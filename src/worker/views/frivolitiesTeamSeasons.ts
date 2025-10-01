import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	TeamSeason,
	ByConf,
} from "../../common/types.ts";
import { isSport, PHASE } from "../../common/index.ts";
import { team } from "../core/index.ts";
import hasTies from "../core/season/hasTies.ts";
import { orderBy, type OrderBySortParams } from "../../common/utils.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

// This assumes we add a value for defaultKey before we get any key that might not exist
class DefaultKeyMap<Key, Value> extends Map<Key, Value> {
	defaultKey: Key;

	constructor(defaultKey: Key) {
		super();

		this.defaultKey = defaultKey;
	}

	override get(key: Key) {
		if (!this.has(key)) {
			if (!this.has(this.defaultKey)) {
				throw new Error("No entry for defaultKey");
			}
			return super.get(this.defaultKey)!;
		}

		return super.get(key)!;
	}
}

export const getPlayoffsByConfBySeason = async () => {
	const currentSeason = g.get("season");
	const playoffsByConfBySeason = new DefaultKeyMap<number, ByConf>(
		currentSeason,
	);
	for (
		let season = g.get("startingSeason");
		season <= currentSeason;
		season++
	) {
		playoffsByConfBySeason.set(season, await getPlayoffsByConf(season));
	}

	return playoffsByConfBySeason;
};

const getMostXTeamSeasons = async ({
	filter,
	getValue,
	after,
	sortParams,
}: {
	filter?: (ts: TeamSeason) => boolean;
	getValue: (ts: TeamSeason, playoffsByConf: ByConf) => Most | undefined;
	after?: (most: Most) => Promise<Most> | Most;
	sortParams: OrderBySortParams;
}) => {
	const LIMIT = 100;
	const teamSeasonsAll: (TeamSeason & {
		winp: number;
		most: Most;
	})[] = [];

	const playoffsByConfBySeason = await getPlayoffsByConfBySeason();

	for await (const { value: ts } of idb.league.transaction("teamSeasons")
		.store) {
		if (filter !== undefined && !filter(ts)) {
			continue;
		}

		const playoffsByConf = playoffsByConfBySeason.get(ts.season);

		const most = getValue(ts, playoffsByConf);
		if (most === undefined) {
			continue;
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
	}

	const challengeNoRatings = g.get("challengeNoRatings");

	const teamSeasons = await Promise.all(
		teamSeasonsAll.map(async (ts) => {
			return {
				tid: ts.tid,
				season: ts.season,
				abbrev: ts.abbrev ?? g.get("teamInfoCache")[ts.tid]?.abbrev,
				region: ts.region ?? g.get("teamInfoCache")[ts.tid]?.region,
				name: ts.name ?? g.get("teamInfoCache")[ts.tid]?.name,
				imgURL: ts.imgURL ?? g.get("teamInfoCache")[ts.tid]?.imgURL,
				imgURLSmall:
					ts.imgURLSmall ?? g.get("teamInfoCache")[ts.tid]?.imgURLSmall,
				won: ts.won,
				lost: ts.lost,
				tied: ts.tied,
				otl: ts.otl,
				winp: ts.winp,
				standingsPts: team.evaluatePointsFormula(ts, {
					season: ts.season,
				}),
				ptsPct: team.ptsPct(ts),
				playoffRoundsWon: ts.playoffRoundsWon,
				seed: null as null | number,
				rank: 0,
				mov: 0,
				gp: 0,
				pts: 0,
				oppPts: 0,
				most: after ? await after(ts.most) : ts.most,
				ovr: !challengeNoRatings ? ts.ovrEnd : undefined,
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
		const row = teamStats.find((row) => !row.playoffs);
		if (row) {
			ts.mov = team.processStats(row, ["mov"], false, "perGame").mov;
			ts.gp = row.gp;
			ts.pts = row.pts;
			ts.oppPts = row.oppPts;

			// MovOrDiff is expecting this to be per game
			if (isSport("basketball")) {
				ts.pts /= row.gp;
				ts.oppPts /= row.gp;
			}
		}

		if (ts.playoffRoundsWon >= 0) {
			const playoffSeries = await tx
				.objectStore("playoffSeries")
				.get(ts.season);
			if (playoffSeries?.series[0]) {
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
	for (const [i, row] of ordered.entries()) {
		row.rank = i + 1;
	}

	return ordered;
};

export const getRoundsWonText = (ts: TeamSeason, playoffsByConf: ByConf) => {
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", ts.season).length;

	return helpers.roundsWonText({
		playoffRoundsWon: ts.playoffRoundsWon,
		numPlayoffRounds,
		playoffsByConf,
	});
};

const getRoundsWonTextUpper = (ts: TeamSeason, playoffsByConf: ByConf) => {
	return helpers.upperCaseFirstLetter(getRoundsWonText(ts, playoffsByConf));
};

// 0 = won championship, 1 = lost in finals, 2 = lost in semifinals, etc.
const getRoundsFromChamipionship = (ts: TeamSeason) => {
	const numPlayoffRounds = g.get("numGamesPlayoffSeries", ts.season).length;

	return numPlayoffRounds - ts.playoffRoundsWon;
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

		const pointsFormula = g.get("pointsFormula");
		const usePts = pointsFormula !== "";

		const mostValue = (x: any) => x.most.value;

		if (type === "best_non_playoff") {
			title = "Best Non-Playoff Teams";
			description =
				"These are the best seasons from teams that did not make the playoffs.";

			filter = (ts) =>
				ts.playoffRoundsWon < 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = (ts) => {
				return { value: helpers.calcWinp(ts) };
			};
			sortParams = [
				[mostValue, "mov"],
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

			filter = (ts) =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = (ts, playoffsByConf) => ({
				value: -helpers.calcWinp(ts),
				roundsWonText: getRoundsWonTextUpper(ts, playoffsByConf),
			});
			sortParams = [
				[mostValue, "mov"],
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

			filter = (ts) =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = (ts, playoffsByConf) => {
				const roundsWonText = getRoundsWonTextUpper(ts, playoffsByConf);

				const roundsFromChampionship = getRoundsFromChamipionship(ts);
				if (roundsFromChampionship > 1) {
					// Must have at least made finals
					return;
				}
				return {
					value: -helpers.calcWinp(ts),
					roundsWonText,
				};
			};
			sortParams = [
				[mostValue, "mov"],
				["desc", "asc"],
			];
		} else if (type === "worst_champ") {
			title = "Worst Championship Teams";
			description =
				"These are the worst seasons from teams that somehow won the title.";
			extraCols.push({
				key: "seed",
				colName: "Seed",
			});

			filter = (ts) =>
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = (ts) => {
				const roundsFromChampionship = getRoundsFromChamipionship(ts);
				if (roundsFromChampionship > 0) {
					// Must have won championship
					return;
				}
				return {
					value: -helpers.calcWinp(ts),
				};
			};
			sortParams = [
				[mostValue, "mov"],
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

			filter = (ts) => season > ts.season || phase > PHASE.PLAYOFFS;
			getValue = (ts, playoffsByConf) => ({
				value: helpers.calcWinp(ts),
				roundsWonText: getRoundsWonTextUpper(ts, playoffsByConf),
			});
			sortParams = [
				[mostValue, "mov"],
				["desc", "desc"],
			];
		} else if (type === "worst") {
			title = "Worst Teams";

			filter = (ts) => season > ts.season || phase > PHASE.PLAYOFFS;
			getValue = (ts) => ({
				value: -helpers.calcWinp(ts),
			});
			sortParams = [
				[mostValue, "mov"],
				["desc", "asc"],
			];
		} else if (type === "old_champ" || type === "young_champ") {
			title = `${
				type === "old_champ" ? "Oldest" : "Youngest"
			} Championship Teams`;
			description = `These are ${
				type === "old_champ" ? "oldest" : "youngest"
			} teams that won the title.`;
			extraCols.push(
				{
					key: ["most", "avgAge"],
					colName: "AvgAge",
				},
				{
					key: "seed",
					colName: "Seed",
				},
			);

			filter = (ts) =>
				ts.avgAge !== undefined &&
				ts.playoffRoundsWon >= 0 &&
				(season > ts.season || phase > PHASE.PLAYOFFS);
			getValue = (ts) => {
				const roundsFromChampionship = getRoundsFromChamipionship(ts);
				if (roundsFromChampionship > 0) {
					// Must have won championship
					return;
				}

				const avgAge = ts.avgAge ?? 0;

				return {
					avgAge,
					value: type === "old_champ" ? avgAge : -avgAge,
				};
			};
			sortParams = [
				[mostValue, "winp"],
				["desc", "desc"],
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
			ties: hasTies(Infinity),
			otl: g.get("otl"),
			title,
			type,
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateFrivolitiesTeamSeasons;
