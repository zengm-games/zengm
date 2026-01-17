import type {
	DBSchema,
	IDBPDatabase,
	IDBPTransaction,
	StoreKey,
	StoreNames,
	StoreValueWithOptionalKey,
} from "@dumbmatter/idb";

// Why this rather than raw idb? Because Safari does not like long running inactive database connections it seems, so sometimes it gets closed and idb.meta was being set to undefined. I'm not totally sure because I could never reproduce it and was just seeing it in Bugsnag and some user reports. But maybe checking for the connection before using it solves that problem?
export class SafeIdb<T extends DBSchema | unknown> {
	private db: IDBPDatabase<T> | undefined;
	private connect: () => Promise<IDBPDatabase<T>>;

	constructor(connect: () => Promise<IDBPDatabase<T>>) {
		this.connect = connect;
	}

	private async getDb() {
		if (!this.db) {
			const newConnection = await this.connect();

			// In case a second attempt to open happens before the first finishes
			if (this.db) {
				newConnection.close();
			} else {
				this.db = newConnection;
			}
		}
		return this.db;
	}

	async add<Name extends StoreNames<T>>(
		storeName: Name,
		value: StoreValueWithOptionalKey<T, Name>,
		key?: StoreKey<T, Name> | IDBKeyRange,
	) {
		const db = await this.getDb();
		return db.add(storeName, value, key);
	}

	async clear(name: StoreNames<T>) {
		const db = await this.getDb();
		db.clear(name);
	}

	async close() {
		const db = await this.getDb();
		db.close();
	}

	async delete<Name extends StoreNames<T>>(
		storeName: Name,
		key: StoreKey<T, Name> | IDBKeyRange,
	) {
		const db = await this.getDb();
		return db.delete(storeName, key);
	}

	async get<Name extends StoreNames<T>>(
		storeName: Name,
		query: StoreKey<T, Name> | IDBKeyRange,
	) {
		const db = await this.getDb();
		return db.get(storeName, query);
	}

	async getAll<Name extends StoreNames<T>>(
		storeName: Name,
		query?: StoreKey<T, Name> | IDBKeyRange | null,
		count?: number,
	) {
		const db = await this.getDb();
		return db.getAll(storeName, query, count);
	}

	async put<Name extends StoreNames<T>>(
		storeName: Name,
		value: StoreValueWithOptionalKey<T, Name>,
		key?: StoreKey<T, Name> | IDBKeyRange,
	) {
		const db = await this.getDb();
		return db.put(storeName, value, key);
	}

	transaction<
		Name extends StoreNames<T>,
		Mode extends IDBTransactionMode = "readonly",
	>(
		storeNames: Name,
		mode?: Mode,
		options?: IDBTransactionOptions,
	): Promise<IDBPTransaction<T, [Name], Mode>>;
	transaction<
		Names extends ArrayLike<StoreNames<T>>,
		Mode extends IDBTransactionMode = "readonly",
	>(
		storeNames: Names,
		mode?: Mode,
		options?: IDBTransactionOptions,
	): Promise<IDBPTransaction<T, Names, Mode>>;
	async transaction(
		storeNames: StoreNames<T> | ArrayLike<StoreNames<T>>,
		mode?: "readwrite",
	) {
		const db = await this.getDb();

		// @ts-expect-error
		return db.transaction(storeNames, mode);
	}
}
