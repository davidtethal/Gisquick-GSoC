<template>
  <div class="pa-2">
    <!--layers drop box-->
    <!--@change in case of selecting same option twice-->
    <!--<v-date-picker v-model="date" no-title="true" :reactive="false"></v-date-picker>-->


    <v-select
      label="Select Time Layer"
      :items="layersSelection"
      v-model="timeData"
      item-text="name"
      @change="resetAttribute()"
    />
    <v-select
      v-if="attributesSelection.length > 1 && !attribute"
      label="Select Attribute"
      :items="attributesSelection"
      v-model="attribute"
    />
    <div v-if="openInfo">
      <p v-if="!attribute">time-attribute: {{timeData.original_time_attribute}}</p>
      <p v-if="attribute">time-attribute: {{attribute}}</p>
      <!--<p v-for="time in timeValues">{{time}}</p>-->
      <!--thumb-label-->
<!--      <v-slider
        ticks
        @click="getNewUrl()"
        v-model="sliderValue"
        :min="sliderMin"
        :max="sliderMax"
        :step="step"
        hide-details
      />-->
<!--      <div class="slidecontainer">
        <input
          type="range"
          @click="getNewUrl()"
          v-model="sliderValue"
          :min="sliderMin"
          :max="sliderMax"
          :step="step"
          class="slider"
          id="myRange">
      </div>-->

      <!--double range slider-->
      <section class="range-slider">
        <span class="rangeValues"></span>
        <input
          @click="getNewUrl()"
          v-model="sliderValue1"
          :min="sliderMin"
          :max="sliderMax"
          :step="step"
          type="range">
        <input
          @click="getNewUrl()"
          v-model="sliderValue"
          :min="sliderMin"
          :max="sliderMax"
          :step="step"
          type="range">
      </section>

      <v-text-field
        type="text"
        v-model="sliderValueDate1"
        hide-details
      />
      <v-text-field
        type="text"
        v-model="sliderValueDate"
        hide-details
      />
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import ImageLayer from 'ol/layer/image'
  import { WebgisImageWMS, layersList } from '../../map-builder'

  export default {
    inject: ['$map', '$project', '$overlays'],
    name: 'timeslide',

    data () {
      return {
        layers: layersList(this.$project.layers, true),
        layersSelection: [],
        attributesSelection: [],
        timeData: null,
        sliderValue1: 0,
        sliderValue: null,
        sliderValueDate1: null,
        sliderValueDate: null,
        attribute: null,
        sliderMin: 0,
        sliderMax: 0,
        openInfo: false,
        date: null
      }
    },

    computed: {
      layerModel () {
        if (this.timeData && this.timeData.selectAllLayers) {
          return this.layersSelection[0]
        } else if (this.timeData) {
          return this.layers.find(l => l.name === this.timeData.name)
        }
      },
      step () {
        console.log('STEP', (this.sliderMax - this.sliderMin) / 100)
        return (this.sliderMax - this.sliderMin) / 100
      }
    },

    watch: {
      timeData (value, oldValue) {
        console.log(value)
        this.attributesSelection = []
        this.attribute = null
        // todo timeData watch or trigger method
        // case of all layers
        if (value.selectAllLayers) {
          this.checkDiffAttributes()
          // case of one attribute
          if (this.attributesSelection.length === 1) {
            const minmax = this.getSliderRange(this.attributesSelection[0])
            this.sliderMin = minmax[0]
            this.sliderMax = minmax[1]
            this.sliderValue1 = minmax[0]
            this.sliderValue = minmax[0]
            this.openInfo = true
          }
          // case of one layer
        } else if (!value.selectAllLayers) {
          this.setSliderValue()
          this.sliderMin = this.timeData.timeValues[0]
          this.sliderMax = this.timeData.timeValues[1]
          this.openInfo = true
          this.getNewUrl()
        }
      },
      layerModel (model, oldModel) {
/*
        if (oldModel) {
          this.resetLayerTitle(oldModel)
        }
*/
//        model._title = model.title
        if (!model.visible) {
          this.setModelVisibility(model, true)
        }
      },
      attribute (value) {
        console.log('ATTRIBUTE', value)
        if (value) {
          const minmax = this.getSliderRange(value)
          this.sliderMin = minmax[0]
          this.sliderMax = minmax[1]
          this.sliderValue = minmax[0]
          this.openInfo = true
        }
      },
      sliderValue1 (value) {
        this.sliderValueDate1 = moment(value * 1000).format('DD-MM-YYYY')
      },
      sliderValue (value) {
//        console.log('UNIX', value)
//        console.log('MIN', this.sliderMin)
//        console.log('MAX', this.sliderMax)
//        console.log(moment(value * 1000).format('DD-MM-YYYY'))
        this.sliderValueDate = moment(value * 1000).format('DD-MM-YYYY')
      }
    },

    created () {

      // Initialize Sliders
      var sliderSections = document.getElementsByClassName("range-slider");
      for( var x = 0; x < sliderSections.length; x++ ){
        var sliders = sliderSections[x].getElementsByTagName("input");
        for( var y = 0; y < sliders.length; y++ ){
          if( sliders[y].type ==="range" ){
            sliders[y].oninput = this.getVals();
            // Manually trigger event first time to display values
            sliders[y].oninput();
          }
        }
      }

      this.addAllIntoSelection()
      const map = this.$map
      if (!(map.overlay instanceof ImageLayer)) {
        // create and switch to WMS layer
        this.originalLayer = map.overlay
        this.originalLayer.setVisible(false)

        this.layer = new ImageLayer({
          visible: true,
          extent: this.$project.project_extent,
          source: new WebgisImageWMS({
            resolutions: this.$project.tile_resolutions,
            url: this.$project.ows_url,
            visibleLayers: this.originalLayer.getSource().getVisibleLayers(),
            layersAttributions: {},
            params: {
              'FORMAT': 'image/png'
            },
            serverType: 'qgis',
            ratio: 1
          })
        })
        map.addLayer(this.layer)
        // set as new main map's layer - required to control layers visibility in Content panel
        map.overlay = this.layer
      }
    },

    beforeDestroy () {
      for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].title = this.layers[i].name
        delete this.layers[i].sliderValue1
        delete this.layers[i].sliderValue
        delete this.layers[i].timeFilter
      }
      if (this.originalLayer) {
        // switch back to original cached layer
        const map = this.$map
        map.removeLayer(this.layer)
        map.overlay = this.originalLayer
        map.overlay.getSource().setVisibleLayers(this.layer.getSource().getVisibleLayers())
        map.overlay.setVisible(true)
      }
    },

    methods: {
      // make selected layer visible
      setModelVisibility (model, visible) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        if (visible && !model.selectAllLayers) {
          visibleLayers.push(model)
          model._visible = true
          model.visible = true
        }
        this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      },
      // initialize slider by last used value
      setSliderValue () {
        if (this.layerModel.sliderValue1) {
          this.sliderValue1 = this.layerModel.sliderValue1
        } else {
          this.sliderValue1 = this.timeData.timeValues[0]
        }
        if (this.layerModel.sliderValue) {
          this.sliderValue = this.layerModel.sliderValue
        } else {
          this.sliderValue = this.timeData.timeValues[0]
        }
      },
      // make filter for non selected time layers
      getFilterFromLayers (layers, layerModel) {
        const modelIndex = layers.indexOf(layerModel)
        let filter = ''
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].timeFilter && i !== modelIndex) {
            filter += `;${layers[i].timeFilter}`
          }
        }
        return filter
      },
      // update WMS url
      getNewUrl () {
        if (this.layerModel.selectAllLayers) {
          this.updateMultipleLayers()
        } else {
          this.updateSingleLayer()
        }
      },
      updateSingleLayer () {
        console.log('SINGLE')
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
//        const modelFilter = `${this.timeData.name}:"${this.timeData.timeAttribute}" < '${this.sliderValue}'`
        const modelFilter = `${this.timeData.name}:"${this.timeData.timeAttribute}" >= '${this.sliderValue1}' AND "${this.timeData.timeAttribute}" <= '${this.sliderValue}'`
        const filter = `${modelFilter}${otherLayerFilter}`
        console.log(filter)
        this.layer.getSource().updateParams({'FILTER': filter})
        this.layerModel.title = `${this.timeData.name}-${this.sliderValue}`
        this.layerModel.sliderValue1 = this.sliderValue1
        this.layerModel.sliderValue = this.sliderValue
        this.layerModel.timeFilter = modelFilter
        console.log(this.layerModel)
      },
      updateMultipleLayers () {
        console.log('MULTIPLE')
        const attribute = this.attribute || this.attributesSelection[0]
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute)
        console.log(visibleLayers)
        let filterIncrement = ''
        let filter = ''
        for (let i = 0; i < visibleLayers.length; i++) {
          console.log(visibleLayers[i].name)
          if (visibleLayers[i].original_time_attribute === attribute) {
//            filterIncrement = `;${visibleLayers[i].name}:"${visibleLayers[i].timeAttribute}" < '${this.sliderValue}'`
            filterIncrement = `;${visibleLayers[i].name}:"${visibleLayers[i].timeAttribute}" >= '${this.sliderValue1}' AND "${visibleLayers[i].timeAttribute}" <= '${this.sliderValue}'`
            filter += filterIncrement
            visibleLayers[i].title = `${visibleLayers[i].name}-${this.sliderValue}`
            visibleLayers[i].sliderValue1 = this.sliderValue1
            visibleLayers[i].sliderValue = this.sliderValue
            visibleLayers[i].timeFilter = filterIncrement
          } else {
            filter += `;${visibleLayers[i].timeFilter}`
          }
        }
        console.log(filter)
        this.layer.getSource().updateParams({'FILTER': filter})
      },
      // add "All visible layers" option into layers select
      addAllIntoSelection () {
        const all = {
          name: 'All visible layers',
          title: 'All visible layers',
          selectAllLayers: true
        }
        this.layersSelection.push(all)
        this.$project.layers.forEach(l => { this.layersSelection.push(l) })
      },
      // find unique attributes
      checkDiffAttributes () {
        this.openInfo = false
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute)
        this.attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
      },
      // get min and max slider range
      getSliderRange (attribute) {
        console.log(attribute)
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.timeAttribute && l.original_time_attribute === attribute)
        // set min max values
        let min = 1E+100
        let max = -1E+100
        for (let i = 0; i < visibleLayers.length; i++) {
          if (min > visibleLayers[i].timeValues[0]) { // vl[i].timeAttribute && vl[i].timeAttribute === attribute &&
            min = visibleLayers[i].timeValues[0]
          }
          if (max < visibleLayers[i].timeValues[1]) { // vl[i].timeAttribute && vl[i].timeAttribute === attribute &&
            max = visibleLayers[i].timeValues[1]
          }
        }
        return [min, max]
      },
      resetAttribute () {
        this.attribute = null
        this.openInfo = false
        console.log(this.attribute)
        this.attributesSelection = []
        this.checkDiffAttributes()
        if (this.attributesSelection.length === 1) {
          this.attribute = this.attributesSelection[0]
          const minmax = this.getSliderRange(this.attributesSelection[0])
          this.sliderMin = minmax[0]
          this.sliderMax = minmax[1]
          this.sliderValue1 = minmax[0]
          this.sliderValue = minmax[0]
          this.openInfo = true
        }
      },
      getVals () {
        // Get slider values
        var parent = this.parentNode;
        var slides = parent.getElementsByTagName("input");
        var slide1 = parseFloat( slides[0].value );
        var slide2 = parseFloat( slides[1].value );
        // Neither slider will clip the other, so make sure we determine which is larger
        if( slide1 > slide2 ){ var tmp = slide2; slide2 = slide1; slide1 = tmp; }

        var displayElement = parent.getElementsByClassName("rangeValues")[0];
        displayElement.innerHTML = "$ " + slide1 + "k - $" + slide2 + "k";
      },
      testSlider1 () {
        console.log(this.range1)
        console.log(this.range2)
      }
    }
  }
</script>

<style lang="scss">

  /*slider*/
  @mixin range-slider($width, $height, $input-top, $input-bg-color, $input-thumb-color, $float:none, $input-height:20px, $input-border-radius:14px) {
    position: relative;
    width: $width;
    height: $height;
    float: $float;
    text-align: center;

    input[type="range"] {
      pointer-events: none;
      position: absolute;
      -webkit-appearance: none;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
      border: none;
      border-radius: $input-border-radius;
      background: $input-bg-color;
      box-shadow: inset 0 1px 0 0 darken($input-bg-color,15%), inset 0 -1px 0 0 darken($input-bg-color,10%);
      -webkit-box-shadow: inset 0 1px 0 0 darken($input-bg-color,15%), inset 0 -1px 0 0 darken($input-bg-color,10%);
      overflow: hidden;
      left: 0;
      top: $input-top;
      width: $width;
      outline: none;
      height: $input-height;
      margin: 0;
      padding: 0;
    }

    input[type="range"]::-webkit-slider-thumb {
      pointer-events: all;
      position: relative;
      z-index: 1;
      outline: 0;
      -webkit-appearance: none;
      width: $input-height;
      height: $input-height;
      border: none;
      border-radius: $input-border-radius;
      background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, lighten($input-thumb-color,60%)), color-stop(100%, $input-thumb-color)); /* android <= 2.2 */
      background-image: -webkit-linear-gradient(top , lighten($input-thumb-color,60%) 0, $input-thumb-color 100%); /* older mobile safari and android > 2.2 */;
      background-image: linear-gradient(to bottom, lighten($input-thumb-color,60%) 0, $input-thumb-color 100%); /* W3C */
    }

    input[type="range"]::-moz-range-thumb {
      pointer-events: all;
      position: relative;
      z-index: 10;
      -moz-appearance: none;
      width: $input-height;
      height: $input-height;
      border: none;
      border-radius: $input-border-radius;
      background-image: linear-gradient(to bottom, lighten($input-thumb-color,60%) 0, $input-thumb-color 100%); /* W3C */
    }

    input[type="range"]::-ms-thumb {
      pointer-events: all;
      position: relative;
      z-index: 10;
      -ms-appearance: none;
      width: $input-height;
      height: $input-height;
      border-radius: $input-border-radius;
      border: 0;
      background-image: linear-gradient(to bottom, lighten($input-thumb-color,60%) 0, $input-thumb-color 100%); /* W3C */
    }

    input[type=range]::-moz-range-track {
      position: relative;
      z-index: -1;
      background-color: rgba(0, 0, 0, 1);
      border: 0;
    }

    input[type=range]:last-of-type::-moz-range-track {
      -moz-appearance: none;
      background: none transparent;
      border: 0;
    }

    input[type=range]::-moz-focus-outer {
      border: 0;
    }
  }

  section.range-slider {
    @include range-slider(100%, 50px, 5px, #F1EFEF, #413F41, left);
  }

</style>
