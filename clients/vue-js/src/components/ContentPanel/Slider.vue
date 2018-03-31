<template>
  <div class="pa-2">
    <!--layers drop box-->
    <!--@change in case of selecting same option twice-->
    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
      item-text="name"
      @change="resetAttribute()"
    />
    <v-select
      v-if="attributesSelection.length > 1 && !attribute"
      label="Select Attribute"
      :items="attributesSelection"
      v-model="attribute"
    />
    <div v-if="openInfo">
      <p v-if="!attribute">time-attribute: {{timeData.original_time_attribute}}</p>
      <p v-if="attribute">time-attribute: {{attribute}}</p>
      <!--<p v-for="time in timeValues">{{time}}</p>-->
      <!--thumb-label-->
<!--      <v-slider
        ticks
        @click="getNewUrl()"
        v-model="sliderValue"
        :min="sliderMin"
        :max="sliderMax"
        :step="step"
        hide-details
      />-->
      <div class="slidecontainer">
        <input
          type="range"
          @click="getNewUrl()"
          v-model="sliderValue"
          :min="sliderMin"
          :max="sliderMax"
          :step="step"
          class="slider"
          id="myRange">
      </div>
      <v-text-field
        type="text"
        v-model="sliderValueDate"
        hide-details
      />
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
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
        sliderValueDate: null,
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
      },
      step () {
        console.log('STEP', (this.sliderMax - this.sliderMin) / 100)
        return (this.sliderMax - this.sliderMin) / 100
      }
    },

    watch: {
      timeData (value, oldValue) {
        console.log(value)
        this.attributesSelection = []
        this.attribute = null
        // todo timeData watch or trigger method
        // case of all layers
        if (value.selectAllLayers) {
          this.checkDiffAttributes()
          // case of one attribute
          if (this.attributesSelection.length === 1) {
            const minmax = this.getSliderRange(this.attributesSelection[0])
            this.sliderMin = minmax[0]
            this.sliderMax = minmax[1]
            this.sliderValue = minmax[0]
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
//        model._title = model.title
        if (!model.visible) {
          this.setModelVisibility(model, true)
        }
      },
      attribute (value) {
        console.log('ATTRIBUTE', value)
        if (value) {
          const minmax = this.getSliderRange(value)
          this.sliderMin = minmax[0]
          this.sliderMax = minmax[1]
          this.sliderValue = minmax[0]
          this.openInfo = true
        }
      },
      sliderValue (value) {
//        console.log('UNIX', value)
//        console.log('MIN', this.sliderMin)
//        console.log('MAX', this.sliderMax)
//        console.log(moment(value * 1000).format('DD-MM-YYYY'))
        this.sliderValueDate = moment(value * 1000).format('DD-MM-YYYY')
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

    beforeDestroy () {
      for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].title = this.layers[i].name
        delete this.layers[i].sliderValue
        delete this.layers[i].timeFilter
      }
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
        console.log('SINGLE')
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
        const modelFilter = `${this.timeData.name}:"${this.timeData.timeAttribute}" < '${this.sliderValue}'`
        const filter = `${modelFilter}${otherLayerFilter}`
        console.log(filter)
        this.layer.getSource().updateParams({'FILTER': filter})
        this.layerModel.title = `${this.timeData.name}-${this.sliderValue}`
        this.layerModel.sliderValue = this.sliderValue
        this.layerModel.timeFilter = modelFilter
        console.log(this.layerModel)
      },
      updateMultipleLayers () {
        console.log('MULTIPLE')
        const attribute = this.attribute || this.attributesSelection[0]
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute)
        console.log(visibleLayers)
        let filterIncrement = ''
        let filter = ''
        for (let i = 0; i < visibleLayers.length; i++) {
          console.log(visibleLayers[i].name)
          if (visibleLayers[i].original_time_attribute === attribute) {
            filterIncrement = `;${visibleLayers[i].name}:"${visibleLayers[i].timeAttribute}" < '${this.sliderValue}'`
            filter += filterIncrement
            visibleLayers[i].title = `${visibleLayers[i].name}-${this.sliderValue}`
            visibleLayers[i].sliderValue = this.sliderValue
            visibleLayers[i].timeFilter = filterIncrement
          } else {
            filter += `;${visibleLayers[i].timeFilter}`
          }
        }
        console.log(filter)
        this.layer.getSource().updateParams({'FILTER': filter})
      },
      // add "All visible layers" option into layers select
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
        this.attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
      },
      // get min and max slider range
      getSliderRange (attribute) {
        console.log(attribute)
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute && l.original_time_attribute === attribute)
        // set min max values
        let min = 1E+100
        let max = -1E+100
        for (let i = 0; i < visibleLayers.length; i++) {
          if (min > visibleLayers[i].timeValues[0]) { // vl[i].timeAttribute && vl[i].timeAttribute === attribute &&
            min = visibleLayers[i].timeValues[0]
          }
          if (max < visibleLayers[i].timeValues[1]) { // vl[i].timeAttribute && vl[i].timeAttribute === attribute &&
            max = visibleLayers[i].timeValues[1]
          }
        }
        return [min, max]
      },
      resetAttribute () {
        this.attribute = null
        this.openInfo = false
        console.log(this.attribute)
        this.attributesSelection = []
        this.checkDiffAttributes()
        if (this.attributesSelection.length === 1) {
          this.attribute = this.attributesSelection[0]
          const minmax = this.getSliderRange(this.attributesSelection[0])
          this.sliderMin = minmax[0]
          this.sliderMax = minmax[1]
          this.sliderValue = minmax[0]
          this.openInfo = true
        }
      }
    }
  }
</script>

<style lang="scss">
</style>
