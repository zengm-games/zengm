// @flow

import type { GameAttributes } from "../common/types";

// This will get filled by values from IndexedDB. It is initialized by different mechanisms in the ui and worker, but the end result is the same.
const g: GameAttributes = {
    lid: undefined,
};

export default g;
