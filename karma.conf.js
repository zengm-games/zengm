module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: ['src/js/test/app.js'],

        exclude: [],

        preprocessors: {
            'src/js/**/*.js': ['browserify'],
        },

        reporters: ['mocha'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_DEBUG,

        autoWatch: false,

        browsers: ['Chrome', 'Firefox'],

        singleRun: true,

        browserify: {
            transform: ['babelify'],
        },
    });
};
