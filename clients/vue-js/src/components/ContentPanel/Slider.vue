<template>
  <div>
    <p>time-attribute: {{this.project.time_data.attribute}}</p>
    <!--<p v-for="time in this.timeValues">{{time}}</p>-->
    <v-slider v-model="sliderValue" thumb-label step="1" ticks v-bind:min="this.timeValues[0]" v-bind:max="this.timeValues.slice(-1)[0]"></v-slider>
    <v-text-field v-model="sliderValue" type="number"></v-text-field>
  </div>
</template>

<script>
  export default {
    name: 'timeslide',
    props: [
      'project', 'layers', 'visible'
    ],
    data () {
      return {
        timeValues: [],
        sliderValue: 0,
        min: 2000,
        max: 2015
      }
    },
    watch: {
      visible (visible) {
        this.setActive(visible)
      }
    },
    created () {
      console.log('slider', this.project)
    },
    mounted () {
      this.timeValues = this.project.time_data.values
      this.sliderValue = this.timeValues[0]
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">

</style>
