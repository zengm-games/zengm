// @flow

import Backboard from 'backboard';

/**
 * Create new meta database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 */
const createMeta = async (upgradeDB) => {
    console.log('Creating meta database');

    upgradeDB.createObjectStore('achievements', {keyPath: 'aid', autoIncrement: true});
    const attributeStore = upgradeDB.createObjectStore('attributes');
    upgradeDB.createObjectStore('leagues', {keyPath: 'lid', autoIncrement: true});

    await attributeStore.put(-1, 'changesRead');
    await attributeStore.put(-1, 'lastSelectedTid');
    await attributeStore.put(0, 'nagged');
};

/**
 * Migrate meta database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 */
const migrateMeta = async (upgradeDB, fromLocalStorage) => {
    console.log(`Upgrading meta database from version ${upgradeDB.oldVersion} to version ${upgradeDB.version}`);

    if (upgradeDB.oldVersion <= 6) {
        upgradeDB.createObjectStore('achievements', {keyPath: 'aid', autoIncrement: true});
    }
    if (upgradeDB.oldVersion <= 7) {
        const attributeStore = upgradeDB.createObjectStore('attributes');

        await attributeStore.put(-1, 'changesRead');
        await attributeStore.put(-1, 'lastSelectedTid');
        await attributeStore.put(0, 'nagged');

        for (const key of Object.keys(fromLocalStorage)) {
            const int = parseInt(fromLocalStorage[key], 10);
            if (!isNaN(int)) {
                await attributeStore.put(int, key);
            }
        }
    }
};

const connectMeta = async (fromLocalStorage: {[key: string]: ?string}) => {
    const db = await Backboard.open('meta', 8, async (upgradeDB) => {
        if (upgradeDB.oldVersion === 0) {
            await createMeta(upgradeDB);
        } else {
            await migrateMeta(upgradeDB, fromLocalStorage);
        }
    });

    db.on('versionchange', () => db.close());

    return db;
};

export default connectMeta;
