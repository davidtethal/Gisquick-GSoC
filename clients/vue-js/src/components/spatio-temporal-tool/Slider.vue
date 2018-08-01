<template>
  <v-slider
    v-bind="_props"
    @input="handleInput"
  />
</template>

<script>
  export default {
    // requires to specify all needed props to propagate them to original range slider component
    props: {
      value: Number,
      min: Number,
      max: Number,
      step: Number,
      'tick-size': String,
      ticks: String
//      frameRate: Number,
//      fixed: Boolean,
//      hideDetails: Boolean,
//      animate: Boolean,
//      cumulatively: Boolean,
//      animationStep: Number,
//      animationStepValue: Number
    },

/*
    watch: {
      animate: {
        immediate: true,
        handler () {
          this.newFrame()
        }
      }
    },
*/

/*
    computed: {
      animateStep () {
        if (this.animationStep) {
          return this.animationStepValue * this.animationStep
        } else {
          return (this.max - this.min) / 100
        }
      },
      animateSpeed () {
        return 0.2813 * this.frameRate * this.frameRate - 2.063 * this.frameRate + 4
      }
    },
*/

    methods: {
      handleInput (value) {
        this.$emit('input', value)
      }
/*
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
*/
    }
  }
</script>
