// @flow

import Backboard from "backboard";
import Cache from "./Cache";
import getAll from "./getAll";
import * as getCopies from "./getCopies";
import * as getCopy from "./getCopy";
import { logEvent } from "../util";

Backboard.setPromiseConstructor(Promise);
Backboard.on("quotaexceeded", () => {
    logEvent({
        type: "error",
        text:
            'Your browser isn\'t letting the game store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Delete Old Data within a league). Clearing space elsewhere on your hard drive might help too. <a href="https://basketball-gm.com/manual/debugging/quota-errors/"><b>Read this for more info.</b></a>',
        saveToDb: false,
        persistent: true,
    });
});
Backboard.on("blocked", () => {
    logEvent({
        type: "error",
        text: "Please close any other tabs with this league open!",
        saveToDb: false,
    });
});

const idb: {
    cache: Cache,
    getCopies: typeof getCopies,
    getCopy: typeof getCopy,
    league: any,
    meta: any,
} = {
    cache: new Cache(),
    getCopies,
    getCopy,
    league: undefined,
    meta: undefined,
};

export { Cache, getAll, idb };
export { default as connectMeta } from "./connectMeta";
export { default as connectLeague } from "./connectLeague";
export { default as reset } from "./reset";
