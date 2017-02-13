// @flow

import Backboard from 'backboard';
import Promise from 'bluebird';
import Cache from './Cache';
import connectMeta from './connectMeta';
import connectLeague from './connectLeague';
import reset from './reset';
import logEvent from '../util/logEvent';

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

export {
    Cache,
    connectMeta,
    connectLeague,
    reset,
};
