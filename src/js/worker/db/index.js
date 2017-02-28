// @flow

import Backboard from 'backboard';
import Promise from 'bluebird';
import * as getCopy from './getCopy';
import {logEvent} from '../util';

Backboard.setPromiseConstructor(Promise);
Backboard.on('quotaexceeded', () => {
    logEvent({
        type: "error",
        text: 'Your browser isn\'t letting Basketball GM store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Improve Performance within a league). Clearing space elsewhere on your hard drive might help too. <a href="https://basketball-gm.com/manual/debugging/quota-errors/"><b>Read this for more info.</b></a>',
        saveToDb: false,
        persistent: true,
    });
});
Backboard.on('blocked', () => {
    window.alert("Please close any other tabs with this league open!");
});

const idb: any = {
    league: undefined,
    meta: undefined,
};

export {
    getCopy,
    idb,
};
export {default as Cache} from './Cache';
export {default as connectMeta} from './connectMeta';
export {default as connectLeague} from './connectLeague';
export {default as reset} from './reset';
