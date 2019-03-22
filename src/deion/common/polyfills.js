// @flow

// Comments indicate where I'd have to bump minimum supported browser versions to get rid of these.

// Safari 11 (because in 10.1 getAll crashes in a worker)
import "indexeddb-getall-shim";

// Chrome 54, Safari 10.1
import objectEntries from "object.entries";
import objectValues from "object.values";

// Safari 10.1
import "url-search-params-polyfill";
import "whatwg-fetch";

objectEntries.shim();
objectValues.shim();
