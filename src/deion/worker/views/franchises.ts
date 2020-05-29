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
				start: minBy(t.seasonAttrs, "season"),
				end: maxBy(t.seasonAttrs, "season"),
				numSeasons: t.seasonAttrs.length,
				won: sumBy(t.seasonAttrs, "won"),
				lost: sumBy(t.seasonAttrs, "lost"),
				tied: sumBy(t.seasonAttrs, "tied"),
				winp: 0,
				playoffs: countPlayoffs(t.seasonAttrs),
				championships: countChampionships(t.seasonAttrs),
				sortValue: teams.length,
			};
			row.winp = helpers.calcWinp(row);
			teams.push(row);

			// Any name changes? If so, separate
			let prevName: string | undefined;
			let prevSeason: number | undefined;
			const rowTemplate = {
				...row,
				start: 0,
				end: 0,
				numSeasons: 0,
				won: 0,
				lost: 0,
				tied: 0,
				winp: 0,
				playoffs: 0,
				championships: 0,
				root: false,
			};
			const partials: typeof teams = [];
			let partial: typeof rowTemplate | undefined;

			// Start with newest season
			t.seasonAttrs.reverse();
			for (const ts of t.seasonAttrs) {
				const name = `${ts.region} ${ts.name}`;
				if (prevName !== name || prevSeason !== ts.season + 1) {
					// Either this is the first iteration of the loop, or the team name/region changed, or there is a gap in seasons
					if (partial) {
						partial.winp = helpers.calcWinp(partial);
						partials.push(partial);
					}

					partial = undefined;
					prevName = name;
				}
				prevSeason = ts.season;

				if (partial === undefined) {
					partial = {
						...rowTemplate,
						abbrev: ts.abbrev,
						name: ts.name,
						region: ts.region,
						end: ts.season,
						sortValue: teams.length + partials.length,
					};
				}

				partial.start = ts.season;
				partial.numSeasons += 1;
				partial.won += ts.won;
				partial.lost += ts.lost;
				partial.tied += ts.tied;
				if (ts.playoffRoundsWon >= 0) {
					partial.playoffs += 1;
				}
				if (
					ts.playoffRoundsWon >=
					g.get("numGamesPlayoffSeries", ts.season).length
				) {
					partial.championships += 1;
				}
			}

			// Handle if last row was a new name/season
			if (partial) {
				partials.push(partial);
			}

			if (partials.length > 1) {
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
