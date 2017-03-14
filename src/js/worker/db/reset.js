// @flow

import Backboard from 'backboard';
import {league} from '../core';
import {idb} from '../db';

const reset = async () => {
    // Delete any current league databases
    console.log("Deleting any current league databases...");
    const leagues = await idb.meta.leagues.getAll();
    for (const l of leagues) {
        await league.remove(l.lid);
    }

    // Delete any current meta database
    console.log("Deleting any current meta database...");
    idb.meta.close();
    await Backboard.delete("meta");
};

export default reset;
