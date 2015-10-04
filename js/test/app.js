'use strict';

var assert = require('assert');

mocha.setup({
    ui: "bdd",
    globals: ["console"],
    timeout: 2000000000
});

describe('b', function() {
    it('should equal fixture contents', function() {
        assert.equal([1,2].length, 2);
    });
});
