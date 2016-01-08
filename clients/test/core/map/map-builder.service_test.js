describe('Test MapBuilder', function() {

  var mapBuilder;
  beforeEach(module('gl.map'));

  beforeEach(inject(function(_mapBuilder_) {
    mapBuilder = _mapBuilder_;
  }));

  it('MapBox.createMapBoxLayer', function() {
    var conf = {
      'name': 'mymapbox',
      'title': 'MapBox Layer',
      'visible': false,
      'apikey': 'secrete-key',
      'mapid': 'jachym.1z95xvcu',
      'type': 'MapBox'
    };
    var layer = mapBuilder.createBaseLayer(conf);
    expect(layer).toBeTruthy();
  });
});
