import { idb, iterate } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput, TeamSeason } from "../../common/types";
import { PHASE } from "../../common";
import orderBy from "lodash/orderBy";
import { team } from "../core";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

export const getMostXTeamSeasons = async ({
	filter,
	getValue,
	after,
	sortParams,
}: {
	filter?: (ts: TeamSeason) => boolean;
	getValue: (ts: TeamSeason) => Most | undefined;
	after?: (most: Most) => Promise<Most> | Most;
	sortParams?: any;
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
				abbrev: ts.abbrev || g.get("teamInfoCache")[ts.tid]?.abbrev,
				region: ts.region || g.get("teamInfoCache")[ts.tid]?.region,
				name: ts.name || g.get("teamInfoCache")[ts.tid]?.name,
				won: ts.won,
				lost: ts.lost,
				tied: ts.tied,
				winp: ts.winp,
				playoffRoundsWon: ts.playoffRoundsWon,
				seed: null as null | number,
				rank: 0,
				mov: 0,
				most: after ? await after(ts.most) : ts.most,
			};
		}),
	);

	// Add margin of victory, playoff seed
	const tx = idb.league.transaction(["teamStats", "playoffSeries"]);
	for (const ts of teamSeasons) {
		const teamStats = await tx
			.objectStore("teamStats")
			.index("season, tid")
			.getAll([ts.season, ts.tid]);
		const row = teamStats.find(row => !row.playoffs);
		if (row) {
			ts.mov = team.processStats(row, ["mov"], false, "perGame").mov;
		}

		if (ts.playoffRoundsWon >= 0) {
			const playoffSeries = await tx
				.objectStore("playoffSeries")
				.get(ts.season);
			if (playoffSeries) {
				const matchups = playoffSeries.series[0];
				for (const matchup of matchups) {
					if (matchup.home.tid === ts.tid) {
						ts.seed = matchup.home.seed;
						break;
					} else if (matchup.away && matchup.away.tid === ts.tid) {
						ts.seed = matchup.away.seed;
						break;
					}
				}
			}
		}
	}

	const ordered = orderBy(teamSeasons, ...sortParams);
	for (let i = 0; i < ordered.length; i++) {
		ordered[i].rank = i + 1;
	}

	return ordered;
};

const getRoundsWonText = (ts: TeamSeason) => {
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", ts.season).length;
	const numConfs = g.get("confs", ts.season).length;

	return helpers.roundsWonText(ts.playoffRoundsWon, numPlayoffRounds, numConfs);
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
		let sortParams: any;
		let title: string;
		let description: string | undefined;
		const extraCols: {
			key: string | [string, string] | [string, string, string];
			keySort?: string | [string, string] | [string, string, string];
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
			sortParams = [
				["most.value", "mov"],
				["desc", "desc"],
			];
		} else if (type === "worst_playoff") {
			title = "Worst Playoff Teams";
			description =
				"These are the worst seasons from teams that somehow made the playoffs.";
			extraCols.push(
				{
					key: "seed",
					colName: "Seed",
				},
				{
					key: ["most", "roundsWonText"],
					keySort: "playoffRoundsWon",
					colName: "Rounds Won",
				},
			);

			filter = ts =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = ts => ({
				value: -helpers.calcWinp(ts),
				roundsWonText: getRoundsWonText(ts),
			});
			sortParams = [
				["most.value", "mov"],
				["desc", "asc"],
			];
		} else if (type === "worst_finals") {
			title = "Worst Finals Teams";
			description =
				"These are the worst seasons from teams that somehow made the finals.";
			extraCols.push(
				{
					key: "seed",
					colName: "Seed",
				},
				{
					key: ["most", "roundsWonText"],
					keySort: "playoffRoundsWon",
					colName: "Rounds Won",
				},
			);

			filter = ts =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = ts => {
				const roundsWonText = getRoundsWonText(ts);

				// Keep in sync with helpers.roundsWonText
				const validTexts = [
					"League champs",
					"Conference champs",
					"Made finals",
				];
				if (!validTexts.includes(roundsWonText)) {
					return;
				}
				return {
					value: -helpers.calcWinp(ts),
					roundsWonText,
				};
			};
			sortParams = [
				["most.value", "mov"],
				["desc", "asc"],
			];
		} else if (type === "worst_champ") {
			title = "Worst Champion Teams";
			description =
				"These are the worst seasons from teams that somehow won the title.";
			extraCols.push(
				{
					key: "seed",
					colName: "Seed",
				},
				{
					key: ["most", "roundsWonText"],
					keySort: "playoffRoundsWon",
					colName: "Rounds Won",
				},
			);

			filter = ts =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = ts => {
				const roundsWonText = getRoundsWonText(ts);

				// Keep in sync with helpers.roundsWonText
				const validTexts = ["League champs"];
				if (!validTexts.includes(roundsWonText)) {
					return;
				}
				return {
					value: -helpers.calcWinp(ts),
					roundsWonText,
				};
			};
			sortParams = [
				["most.value", "mov"],
				["desc", "asc"],
			];
		} else if (type === "best") {
			title = "Best Teams";
			extraCols.push(
				{
					key: "seed",
					colName: "Seed",
				},
				{
					key: ["most", "roundsWonText"],
					keySort: "playoffRoundsWon",
					colName: "Rounds Won",
				},
			);

			filter = ts => season > ts.season || phase > PHASE.PLAYOFFS;
			getValue = ts => ({
				value: helpers.calcWinp(ts),
				roundsWonText: getRoundsWonText(ts),
			});
			sortParams = [
				["most.value", "mov"],
				["desc", "desc"],
			];
		} else if (type === "worst") {
			title = "Worst Teams";

			filter = ts => season > ts.season || phase > PHASE.PLAYOFFS;
			getValue = ts => ({
				value: -helpers.calcWinp(ts),
			});
			sortParams = [
				["most.value", "mov"],
				["desc", "asc"],
			];
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		const teamSeasons = await getMostXTeamSeasons({
			filter,
			getValue,
			after,
			sortParams,
		});

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
