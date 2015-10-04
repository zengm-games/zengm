'use strict';

require('lib/IndexedDB-getAll-shim');
require('../util/templateHelpers');

mocha.setup({
    globals: ["console"],
    timeout: 20000
});
