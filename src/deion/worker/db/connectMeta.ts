import { openDB, DBSchema, IDBPDatabase } from "idb";
import { logEvent } from "../util";
import { League } from "../../common/types";

export interface MetaDB extends DBSchema {
	achievements: {
		key: number;
		value: {
			slug: string;
		};
	};
	attributes: {
		value: number;
		key: "changesRead" | "lastSelectedTid" | "nagged";
	};
	leagues: {
		value: League;
		key: number;
	};
}

const createMeta = (upgradeDB: IDBPDatabase<MetaDB>) => {
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

const migrateMeta = (upgradeDB: IDBPDatabase<MetaDB>, oldVersion: number) => {
	console.log(
		`Upgrading meta database from version ${oldVersion} to version ${upgradeDB.version}`,
	);

	if (oldVersion <= 6) {
		upgradeDB.createObjectStore("achievements", {
			keyPath: "aid",
			autoIncrement: true,
		});
	}

	if (oldVersion <= 7) {
		const attributeStore = upgradeDB.createObjectStore("attributes");
		attributeStore.put(-1, "changesRead");
		attributeStore.put(-1, "lastSelectedTid");
		attributeStore.put(0, "nagged");
	}
};

const connectMeta = async () => {
	// Would like to await on createMeta/migrateMeta and inside those functions, but Firefox
	const db = await openDB<MetaDB>("meta", 8, {
		upgrade(db, oldVersion) {
			if (oldVersion === 0) {
				createMeta(db);
			} else {
				migrateMeta(db, oldVersion);
			}
		},
		blocked() {
			logEvent({
				type: "error",
				text: "Please close any other open tabs.",
				saveToDb: false,
			});
		},
		blocking() {
			db.close();
		},
		terminated() {
			logEvent({
				type: "error",
				text: "Something bad happened...",
				saveToDb: false,
			});
		},
	});

	return db;
};

export default connectMeta;
