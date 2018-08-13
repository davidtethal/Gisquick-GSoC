<template>
  <v-layout
    class="row time-info"
    v-if="layer.timeFilter"
  >
    <v-icon>access_time</v-icon>
    <span>{{ layer.original_time_attribute }} {{ dateRange }}</span>
    <v-icon
      class="refresh"
      v-if="filtered"
      @click="resetFilter"
    >
      refresh
    </v-icon>
  </v-layout>
</template>

<script>
  import moment from 'moment'

  export default {
    props: ['layer'],

    computed: {
      dateRange () {
//        const mask = this.layer.output_datetime_mask
        const mask = 'DD-MM-YYYY'
        const since = moment(this.layer.timeFilter.timeRange[0] * 1000).format(mask)
        const till = moment(this.layer.timeFilter.timeRange[1] * 1000).format(mask)
        return `${since}, ${till}`
      },
      filtered () {
        if (this.layer.timeFilter.timeRange[0] !== this.layer.time_values[0] ||
            this.layer.timeFilter.timeRange[1] !== this.layer.time_values[1]) {
          return true
        } else {
          return false
        }
      }
    },

    methods: {
      resetFilter () {
        if (this.filtered) {
          this.layer.timeFilter.timeRange = this.layer.time_values
          this.layer.timeMin = this.layer.time_values[0]
          this.layer.timeMax = this.layer.time_values[1]
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .time-info {
    padding: 0 0.5em;
    background-color: rgba(#EFEBE9, 0.75);
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    // border-top: 1px solid rgba(#777, 0.25);
    border-bottom: 1px solid rgba(#777, 0.25);
    opacity: 0.75;
    .v-icon {
      font-size: 16px;
      margin-right: 0.25em;
    }
    span {
      font-size: 13px;
    }
    .refresh {
      margin-left: 0.25em;
      cursor: pointer;
    }
  }
</style>
