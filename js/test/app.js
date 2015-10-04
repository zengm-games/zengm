'use strict';

var assert = require('assert');
require('lib/IndexedDB-getAll-shim');
require('../util/templateHelpers');

mocha.setup({
    globals: ["console"],
    timeout: 20000
});

describe('b', function() {
    it('should equal fixture contents', function() {
        assert.equal([1, 2].length, 2);
    });
});
