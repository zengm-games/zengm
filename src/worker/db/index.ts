import type { IDBPDatabase } from "idb";
import Cache from "./Cache";
import connectLeague, { LeagueDB } from "./connectLeague";
import connectMeta, { MetaDB } from "./connectMeta";
import * as getCopies from "./getCopies";
import * as getCopy from "./getCopy";

const idb: {
	cache: Cache;
	getCopies: typeof getCopies;
	getCopy: typeof getCopy;
	league: IDBPDatabase<LeagueDB>;
	meta: IDBPDatabase<MetaDB>;
} = {
	cache: new Cache(),
	getCopies,
	getCopy,
	// @ts-ignore
	league: undefined,
	// @ts-ignore
	meta: undefined,
};

export { Cache, connectLeague, connectMeta, idb };
export { default as getAll } from "./getAll";
export { default as iterate } from "./iterate";
export { default as reset } from "./reset";
