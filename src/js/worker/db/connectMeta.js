// @flow

import Backboard from 'backboard';

/**
 * Create new meta database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 */
const createMeta = (upgradeDB) => {
    console.log("Creating meta database");

    upgradeDB.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
    upgradeDB.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
};

/**
 * Migrate meta database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 */
const migrateMeta = (upgradeDB) => {
    console.log(`Upgrading meta database from version ${upgradeDB.oldVersion} to version ${upgradeDB.version}`);

    if (upgradeDB.oldVersion <= 6) {
        upgradeDB.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
    }
};

const connectMeta = async () => {
    const db = await Backboard.open('meta', 7, async (upgradeDB) => {
        if (upgradeDB.oldVersion === 0) {
            createMeta(upgradeDB);
        } else {
            await migrateMeta(upgradeDB);
        }
    });

    db.on('versionchange', () => db.close());

    return db;
};

export default connectMeta;
