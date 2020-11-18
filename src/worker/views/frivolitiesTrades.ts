import { idb, iterate } from "../db";
import { g, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	TeamSeason,
	DiscriminateUnion,
	EventBBGM,
} from "../../common/types";
import { PHASE } from "../../common";
import orderBy from "lodash/orderBy";
import { team } from "../core";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

type TradeEvent = DiscriminateUnion<EventBBGM, "type", "trade">;

export const getMostXRows = async ({
	filter,
	getValue,
	sortParams,
}: {
	filter?: (event: TradeEvent) => boolean;
	getValue: (ts: TeamSeason) => Most | undefined;
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
				most: ts.most,
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

const frivolitiesTrades = async (
	{ abbrev, tid, type }: ViewInput<"frivolitiesTrades">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || type !== state.type) {
		let filter: Parameters<typeof getMostXRows>[0]["filter"];
		let getValue: Parameters<typeof getMostXRows>[0]["getValue"];
		let sortParams: any;
		let title: string;
		let description: string | undefined;

		if (type === "biggest") {
			title = "Biggest Trades";
			description = "Trades involving the best players and prospects.";

			getValue = ts => {
				return { value: helpers.calcWinp(ts) };
			};
			sortParams = [["most.value"], ["desc"]];
		} else if (type === "lopsided") {
			title = "Most Lopsided Trades";
			description =
				"Trades where one team's assets got a lot more production than the other.";

			getValue = ts => ({
				value: -helpers.calcWinp(ts),
				roundsWonText: getRoundsWonText(ts),
			});
			sortParams = [["most.value"], ["desc"]];
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		if (tid >= 0) {
			filter = event => event.tids.includes(tid);
		}

		const rows = await getMostXRows({
			filter,
			getValue,
			sortParams,
		});

		return {
			abbrev,
			description,
			rows,
			title,
			tid,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default frivolitiesTrades;
