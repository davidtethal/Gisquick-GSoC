<template>
  <div class="pa-2">
    <!--layers drop box-->
    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
      item-text="name"
    />
    <v-select
      v-if="attributesSelection.length > 1"
      label="Select Attribute"
      :items="attributesSelection"
      v-model="attribute"
    />
    <div v-if="openInfo">
      <p>time-attribute: {{timeData.timeAttribute}}</p>
      <!--<p v-for="time in timeValues">{{time}}</p>-->
      <!--thumb-label-->
      <v-slider
        ticks
        @click="getNewUrl()"
        v-model="sliderValue"
        :min="sliderMin"
        :max="sliderMax"
        :step="1"
        hide-details
      />
      <v-text-field
        type="number"
        v-model="sliderValue"
        hide-details
      />
    </div>
  </div>
</template>

<script>
  import ImageLayer from 'ol/layer/image'
  import { WebgisImageWMS, layersList } from '../../map-builder'

  export default {
    inject: ['$map', '$project', '$overlays'],
    name: 'timeslide',

    data () {
      return {
        layers: layersList(this.$project.layers, true),
        layersSelection: [],
        attributesSelection: [],
        timeData: null,
        sliderValue: null,
        attribute: null,
        sliderMin: 0,
        sliderMax: 0,
        openInfo: false
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
      timeData (value, oldValue) {
        this.attributesSelection = []
        // case of all layers
        if (value.selectAllLayers) {
          this.checkDiffAttributes()
          // case of one attribute
          if (this.attributesSelection.length === 1) {
            const minmax = this.getSliderRange(this.attributesSelection[0])
            this.sliderMin = minmax[0]
            this.sliderMax = minmax[1]
            this.openInfo = true
          }
          // case of one layer
        } else if (!value.selectAllLayers) {
          this.setSliderValue()
          this.sliderMin = this.timeData.timeValues[0]
          this.sliderMax = this.timeData.timeValues[1]
          this.openInfo = true
          this.getNewUrl()
        }
      },
      layerModel (model, oldModel) {
/*
        if (oldModel) {
          this.resetLayerTitle(oldModel)
        }
*/
        model._title = model.title
        if (!model.visible) {
          this.setModelVisibility(model, true)
        }
      },
      attribute (value) {
        const minmax = this.getSliderRange(value)
        this.sliderMin = minmax[0]
        this.sliderMax = minmax[1]
        this.openInfo = true
      }
    },

    created () {
      this.addAllIntoSelection()
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
        map.addLayer(this.layer)
        // set as new main map's layer - required to control layers visibility in Content panel
        map.overlay = this.layer
      }
    },

    // todo delete names
    beforeDestroy () {
      for (let i = 0; i < this.layers.length; i++) {
        this.resetLayerTitle(this.layers[i])
        delete this.layers[i].sliderValue
        delete this.layers[i].timeFilter
      }
/*
      if (this.layerModel) {
        this.resetLayerTitle(this.layerModel)
      }
*/
      if (this.originalLayer) {
        // switch back to original cached layer
        const map = this.$map
        map.removeLayer(this.layer)
        map.overlay = this.originalLayer
        map.overlay.getSource().setVisibleLayers(this.layer.getSource().getVisibleLayers())
        map.overlay.setVisible(true)
      }
    },

    methods: {
      resetLayerTitle (layerModel) {
        layerModel.title = layerModel._title || layerModel.title
        delete layerModel._title
      },
      // make selected layer visible
      setModelVisibility (model, visible) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        if (visible && !model.selectAllLayers) {
          visibleLayers.push(model)
          model._visible = true
          model.visible = true
        }
        this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      },
      // initialize slider by last used value
      setSliderValue () {
        if (this.layerModel.sliderValue) {
          this.sliderValue = this.layerModel.sliderValue
        } else {
          this.sliderValue = this.timeData.timeValues[0]
        }
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
      // update WMS url
      getNewUrl () {
        if (this.layerModel.selectAllLayers) {
          this.updateMultipleLayers()
        } else {
          this.updateSingleLayer()
        }
      },
      updateSingleLayer () {
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
        const modelFilter = `${this.timeData.name}:"${this.timeData.timeAttribute}" < '${this.sliderValue}'`
        const filter = `${modelFilter}${otherLayerFilter}`
        this.layer.getSource().updateParams({'FILTER': filter})
        this.layerModel.title = `${this.timeData.name}-${this.sliderValue}`
        this.layerModel.sliderValue = this.sliderValue
        this.layerModel.timeFilter = modelFilter
      },
      updateMultipleLayers () {
        const attribute = this.attribute || this.attributesSelection[0]
        const layers = this.$project.layers
        let filter = ''
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].timeAttribute && layers[i].timeAttribute === attribute && layers[i].visible) {
            filter += `;${layers[i].name}:"${layers[i].timeAttribute}" < '${this.sliderValue}'`
            layers[i].title = `${layers[i].name}-${this.sliderValue}`
            layers[i].sliderValue = this.sliderValue
            layers[i].timeFilter = filter
          }
        }
        this.layer.getSource().updateParams({'FILTER': filter})
      },
      // add "All visible layers" option into select
      addAllIntoSelection () {
        const all = {
          name: 'All visible layers',
          title: 'All visible layers',
          selectAllLayers: true
        }
        this.layersSelection.push(all)
        this.$project.layers.forEach(l => { this.layersSelection.push(l) })
      },
      // find unique attributes
      checkDiffAttributes () {
        this.openInfo = false
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute)
        this.attributesSelection = [...new Set(visibleLayers.map(l => l.timeAttribute))]
      },
      // get min and max slider range
      getSliderRange (attribute) {
        const vl = this.$overlays.list.filter(l => l.visible && l.timeAttribute)
        // set min max values
        let min = 1E+100
        let max = -1E+100
        for (let i = 0; i < vl.length; i++) {
          if (vl[i].timeAttribute && vl[i].timeAttribute === attribute && min > vl[i].timeValues[0]) {
            min = vl[i].timeValues[0]
          }
          if (vl[i].timeAttribute && vl[i].timeAttribute === attribute && max < vl[i].timeValues[1]) {
            max = vl[i].timeValues[1]
          }
        }
        return [min, max]
      }
    }
  }
</script>

<style lang="scss">
</style>
