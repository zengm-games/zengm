module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: [
            'js/test/app.js',
//            {pattern: 'js/**/*.js', included: false},
//            {pattern: 'js/**/*.json', included: false},
//            {pattern: 'templates/*.html', included: false}
        ],

        exclude: [
        ],

        preprocessors: {
            'js/**/*.js': ['browserify']
        },

        reporters: ['progress'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        autoWatch: false,

        browsers: ['Chrome'],// 'Firefox'],

        singleRun: true,

        browserify: {
          transform: ['browserify-shim', 'brfs']
        }
    });
};
