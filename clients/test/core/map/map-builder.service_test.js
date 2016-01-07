describe('Test MapBuilder', function() {

  beforeEach(module('gl.map'));

  it('MapBox.createMapBoxLayer', function() {
    var conf = {
      'name': 'mymapbox',
      'title': 'MapBox Layer',
      'visible': false,
      'apikey': 'secrete-key',
      'mapid': 'jachym.1z95xvcu',
      'type': 'MapBox'
    };
    var layer = MapBuilder.createMapBoxLayer(conf);
    expect(layer).toBeTruthy();
  });
});
