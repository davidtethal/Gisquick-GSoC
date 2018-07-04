<template>
  <v-speed-dial
    class="tools"
    v-model="open"
    :open-on-hover="false"
    direction="bottom"
    transition="scale-transition">
    <v-btn
      fab dark
      slot="activator"
      v-model="open">
      <v-icon>menu</v-icon>
      <v-icon>close</v-icon>
    </v-btn>

    <v-btn
      v-for="tool in tools"
      :key="tool.name"
      fab dark
      @click="activate(tool)">
      <icon :name="tool.icon" />
    </v-btn>
  </v-speed-dial>
</template>

<script>
import Identification from './Identification'
import Measure from './measure/Measure'
import Slider from './ContentPanel/Slider'
import Print from './print/Print'

export default {
  inject: ['$map', '$project'],
  data: () => ({
    open: false
  }),
  created () {
    this.tools = [
      Identification,
      Measure,
      Print
    ]
    for (let i = 0; i < this.$project.layers.length; i++) {
      if (this.$project.layers[i].time_values &&
          this.$project.layers[i].time_values.length > 0 ||
          this.$project.layers[i].spatio_temporal) {
        this.tools.push(Slider)
        break
      }
    }
  },
  methods: {
    activate (tool) {
      if (tool.activate) {
        tool.activate(this.$project)
      } else {
        this.$root.$panel.setPanel(tool)
      }
      this.activeTool = tool
    }
  }
}
</script>

<style lang="scss">
.tools.speed-dial {
  .btn--floating {
    border-radius: 20%;
    width: 2.75em;
    height: 2.75em;
  }
  svg.icon {
    width: 24px;
    height: 24px;
  }
}
</style>
