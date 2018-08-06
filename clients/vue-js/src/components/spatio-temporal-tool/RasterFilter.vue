<template>
  <div>
    <!--TIME INPUT-->
    <!--<time-field
      v-model="activeTime"
      :min="range.min"
      :max="range.max"
      :mask="dateMask"
      label="From"
    />-->
    <v-text-field
      slot="activator"
      :value="outputTime"
      prepend-icon="event"
      readonly
    />

    <!--SLIDER-->
    <div class="range-container">
      <v-icon
        class="animate-icon"
        v-if="!animate"
        @click="animate = !animate">
        play_circle_outline
      </v-icon>
      <v-icon
        class="animate-icon"
        v-if="animate"
        @click="animate = !animate">
        pause_circle_outline
      </v-icon>
      <v-slider
        class="mx-2 time-slider"
        v-model="timeValuesIndex"
        :min="range.min"
        :max="range.max"
        step="1"
        ticks="always"
        tick-size="2"
        hide-details>
      </v-slider>
      <v-icon
        class="animate-icon"
        @click="animationSettings = !animationSettings">
        settings
      </v-icon>
    </div>

    <!--ANIMATION SETTINGS-->
    <div v-bind:class="{ 'settings-container': animationSettings }"  v-if="animationSettings">
      <div class="animate-row">
        <p>opacity</p>
        <v-slider class="options-slider"
                  v-model="layerOpacity"
                  step="1"
                  min="0"
                  max="250"
        ></v-slider>
      </div>
      <div class="animate-row">
        <p>speed</p>
        <v-slider class="options-slider"
                  v-model="frameRate"
                  step="0.1"
                  min="0"
                  max="4"
        ></v-slider>
      </div>
    </div>

  </div>
</template>

<script>
  import moment from 'moment'
  // import _throttle from 'lodash/throttle'
//  import _debounce from 'lodash/debounce'
  import TimeField from './TimeField'
//  import Slider from './Slider'

  let lastState

  export default {
    components: { TimeField },
    inject: ['$map', '$overlays'],
    props: ['input', 'layer'],
    data () {
      return lastState || {
        timeValuesIndex: null,

        // animation settings
        animationSettings: false,
        animate: false,
        layerOpacity: 250,
        frameRate: 2  // sec
      }
    },
    computed: {
      visibleLayers () {
        return this.$overlays.list.filter(l => l.visible)
      },
      outputTime () {
        return moment(this.activeTime * 1000).format('YYYY-MM-DD')
      },
      selectedLayers () {
        return this.input.layers
      },
      range () {
        return {
          min: 0,
          max: this.timeValues.length - 1
        }
      },
      activeTime () {
        if (this.timeValues) {
          return this.timeValues[this.timeValuesIndex]
        }
      },
      activeLayer () {
        if (this.activeTime) {
          return this.selectedLayers.filter(l => l.time_stamp === this.activeTime)[0]
        }
      },
      timeValues () {
        const rasterGroupTimeValues = []
        let group = this.selectedLayers
        group.forEach(l => { rasterGroupTimeValues.push(parseInt(l.time_stamp)) })
        return rasterGroupTimeValues.sort(function (a, b) { return a - b })
      },
      animateSpeed () {
        return 0.2813 * this.frameRate * this.frameRate - 2.063 * this.frameRate + 4
      }
    },
    watch: {
      timeValues: {
        immediate: true,
        handler () {
          this.timeValuesIndex = 0
        }
      },
      activeLayer: {
        immediate: true,
        handler (activeLayer, oldLayer) {
          this.selectedLayers
            .filter(l => l.visible || l._visible)
            .forEach(l => { this.setLayerVisibility(l, false) })
          this.setLayerVisibility(activeLayer, true)
          this.setGroupVisibility(activeLayer, true)
          this.layer.getSource().updateParams({'OPACITIES': this.getOpacities(activeLayer, oldLayer)})
        }
      },
      animate: {
        immediate: true,
        handler () {
          this.newFrame()
        }
      }
    },
    beforeDestroy () {
      lastState = this.$data
    },
    methods: {
      setLayerVisibility (layer, visible) {
        if (layer) {
          this.visibleLayers.push(layer)
          layer._visible = visible
          layer.visible = visible
        }
        this.layer.getSource().setVisibleLayers(this.visibleLayers.map(l => l.name))
      },
      setGroupVisibility (layer, visible) {
        this.$overlays.tree.forEach(group => {
          if (group.isGroup) {
            const index = group.layers.indexOf(layer)
            if (index !== -1) {
              group.visible = visible
              return true
            }
          }
        })
      },
      getOpacities (layer, oldLayer) {
        let opacityArray = []
        this.visibleLayers.forEach(l => {
          if (l.name === layer.name) {
            opacityArray.push(this.layerOpacity)
          } else if (oldLayer && l.name !== oldLayer.name) {
            opacityArray.push(250)
          }
        })
        return opacityArray.join(',')
      },
      newFrame () {
        if (this.animate) {
          if (this.timeValuesIndex === this.range.max) {
            this.timeValuesIndex = 0
          } else {
            this.timeValuesIndex += 1
          }
          setTimeout(this.newFrame, this.animateSpeed * 1000)
        }
      }
    }
  }

</script>

<style lang="scss">

  .range-container {
    display: flex !important;
    padding: 15px 0 10px;
  }

  .time-slider {
    width: 80% !important;
    height: 32px;
    padding: 0 10px;
  }

  .settings-container {
    margin: 5px 0;
    padding-top: 15px;
    opacity: 0;
    animation: fadeIn 0.3s ease-in both;
    background-color: aliceblue;
  }

  .animate-icon {
    cursor: pointer;
    color: gray !important;
  }

  .animate-row {
    max-height: 40px;
    margin-bottom: -10px;
    display: flex;
  }

  .animate-row > div {
    max-width: 170px;
    margin-left: auto;
  }

  .options-slider {
    padding: 0 !important;
    width: 100%;
    margin-left: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate3d(0, -20%, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

</style>
