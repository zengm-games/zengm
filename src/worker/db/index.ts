import type { IDBPDatabase } from "@dumbmatter/idb";
import Cache from "./Cache.ts";
import connectLeague, { type LeagueDB } from "./connectLeague.ts";
import connectMeta from "./connectMeta.ts";
import * as merged from "./merged/index.ts";
import { SafeIdb } from "./SafeIdb.ts";

const idb = {
	cache: new Cache(),
	// @ts-expect-error
	league: undefined as IDBPDatabase<LeagueDB>,
	merged,
	meta: new SafeIdb(connectMeta),
};

export { Cache, connectLeague, connectMeta, idb };
export { default as getAll } from "../../common/getAll.ts";
export { default as iterate } from "./iterate.ts";
export { default as reset } from "./reset.ts";
