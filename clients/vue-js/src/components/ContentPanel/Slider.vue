<template>
  <div class="pa-2">

    <!--layers drop box-->
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

    <div v-if="openVector">
      <!--VECTOR datepicker 1-->
      <v-menu
        ref="menu1"
        lazy
        :close-on-content-click="false"
        v-model="menu1"
        transition="scale-transition"
        offset-y
        full-width
        :nudge-right="40"
        :return-value.sync="pickerDate1">
        <v-text-field
          slot="activator"
          v-model="userDate1"
          prepend-icon="event"
          readonly
        ></v-text-field>
        <v-date-picker
          v-bind:class="{ 'hide-child': !hasDate }"
          v-model="pickerDate1"
          no-title
          scrollable
          :min="datePickerMinMax[0]"
          :max="pickerDate2">
          <v-spacer></v-spacer>
          <v-time-picker
            v-if="hasTime"
            v-model="pickerTime1"
            format="24hr"
            no-title
          ></v-time-picker>
          <v-btn flat color="primary" @click="menu1 = false; resetTime(1)">
            Cancel
          </v-btn>
          <v-btn class="right" flat color="primary" @click="$refs.menu1.save(pickerDate1); getNewVector()">
            OK
          </v-btn>
        </v-date-picker>
      </v-menu>

      <!--VECTOR datepicker 2-->
      <v-menu
        ref="menu2"
        lazy
        :close-on-content-click="false"
        v-model="menu2"
        transition="scale-transition"
        offset-y
        full-width
        :nudge-right="40"
        :return-value.sync="pickerDate2">
        <v-text-field
          class="no-padding"
          slot="activator"
          v-model="userDate2"
          prepend-icon="event"
          readonly
        ></v-text-field>
        <v-date-picker
          v-bind:class="{ 'hide-child': !hasDate }"
          v-model="pickerDate2"
          no-title
          scrollable
          :min="pickerDate1"
          :max="datePickerMinMax[1]">
          <v-spacer></v-spacer>
          <v-time-picker class="time-picker" v-if="hasTime" v-model="pickerTime2" format="24hr" no-title ></v-time-picker>
          <v-btn flat color="primary" @click="menu2 = false; resetTime(2)">
            Cancel
          </v-btn>
          <v-btn class="right" flat color="primary" @click="$refs.menu2.save(pickerDate2); getNewVector()">
            OK
          </v-btn>
        </v-date-picker>
      </v-menu>
    </div>

    <!--RASTER date-->
    <div v-if="openRaster">
      <v-text-field
        v-model="rasterDate"
        readonly
      ></v-text-field>
    </div>

    <!--VECTOR double range slider-->
    <!--<div class="range-container"
         v-if="!openRaster">
      &lt;!&ndash;v-bind:class="{ hidden: !openVector }"&ndash;&gt;
      <v-icon
        class="animate-icon"
        v-if="animateStop && openVector"
        @click="animate(animateStop)">
        play_circle_outline
      </v-icon>
      <v-icon
        class="animate-icon"
        v-if="!animateStop && openVector"
        @click="animate(animateStop)">
        pause_circle_outline
      </v-icon>
      <vue-slider
        class="time-slider"
        ref="slider"
        v-model="sliderValue"
        v-bind="sliderOptions"
        @drag-end="getNewVector()">
      </vue-slider>
      <v-icon
        v-if="openVector"
        class="animate-icon"
        @click="animationSettings = !animationSettings">
        settings
      </v-icon>
    </div>-->
    <div class="range-container"
         v-if="!openRaster"
         v-bind:class="{ hidden: !openVector }">
      <v-icon
        class="animate-icon"
        v-if="animateStop && openVector"
        @click="animate(animateStop)">
        play_circle_outline
      </v-icon>
      <v-icon
        class="animate-icon"
        v-if="!animateStop && openVector"
        @click="animate(animateStop)">
        pause_circle_outline
      </v-icon>
      <vue-slider
        class="time-slider"
        ref="slider"
        v-model="sliderValue"
        v-bind="sliderOptions"
        @drag-end="getNewVector()">
      </vue-slider>
      <v-icon
        v-if="openVector"
        class="animate-icon"
        @click="animationSettings = !animationSettings">
        settings
      </v-icon>
    </div>

    <!--RASTER range slider-->
    <div class="range-container" v-bind:class="{ hidden: !openRaster }">
      <v-icon
        class="animate-icon"
        v-if="animateStop && openRaster"
        @click="animate(animateStop)">
        play_circle_outline
      </v-icon>
      <v-icon
        class="animate-icon"
        v-if="!animateStop && openRaster"
        @click="animate(animateStop)">
        pause_circle_outline
      </v-icon>
      <vue-slider
        class="time-slider"
        v-bind="rasterSliderOptions"
        v-model="rasterSliderValue">
        <!--@drag-end="getNewRaster()"-->
      </vue-slider>
      <v-icon
        v-if="openRaster"
        class="animate-icon"
        @click="animationSettings = !animationSettings">
        settings
      </v-icon>
    </div>

    <!--slider settings-->
    <div v-bind:class="{ 'settings-container': animationSettings }"  v-if="animationSettings">
      <div class="animate-row"
           v-if="openVector">
        <p>fixed</p>
        <v-switch
          class="cumulatively"
          v-model="stickySlide"
        ></v-switch>
      </div>
      <div class="animate-row"
           v-if="openVector">
        <p>cumulative</p>
        <v-switch
          class="cumulatively"
          v-model="cumulatively"
        ></v-switch>
      </div>
      <div class="animate-row">
        <p>speed</p>
        <v-slider class="speed-slider"
                  v-model="animationSpeed"
                  step="0.1"
                  min="0"
                  max="4"
        ></v-slider>
        <!--thumbLabel="false"-->
      </div>
      <div class="animate-row"
           v-if="openVector">
        <p>step</p>
        <v-text-field
          class="step-text ml-20"
          v-model="setStepValue">
        </v-text-field>
        <v-select
          max-height="150"
          class="step-select"
          :items="timeSteps"
          v-model="setTimeStep"
          item-value="inUnix"
          item-text="name"
        />
        <!--:items="timeSteps"-->
      </div>
      <div class="animate-row"
           v-if="openRaster">
        <p>opacity</p>
        <v-slider class="speed-slider"
                  v-model="rasterOpacity"
                  min="0"
                  max="250"
        ></v-slider>
      </div>
    </div>

  </div>
</template>

<script>
  import moment from 'moment'
  import ImageLayer from 'ol/layer/image'
  import { WebgisImageWMS, layersList } from '../../map-builder'
  import vueSlider from 'vue-slider-component'

  export default {
    inject: ['$map', '$project', '$overlays'],
    name: 'timeslide',
    icon: 'tracking',
    components: { vueSlider },

    data () {
      return {
        layers: layersList(this.$project.layers, true),
        timeData: null,
        attribute: null,
        openVector: false,
        openRaster: false,
        sliderCreated: false,

        // selects lists
        layersSelection: [],
        attributesSelection: [],

        // unix time
        unix1: 0,
        unix2: null,

        // slider
        userDate1: null,
        userDate2: null,
        sliderMin: 0,
        sliderMax: 0,

        // datepicker
        pickerDate1: null,
        pickerDate2: null,
        menu1: false,
        menu2: false,

        // timepicker
        pickerTime1: null,
        pickerTime2: null,

        // animate
        animationSpeed: 2,
        animationSettings: false,
        animateStop: true,
        frameRate: 1, // sec
        cumulatively: false,
        stickySlide: false,
        setStepValue: null,
        setTimeStep: null,
        timeSteps: [
          {name: 'seconds', inUnix: 1},
          {name: 'minutes', inUnix: 60},
          {name: 'hours', inUnix: 3600},
          {name: 'days', inUnix: 86400},
          {name: 'months', inUnix: 2592000},
          {name: 'years', inUnix: 31536000}
        ],

        sliderValue: [0, 0],
        sliderOptions: {
          height: 2,
          dotSize: 12,
          min: 0,
          max: 1E+20,
          disabled: false,
          show: true,
          fixed: false,
          processDragable: true,
          useKeyboard: true,
          tooltip: false,
          sliderStyle: [
            {
              'backgroundColor': '#1976D2'
            },
            {
              'backgroundColor': '#1976D2'
            }
          ],
          bgStyle: {
            'backgroundColor': '#fff',
            'boxShadow': 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.25)'
          },
          processStyle: {
            'backgroundColor': '#1976D2'
          }
        },

        rasterSliderValue: 0,
        rasterSliderOptions: {
          height: 2,
          dotSize: 12,
          min: 0,
          max: 1E+20,
          disabled: false,
          show: true,
          fixed: false,
          processDragable: true,
          useKeyboard: true,
          tooltip: false,
          sliderStyle: [
            {
              'backgroundColor': '#1976D2'
            },
            {
              'backgroundColor': '#1976D2'
            }
          ],
          bgStyle: {
            'backgroundColor': '#fff',
            'boxShadow': 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.25)'
          },
          processStyle: {
            'backgroundColor': '#1976D2'
          },
          piecewise: true,
          data: [0, 1]
        },

        rasterGroupLayers: [],
        rasterOpacity: 250
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
      datePickerMinMax () {
        const min = moment(this.sliderMin * 1000).format('YYYY-MM-DD')
        const max = moment(this.sliderMax * 1000).format('YYYY-MM-DD')
        return [min, max]
      }
    },

    watch: {
      // triggers after time layer is selected
      timeData (value) {
        // case of all layers
        if (value.selectAllLayers) {
          this.checkMultipleAttributes()

          // case of one attribute
          if (this.attributesSelection.length === 1) {
            this.initializeSliderMultiple(this.attributesSelection[0])
          }

        // case of one layer
        } else if (value.type === 'vector') {
          this.initializeSliderSingle(value)
        } else {
          this.initializeRasterSlider(value)
          this.rasterGroupLayers = value.layers
          this.getNewRaster()
        }
      },
      // contain currently selected layer
      layerModel (model) {
        if (model && !model.visible) {
          this.setModelVisibility(model, true)
        }
      },
      attribute (value) {
        if (value) {
          this.initializeSliderMultiple(value)
        }
      },
      sliderValue (val) {
        this.unix1 = val[0] + this.sliderMin
        this.unix2 = val[1] + this.sliderMin
      },
      // slider values
      unix1 (val) {
        this.userDate1 = moment(val * 1000).format(this.outputDateMask)
        this.pickerDate1 = moment(val * 1000).format('YYYY-MM-DD')
        this.pickerTime1 = moment(val * 1000).format('HH:mm')

        this.sliderValue[0] = val - this.sliderMin
        this.sliderValue[1] = this.unix2 - this.sliderMin
        this.$refs.slider.setValue([val - this.sliderMin, this.unix2 - this.sliderMin])
      },
      unix2 (val) {
        this.userDate2 = moment(val * 1000).format(this.outputDateMask)
        this.pickerDate2 = moment(val * 1000).format('YYYY-MM-DD')
        this.pickerTime2 = moment(val * 1000).format('HH:mm')

        this.sliderValue[0] = this.unix1 - this.sliderMin
        this.sliderValue[1] = val - this.sliderMin
        this.$refs.slider.setValue([this.unix1 - this.sliderMin, val - this.sliderMin])
      },
      // date picker
      pickerDate1 (val) {
        const dateAndTime = `${val}-${this.pickerTime1}`
        this.unix1 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
      },
      pickerDate2 (val) {
        const dateAndTime = `${val}-${this.pickerTime2}`
        this.unix2 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
      },
      // time picker
      pickerTime1 (val) {
        const dateAndTime = `${this.pickerDate1}-${val}`
        this.unix1 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
      },
      pickerTime2 (val) {
        const dateAndTime = `${this.pickerDate2}-${val}`
        this.unix2 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
      },
      animationSpeed (val) {
//        this.frameRate = val
        // quadratic function for frame rate
        this.frameRate = 0.2813 * val * val - 2.063 * val + 4
      },
      setStepValue (val) {
        this.changeTimeStep()
      },
      setTimeStep (val) {
        this.changeTimeStep()
      },
      stickySlide (val) {
        this.sliderOptions.fixed = val
      },
      rasterSliderValue (val) {
        this.getNewRaster()
        this.rasterDate = moment(val * 1000).format('YYYY-MM-DD')
      }
    },

    created () {
      // add "select all layers" into layer select
      this.addLayersIntoDropdown()

      // disable map cashing
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

        // set as new main map's layer
        map.addLayer(this.layer)
        map.overlay = this.layer
      } else {
        this.layer = map.overlay
      }
    },

    beforeDestroy () {
      this.animateStop = true
      // remove all extra parameters and reset names
      for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].title = this.layers[i].name
        delete this.layers[i].unix1
        delete this.layers[i].unix2
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
      // initialize slider --> single layer
      initializeSliderSingle (value) {
//        console.log('INIT SIGNLE')
        this.openVector = true
        this.outputDateMask = value.output_datetime_mask
        this.maskIncludeDate(this.outputDateMask)
        this.hasTime = this.outputDateMask.includes('HH:mm')
        this.sliderMin = this.timeData.time_values[0]
        this.sliderMax = this.timeData.time_values[1]
        this.sliderOptions.max = this.sliderMax - this.sliderMin
        this.step = (this.sliderMax - this.sliderMin) / 100
        this.unix1 = this.sliderMin
        this.unix2 = this.unix1 + this.step
        this.setSliderValue(this.step)
        this.getNewVector()
      },

      // initialize slider --> multiple layers
      initializeSliderMultiple (attribute) {
//        console.log('INIT MULTIPLE')
        this.openVector = true
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)  // && l.original_time_attribute === attribute
        this.setDateMask(visibleLayers)
        this.maskIncludeDate(this.outputDateMask)
        this.hasTime = this.outputDateMask.includes('HH:mm')
        const minmax = this.getSliderRange(visibleLayers)
        this.sliderMin = minmax[0]
        this.sliderMax = minmax[1]
        this.sliderOptions.max = this.sliderMax - this.sliderMin
        this.step = (this.sliderMax - this.sliderMin) / 100
        this.unix1 = minmax[0]
        this.unix2 = minmax[0] + this.step
      },

      initializeRasterSlider (group) {
        this.openRaster = true
        const layersTimeValues = this.getRasterSliderRange(group)
        this.rasterSliderOptions.data = layersTimeValues
        this.rasterSliderOptions.max = Math.max.apply(null, layersTimeValues)
        this.rasterSliderOptions.min = Math.min.apply(null, layersTimeValues)
        this.rasterSliderValue = this.rasterSliderOptions.min
      },

      // set selected layer visible
      setModelVisibility (model, visible) {
        const visibleLayers = this.$overlays.list.filter(l => l.visible)
        if (!model.selectAllLayers) {
          visibleLayers.push(model)
          model._visible = visible
          model.visible = visible
        }
        this.layer.getSource().setVisibleLayers(visibleLayers.map(l => l.name))
      },

      // set slider values by last used one
      setSliderValue (step) {
//        console.log('GET VALUE')
        if (this.layerModel.unix1) {
          this.unix1 = this.layerModel.unix1
        } else {
          this.unix1 = this.timeData.time_values[0]
        }
        if (this.layerModel.unix2) {
          this.unix2 = this.layerModel.unix2
        } else {
          this.unix2 = this.timeData.time_values[0] + step
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

      // update WMS vector layer
      getNewVector () {
        if (this.layerModel.selectAllLayers) {
          this.updateMultipleLayers()
        } else {
          this.updateSingleLayer()
        }
      },

      // update WMS raster layer
      getNewRaster () {
        let model = null
        this.rasterGroupLayers.forEach(l => {
          if (parseInt(l.time_stamp) === this.rasterSliderValue) {
            model = l
          }
          this.setModelVisibility(l, false)
        })
        this.setModelVisibility(model, true)
        const layersArray = this.layer.getSource().getVisibleLayers()
        let opacity = ''
        for (let i = 0; i < layersArray.length; i++) {
          if (layersArray[i] === model.name) {
            opacity += `${this.rasterOpacity}, `
          } else {
            opacity += `250, `
          }
        }
        console.log(opacity)
        this.layer.getSource().updateParams({'OPACITIES': opacity})
      },

      updateSingleLayer () {
        const otherLayerFilter = this.getFilterFromLayers(this.layers, this.layerModel)
        let modelFilter = ''
        if (this.timeData.unix) {
          modelFilter = `${this.timeData.name}:"${this.timeData.time_attribute}" >= '${this.unix1}' AND "${this.timeData.time_attribute}" <= '${this.unix2}'`
        } else {
          const dateTimeUnix1 = moment(this.unix1 * 1000).format(this.timeData.input_datetime_mask)
          const dateTimeUnix2 = moment(this.unix2 * 1000).format(this.timeData.input_datetime_mask)
          modelFilter = `${this.timeData.name}:"${this.timeData.original_time_attribute}" >= '${dateTimeUnix1}' AND "${this.timeData.original_time_attribute}" <= '${dateTimeUnix2}'`
        }
        const filter = `${modelFilter}${otherLayerFilter}`
        this.layerModel.title = `${this.timeData.name}-${moment(this.unix1 * 1000).format(this.outputDateMask)}`
        this.layerModel.unix1 = this.unix1
        this.layerModel.unix2 = this.unix2
        this.layerModel.timeFilter = modelFilter
        this.oldPickerTime1 = moment(this.unix1 * 1000).format('HH:mm')
        this.oldPickerTime2 = moment(this.unix2 * 1000).format('HH:mm')
        this.layer.getSource().updateParams({'FILTER': filter})
      },

      updateMultipleLayers () {
        const attribute = this.attribute || this.attributesSelection[0]
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)
        let filterIncrement = ''
        let filter = ''
        for (let i = 0; i < visibleLayers.length; i++) {
          if (visibleLayers[i].original_time_attribute === attribute || attribute === 'All attributes') {
            if (visibleLayers[i].unix) {
              filterIncrement = `;${visibleLayers[i].name}:"${visibleLayers[i].time_attribute}" >= '${this.unix1}' AND "${visibleLayers[i].time_attribute}" <= '${this.unix2}'`
            } else {
              const dateTimeUnix1 = moment(this.unix1 * 1000).format(visibleLayers[i].input_datetime_mask)
              const dateTimeUnix2 = moment(this.unix2 * 1000).format(visibleLayers[i].input_datetime_mask)
              filterIncrement = `;${visibleLayers[i].name}:"${visibleLayers[i].original_time_attribute}" >= '${dateTimeUnix1}' AND "${visibleLayers[i].original_time_attribute}" <= '${dateTimeUnix2}'`
            }
            filter += filterIncrement
            visibleLayers[i].title = `${visibleLayers[i].name}-${moment(this.unix1 * 1000).format(this.outputDateMask)}`
            visibleLayers[i].unix1 = this.unix1
            visibleLayers[i].unix2 = this.unix2
            visibleLayers[i].timeFilter = filterIncrement
          } else {
            filter += `;${visibleLayers[i].timeFilter}`
          }
        }
        this.oldPickerTime1 = moment(this.unix1 * 1000).format('HH:mm')
        this.oldPickerTime2 = moment(this.unix2 * 1000).format('HH:mm')
        this.layer.getSource().updateParams({'FILTER': filter})
      },

      // in case that one layer is selected twice
      resetAttribute () {
        this.openVector = false
        this.openRaster = false
        this.animateStop = true
        this.animationSettings = false
        this.stickySlide = false
        this.cumulatively = false
        this.animationSpeed = 2
        this.setStepValue = null
        this.setTimeStep = null
        if (this.timeData && this.timeData.selectAllLayers) {
          this.attribute = null
          this.attributesSelection = []
          this.checkMultipleAttributes()
          if (this.attributesSelection.length === 1) {
            this.attribute = this.attributesSelection[0]
            this.initializeSliderMultiple(this.attributesSelection[0])
          }
        }
      },

      // add "All visible layers" option into layers select
      addLayersIntoDropdown () {
        let containVector = 0
        this.$project.layers.forEach(l => {
          if (l.time_values &&
              l.time_values.length > 0) {
            containVector += 1
          }
        })
        if (containVector > 1) {
          const all = {
            name: 'All visible layers',
            title: 'All visible layers',
            selectAllLayers: true
          }
          this.layersSelection.push(all)
        }
        this.$project.layers.forEach(l => {
          if ((l.time_values &&
               l.time_values.length > 0) ||
               l.spatio_temporal) {
            this.layersSelection.push(l)
          }
        })
      },

      // find unique attributes
      checkMultipleAttributes () {
        this.openVector = false
        const visibleLayers = this.$overlays.list.filter(l => l.visible && l.original_time_attribute)
        this.attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
        this.attributesSelection.unshift('All attributes')
      },

      // get min and max slider range
      getSliderRange (visibleLayers) {
        let min = 1E+100
        let max = -1E+100
        for (let i = 0; i < visibleLayers.length; i++) {
          if (min > visibleLayers[i].time_values[0]) {
            min = visibleLayers[i].time_values[0]
          }
          if (max < visibleLayers[i].time_values[1]) {
            max = visibleLayers[i].time_values[1]
          }
        }
        return [min, max]
      },

      // get min and max from raster slider
      getRasterSliderRange (group) {
        const rasterLayersTimeValues = []
        group.layers.forEach(l => { rasterLayersTimeValues.push(parseInt(l.time_stamp)) })
        rasterLayersTimeValues.sort(function (a, b) { return a - b })
        return rasterLayersTimeValues
      },

      // set date mask in cas of multiple layers
      setDateMask (visibleLayers) {
        for (let i = 0; i < visibleLayers.length; i++) {
          if (visibleLayers[i].output_datetime_mask.includes('HH:mm') && visibleLayers[i].output_datetime_mask.includes('YYYY')) {
            this.outputDateMask = visibleLayers[i].output_datetime_mask
            this.hasTime = true
            return
          }
        }
        for (let i = 0; i < visibleLayers.length; i++) {
          if (visibleLayers[i].output_datetime_mask.includes('YYYY')) {
            this.outputDateMask = visibleLayers[i].output_datetime_mask
            this.hasTime = true
            return
          }
        }
        this.outputDateMask = visibleLayers[0].output_datetime_mask
        this.hasTime = false
      },

      // set old time from date picker in case of "cancel" button pressed
      resetTime (num) {
        if (num === 1) {
          const dateAndTime = `${this.pickerDate1}-${this.oldPickerTime1}`
          this.unix1 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
        } else {
          const dateAndTime = `${this.pickerDate2}-${this.oldPickerTime2}`
          this.unix2 = moment(dateAndTime, 'YYYY-MM-DD-HH:mm').unix()
        }
      },

      // simple animation
      animate (play) {
        if (play) {
          this.animateStop = false
          this.newFrame()
        } else {
          this.animateStop = true
        }
      },

      // one animation step
      newFrame () {
        if (this.timeData.type === 'vector') {
          if (this.cumulatively) {
            if (this.unix2 < this.sliderMax - this.step) {
              this.unix2 += this.step
            } else if (this.unix1 < this.sliderMax - 2 * this.step) {
              this.unix1 += this.step
            } else {
              this.animateStop = true
              return
            }
          } else {
            if (this.unix2 < this.sliderMax - this.step) {
              this.unix1 += this.step
              this.unix2 += this.step
            } else {
              this.animateStop = true
              return
            }
          }
          this.getNewVector()
        } else {
          let index = this.rasterSliderOptions.data.indexOf(this.rasterSliderValue)
          if (index === this.rasterSliderOptions.data.length - 1) {
            index = 0
          } else {
            index += 1
          }
          this.rasterSliderValue = this.rasterSliderOptions.data[index]
//          this.getNewRaster()
        }
        if (!this.animateStop) {
          setTimeout(this.newFrame, this.frameRate * 1000)
        }
      },

      // check if mask includes year, month or days
      maskIncludeDate (mask) {
        if (
          mask.includes('YYYY') || mask.includes('MM') || mask.includes('DD')
        ) {
          this.hasDate = true
        } else {
          this.hasDate = false
        }
      },

      isNormalInteger (str) {
        var n = Math.floor(Number(str))
        return n !== Infinity && String(n) === str && n >= 0
      },

      changeTimeStep () {
        if (this.setStepValue &&
            this.setTimeStep &&
            this.isNormalInteger(this.setStepValue)) {
          this.step = this.setStepValue * this.setTimeStep
        }
      }
    }
  }
</script>

<style lang="scss">

  .no-padding {
    padding: 0;
  }

  /*animate*/
  .settings-container {
    margin-top: 10px;
    padding-top: 15px;
    opacity: 0;
    animation: fadeIn 0.3s ease-in both;
    background-color: aliceblue;
  }

  .animate-icon {
    margin-top: -14px;
    cursor: pointer;
    color: gray !important;
  }

  .animate-row {
    margin-bottom: -20px;
    display: flex;
  }

  .animate-row > div {
    max-width: 170px;
    margin-left: auto;
  }

  .cumulatively > div > div {
    margin: auto;
  }

  .speed-slider {
    padding: 0 !important;
    width: 100%;
    margin-left: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate3d(0, -20%, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  /*double range slider*/

  .range-container {
    display: flex !important;
    padding-top: 30px;
  }

  .time-slider {
    margin: 0 20px;
    width: 80% !important;
    height: 15px;
    padding: 0 !important;
    /*padding-top: 13px;*/
  }

  .hidden {
    visibility: hidden;
    height: 0;
    padding: 0 !important;
  }

  /*step select*/

  .ml-20 {
    margin-left: 20px;
  }

  .step-text {
    padding: 0;
    margin-top: -3px;
    margin-left: auto !important;
    max-width: 70px !important;
  }

  .step-select {
    padding: 0;
    margin-top: -3px;
    margin-left: 0 !important;
    max-width: 100px !important;
  }

  .step-select > div > div {
    overflow: inherit;
  }

  .step-text > div > input {
    text-align: center;
  }

  /*time picker*/

  .hide-child > :first-child{
    display: none;
  }

  .time-picker {
    display: flex !important;
  }

  .picker__actions {
    display: block;
    padding: 8px 0;
  }

  .picker--time {
    margin: 0;
  }

  .picker {
    display: inherit;
  }

  .right {
    float: right;
  }

</style>
