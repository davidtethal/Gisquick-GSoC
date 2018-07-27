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
    :return-value.sync="pickedDate"
  >
    <v-text-field
      slot="activator"
      :value="outputFormat"
      :label="label"
      prepend-icon="event"
      readonly
    />
    <v-date-picker
      no-title
      scrollable
      :min="minDate"
      :max="maxDate"
      v-model="pickedDate"
    >
      <v-spacer/>
      <v-btn
        flat
        color="primary"
        @click="close">Cancel
      </v-btn>
      <v-btn
        flat
        color="primary"
        @click="update">OK
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
      pickedDate: null
    }
  },
  computed: {
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
      if (!this.pickedDate) {
        return moment(this.value * 1000).format(this.mask)
      } else {
        return this.pickedDate
      }
    }
  },
  watch: {
    open (value) {
      if (value) {
        this.pickedDate = moment(this.value * 1000).format('YYYY-MM-DD')
      }
    }
  },
  methods: {
    close () {
      this.open = false
    },
    update () {
      const date = moment(this.pickedDate, this.mask)
      this.$emit('input', date.unix())
      this.close()
    }
  }
}
</script>
