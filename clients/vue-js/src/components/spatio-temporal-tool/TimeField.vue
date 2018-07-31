<template>
  <v-menu
    ref="open"
    v-model="open"
    lazy
    offset-y
    full-width
    min-width="290px"
    transition="scale-transition"
    :close-on-content-click="false"
    :return-value.sync="pickedDateTime[0]"
  >
    <v-text-field
      slot="activator"
      :value="outputFormat"
      :label="label"
      prepend-icon="event"
      readonly
    />
    <v-date-picker
      :class="{ 'hide-child': !includeDate }"
      v-model="pickedDateTime[0]"
      :min="minDate"
      :max="maxDate"
      scrollable
      no-title
    >
      <v-spacer></v-spacer>
      <v-time-picker
        class="time-picker"
        v-model="pickedDateTime[1]"
        v-if="includeTime"
        format="24hr"
        no-title
      ></v-time-picker>
      <v-spacer/>
      <v-btn
        @click="close"
        flat
        color="primary">Cancel
      </v-btn>
      <v-btn
        class="right"
        @click="update"
        flat
        color="primary">OK
      </v-btn>
    </v-date-picker>
  </v-menu>

</template>

<script>
import moment from 'moment'

export default {
  props: {
    // unix timestamps
    min: Number,
    max: Number,
    value: Number,

    time: {
      type: Boolean,
      default: false
    },
    mask: {
      type: String,
      default: 'YYYY-MM-DD'
    },
    label: String
  },
  data () {
    return {
      open: false,
      pickedDateTime: []
    }
  },
  computed: {
    includeDate () {
      if (this.mask.includes('YYYY') || this.mask.includes('MM') || this.mask.includes('DD')) {
        return true
      }
      return false
    },
    includeTime () {
      if (this.mask.includes('HH:mm') || this.mask.includes('HH') || this.mask.includes('mm')) {
        return true
      }
      return false
    },
    minDate () {
      if (Number.isInteger(this.min)) {
        return moment.unix(this.min).toISOString()
      }
    },
    maxDate () {
      if (Number.isInteger(this.max)) {
        return moment.unix(this.max).toISOString()
      }
    },
    moment () {
      return moment.unix(this.value)
    },
    outputFormat () {
      if (!this.pickedDateTime[0]) {
        return moment(this.value * 1000).format(this.mask)
      } else {
        const dateTime = `${this.pickedDateTime[0]} ${this.pickedDateTime[1]}`
        return moment(dateTime, 'YYYY-MM-DD HH:mm').format(this.mask)
      }
    }
  },
  watch: {
    open (value) {
      if (value) {
        this.pickedDateTime = moment((this.value * 1000)).format('YYYY-MM-DD HH:mm').split(' ')
      }
    }
  },
  methods: {
    close () {
      this.open = false
    },
    update () {
      const dateTime = moment(`${this.pickedDateTime[0]} ${this.pickedDateTime[1]}`, 'YYYY-MM-DD HH:mm')
      this.$emit('input', dateTime.unix())
      this.close()
    }
  }
}
</script>

<style lang="scss">

  .hide-child > :first-child{
    display: none;
  }

  .v-time-picker {
    display: flex !important;
  }

  .v-picker__actions {
    display: block;
    padding: 8px 0;
  }

  .v-picker--time {
    margin: 0;
  }

  .v-picker {
    display: inherit;
  }

  .right {
    float: right;
  }
</style>
