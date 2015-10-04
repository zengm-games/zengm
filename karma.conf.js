module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: [
            'js/test/app.js',
            'js/test/util/helpers.js',
            {pattern: 'js/api.js', included: false},
            {pattern: 'js/app.js', included: false},
            {pattern: 'js/dao.js', included: false},
            {pattern: 'js/db.js', included: false},
            {pattern: 'js/export_3.3.js', included: false},
            {pattern: 'js/globals.js', included: false},
            {pattern: 'js/templates.js', included: false},
            {pattern: 'js/ui.js', included: false},
            {pattern: 'js/views.js', included: false},
            {pattern: 'js/dao/*.js', included: false},
            {pattern: 'js/data/*.js', included: false},
            {pattern: 'js/lib/bbgm-notifications.js', included: false},
            {pattern: 'js/util/*.js', included: false},
//            {pattern: 'js/**/*.js', included: false},
//            {pattern: 'js/**/*.json', included: false},
//            {pattern: 'templates/*.html', included: false}
        ],

        exclude: [
        ],

        preprocessors: {
            'js/**/*.js': ['browserify']
        },

        reporters: ['mocha'],

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
