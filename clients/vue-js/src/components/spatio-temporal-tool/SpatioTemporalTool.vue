 <template>
  <div class="mx-2">
    <!--layers drop box-->
    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
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
       @click="updateVectorLayer"
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
import ImageLayer from 'ol/layer/image'
import TimeField from './TimeField'
import RangeSlider from './RangeSlider1'
import { WebgisImageWMS, layersList } from '../../map-builder'
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
//      console.log('TIME DATA', this.timeData)
      if (this.timeData && this.timeData.type === 'multiple') {
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
    // triggers after time layer is selected
    timeData (value) {
      this.attribute = null
      this.attributesSelection = []
      this.openVector = false
      this.openRaster = false
//
      const sliderModel = initializeSlider(value, this.$overlays, this.layerModel)
      if (sliderModel && sliderModel.constructor === Array && sliderModel.length === 1) {
        this.attribute = sliderModel[0]
      } else if (sliderModel && sliderModel.constructor === Array) {
        this.attributesSelection = sliderModel
      } else if (sliderModel) {
        this.setModelVisibility(this.layerModel, true)
        this.slider = sliderModel
        this.updateVectorLayer()
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
        this.updateVectorLayer()
      }
    }
  },

  beforeDestroy () {
    state = this.$data
  },

  created () {
    this.addLayersIntoDropdown()

    // disable map cashing
    const map = this.$map
    if (!(map.overlay instanceof ImageLayer)) {
      // create and switch to WMS layer
      this.originalLayer = map.overlay
      this.originalLayer.setVisible(false)

      this.layer = new ImageLayer({
        visible: true,
        extent: this.$project.project_extent,
        source: new WebgisImageWMS({
          resolutions: this.$project.tile_resolutions,
          url: this.$project.ows_url,
          visibleLayers: this.originalLayer.getSource().getVisibleLayers(),
          layersAttributions: {},
          params: {
            'FORMAT': 'image/png'
          },
          serverType: 'qgis',
          ratio: 1
        })
      })

      // set as new main map's layer
      map.addLayer(this.layer)
      map.overlay = this.layer
    } else {
      this.layer = map.overlay
    }
  },
  methods: {
    // add vector layers into selection
    addLayersIntoDropdown () {
      let containVector = false
      const all = {
        text: 'All visible vector layers',
        value: {
          name: 'All visible vector layers',
          title: 'All visible vector layers',
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
    /*
    LAYERS VISIBILITY
    */
    setModelVisibility (model, visible) {
      this.setGroupVisibility(model, visible)
      const visibleLayers = this.$overlays.list.filter(l => l.visible)
      if (!model.selectAllLayers) {
        visibleLayers.push(model)
        model._visible = visible
        model.visible = visible
      }
      this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
    },
    setGroupVisibility (model, visible) {
      this.$overlays.tree.forEach(group => {
        if (group.isGroup) {
          const index = group.layers.indexOf(model)
          if (index !== -1) {
            group.visible = visible
            return true
          }
        }
      })
    },
    /*
    VECTOR FILTER
    */
    updateVectorLayer () {
      let filter = ''
      if (this.layerModel.type === 'multiple') {
        const attribute = this.attribute || this.attributesSelection[0]
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)

        for (let i = 0; i < visibleLayers.length; i++) {
          const model = this.layers.find(l => l.name === visibleLayers[i].name)

          if (model.original_time_attribute === attribute || attribute === 'All attributes') {
            const modelFilter = this.createFilterString(model, this.slider)
            filter += modelFilter
            this.updateModel(model, this.slider, modelFilter)
          } else {
            filter += `;${model.timeFilter}`
          }
        }
//
//        this.oldPickerTime1 = moment(this.unix1 * 1000).format('HH:mm')
//        this.oldPickerTime2 = moment(this.unix2 * 1000).format('HH:mm')
//
      } else {
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
        const modelFilter = this.createFilterString(this.timeData, this.slider)
        filter = `${modelFilter}${otherLayerFilter}`
        this.updateModel(this.layerModel, this.slider, modelFilter)
//
//        this.oldPickerTime1 = moment(this.slider.timeRange[0] * 1000).format('HH:mm')
//        this.oldPickerTime2 = moment(this.slider.timeRange[1] * 1000).format('HH:mm')
//
      }
      this.layer.getSource().updateParams({'FILTER': filter})
    },
    createFilterString (timeData, slider) {
      let filter = ''
      if (timeData.unix) {
        filter = this.createLayerFilterString(
          timeData.name,
          timeData.time_attribute,
          slider.timeRange[0],
          slider.timeRange[1])
      } else {
        const dateTimeUnix1 = moment(slider.timeRange[0] * 1000).format(timeData.input_datetime_mask)
        const dateTimeUnix2 = moment(slider.timeRange[1] * 1000).format(timeData.input_datetime_mask)
        filter = this.createLayerFilterString(
          timeData.name,
          timeData.original_time_attribute,
          dateTimeUnix1,
          dateTimeUnix2)
      }
      return filter
    },
    createLayerFilterString (layerName, attribute, min, max) {
      const filterString = `;${layerName}:"${attribute}" >= '${min}' AND "${attribute}" <= '${max}'`
      return filterString
    },
    // make filter for non selected time layers
    getFilterFromLayers (layers, layerModel) {
      const modelIndex = layers.indexOf(layerModel)
      let filter = ''
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].timeFilter && i !== modelIndex) {
          filter += `;${layers[i].timeFilter}`
        }
      }
      return filter
    },
    // update layer model params
    updateModel (model, slider, filter) {
      model.title = `${model.name}-${moment(slider.timeRange[0] * 1000).format(this.outputDateMask)}`
      model.unix1 = slider.timeRange[0]
      model.unix2 = slider.timeRange[1]
      model.timeFilter = filter
    }
//
  }
}
</script>
