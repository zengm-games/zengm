// @flow

import Backboard from "backboard";
import { league } from "../core";
import { idb } from ".";

const reset = async () => {
    // Delete any current league databases
    console.log("Deleting any current league databases...");
    const leagues = await idb.meta.leagues.getAll();

    let numDeleted = 0;
    await Promise.all(
        leagues.map(async l => {
            await league.remove(l.lid);
            numDeleted += 1;
            console.log(`Deleted ${numDeleted} of ${leagues.length} leagues`);
        }),
    );

    // Delete any current meta database
    console.log("Deleting any current meta database...");
    idb.meta.close();
    await Backboard.delete("meta");
};

export default reset;
