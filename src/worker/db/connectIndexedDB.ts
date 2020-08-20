import { openDB, IDBPDatabase, IDBPTransaction } from "idb";
import { logEvent } from "../util";

// If duplicate message is sent multiple times in a row (like IndexedDB transaction abort with many open requests), only show one
const debounceMessagesStore = new Map<string, number>();
const stopBecauseDebounce = (text: string) => {
	const timeoutID = debounceMessagesStore.get(text);
	if (timeoutID === undefined) {
		const newTimeoutID = self.setTimeout(() => {
			debounceMessagesStore.delete(text);
		}, 1000);
		debounceMessagesStore.set(text, newTimeoutID);
		return false;
	}
	return true;
};

const connectIndexedDB = async <DBTypes>({
	name,
	version,
	create,
	migrate,
	lid,
}: {
	name: string;
	version: number;
	lid: number;
	create: (db: IDBPDatabase<DBTypes>) => void;
	migrate: (a: {
		db: IDBPDatabase<DBTypes>;
		lid: number;
		oldVersion: number;
		transaction: IDBPTransaction<DBTypes>;
	}) => void;
}) => {
	// Would like to await on create/migrate and inside those functions, but Firefox
	const db = await openDB<DBTypes>(name, version, {
		upgrade(db, oldVersion, newVerison, transaction) {
			if (oldVersion === 0) {
				create(db);
			} else {
				migrate({ db, lid, oldVersion, transaction });
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
				text: "Something bad happened. Please try reloading the game.",
				saveToDb: false,
				persistent: true,
			});
		},
	});

	const quotaErrorMessage =
		'browser isn\'t letting the game store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Delete Old Data within a league). Clearing space elsewhere on your hard drive might help too. <a href="https://basketball-gm.com/manual/debugging/quota-errors/"><b>Read this for more info.</b></a>';

	db.addEventListener("abort", (event: any) => {
		console.log(`${name} database abort event`, event.target.error);

		let text: string | undefined;
		if (
			event.target.error &&
			event.target.error.name === "QuotaExceededError"
		) {
			text = `Your ${quotaErrorMessage}`;
		} else if (event.target.error) {
			text = `${name} database abort event: ${event.target.error.message}<br><br>Maybe your ${quotaErrorMessage}`;
		}

		if (text && !stopBecauseDebounce(text)) {
			logEvent({
				type: "error",
				text,
				saveToDb: false,
				persistent: true,
			});
		}

		if (event.target.error) {
			throw event.target.error;
		}
	});
	db.addEventListener("error", (event: any) => {
		console.log(`${name} database error event`, event.target.error);

		if (event.target.error) {
			let text: string;
			if (event.target.error.message.includes("abort")) {
				text = `${name} database error event: ${event.target.error.message}<br><br>Maybe your ${quotaErrorMessage}`;
			} else {
				text = `${name} database error event: ${event.target.error.message}`;
			}

			if (!stopBecauseDebounce(text)) {
				logEvent({
					type: "error",
					text,
					saveToDb: false,
					persistent: true,
				});
			}

			throw event.target.error;
		}
	});

	return db;
};

export default connectIndexedDB;
