<template>
  <div class="pa-2">
    <!--layers drop box-->
    <v-select
      :items="$project.layers"
      v-model="timeData"
      item-text="name"
    />
    <!--label="Select Time Layer"-->
    <!--:filter="customFilter"-->
    <div v-if="timeData">
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
        timeData: null,
        sliderValue: null,
        sliderMin: 0,
        sliderMax: 0
      }
    },

    computed: {
      layerModel () {
        if (this.timeData) {
          return this.layers.find(l => l.name === this.timeData.name)
        }
      }
    },

    watch: {
      timeData (value, oldValue) {
        this.setSliderValue()
        this.sliderMin = this.timeData.timeValues[0]
        this.sliderMax = this.timeData.timeValues[1]
        this.getNewUrl()
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
      }
    },

    created () {
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
      setModelVisibility (model, visible) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        if (visible) {
          visibleLayers.push(model)
          model._visible = true
          model.visible = true
        }
        this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      },
      setSliderValue () {
        if (this.layerModel.sliderValue) {
          this.sliderValue = this.layerModel.sliderValue
        } else {
          this.sliderValue = this.timeData.timeValues[0]
        }
      },
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
      getNewUrl () {
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
        const modelFilter = `${this.timeData.name}:"${this.timeData.timeAttribute}" < '${this.sliderValue}'`
        const filter = `${modelFilter}${otherLayerFilter}`
        this.layer.getSource().updateParams({'FILTER': filter})
        this.layerModel.title = `${this.timeData.name}-${this.sliderValue}`
        this.layerModel.sliderValue = this.sliderValue
        this.layerModel.timeFilter = modelFilter
      }
    }
  }
</script>

<style lang="scss">
</style>
