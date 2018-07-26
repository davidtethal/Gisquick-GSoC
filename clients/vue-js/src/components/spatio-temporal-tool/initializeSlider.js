import moment from 'moment'


export function initializeSlider (layer, overlays, layerModel) {
  let attributesSelection = []

  let slider = {
    'fixed': false,
    'range': {
      'min': 100,
      'max': 200
    },
    'timeRange': [
      10,
      20
    ],
    'step': 100,
    'discreteData': [],
    'rasterGroupLayers': [],
    'timeData': {}
  }

  if (layer.type === 'multiple') {
    const visibleLayers = overlays.list.filter(l => l.visible && l.original_time_attribute)
    hasMultipleAttributes(visibleLayers)
    return attributesSelection
  } else if (layer.type === 'vector') {
    slider = setRangeSliderValues(layer.time_values[0], layer.time_values[1], layerModel)
    slider.timeData = findDateTimeMask([layer])
    return slider
  } else if (layer.isGroup) {
    setSliderValues(getRasterGroupTimeValues(layer))
    slider.rasterGroupLayers = layer.layers
    return slider
    // this.openRaster = true
  }

  function hasMultipleAttributes (visibleLayers) {
    attributesSelection = [...new Set(visibleLayers.map(l => l.original_time_attribute))]
    if (attributesSelection.length > 1) {
      attributesSelection.unshift('All attributes')
    }
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
    slider.rasterGroupLayers = null
    return slider
//      console.log(this.rasterSliderOptions.data)
//      console.log(this.rasterSliderOptions.max)
//      console.log(this.rasterSliderOptions.min)
//      console.log(this.rasterSliderValue)
  }

  // function unixTime (time) {
  //   return moment(time, 'YYYY-MM-DD').unix()
  // }
  //
  // find mask in cas of multiple layers
}

export function getSliderRange (visibleLayers) {
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

export function setRangeSliderValues (min, max, layerModel) {
  let slider = {
    'fixed': false,
    'range': {
      'min': 100,
      'max': 200
    },
    'timeRange': [
      10,
      20
    ],
    'step': 100,
    'discreteData': [],
    'rasterGroupLayers': [],
    'timeData': {}
  }
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
  // console.log(slider.range.min)
  // console.log(slider.range.max)
  // console.log(slider.step)
  // console.log(slider.timeRange[0])
  // console.log(slider.timeRange[1])
  return slider
}

export function findDateTimeMask (visibleLayers) {
  for (let i = 0; i < visibleLayers.length; i++) {
    if (visibleLayers[i].output_datetime_mask.includes('HH:mm') && visibleLayers[i].output_datetime_mask.includes('YYYY')) {
      return {
        'outputDateTimeMask': visibleLayers[i].output_datetime_mask,
        'hasDate': true,
        'hasTime': true}
    }
  }
  for (let i = 0; i < visibleLayers.length; i++) {
    if (visibleLayers[i].output_datetime_mask.includes('YYYY')) {
      return {
        'outputDateTimeMask': visibleLayers[i].output_datetime_mask,
        'hasDate': true,
        'hasTime': false}
    }
  }
  return {
    'outputDateTimeMask': visibleLayers[0].output_datetime_mask,
    'hasDate': false,
    'hasTime': true}
}

