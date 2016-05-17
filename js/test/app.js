'use strict';

var Promise = require('bluebird');
Promise.config({warnings: false});

// Make sure I never accidentally use native promises, because that could fuck with error handling
window.Promise = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.all = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.map = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.try = function () { throw new Error("USE BLUEBIRD!"); };

require('indexeddb-getall-shim');
require('../util/templateHelpers');

mocha.setup({
    ui: 'bdd',
    timeout: 20000
});

require('./core/contractNegotiation');
require('./core/draft');
require('./core/finances');
require('./core/league');
require('./core/player');
require('./core/season');
require('./core/team');
require('./core/trade');
require('./util/account');
require('./util/helpers');
require('./views/components');
require('./views/gameLog');