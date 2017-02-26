/* eslint-disable import/first */
import '../vendor/babel-external-helpers';
import Promise from 'bluebird';
import 'indexeddb-getall-shim';

// Overwrite Promise object globally so Babel uses it when transpiling async/await (not totally sure if necessary)
window.Promise = Promise;
window.Promise.config({warnings: false});

mocha.setup({
    ui: 'bdd',
    timeout: 20000,
});
