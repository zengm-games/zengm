/* eslint-env node */

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'browserify', 'source-map-support'],

        files: ['src/js/test/index.js', 'src/js/test/**/*.js'],

        preprocessors: {
            'src/js/**/*.js': ['browserify'],
        },

        // http://stackoverflow.com/a/42379383/786644
        browserConsoleLogOptions: {
            terminal: true,
            level: '',
        },

        autoWatch: false,

        singleRun: true,

        browserify: {
            debug: true,
            transform: ['babelify'],
        },

        reporters: ['mocha'],

        browsers: ['Chrome', 'Firefox'],
    });
};
