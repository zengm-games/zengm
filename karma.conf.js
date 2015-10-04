module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: ['js/test/app.js'],

        exclude: [],

        preprocessors: {
            'js/**/*.js': ['browserify']
        },

        reporters: ['mocha'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_DEBUG,

        autoWatch: false,

        browsers: ['Chrome', 'Firefox'],

        singleRun: true,

        browserify: {
            transform: ['browserify-shim', 'brfs']
        }
    });
};
