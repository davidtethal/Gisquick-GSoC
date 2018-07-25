import moment from 'moment'


export function initializeSlider (layer, overlays, layerModel) {
  let attributesSelection = []
  let rasterGroupLayers = []

  let slider = {
    'fixed': false,
    'range': {
      'min': unixTime('2018-06-03'),
      'max': unixTime('2018-08-05')
    },
    'timeRange': [
      unixTime('2018-06-15'),
      unixTime('2018-07-15')
    ],
    'step': 100,
    'discreteData': []
    // 'timeValue': unixTime('2018-06-15'),
  }

  if (layer.type === 'multiple') {
    const visibleLayers = overlays.list.filter(l => l.visible && l.original_time_attribute)
//
    if (!hasMultipleAttributes(visibleLayers)) {
//
//          this.setDateMask(visibleLayers)
//          this.maskIncludeDate(this.outputDateMask)
//          this.hasTime = this.outputDateMask.includes('HH:mm')
//
      const sliderRange = getSliderRange(visibleLayers)
      setRangeSliderValues(sliderRange[0], sliderRange[1])
      // this.openVector = true
    }
  } else if (layer.type === 'vector') {
//
//        this.outputDateMask = value.output_datetime_mask
//        this.maskIncludeDate(this.outputDateMask)
//        this.hasTime = this.outputDateMask.includes('HH:mm')
//
    setRangeSliderValues(layer.time_values[0], layer.time_values[1])
    // this.openVector = true
//
//        this.updateSingleLayer()
//
    return slider
  } else if (layer.isGroup) {
    setSliderValues(getRasterGroupTimeValues(layer))
    rasterGroupLayers = layer.layers
    return slider
    // this.openRaster = true
  }

  function hasMultipleAttributes (visibleLayers) {
    attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
    if (attributesSelection.length === 1) {
      return false
    } else {
      attributesSelection.unshift('All attributes')
      return true
    }
  }

  function getSliderRange (visibleLayers) {
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
  }

  function getRasterGroupTimeValues (group) {
    const rasterGroupTimeValues = []
    group.layers.forEach(l => { rasterGroupTimeValues.push(parseInt(l.time_stamp)) })
    rasterGroupTimeValues.sort(function (a, b) { return a - b })
    return rasterGroupTimeValues
  }

  function setSliderValues (timeValueArray) {
    slider.range.min = Math.min.apply(null, timeValueArray)
    slider.range.max = Math.max.apply(null, timeValueArray)
    slider.timeRange[0] = slider.range.min
    slider.timeRange[1] = null
    slider.discreteData.data = timeValueArray
    return slider
//      console.log(this.rasterSliderOptions.data)
//      console.log(this.rasterSliderOptions.max)
//      console.log(this.rasterSliderOptions.min)
//      console.log(this.rasterSliderValue)
  }

  function setRangeSliderValues (min, max) {
    console.log('SLIDER RANGE', slider.range)
    slider.range.min = min
    slider.range.max = max
    // slider.sliderOptions.max = max - min
    slider.step = (max - min) / 100
    if (layerModel && layerModel.unix1) {
      slider.timeRange[0] = layerModel.unix1
    } else {
      slider.timeRange[0] = min
    }
    if (layerModel && layerModel.unix2) {
      slider.timeRange[1] = layerModel.unix2
    } else {
      slider.timeRange[1] = min + slider.step
    }
    return slider

    // console.log(this.range.min)
    // console.log(this.range.max)
    // console.log(this.step)
    // console.log(this.timeRange[0])
    // console.log(this.timeRange[1])
  }

  function unixTime (time) {
    return moment(time, 'YYYY-MM-DD').unix()
  }
}

