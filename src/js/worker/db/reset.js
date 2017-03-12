// @flow

import Backboard from 'backboard';
import page from 'page';
import {league} from '../core';
import {idb} from '../db';

const reset = async () => {
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
