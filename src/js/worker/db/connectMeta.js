// @flow

import Backboard from "backboard";

/**
 * Create new meta database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 */
const createMeta = upgradeDB => {
    console.log("Creating meta database");

    upgradeDB.createObjectStore("achievements", {
        keyPath: "aid",
        autoIncrement: true,
    });
    const attributeStore = upgradeDB.createObjectStore("attributes");
    upgradeDB.createObjectStore("leagues", {
        keyPath: "lid",
        autoIncrement: true,
    });

    attributeStore.put(-1, "changesRead");
    attributeStore.put(-1, "lastSelectedTid");
    attributeStore.put(0, "nagged");
};

/**
 * Migrate meta database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 */
const migrateMeta = (upgradeDB, fromLocalStorage) => {
    console.log(
        `Upgrading meta database from version ${
            upgradeDB.oldVersion
        } to version ${upgradeDB.version}`,
    );

    if (upgradeDB.oldVersion <= 6) {
        upgradeDB.createObjectStore("achievements", {
            keyPath: "aid",
            autoIncrement: true,
        });
    }
    if (upgradeDB.oldVersion <= 7) {
        const attributeStore = upgradeDB.createObjectStore("attributes");

        attributeStore.put(-1, "changesRead");
        attributeStore.put(-1, "lastSelectedTid");
        attributeStore.put(0, "nagged");

        for (const key of Object.keys(fromLocalStorage)) {
            const int = parseInt(fromLocalStorage[key], 10);
            if (!Number.isNaN(int)) {
                attributeStore.put(int, key);
            }
        }
    }
};

const connectMeta = async (fromLocalStorage: { [key: string]: ?string }) => {
    // Would like to await on createMeta/migrateMeta and inside those functions, but Firefox
    const db = await Backboard.open("meta", 8, upgradeDB => {
        if (upgradeDB.oldVersion === 0) {
            createMeta(upgradeDB);
        } else {
            migrateMeta(upgradeDB, fromLocalStorage);
        }
    });

    db.on("versionchange", () => db.close());

    return db;
};

export default connectMeta;
