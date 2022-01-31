import { idb } from "../db";
import { uniq } from "lodash-es";
import { g } from "../../worker/util";
import type { MetaCol } from "../../ui/util/columns/getCols";
import {
	getCols,
	isSport,
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
} from "../../common";
import { PlayerStatType } from "../../common/types";

type PlayerTableInput = {
	teamsAndAllWatch: string;
	season: "career" | "all" | number;
	statType: string;
	playoffs: "playoffs" | "regularSeason";
};

export default async function getPlayerTable(
	inputs: PlayerTableInput,
	tableName: string,
	fallback: string[] = [],
) {
	const colOptions: string[] | undefined = await idb.meta.get(
		"tables",
		tableName,
	);
	fallback = [
		"Name",
		"Pos",
		"Team",
		"Age",
		...PLAYER_STATS_TABLES.regular.stats.map(s => `stat:${s}`),
	];
	console.log(fallback);
	const columns: MetaCol[] = getCols(colOptions ?? fallback);
	const statsNeeded: string[] = uniq(
		columns.reduce(
			(needed: string[], c: MetaCol) => needed.concat(c.stats ?? []),
			[],
		),
	);
	const ratingsNeeded: string[] = uniq(
		columns.reduce(
			(needed: string[], c: MetaCol) => needed.concat(c.ratings ?? []),
			[],
		),
	);
	const attrsNeeded: string[] = uniq(
		columns.reduce(
			(needed: string[], c: MetaCol) => needed.concat(c.attrs ?? []),
			[],
		),
	);
	// const vars = {
	// 	season: g.get("season"),
	// 	userTid: g.get("userTid"),
	// 	godMode: g.get("godMode"),
	// 	spectator: g.get("spectator"),
	// 	phase: g.get("phase"),
	// 	challengeNoRatings: g.get("challengeNoRatings"),
	// 	challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
	// 	challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
	// 	challengeNoTrades: g.get("challengeNoTrades"),
	// 	salaryCapType: g.get("salaryCapType"),
	// 	salaryCap: g.get("salaryCap"),
	// 	maxContract: g.get("maxContract"),
	// 	minContract: g.get("minContract"),
	// };

	return getPlayers(inputs, statsNeeded, ratingsNeeded, attrsNeeded);
}

export const getPlayers = async (
	inputs: PlayerTableInput,
	statsNeeded: string[],
	ratingsNeeded: string[],
	attrsNeeded: string[],
) => {
	let playersAll;
	let tid: number | undefined = g
		.get("teamInfoCache")
		.findIndex(t => t.abbrev === inputs.teamsAndAllWatch);
	if (tid < 0) {
		tid = undefined;
	}

	if (g.get("season") === inputs.season) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason:
					typeof inputs.season === "number" ? inputs.season : undefined,
			},
			"noCopyCache",
		);
	}
	// Show all teams
	if (tid === undefined && inputs.teamsAndAllWatch === "watch") {
		playersAll = playersAll.filter(p => p.watch);
	}

	return playersAll;

	// Show all teams
	let statType: PlayerStatType;

	if (isSport("basketball")) {
		if (inputs.statType === "totals") {
			statType = "totals";
		} else if (inputs.statType === "per36") {
			statType = "per36";
		} else {
			statType = "perGame";
		}
	} else {
		statType = "totals";
	}

	// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
	// For the current season, use the current abbrev (including FA), not the last stats abbrev
	// For other seasons, use the stats abbrev for filtering
	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [],
		ratings: [],
		stats: [],
		season: typeof inputs.season === "number" ? inputs.season : undefined,
		tid,
		statType,
		playoffs: inputs.playoffs === "playoffs",
		regularSeason: inputs.playoffs !== "playoffs",
		mergeStats: true,
	});

	if (inputs.season === "all") {
		players = players
			.map(p =>
				p.stats.map((ps: any) => {
					const ratings =
						p.ratings.find((pr: any) => pr.season === ps.season) ??
						p.ratings.at(-1);

					return {
						...p,
						ratings,
						stats: ps,
					};
				}),
			)
			.flat();
	}

	// Only keep players who actually played
	if (inputs.abbrev !== "watch" && isSport("basketball")) {
		players = players.filter(p => {
			if (inputs.statType === "gameHighs") {
				if (inputs.season !== "career") {
					return p.stats.gp > 0;
				} else if (inputs.playoffs !== "playoffs") {
					return p.careerStats.gp > 0;
				}
				return p.careerStatsPlayoffs.gp > 0;
			}

			if (inputs.season !== "career") {
				return p.stats.gp > 0;
			} else if (inputs.playoffs === "playoffs") {
				return p.careerStatsPlayoffs.gp > 0;
			} else if (inputs.playoffs !== "playoffs") {
				return p.careerStats.gp > 0;
			}

			return false;
		});
	} else if (
		inputs.abbrev !== "watch" &&
		statsTable.onlyShowIf &&
		(isSport("football") || isSport("hockey"))
	) {
		// Ensure some non-zero stat for this position
		const onlyShowIf = statsTable.onlyShowIf;

		let obj: "careerStatsPlayoffs" | "careerStats" | "stats";
		if (inputs.season === "career") {
			if (inputs.playoffs === "playoffs") {
				obj = "careerStatsPlayoffs";
			} else {
				obj = "careerStats";
			}
		} else {
			obj = "stats";
		}

		players = players.filter(p => {
			for (const stat of onlyShowIf) {
				if (typeof p[obj][stat] === "number" && p[obj][stat] > 0) {
					return true;
				}
			}

			return false;
		});
	}

	return players;
};
