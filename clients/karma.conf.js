// Karma configuration
// Generated on Mon Dec 28 2015 13:37:25 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular/angular.js',
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular-animate/angular-animate.js',
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular-material/angular-material.js',
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular-aria/angular-aria.js',
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular-ui-layout/dist/ui-layout.js',
      '/home/vagrant/dev/node_modules/gislab-web/node_modules/angular-material-data-table/dist/md-data-table.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/openlayers/build/ol3-deps.debug.js',
      'src/web/js/web.module.js',
      'src/web/js/app.ctrl.js',
      'src/core/network/network.module.js',
      'src/core/network/gislab-client.service.js',
      'src/core/map/map.module.js',
      'src/core/map/map-builder.service.js',
      'src/core/map/project-provider.service.js',
      'src/core/ui/ui.module.js',
      'src/core/ui/tree.dir.js',
      'src/core/ui/accordion.dir.js',
      'src/core/ui/accordion.ctrl.js',
      'src/core/map-tools/layers-control/layers-control.module.js',
      'src/core/map-tools/layers-control/layers-control.service.js',
      'src/core/map-tools/layers-control/layers-control.ctrl.js',
      'src/core/map-tools/legend/legend.module.js',
      'src/core/map-tools/legend/legend.ctrl.js',
      'src/core/map-tools/features/features.module.js',
      'src/core/map-tools/features/features-viewer.service.js',
      'src/core/map-tools/features/identification.ctrl.js',
      'src/core/map-tools/features/search.ctrl.js',
      'test/*_test.js',
      'test/**/*_test.js'
    ],

    // list of files to exclude
    exclude: [
      '**/.sw*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
