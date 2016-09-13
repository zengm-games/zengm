import Promise from 'bluebird';
import 'indexeddb-getall-shim';

// Overwrite Promise object globally so Babel uses it when transpiling async/await (not totally sure if necessary)
window.Promise = Promise;
window.Promise.config({warnings: false});

mocha.setup({
    ui: 'bdd',
    timeout: 20000,
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
