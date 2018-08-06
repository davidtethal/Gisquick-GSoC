<template>
  <v-range-slider
    v-bind="_props"
    @input="handleInput"
  />
</template>

<script>
export default {
  // requires to specify all needed props to propagate them to original range slider component
  props: {
    value: Array,
    min: Number,
    max: Number,
    frameRate: Number,
    fixed: Boolean,
    hideDetails: Boolean,
    animate: Boolean,
    cumulatively: Boolean,
    animationStep: Number,
    animationStepValue: String
  },

  watch: {
    animate: {
      immediate: true,
      handler () {
        this.newFrame()
      }
    }
  },

  computed: {
    animateStep () {
      if (this.animationStep) {
        return parseInt(this.animationStepValue) * this.animationStep
      } else {
        return (this.max - this.min) / 100
      }
    },
    animateSpeed () {
      return 0.2813 * this.frameRate * this.frameRate - 2.063 * this.frameRate + 4
    }
  },

  methods: {
    _validate (val) {
      if (val[0] < this.min) {
        return [this.min, val[1] + this.min - val[0]]
      }
      if (val[1] > this.max) {
        return [val[0] + this.max - val[1], this.max]
      }
      return val
    },
    handleInput (val) {
      let value = val
      if (this.fixed) {
        if (val[0] !== this.value[0]) {
          value = this._validate([val[0], val[1] + val[0] - this.value[0]])
        }
        if (val[1] !== this.value[1]) {
          value = this._validate([val[0] + val[1] - this.value[1], val[1]])
        }
      }
      this.$emit('input', value)
    },
    newFrame () {
      if (this.animate) {
        if (this.cumulatively) {
          if (this.value[1] < this.max - this.animateStep) {
            this.value[1] += this.animateStep
          } else if (this.value[0] < this.max - 2 * this.animateStep) {
            this.value[0] += this.animateStep
          } else {
            this.$emit('update:animate', false)
            return
          }
        } else {
          if (this.value[1] < this.max - this.animateStep) {
            this.value[0] += this.animateStep
            this.value[1] += this.animateStep
          } else {
            this.$emit('update:animate', false)
            return
          }
        }
        this.$emit('input', [this.value[0], this.value[1]])
        setTimeout(this.newFrame, this.animateSpeed * 1000)
      }
    }
  }
}
</script>
