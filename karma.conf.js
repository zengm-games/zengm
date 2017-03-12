/* eslint-env node */

module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify', 'source-map-support'],

        files: ['src/js/test/index.js', 'src/js/test/**/*.js'],

        exclude: [],

        preprocessors: {
            'src/js/**/*.js': ['browserify'],
        },

        reporters: ['mocha'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_DEBUG,

        autoWatch: false,

        browsers: ['Chrome'],

        singleRun: true,

        browserify: {
            debug: true,
            transform: ['babelify'],
        },
    });
};
