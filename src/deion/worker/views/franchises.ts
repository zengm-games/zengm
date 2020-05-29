import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";
import orderBy from "lodash/orderBy";

const sumBy = <Key extends string, T extends Record<Key, number>>(
	records: T[],
	key: Key,
): number => {
	let sum = 0;
	for (const record of records) {
		sum += record[key];
	}
	return sum;
};

const minBy = <Key extends string, T extends Record<Key, number>>(
	records: T[],
	key: Key,
): number => {
	let min = Infinity;
	for (const record of records) {
		if (record[key] < min) {
			min = record[key];
		}
	}
	return min;
};

const maxBy = <Key extends string, T extends Record<Key, number>>(
	records: T[],
	key: Key,
): number => {
	let max = -Infinity;
	for (const record of records) {
		if (record[key] > max) {
			max = record[key];
		}
	}
	return max;
};

const countPlayoffs = (records: { playoffRoundsWon: number }[]) => {
	let playoffs = 0;
	for (const record of records) {
		if (record.playoffRoundsWon >= 0) {
			playoffs += 1;
		}
	}
	return playoffs;
};

const countChampionships = (
	records: { playoffRoundsWon: number; season: number }[],
) => {
	let championships = 0;
	for (const record of records) {
		const numRounds = g.get("numGamesPlayoffSeries", record.season).length;
		if (record.playoffRoundsWon === numRounds) {
			championships += 1;
		}
	}
	return championships;
};

const getRowInfo = (
	seasonAttrs: {
		season: number;
		won: number;
		lost: number;
		tied: number;
		playoffRoundsWon: number;
	}[],
) => {
	const rowInfo = {
		start: minBy(seasonAttrs, "season"),
		end: maxBy(seasonAttrs, "season"),
		numSeasons: seasonAttrs.length,
		won: sumBy(seasonAttrs, "won"),
		lost: sumBy(seasonAttrs, "lost"),
		tied: sumBy(seasonAttrs, "tied"),
		winp: 0,
		playoffs: countPlayoffs(seasonAttrs),
		championships: countChampionships(seasonAttrs),
	};
	rowInfo.winp = helpers.calcWinp(rowInfo);
	return rowInfo;
};

const updateFranchises = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		const teamsAll = orderBy(
			await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev", "region", "name"],
				seasonAttrs: [
					"abbrev",
					"region",
					"name",
					"season",
					"won",
					"lost",
					"tied",
					"playoffRoundsWon",
				],
			}),
			["region", "name", "tid"],
		);

		const teams: {
			root: boolean;
			tid: number;
			abbrev: string;
			region: string;
			name: string;
			start: number;
			numSeasons: number;
			end: number;
			won: number;
			lost: number;
			tied: number;
			winp: number;
			playoffs: number;
			championships: number;
			sortValue: number;
		}[] = [];

		for (const t of teamsAll) {
			// Root object
			const row = {
				root: true,
				tid: t.tid,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				...getRowInfo(t.seasonAttrs),
				sortValue: teams.length,
			};
			teams.push(row);

			// Any name changes or season gaps? If so, separate
			const partials: typeof teams = [];
			const addPartial = (tid: number, seasonAttrs: typeof t.seasonAttrs) => {
				partials.push({
					root: false,
					tid: tid,
					abbrev: seasonAttrs[0].abbrev,
					region: seasonAttrs[0].region,
					name: seasonAttrs[0].name,
					...getRowInfo(seasonAttrs),
					sortValue: teams.length + partials.length,
				});
			};
			let prevName: string | undefined;
			let prevSeason: number | undefined;
			let seasonAttrs: typeof t.seasonAttrs = [];

			// Start with newest season
			t.seasonAttrs.reverse();
			for (const ts of t.seasonAttrs) {
				const name = `${ts.region} ${ts.name}`;
				if (prevName !== name || prevSeason !== ts.season + 1) {
					// Either this is the first iteration of the loop, or the team name/region changed, or there is a gap in seasons
					if (seasonAttrs.length > 0) {
						addPartial(t.tid, seasonAttrs);
					}

					seasonAttrs = [];
					prevName = name;
				}
				prevSeason = ts.season;
				seasonAttrs.push(ts);
			}

			if (partials.length > 0) {
				if (seasonAttrs.length > 0) {
					addPartial(t.tid, seasonAttrs);
				}

				console.log(t.abbrev, partials.length);
				teams.push(...partials);
			}
		}

		return {
			teams,
			ties: g.get("ties"),
			userTid: g.get("userTid"),
		};
	}
};

export default updateFranchises;
