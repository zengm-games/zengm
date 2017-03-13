// @flow

// Polyfills for Safari
import objectEntries from 'object.entries';
import objectValues from 'object.values';
import 'url-search-params-polyfill';
import 'whatwg-fetch';
objectEntries.shim();
objectValues.shim();

export * from './constants';
export {default as createLogger} from './createLogger';
export {default as fetchWrapper} from './fetchWrapper';
export {default as g} from './gameAttributes';
export {default as helpers} from './helpers';
