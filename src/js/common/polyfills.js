// @flow

// Polyfills for Safari and old browsers
import objectEntries from 'object.entries';
import objectValues from 'object.values';
import 'url-search-params-polyfill';
import 'whatwg-fetch';
objectEntries.shim();
objectValues.shim();
