<template>
  <div>
    <!--ATTRIBUTES DROP BOX-->
    <v-select
      v-bind="_props"
      v-if="allAttributes.length > 1"
      label="Select Attribute"
      :items="attributesOptions"
      v-model="attribute"
    />

    <!--TIME INPUTS-->
    <time-field
      :min="range.min"
      :max="range.max"
      v-model="timeRange[0]"
      :mask="dateMask"
      label="From"
    />
    <time-field
      :min="timeRange[0]"
      :max="range.max"
      v-model="timeRange[1]"
      :mask="dateMask"
      label="To"
    />

    <!--RANGE SLIDER-->
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
      <range-slider
        :min="range.min"
        :max="range.max"
        :fixed="fixedRange"
        :step="step"
        :animate.sync="animate"
        :cumulatively="false"
        :frameRate="1"
        v-model="timeRange"
        class="mx-2 time-slider"
        hide-details
      />
      <v-icon
        class="animate-icon"
        @click="animationSettings = !animationSettings">
        settings
      </v-icon>
    </div>

    <!--ANIMATION SETTINGS-->
    <div v-bind:class="{ 'settings-container': animationSettings }"  v-if="animationSettings">
      <div class="animate-row">
        <p>fixed range</p>
        <v-checkbox
          class="switch"
          v-model="fixedRange"
          color="primary"
          hide-details
        />
        <!--label="Fixed range"-->
      </div>
      <div class="animate-row">
        <p>cumulative</p>
        <v-checkbox
          class="switch"
          color="primary"
          hide-details
        />
        <!--v-model="cumulatively"-->
      </div>
      <div class="animate-row">
        <p>speed</p>
        <v-slider class="speed-slider"
                  step="0.1"
                  min="0"
                  max="4"
        ></v-slider>
        <!--v-model="animationSpeed"-->
        <!--thumbLabel="false"-->
      </div>
      <div class="animate-row">
        <p>step</p>
        <v-text-field
          class="step-text ml-20">
          <!--v-model="setStepValue"-->
        </v-text-field>
        <v-select
          max-height="150"
          class="step-select"
          item-value="inUnix"
          item-text="name"
        />
        <!--:items="timeSteps"-->
        <!--v-model="setTimeStep"-->
      </div>
    </div>


  </div>
</template>

<script>
import moment from 'moment'
// import _throttle from 'lodash/throttle'
import _debounce from 'lodash/debounce'
import TimeField from './TimeField'
import RangeSlider from './RangeSlider1'

let lastState

export default {
  components: { TimeField, RangeSlider },
  inject: ['$map', '$overlays'],
  props: ['input', 'layer'],
  data () {
    return lastState || {
      step: 1000,
      attribute: 'All attributes',
      timeRange: [Number.MIN_VALUE, Number.MAX_VALUE],

      // animation settings
      animationSettings: false,
      animate: false,
      fixedRange: false,
      cumulatively: false
    }
  },
  computed: {
    dateMask () {
      if (this.selectedLayers.length === 1) {
        return this.selectedLayers[0].output_datetime_mask
      } else {
        return this.getDateTimeMask(this.selectedLayers)
      }
    },
    visibleLayers () {
      return this.$overlays.list.filter(l => l.visible && l.original_time_attribute)
    },
    selectedLayers () {
      return Array.isArray(this.input) ? this.input : [this.input]
    },
    allAttributes () {
      return [...new Set(this.selectedLayers
        .filter(l => l.visible)
        .map(l => l.visible && l.original_time_attribute))]
    },
    attributesOptions () {
      if (this.allAttributes.length > 1) {
        return ['All attributes', ...this.allAttributes]
      }
      return this.allAttributes
    },
    range () {
      return {
        min: Math.min(...this.selectedLayers.map(l => l.time_values[0])),
        max: Math.max(...this.selectedLayers.map(l => l.time_values[1]))
      }
    },
    filter () {
      const filters = []
      if (this.attribute) {
        this.visibleLayers
//          .filter(layer => layer.visible)
          .forEach(layer => {
            let layerFilter = ''
            if (this.selectedLayers.includes(layer) &&
               (this.attribute === 'All attributes' || layer.original_time_attribute === this.attribute)) {
              layerFilter = this.createFilterString(layer, ...this.timeRange)
              layer.timeFilter = layerFilter
              layer.timeMin = this.timeRange[0]
              layer.timeMax = this.timeRange[1]
            } else if (layer.timeFilter) {
              layerFilter = layer.timeFilter
            }
            filters.push(layerFilter)
          })
      }
      return filters.join(';')
    }
  },
  watch: {
    animate (value) {
      console.log(value)
    },
    selectedLayers: {
      immediate: true,
      handler () {
        if (this.allAttributes.length <= 1) {
          this.attribute = 'All attributes'
        }
        if (this.selectedLayers.length === 1 && this.selectedLayers[0].visible === false) {
          this.setLayerVisibility(this.selectedLayers[0], true)
        }
      }
    },
    range: {
      immediate: true,
      handler (range) {
        if (this.selectedLayers.length === 1 && this.selectedLayers[0].timeMin) {
          this.$set(this.timeRange, 0, this.selectedLayers[0].timeMin)
          this.$set(this.timeRange, 1, this.selectedLayers[0].timeMax)
        } else {
          this.$set(this.timeRange, 0, range.min)
          this.$set(this.timeRange, 1, range.max)
        }
      }
    },
    filter: {
      immediate: true,
      handler () {
        this.updateVectorLayer()
      }
    }
  },
  beforeDestroy () {
    lastState = this.$data
  },
  methods: {
    updateVectorLayer: _debounce(function () {
      this.$map.overlay.getSource().updateParams({'FILTER': this.filter})
    }, 250),
    createFilterString (layer, min, max) {
      if (layer.unix) {
        return this.createLayerFilterString(layer.name, layer.time_attribute, min, max)
      } else {
        return this.createLayerFilterString(
          layer.name,
          layer.original_time_attribute,
          moment(min * 1000).format(layer.input_datetime_mask),
          moment(max * 1000).format(layer.input_datetime_mask)
        )
      }
    },
    createLayerFilterString (layerName, attribute, min, max) {
      return `${layerName}:"${attribute}" >= '${min}' AND "${attribute}" <= '${max}'`
    },
    setLayerVisibility (layer, visible) {
      if (layer) {
        this.visibleLayers.push(layer)
        layer._visible = visible
        layer.visible = visible
      }
      this.layer.getSource().setVisibleLayers(this.visibleLayers.map(l => l.name))
    },
    getDateTimeMask (layers) {
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].output_datetime_mask.includes('HH:mm') &&
           layers[i].output_datetime_mask.includes('YYYY') &&
           (this.attribute === 'All attributes' || layers[i].original_time_attribute === this.attribute)) {
          return layers[i].output_datetime_mask
        }
      }
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].output_datetime_mask.includes('YYYY') &&
           (this.attribute === 'All attributes' || layers[i].original_time_attribute === this.attribute)) {
          return layers[i].output_datetime_mask
        }
      }
      return layers[0].output_datetime_mask
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

  .switch {
    margin-top: 0;
  }

  .switch > div > div > div {
    margin: auto;
  }

  .speed-slider {
    padding: 0 !important;
    width: 100%;
    margin-left: 20px;
  }

  .step-text {
    padding: 0;
    margin-top: -3px;
    margin-left: auto !important;
    max-width: 70px !important;
  }

  .step-select {
    padding: 0;
    margin-top: -3px;
    margin-left: 0 !important;
    max-width: 100px !important;
  }

  .step-select > div > div {
    overflow: inherit;
  }

  .step-text > div > input {
    text-align: center;
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
