<template>
  <div>
    <!--layers drop box-->
    <v-select
      @change="timeLayerSelected"
      :items="this.timeLayerSelection"
      item-text="title"
    ></v-select>
    <!--attributes drop box-->
    <v-select
      v-if="this.allTimeAttributes.length > 1"
      @change="this.hideLayersWithoutAttribute"
      :items="this.allTimeAttributes"
    ></v-select>
    <!--label="Select Time Layer"-->
    <!--:filter="customFilter"-->
    <span v-if="this.activeTimeLayer.timeAttribute">
    <p>time-attribute: {{this.activeTimeLayer.timeAttribute}}</p>
      <!--<p v-for="time in this.timeValues">{{time}}</p>-->
      <!--thumb-label-->
    <v-slider v-model="sliderValue" v-on:click="getSliderUrl"  step="1" ticks v-bind:min="this.sliderMin" v-bind:max="this.sliderMax"></v-slider>
    <v-text-field v-on:input="getSliderUrl()" id="test" v-model="sliderValue" type="text"></v-text-field>
    </span>
  </div>
</template>

<script>
  import { WebgisImageWMS } from '../../map-builder'
  import ImageLayer from 'ol/layer/image'


  export default {
    inject: ['$map', '$project', '$overlays'],
    name: 'timeslide',
/*
    props: [
      'project', 'overlays', 'map'
    ],
*/

    data () {
      return {
        activeTimeLayer: {},
//        timeLayerIndex: -1,
        sliderValue: 0,
        sliderDirty: false,
        sliderMin: 0,
        sliderMax: 0,
        lastLayer: {},
        newLayer: {},
        timeLayerSelection: [],
        allTimeAttributes: []
      }
    },

    created () {
      this.allLayersIntoSelect()
    },

    mounted () {
    },

    methods: {
      sliderInit (multipleLayers) {
        if (multipleLayers) {
          // set min max values
          let min = multipleLayers[0].timeValues[0]
          let max = multipleLayers[0].timeValues[1]
          for (let i = 0; i < multipleLayers.length; i++) {
            if (min > multipleLayers[i].timeValues[0]) {
              min = multipleLayers[i].timeValues[0]
            }
            if (max < multipleLayers[i].timeValues[1]) {
              max = multipleLayers[i].timeValues[1]
            }
          }
          this.activeTimeLayer.timeValues = [min, max]
        }
        this.sliderValue = this.activeTimeLayer.timeValues[0]
        this.sliderMin = this.sliderValue
        this.sliderMax = this.activeTimeLayer.timeValues.slice(-1)[0]
        this.lastLayer = {}
        this.newLayer = {}
      },
      timeLayerSelected (selectedLayer) {
        this.activeTimeLayer = {}
        this.activeTimeLayer = selectedLayer
        if (this.activeTimeLayer.title === 'all visible time layers') {
          this.compareTimeLayers()
        }
        this.sliderInit()
      },
      getSliderUrl () {
        // set visible layers
        let visibleLayers = []
        if (this.activeTimeLayer.multipleLayers) {
          visibleLayers = this.activeTimeLayer.multipleLayers
        } else {
          visibleLayers.push(this.activeTimeLayer.title)
        }
        // hide filtered layers
        this.hideParentLayers(visibleLayers)
        // made filter expression
        let timeFilter = ''
        for (let i = 0; i < visibleLayers.length; i++) {
          timeFilter += `${visibleLayers[i]}:"${this.activeTimeLayer.timeAttribute}" < '${this.sliderValue}';`
        }
        // store previous time layer
        this.lastLayer = this.newLayer
        //
        // get time layer
        this.newLayer = new ImageLayer({
          visible: true,
          extent: this.$project.project_extent,
          source: new WebgisImageWMS({
            resolutions: this.$project.tile_resolutions,
            url: this.$project.ows_url,
            visibleLayers: visibleLayers,
            layersAttributions: {},
//            layersOrder: {'husinec-budovy': 0},
            params: {
              'FORMAT': 'image/png',
              'FILTER': timeFilter
//              'FILTER': `${this.activeTimeLayer.title}:"${this.activeTimeLayer.timeAttribute}" < '${this.sliderValue}'`
//              'FILTER': `${this.activeTimeLayer.multipleLayers[0]}:"${this.activeTimeLayer.timeAttribute}" < '${this.sliderValue}';${this.activeTimeLayer.multipleLayers[1]}:"${this.activeTimeLayer.timeAttribute}" < '${this.sliderValue}'`
//              'FILTER': `${this.activeTimeLayer.title}:cast("${this.activeTimeLayer.timeAttribute}" as character) < ${this.sliderValue}`
            },
            serverType: 'qgis',
            ratio: 1
          })
        })
        //
        // add time layer data
        this.newLayer.values_.title = `${this.activeTimeLayer.title}-${this.sliderValue}`
        this.newLayer.values_.timeAttribute = this.activeTimeLayer.timeAttribute
        this.newLayer.values_.timeValues = this.activeTimeLayer.timeValues
        this.newLayer.values_.hidden = false
        this.newLayer.values_.temporaryTimeLayer = true
//        this.newLayer.values_.metadata = this.$overlays.list.filter(l => l.name === this.activeTimeLayer.title)[0].metadata
        console.log(this.newLayer)
        //
        // add or replace time layer in layers list
        const index = this.$overlays.tree.indexOf(this.lastLayer.values_)
        if (index !== -1) {
          this.$overlays.list.splice(index, 1)
          this.$overlays.tree.splice(index, 1)
        }
        this.$overlays.list.push(this.newLayer.values_)
        this.$overlays.tree.push(this.newLayer.values_)
        this.$overlays.list.forEach(l => { this.$set(l, '_visible', l.visible) })
        //
        // add layer into map
        this.$map.addLayer(this.newLayer)
        this.newLayer.getSource().on('imageloadend', () => {
          this.$map.removeLayer(this.lastLayer)
        })
      },
      hideParentLayers (hideLayers) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        for (let j = 0; j < hideLayers.length; j++){
          for (let i = 0; i < visibleLayers.length; i++) {
            if (visibleLayers.length > 0 && visibleLayers[i].name === hideLayers[j]) {
              visibleLayers.splice(i, 1)
              this.$overlays.list.forEach((l) => {
                if (l.name === hideLayers[j]) {
                  l.visible = false
                }
              })
              /*this.$overlays.tree.forEach((l) => {
                if (l.name === this.activeTimeLayer.title) {
                  l.visible = false
                }
              })*/
              break
            }
          }
        }
        this.$map.overlay.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      },
      // add "all visible layers" selection into select box
      allLayersIntoSelect () {
        const allLayers = {
          timeAttribute: '',
          title: 'all visible time layers',
          timeValues: ''
        }
        this.timeLayerSelection.push(allLayers)
        for (let i = 0; i < this.$project.time_data.length; i++) {
          if (this.$overlays.list[i].timeAttribute) {
            this.timeLayerSelection.push(this.$overlays.list[i])
          }
        }
      },
      compareTimeLayers () {
        // get visible time layers
        const visibleTimeLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute && !l.temporaryTimeLayer)
        // count and valid time layers
        if ((visibleTimeLayers.length === 0)) {
          console.log('NO LAYER SELECTED')
        } else if (visibleTimeLayers.length === 1) {
          this.activeTimeLayer = visibleTimeLayers[0]
          console.log('ONE LAYER SELECTED')
          this.sliderInit()
        } else {
          // find unique attributes
          this.allTimeAttributes = [...new Set(visibleTimeLayers.map(item => item.timeAttribute))]
          if (this.allTimeAttributes.length === 1) {
            this.hideLayersWithoutAttribute(this.allTimeAttributes[0])
          }
        }
      },
      hideLayersWithoutAttribute (attribute) {
        const visibleLayers = []
        const visibleLayersTitles = []
        // hide time layers that doesn't contain given attribute
        for (let i = 0; i < this.$overlays.list.length; i++) {
          if (this.$overlays.list[i].timeAttribute) {
            if (!this.$overlays.list[i].temporaryTimeLayer && this.$overlays.list[i].timeAttribute === attribute) {
              this.$overlays.list[i].visible = true
              this.$overlays.list[i]._visible = true
              visibleLayers.push(this.$overlays.list[i])
              visibleLayersTitles.push(this.$overlays.list[i].title)
            } else if (!this.$overlays.list[i].temporaryTimeLayer) {
              this.$overlays.list[i].visible = false
              this.$overlays.list[i]._visible = false
            }
          }
        }
        // change map
        this.$map.overlay.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
        // set active layers
        this.activeTimeLayer.multipleLayers = visibleLayersTitles
        // initialize slider
        this.sliderInit(visibleLayers)
        // set time attribute name
        this.setTimeLayerAttribute(attribute)
      },
      setTimeLayerAttribute (attribute) {
        this.activeTimeLayer.timeAttribute = attribute
      }
    }

  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">

</style>
