<template>
  <div>
    <p>time-attribute: {{this.project.time_data.attribute}}</p>
    <!--<p v-for="time in this.timeValues">{{time}}</p>-->
    <v-slider v-model="sliderValue" v-on:click="getSliderUrl" thumb-label step="1" ticks v-bind:min="this.timeValues[0]" v-bind:max="this.timeValues.slice(-1)[0]"></v-slider>
    <v-text-field id="test" v-model="sliderValue" type="number"></v-text-field>
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
        timeValues: [],
        sliderValue: 0,
        sliderDirty: false,
        lastLayer: '',
        newLayer: ''
      }
    },

    created () {
      console.log('slider', this.project)
    },

    mounted () {
      this.timeValues = this.project.time_data.values
      this.sliderValue = this.timeValues[0]
    },

    methods: {
      getSliderUrl () {
//
//        const visibleLayers = this.overlays.list.filter(l => l.visible)
//        console.log(this.overlays)
//        const visibleLayers = []
//        this.map.overlay.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
//
        this.lastLayer = this.newLayer
//        get layer
        this.newLayer = new ImageLayer({
          visible: true,
          extent: this.project.project_extent,
          source: new WebgisImageWMS({
            resolutions: this.project.tile_resolutions,
            url: this.project.ows_url,
            visibleLayers: 'husinec-budovy',
            layersAttributions: {},
            layersOrder: {'husinec-budovy': 0},
            params: {
              'FORMAT': 'image/png',
              'FILTER': `${this.project.time_data.layer}:"${this.project.time_data.attribute}" < ${this.sliderValue}`
            },
            serverType: 'qgis',
            ratio: 1
          })
        })
//        add ore replace layer into list
        const index = this.overlays.tree.indexOf(this.lastLayer.values_);
        if (index !== -1) {
          this.overlays.list[index] = this.newLayer.values_;
          this.overlays.tree[index] = this.newLayer.values_;
        } else {
          this.overlays.list.push(this.newLayer.values_)
          this.overlays.tree.push(this.newLayer.values_)
        }
//        add layer into map
        this.map.addLayer(this.newLayer)
        this.newLayer.getSource().on('imageloadend', () => {
          this.map.removeLayer(this.lastLayer)
        })
      }
    }

  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">

</style>
