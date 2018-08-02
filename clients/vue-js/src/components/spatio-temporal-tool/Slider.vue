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
      ticks: String,
      animate: Boolean,
      frameRate: Number
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
      animateSpeed () {
        return 0.2813 * this.frameRate * this.frameRate - 2.063 * this.frameRate + 4
      }
    },

    methods: {
      handleInput (index) {
        this.$emit('input', index)
      },
      newFrame () {
        let index = this.value
        if (this.animate) {
          if (index === this.max) {
            index = 0
          } else {
            index += 1
          }
          this.$emit('input', index)
          setTimeout(this.newFrame, this.animateSpeed * 1000)
        }
      }
    }
  }

</script>
