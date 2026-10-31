import type { Game } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { idb } from "../index.ts";
import { MergedStore, type Exclusive, type Query } from "./engine.ts";

export type GamesSelector = Exclusive<
	{ gids: readonly number[] } | { season: number } | { note: true }
>;

class GamesStore extends MergedStore<"games", GamesSelector> {
	protected override toQuery(
		selector: GamesSelector | undefined,
	): Query<Game> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		if (selector.gids !== undefined) {
			return {
				keys: selector.gids,
			};
		}

		if (selector.season !== undefined) {
			const season = selector.season;
			return {
				// The cache has every game from the current season
				fromDb:
					season === g.get("season")
						? undefined
						: () =>
								idb.league
									.transaction("games")
									.store.index("season")
									.iterate(season),
				matches: (game) => game.season === season,
			};
		}

		if (selector.note) {
			return {
				// undefined for key returns all of the games with noteBool, since the ones without noteBool are not included in this index
				fromDb: () =>
					idb.league.transaction("games").store.index("noteBool").iterate(),
				matches: (game) => game.noteBool === 1,
			};
		}

		throw new Error("Invalid selector");
	}
}

export default new GamesStore("games");
