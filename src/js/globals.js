// @flow

import EventEmitter from 'events';
import type {GameAttributes} from './common/types';

// The way this works is... any "global" variables that need to be widely available are stored in g. Some of these are constants, like the ones defined below. Some others are dynamic, like the year of the current season, and are stored in the gameAttributes object store. The dynamic components of g are retrieved/updated/synced elsewhere. Yes, it's kind of confusing and arbitrary.

const g: GameAttributes = {};

// If any of these things are supposed to change at any point, they should be stored in gameAttributes rather than here.

g.emitter = new EventEmitter();

g.enableLogging = window.enableLogging;

// .com or .dev TLD
if (!window.inCordova) {
    const splitUrl = window.location.hostname.split(".");
    g.tld = splitUrl[splitUrl.length - 1];
} else {
    // From within Cordova, window.location.hostname is not set, so always use .com
    g.tld = "com";
}

// THIS MUST BE ACCURATE OR BAD STUFF WILL HAPPEN
g.notInDb = ["dbm", "dbl", "lid", "enableLogging", "tld", "notInDb", "emitter", "cache"];

export default g;
