// @flow

import Backboard from 'backboard';
import Promise from 'bluebird';
import Cache from './Cache';
import * as getCopy from './getCopy';
import {logEvent} from '../util';

Backboard.setPromiseConstructor(Promise);
Backboard.on('quotaexceeded', () => {
    logEvent({
        type: 'error',
        text: 'Your browser isn\'t letting Basketball GM store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Improve Performance within a league). Clearing space elsewhere on your hard drive might help too. <a href="https://basketball-gm.com/manual/debugging/quota-errors/"><b>Read this for more info.</b></a>',
        saveToDb: false,
        persistent: true,
    });
});
Backboard.on('blocked', () => {
    logEvent({
        type: 'error',
        text: 'Please close any other tabs with this league open!',
        saveToDb: false,
    });
});


const idb: {
    cache: any,
    league: any,
    meta: any,
} = {
    cache: undefined,
    league: undefined,
    meta: undefined,
};

export {
    Cache,
    getCopy,
    idb,
};
export {default as connectMeta} from './connectMeta';
export {default as connectLeague} from './connectLeague';
export {default as reset} from './reset';
