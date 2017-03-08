// @flow

import Backboard from 'backboard';
import page from 'page';
import {league} from '../core';
import {idb} from '../db';

const reset = async () => {
/*    // localStorage, which is just use for table sorting currently
    const debug = localStorage.getItem('debug'); // Save debug setting and restore later
    for (const key of Object.keys(localStorage)) {
        localStorage.removeItem(key);
    }
    if (typeof debug === 'string') {
        localStorage.setItem('debug', debug);
    }*/

    // Delete any current league databases
    console.log("Deleting any current league databases...");
    const leagues = await idb.meta.leagues.getAll();
    if (leagues.length === 0) {
        console.log('No leagues found.');
        page('/');
    }

    await Promise.all(leagues.map(l => league.remove(l.lid)));

    // Delete any current meta database
    console.log("Deleting any current meta database...");
    idb.meta.close();
    await Backboard.delete("meta");
};

export default reset;
