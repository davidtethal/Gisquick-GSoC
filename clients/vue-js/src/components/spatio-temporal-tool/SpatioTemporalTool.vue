 <template>
  <div class="mx-2">
    <!--layers drop box-->
    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
      item-text="name"
      @change="resetAttribute"
    />
    <!--attributes drop box-->
    <v-select
      v-if="attributesSelection.length > 1 && !attribute"
      label="Select Attribute"
      :items="attributesSelection"
      v-model="attribute"
    />

    <time-field
      :min="range.min"
      :max="range.max"
      v-model="time[0]"
      mask="YYYY-MM-DD"
      label="From"
    />

    <time-field
      :min="time[0]"
      :max="range.max"
      v-model="time[1]"
      mask="YYYY-MM-DD"
      label="To"
    />

     <range-slider
      :min="range.min"
      :max="range.max"
      :fixed="fixed"
      v-model="time"
      hide-details
    />
   <!-- <f-range-slider
      :min="range.min"
      :max="range.max"
      v-model="time"
      :fixed="fixed"
      class="mx-2"
      hide-details
    />-->
    <v-checkbox
      color="primary"
      label="Fixed range"
      v-model="fixed"
      hide-details
    />
  </div>
</template>

<script>
import moment from 'moment'
import TimeField from './TimeField'
import RangeSlider from './RangeSlider1'
import { WebgisImageWMS, layersList } from '../../map-builder'
// import './RangeSlider3' // gobally registred 'f-range-slider'

function unixTime (time) {
  return moment(time, 'YYYY-MM-DD').unix()
}

let state = null

export default {
  inject: ['$map', '$project', '$overlays'],
  components: { TimeField, RangeSlider },

  data () {
    return state || {
      fixed: false,
      range: {
        min: unixTime('2018-06-03'),
        max: unixTime('2018-08-05')
      },
      time: [
        unixTime('2018-06-15'),
        unixTime('2018-07-15')
      ],
      // selects lists
      layersSelection: [],
      attributesSelection: [],
      rasterGroupLayers: [],

      layers: layersList(this.$project.layers, true),
      timeData: null,
      attribute: null,

      openVector: false,
      openRaster: false,

      // DELETE - testing data
      sliderMin: null,
      sliderMax: null,
      sliderOptions: {
        max: null
      },
      unix1: null,
      unix2: null,
      rasterSliderOptions: {
        data: null,
        max: null,
        min: null
      },
      raterSliderValue: null

    }
  },

  computed: {
    layerModel () {
      if (this.timeData && this.timeData.selectAllLayers) {
        return this.layersSelection[0]
      } else if (this.timeData) {
        return this.layers.find(l => l.name === this.timeData.name)
      }
    }
  },

  watch: {
    // triggers after time layer is selected
    timeData(value) {
      this.attribute = null
      this.attributesSelection = []
      this.openVector = false
      this.openRaster = false

      this.initializeSlider(value)
    },
    // triggers after attribute is selected
    attribute (value) {
      if (this.attribute != null) {
        let visibleLayers = []
        if (value !== 'All attributes') {
          visibleLayers = this.$overlays.list.filter(l => l.visible &&
            l.original_time_attribute &&
            l.original_time_attribute === value)
        } else {
          visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)
        }
        const sliderRange = this.getSliderRange(visibleLayers)
        this.setRangeSliderValues(sliderRange[0], sliderRange[1])
        this.openVector = true
      }
    },
  },

  beforeDestroy () {
    state = this.$data
  },

  created () {
    this.addLayersIntoDropdown()
  },
  methods : {
    // add vector layers into selection
    addLayersIntoDropdown () {
      let containVector = false
      const all = {
        name: 'All visible layers',
        title: 'All visible layers',
        type: 'multiple'
      }
      this.$project.layers.forEach(l => {
        if (l.time_values && l.time_values.length > 0) {
          containVector = true
        }
        if ((l.time_values && l.time_values.length > 0) || l.spatio_temporal) {
          this.layersSelection.push(l)
        }
      })
      if (containVector) {
        this.layersSelection.unshift(all)
      }
    },
    resetAttribute () {
    },
    initializeSlider (value) {
      if (value.type === 'multiple') {
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)

        if (!this.hasMultipleAttributes(visibleLayers)) {

//          this.setDateMask(visibleLayers)
//          this.maskIncludeDate(this.outputDateMask)
//          this.hasTime = this.outputDateMask.includes('HH:mm')

          const sliderRange = this.getSliderRange(visibleLayers)
          this.setRangeSliderValues(sliderRange[0], sliderRange[1])
          this.openVector = true
        }
      } else if (value.type === 'vector') {

//        this.outputDateMask = value.output_datetime_mask
//        this.maskIncludeDate(this.outputDateMask)
//        this.hasTime = this.outputDateMask.includes('HH:mm')

        this.setRangeSliderValues(this.timeData.time_values[0], this.timeData.time_values[1])
        this.openVector = true

//        this.updateSingleLayer()

      } else if (value.isGroup) {
        this.setSliderValues(this.getRasterGroupTimeValues(value))
        this.rasterGroupLayers = value.layers
        this.openRaster = true
      }
    },
    setSliderValues(timeValueArray) {
      this.rasterSliderOptions.data = timeValueArray
      this.rasterSliderOptions.max = Math.max.apply(null, timeValueArray)
      this.rasterSliderOptions.min = Math.min.apply(null, timeValueArray)
      this.rasterSliderValue = this.rasterSliderOptions.min
//      console.log(this.rasterSliderOptions.data)
//      console.log(this.rasterSliderOptions.max)
//      console.log(this.rasterSliderOptions.min)
//      console.log(this.rasterSliderValue)

    },
    setRangeSliderValues(min, max) {
      this.sliderMin = min
      this.sliderMax = max
      this.sliderOptions.max = max - min
      this.step = (max - min) / 100
      if (this.layerModel && this.layerModel.unix1) {
        this.unix1 = this.layerModel.unix1
      } else {
        this.unix1 = min
      }
      if (this.layerModel && this.layerModel.unix2) {
        this.unix2 = this.layerModel.unix2
      } else {
        this.unix2 = max + this.step
      }
//      console.log(this.sliderMin)
//      console.log(this.sliderMax)
//      console.log(this.step)
//      console.log(this.unix1)
//      console.log(this.unix2)
    },
    // find unique attributes
    hasMultipleAttributes (visibleLayers) {
      this.attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
      if (this.attributesSelection.length === 1) {
        return false
      } else {
        this.attributesSelection.unshift('All attributes')
        return true
      }
    },
    // get min and max slider range
    getSliderRange (visibleLayers) {
      let min = 1E+100
      let max = -1E+100
      for (let i = 0; i < visibleLayers.length; i++) {
        if (min > visibleLayers[i].time_values[0]) {
          min = visibleLayers[i].time_values[0]
        }
        if (max < visibleLayers[i].time_values[1]) {
          max = visibleLayers[i].time_values[1]
        }
      }
      return [min, max]
    },
    // get array of time values from raster group layers
    getRasterGroupTimeValues (group) {
      const rasterGroupTimeValues = []
      group.layers.forEach(l => { rasterGroupTimeValues.push(parseInt(l.time_stamp)) })
      rasterGroupTimeValues.sort(function (a, b) { return a - b })
      return rasterGroupTimeValues
    },
  }
}
</script>
