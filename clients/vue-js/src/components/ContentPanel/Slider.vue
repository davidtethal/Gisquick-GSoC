<template>
  <div>
    <!--layers drop box-->
    <v-select
      @change="timeLayerChanged"
      :items="this.project.time_data"
      item-text="layer"
    ></v-select>
    <!--label="Select Time Layer"-->
    <!--:filter="customFilter"-->
    <span v-if="this.timeLayerIndex != -1">
    <p>layer: {{this.timeData.layer}}</p>
    <p>time-attribute: {{this.timeData.attribute}}</p>
      <!--<p v-for="time in this.timeValues">{{time}}</p>-->
      <!--thumb-label-->
    <v-slider v-model="sliderValue" v-on:click="getSliderUrl"  step="1" ticks v-bind:min="this.sliderMin" v-bind:max="this.sliderMax"></v-slider>
    <v-text-field id="test" v-model="sliderValue" type="number"></v-text-field>
    </span>
  </div>
</template>

<script>
  import { WebgisImageWMS } from '../../map-builder'
  import ImageLayer from 'ol/layer/image'


  export default {
    name: 'timeslide',
    props: [
      'project', 'overlays', 'map'
    ],

    data () {
      return {
        timeData: {},
        timeLayerIndex: -1,
        sliderValue: 0,
        sliderDirty: false,
        sliderMin: 0,
        sliderMax: 0,
        lastLayer: {},
        newLayer: {}
      }
    },

    created () {
      console.log('slider', this.project)
    },

    mounted () {
    },

    methods: {
      sliderInit () {
        this.timeData = this.project.time_data[this.timeLayerIndex]
        this.sliderValue = this.timeData.values[0]
        this.sliderMin = this.sliderValue
        this.sliderMax = this.timeData.values.slice(-1)[0]
        this.lastLayer = {}
        this.newLayer = {}
      },
      timeLayerChanged (selectedLayer) {
        console.log(this.project.time_data)
        console.log(selectedLayer)
        this.timeLayerIndex = this.project.time_data.indexOf(selectedLayer)
        this.sliderInit()
      },
      getSliderUrl () {
        //
        // hide filtered layer
        this.hideParentLayer()
        //
        // store previous time layer
        this.lastLayer = this.newLayer
        //
        // get time layer
        this.newLayer = new ImageLayer({
          visible: true,
          extent: this.project.project_extent,
          source: new WebgisImageWMS({
            resolutions: this.project.tile_resolutions,
            url: this.project.ows_url,
            visibleLayers: this.timeData.layer,
            layersAttributions: {},
//            layersOrder: {'husinec-budovy': 0},
            params: {
              'FORMAT': 'image/png',
              'FILTER': `${this.timeData.layer}:"${this.timeData.attribute}" < ${this.sliderValue}`
            },
            serverType: 'qgis',
            ratio: 1
          })
        })
        //
        // add time layer data
        this.newLayer.values_.title = `${this.timeData.layer}-${this.sliderValue}`
        this.newLayer.values_.hidden = false
        this.newLayer.values_.metadata = this.overlays.list.filter(l => l.name === this.timeData.layer)[0].metadata
        //
        // add or replace time layer in layers list
        const index = this.overlays.tree.indexOf(this.lastLayer.values_)
        if (index !== -1) {
          this.overlays.list[index] = this.newLayer.values_
          this.overlays.tree[index] = this.newLayer.values_
        } else {
          this.overlays.list.push(this.newLayer.values_)
          this.overlays.tree.push(this.newLayer.values_)
        }
        this.overlays.list.forEach(l => { this.$set(l, '_visible', l.visible) })
        //
        // add layer into map
        this.map.addLayer(this.newLayer)
        this.newLayer.getSource().on('imageloadend', () => {
          this.map.removeLayer(this.lastLayer)
        })
      },
     /*
     customFilter (item, queryText, itemText) {
        const hasValue = val => val != null ? val : ''
        const text = hasValue(item.layer)
        const query = hasValue(queryText)
        return text.toString()
          .toLowerCase()
          .indexOf(query.toString().toLowerCase()) > -1
      },
      */
      hideParentLayer () {
        const visibleLayers = this.overlays.list.filter(l => l.visible)
        for (let i = 0; i < visibleLayers.length; i++) {
          if (visibleLayers[i].name === this.timeData.layer) {
            visibleLayers.splice(i, 1)
            /*
            this.overlays.list.forEach((l) => {
              if (l.name === this.timeData.layer) {
                l.visible = false
              }
            })
            */
            this.overlays.tree.forEach((l) => {
              if (l.name === this.timeData.layer) {
                l.visible = false
              }
            })
            this.map.overlay.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
            break
          }
        }
      }
    }

  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">

</style>
