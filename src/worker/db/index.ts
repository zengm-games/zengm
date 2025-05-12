import type { IDBPDatabase } from "@dumbmatter/idb";
import Cache from "./Cache.ts";
import connectLeague, { type LeagueDB } from "./connectLeague.ts";
import connectMeta from "./connectMeta.ts";
import * as getCopies from "./getCopies/index.ts";
import * as getCopy from "./getCopy/index.ts";
import { SafeIdb } from "./SafeIdb.ts";

const idb = {
	cache: new Cache(),
	getCopies,
	getCopy,
	// @ts-expect-error
	league: undefined as IDBPDatabase<LeagueDB>,
	meta: new SafeIdb(connectMeta),
};

export { Cache, connectLeague, connectMeta, idb };
export { default as getAll } from "./getAll.ts";
export { default as iterate } from "./iterate.ts";
export { default as reset } from "./reset.ts";
