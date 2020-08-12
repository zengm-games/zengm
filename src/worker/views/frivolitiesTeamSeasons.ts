import { idb, iterate } from "../db";
import { g, helpers, processPlayersHallOfFame } from "../util";
import type {
	UpdateEvents,
	Player,
	ViewInput,
	MinimalPlayerRatings,
	TeamSeason,
} from "../../common/types";
import groupBy from "lodash/groupBy";
import { player, team } from "../core";
import { PLAYER, PHASE } from "../../common";
import orderBy from "lodash/orderBy";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

export const getMostXTeamSeasons = async ({
	filter,
	getValue,
	after,
}: {
	filter?: (ts: TeamSeason) => boolean;
	getValue: (ts: TeamSeason) => Most | undefined;
	after?: (most: Most) => Promise<Most> | Most;
	otherSortCols?: string[];
}) => {
	const LIMIT = 100;
	const teamSeasonsAll: (TeamSeason & {
		winp: number;
		most: Most;
	})[] = [];

	await iterate(
		idb.league.transaction("teamSeasons").store,
		undefined,
		undefined,
		ts => {
			if (filter !== undefined && !filter(ts)) {
				return;
			}

			const most = getValue(ts);
			if (most === undefined) {
				return;
			}

			teamSeasonsAll.push({
				...ts,
				winp: helpers.calcWinp(ts),
				most,
			});
			teamSeasonsAll.sort((a, b) => b.most.value - a.most.value);

			if (teamSeasonsAll.length > LIMIT) {
				teamSeasonsAll.pop();
			}
		},
	);

	const teamSeasons = await Promise.all(
		teamSeasonsAll.map(async ts => {
			return {
				tid: ts.tid,
				season: ts.season,
				abbrev: ts.abbrev,
				region: ts.region,
				name: ts.name,
				won: ts.won,
				lost: ts.lost,
				tied: ts.tied,
				winp: ts.winp,
				playoffRoundsWon: ts.playoffRoundsWon,
				rank: 0,
				mov: 0,
				most: after ? await after(ts.most) : ts.most,
			};
		}),
	);

	// Add margin of victory
	const teamStatsStore = idb.league.transaction("teamStats").store;
	for (const ts of teamSeasons) {
		const teamStats = await teamStatsStore
			.index("season, tid")
			.getAll([ts.season, ts.tid]);
		const row = teamStats.find(row => !row.playoffs);
		if (row) {
			ts.mov = team.processStats(row, ["mov"], false, "perGame").mov;
		}
	}

	const ordered = orderBy(teamSeasons, ["most.value", "mov"], ["desc", "desc"]);
	for (let i = 0; i < ordered.length; i++) {
		ordered[i].rank = i + 1;
	}

	return ordered;
};

const updateFrivolitiesTeamSeasons = async (
	{ type }: ViewInput<"frivolitiesTeamSeasons">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || type !== state.type) {
		let filter: Parameters<typeof getMostXTeamSeasons>[0]["filter"];
		let getValue: Parameters<typeof getMostXTeamSeasons>[0]["getValue"];
		let after: Parameters<typeof getMostXTeamSeasons>[0]["after"];
		let otherSortCols: string[] | undefined;
		let title: string;
		let description: string;
		const extraCols: {
			key: string | [string, string] | [string, string, string];
			colName: string;
		}[] = [];

		const phase = g.get("phase");
		const season = g.get("season");

		if (type === "best_non_playoff") {
			title = "Best Non-Playoff Teams";
			description =
				"These are the best seasons from teams that did not make the playoffs.";

			filter = ts =>
				ts.playoffRoundsWon < 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = ts => {
				return { value: helpers.calcWinp(ts) };
			};
			otherSortCols = ["mov"];
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		const teamSeasons = await getMostXTeamSeasons({
			filter,
			getValue,
			after,
			otherSortCols,
		});

		console.log(teamSeasons);

		return {
			description,
			extraCols,
			teamSeasons,
			ties: g.get("ties"),
			title,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateFrivolitiesTeamSeasons;
