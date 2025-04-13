import type { IDBPDatabase } from "@dumbmatter/idb";
import Cache from "./Cache.ts";
import connectLeague, { type LeagueDB } from "./connectLeague.ts";
import connectMeta, { type MetaDB } from "./connectMeta.ts";
import * as getCopies from "./getCopies/index.ts";
import * as getCopy from "./getCopy/index.ts";

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
	// @ts-expect-error
	league: undefined,
	// @ts-expect-error
	meta: undefined,
};

export { Cache, connectLeague, connectMeta, idb };
export { default as getAll } from "./getAll.ts";
export { default as iterate } from "./iterate.ts";
export { default as reset } from "./reset.ts";
