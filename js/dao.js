/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
'use strict';

var adapter = require('./dao/indexedDb');

module.exports = adapter;
