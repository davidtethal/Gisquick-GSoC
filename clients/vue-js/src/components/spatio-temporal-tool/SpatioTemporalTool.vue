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
import { initializeSlider, getSliderRange, setRangeSliderValues } from './initializeSlider'


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
        step: 100,
        discreteData: [],
        rasterGroupLayers: []
      },

      // selects lists
      layersSelection: [],
      attributesSelection: [],
//      rasterGroupLayers: [],

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
    slider (val, oldVal) {
      console.log('VAL', val)
      console.log('OLD VAL', oldVal)
    },
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
      const sliderModel = initializeSlider(value, this.$overlays, this.layerModel)
      if (sliderModel.constructor === Array) {
        this.attributesSelection = sliderModel
      } else {
        this.slider = sliderModel
      }
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
        const sliderRange = getSliderRange(visibleLayers)
        this.slider = setRangeSliderValues(sliderRange[0], sliderRange[1], this.layerModel)
//        this.openVector = true
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
  }
}
</script>
