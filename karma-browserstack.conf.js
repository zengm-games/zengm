/* eslint-env node */

const browserStack = require('../../.browserstack.json');

const customLaunchers = [{
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: '52.0', // 52 is an LTS and the last release on XP, but it works back to 47 currently
    os: 'Windows',
    os_version: '10',
}, {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: '49.0', // Last release on XP and some old Mac versions
    os: 'Windows',
    os_version: '10',
}, {
    base: 'BrowserStack',
    browser: 'safari',
    browser_version: '10.1', // Works in 10 too, but 10.1 has buggy getAll
    os: 'OS X',
    os_version: 'Sierra',
}].reduce((acc, browser, i) => {
    acc[i] = browser;
    return acc;
}, {});

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

        browserNoActivityTimeout: 5 * 60 * 1000, // 5 minutes

        browserStack,

        customLaunchers,

        browsers: Object.keys(customLaunchers),
    });
};
