 <template>
  <div class="mx-2">
    <!--layers drop box-->
    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
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
      :min="slider.range.min"
      :max="slider.range.max"
      v-model="slider.timeRange[0]"
      mask="YYYY-MM-DD"
      label="From"
    />

    <time-field
      v-if="slider.timeRange[1]"
      :min="slider.timeRange[0]"
      :max="slider.range.max"
      v-model="slider.timeRange[1]"
      mask="YYYY-MM-DD"
      label="To"
    />

     <range-slider
       v-if="slider.timeRange[1]"
      :min="slider.range.min"
      :max="slider.range.max"
      :fixed="slider.fixed"
      :step="slider.step"
      v-model="slider.timeRange"
      hide-details
    />
    <v-slider
      v-if="slider.timeRange[1] === null"
      :min="slider.range.min"
      :max="slider.range.max"
      :step="slider.step"
      v-model="slider.timeRange[0]"
    />

    <v-checkbox
      color="primary"
      label="Fixed range"
      v-model="slider.fixed"
      hide-details
    />
  </div>
</template>

<script>
import moment from 'moment'
import TimeField from './TimeField'
import RangeSlider from './RangeSlider1'
import { layersList } from '../../map-builder' //  WebgisImageWMS,
// import './RangeSlider3' // gobally registred 'f-range-slider'
import { initializeSlider } from './utils'


function unixTime (time) {
  return moment(time, 'YYYY-MM-DD').unix()
}

let state = null

export default {
  inject: ['$map', '$project', '$overlays'],
  components: { TimeField, RangeSlider },

  data () {
    return state || {

      // slider
      slider: {
        fixed: false,
        range: {
          min: unixTime('2018-06-03'),
          max: unixTime('2018-08-05')
        },
        timeRange: [
          unixTime('2018-06-15'),
          unixTime('2018-07-15')
        ],
        timeValue: unixTime('2018-06-15'),
        step: 100
      },

      // selects lists
      layersSelection: [],
      attributesSelection: [],
      rasterGroupLayers: [],

      layers: layersList(this.$project.layers, true),
      timeData: null,
      attribute: null,

      openVector: false,
      openRaster: false

    }
  },

  computed: {
    layerModel () {
      if (this.timeData && this.timeData.selectAllLayers) {
        return this.layersSelection[0].value
      } else if (this.timeData) {
        return this.layers.find(l => l.name === this.timeData.name)
      }
    }
  },

  watch: {
    // contain currently selected layer
    layerModel (model) {
//      if (model && !model.visible) {
//        this.setModelVisibility(model, true)
//      }
    },
    // triggers after time layer is selected
    timeData (value) {
      this.attribute = null
      this.attributesSelection = []
      this.openVector = false
      this.openRaster = false
//
      this.slider = initializeSlider(value, this.$overlays, this.layerModel)
      console.log('SLIDER', this.slider)
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
    }
  },

  beforeDestroy () {
    state = this.$data
  },

  created () {
    this.addLayersIntoDropdown()
  },
  methods: {
    // add vector layers into selection
    addLayersIntoDropdown () {
      let containVector = false
      const all = {
        text: 'All visible layers',
        value: {
          name: 'All visible layers',
          title: 'All visible layers',
          type: 'multiple'
        }
      }
      this.$project.layers.forEach(l => {
        if (l.time_values && l.time_values.length > 0) {
          containVector = true
        }
        if ((l.time_values && l.time_values.length > 0) || l.spatio_temporal) {
          const item = { text: l.name, value: l }
          this.layersSelection.push(item)
        }
      })
      if (containVector) {
        this.layersSelection.unshift(all)
      }
    },
    resetAttribute () {
    }
/*

    initializeSlider (layer) {
      if (layer.type === 'multiple') {
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)
//
        if (!this.hasMultipleAttributes(visibleLayers)) {
//
//          this.setDateMask(visibleLayers)
//          this.maskIncludeDate(this.outputDateMask)
//          this.hasTime = this.outputDateMask.includes('HH:mm')
//
          const sliderRange = this.getSliderRange(visibleLayers)
          this.setRangeSliderValues(sliderRange[0], sliderRange[1])
          this.openVector = true
        }
      } else if (layer.type === 'vector') {
//
//        this.outputDateMask = value.output_datetime_mask
//        this.maskIncludeDate(this.outputDateMask)
//        this.hasTime = this.outputDateMask.includes('HH:mm')
//
        this.setRangeSliderValues(layer.time_values[0], layer.time_values[1])
        this.openVector = true
//
//        this.updateSingleLayer()
//
      } else if (layer.isGroup) {
        this.setSliderValues(this.getRasterGroupTimeValues(layer))
        this.rasterGroupLayers = layer.layers
        this.openRaster = true
      }
    },
    setSliderValues (timeValueArray) {
      this.range.min = Math.min.apply(null, timeValueArray)
      this.range.max = Math.max.apply(null, timeValueArray)
      this.timeValue = this.range.min
      this.rasterSliderOptions.data = timeValueArray
//      console.log(this.rasterSliderOptions.data)
//      console.log(this.rasterSliderOptions.max)
//      console.log(this.rasterSliderOptions.min)
//      console.log(this.rasterSliderValue)
    },
    setRangeSliderValues (min, max) {
      this.range.min = min
      this.range.max = max
      this.sliderOptions.max = max - min
      this.step = (max - min) / 100
      if (this.layerModel && this.layerModel.unix1) {
        this.timeRange[0] = this.layerModel.unix1
      } else {
        this.timeRange[0] = min
      }
      if (this.layerModel && this.layerModel.unix2) {
        this.timeRange[1] = this.layerModel.unix2
      } else {
        this.timeRange[1] = min + this.step
      }
      console.log(this.range.min)
      console.log(this.range.max)
      console.log(this.step)
      console.log(this.timeRange[0])
      console.log(this.timeRange[1])
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
    }
*/
  }
}
</script>
