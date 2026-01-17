import type {
	DBSchema,
	IDBPDatabase,
	IDBPTransaction,
	StoreNames,
} from "@dumbmatter/idb";
import { isSport } from "../../common/index.ts";
import type {
	League,
	Options,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types.ts";
import type { Settings } from "../views/settings.ts";
import connectIndexedDB from "./connectIndexedDB.ts";

interface MetaDB extends DBSchema {
	achievements: {
		key: number;
		value: {
			slug: string;
			difficulty?: "normal" | "hard" | "insane";
		};
	};
	attributes: {
		value:
			| number
			| string
			| Options
			| RealPlayerPhotos
			| RealTeamInfo
			| Partial<Settings>;
		key:
			| "lastChangesVersion"
			| "nagged"
			| "naggedMailingList"
			| "options"
			| "realPlayerPhotos"
			| "realTeamInfo"
			| "defaultSettingsOverrides";
	};
	leagues: {
		value: League;
		key: number;
		autoIncrementKeyPath: "lid";
	};
}

const create = (db: IDBPDatabase<MetaDB>) => {
	db.createObjectStore("achievements", {
		keyPath: "aid",
		autoIncrement: true,
	});
	const attributeStore = db.createObjectStore("attributes");
	db.createObjectStore("leagues", {
		keyPath: "lid",
		autoIncrement: true,
	});
	attributeStore.put(0, "nagged");
	attributeStore.put("VERSION_NUMBER", "lastChangesVersion");
};

type VersionChangeTransaction = IDBPTransaction<
	MetaDB,
	StoreNames<MetaDB>[],
	"versionchange"
>;

const migrate = async ({
	db,
	oldVersion,
	transaction,
}: {
	db: IDBPDatabase<MetaDB>;
	oldVersion: number;
	transaction: VersionChangeTransaction;
}) => {
	console.log(
		`Upgrading meta database from version ${oldVersion} to version ${db.version}`,
	);

	if (isSport("basketball") || isSport("football")) {
		if (oldVersion < 7) {
			db.createObjectStore("achievements", {
				keyPath: "aid",
				autoIncrement: true,
			});
		}

		if (oldVersion < 8) {
			const attributeStore = db.createObjectStore("attributes");
			attributeStore.put(0, "nagged");
		}
	}

	if (oldVersion < 9) {
		for await (const cursor of transaction.objectStore("leagues")) {
			const league = cursor.value;

			let updated;
			if (league.imgURL === "/img/logos-primary/CHI.svg") {
				league.imgURL = "/img/logos-primary/CHW.svg";
				updated = true;
			} else if (league.imgURL === "/img/logos-secondary/CHI.svg") {
				league.imgURL = "/img/logos-secondary/CHW.svg";
				updated = true;
			}

			if (updated) {
				await cursor.update(league);
			}
		}
	}
};

const connectMeta = () =>
	connectIndexedDB<MetaDB>({
		name: "meta",
		version: 9,
		lid: -1,
		create,
		migrate,
	});

export default connectMeta;
