module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: [
            'js/test/app.js',
            'js/test/util/*.js',
            {pattern: 'js/*.js', included: false},
            {pattern: 'js/core/*.js', included: false},
            {pattern: 'js/dao/*.js', included: false},
            {pattern: 'js/data/*.js', included: false},
            {pattern: 'js/lib/*.js', included: false},
            {pattern: 'js/util/*.js', included: false},
            {pattern: 'js/**/*.json', included: false},
            {pattern: 'templates/*.html', included: false}
        ],

        exclude: [
        ],

        preprocessors: {
            'js/**/*.js': ['browserify']
        },

        reporters: ['mocha'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_DEBUG,

        autoWatch: false,

        browsers: ['Chrome'],// 'Firefox'],

        singleRun: true,

        browserify: {
            transform: ['browserify-shim', 'brfs']
        }
    });
};
