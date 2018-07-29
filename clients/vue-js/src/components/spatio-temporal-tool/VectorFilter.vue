<template>
  <div>
    <!--attributes drop box-->
    <v-select
      v-bind="_props"
      v-if="allAttributes.length > 1"
      label="Select Attribute"
      :items="attributesOptions"
      v-model="attribute"
    />

    <time-field
      :min="range.min"
      :max="range.max"
      v-model="timeRange[0]"
      mask="DD-MM-YYYY"
      label="From"
    />
    <time-field
      :min="timeRange[0]"
      :max="range.max"
      v-model="timeRange[1]"
      mask="YYYY-MM-DD"
      label="To"
    />
    <range-slider
      :min="range.min"
      :max="range.max"
      :fixed="fixedRange"
      :step="step"
      v-model="timeRange"
      class="mx-2"
      hide-details
    />
    <v-checkbox
      color="primary"
      label="Fixed range"
      v-model="fixedRange"
      hide-details
    />
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
      step: 100,
      attribute: 'All attributes',
      fixedRange: false,
      timeRange: [Number.MIN_VALUE, Number.MAX_VALUE]
    }
  },
  computed: {
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
          .filter(layer => layer.visible)
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
    input: {
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
    }
  }
}
</script>
