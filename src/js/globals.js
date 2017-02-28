// @flow

import type {GameAttributes} from './common/types';

// The way this works is... any "global" variables that need to be widely available are stored in g. Some of these are constants, like the ones defined below. Some others are dynamic, like the year of the current season, and are stored in the gameAttributes object store. The dynamic components of g are retrieved/updated/synced elsewhere. Yes, it's kind of confusing and arbitrary.

const g: GameAttributes = {};

// If any of these things are supposed to change at any point, they should be stored in gameAttributes rather than here.

// THIS MUST BE ACCURATE OR BAD STUFF WILL HAPPEN
g.notInDb = ["lid", "notInDb", "cache"];

export default g;
