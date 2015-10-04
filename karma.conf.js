module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['mocha', 'browserify'],

        files: [
            'js/test/app.js',
            'js/test/core/contractNegotiation.js',
//            'js/test/core/draft.js',
            'js/test/core/finances.js',
            'js/test/core/league.js',
            'js/test/core/player.js',
            'js/test/core/season.js',
//            'js/test/core/team.js',
            'js/test/core/trade.js',
            'js/test/util/*.js',
            'js/test/views/*.js',
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
