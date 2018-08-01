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
<!--
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
-->
      <slider
        class="mx-2 time-slider"
        v-model="timeValuesIndex"
        :min="range.min"
        :max="range.max"
        :step="1"
        ticks="always"
        tick-size="2"
        hide-details
      />
      <!--:fixed="fixedRange"-->
      <!--:step="step"-->
      <!--:animate.sync="animate"-->
      <!--:cumulatively="cumulatively"-->
      <!--:frameRate="animationSpeed"-->
      <!--:animationStepValue="animationStepValue"-->
      <!--:animationStep="animationStep"-->

      <!--
            <v-icon
              class="animate-icon"
              @click="animationSettings = !animationSettings">
              settings
            </v-icon>
      -->
    </div>

   <!-- &lt;!&ndash;ANIMATION SETTINGS&ndash;&gt;
    <div v-bind:class="{ 'settings-container': animationSettings }"  v-if="animationSettings">
      <div class="animate-row">
        <p>fixed range</p>
        <v-checkbox
          class="switch"
          v-model="fixedRange"
          color="primary"
          hide-details
        />
      </div>
      <div class="animate-row">
        <p>cumulative</p>
        <v-checkbox
          class="switch"
          v-model="cumulatively"
          color="primary"
          hide-details
        />
      </div>
      <div class="animate-row">
        <p>speed</p>
        <v-slider class="speed-slider"
                  v-model="animationSpeed"
                  step="0.1"
                  min="0"
                  max="4"
        ></v-slider>
      </div>
      <div class="animate-row">
        <p>step</p>
        <v-text-field
          class="step-text ml-20"
          v-model="animationStepValue"
          mask="##"
        ></v-text-field>
        <v-select
          class="step-select"
          v-model="animationStep"
          :items="animationStepArray"
          max-height="150"
          item-value="inUnix"
          item-text="name"
        />
      </div>
    </div>-->


  </div>
</template>

<script>
  import moment from 'moment'
  // import _throttle from 'lodash/throttle'
//  import _debounce from 'lodash/debounce'
  import TimeField from './TimeField'
  import Slider from './Slider'

  let lastState

  export default {
    components: { TimeField, Slider },
    inject: ['$map', '$overlays'],
    props: ['input', 'layer'],
    data () {
      return lastState || {
        timeValuesIndex: null

/*
        // animation settings
        animationSettings: false,
        animate: false,
        fixedRange: false,
        cumulatively: false,
        animationSpeed: 2,
        animationStepValue: null,
        animationStep: null,
        animationStepArray: [
          {name: 'seconds', inUnix: 1},
          {name: 'minutes', inUnix: 60},
          {name: 'hours', inUnix: 3600},
          {name: 'days', inUnix: 86400},
          {name: 'months', inUnix: 2592000},
          {name: 'years', inUnix: 31536000}
        ]
*/
      }
    },
    computed: {
      outputTime () {
        return moment(this.activeTime * 1000).format('YYYY-MM-DD')
      },
      selectedLayers () {
        return this.input.layers
      },
      range () {
        return {
//          min: Math.min(...this.selectedLayers.map(l => l.time_stamp)),
//          max: Math.max(...this.selectedLayers.map(l => l.time_stamp))
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
        handler () {
          this.selectedLayers.forEach(l => {
            if (l.name === this.activeLayer.name) {
              this.setLayerVisibility(l, true)
            } else if (l.visible) {
              this.setLayerVisibility(l, false)
            }
          })
        }
      }
    },
    beforeDestroy () {
      lastState = this.$data
    },
    methods: {
      setLayerVisibility (layer, visible) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        if (layer) {
          visibleLayers.push(layer)
          layer._visible = visible
          layer.visible = visible
        }
        this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      }
    }
  }

</script>

<style lang="scss">


</style>
