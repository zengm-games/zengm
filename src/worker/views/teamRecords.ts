import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	UpdateEvents,
	AllStars,
	ViewInput,
	Awards,
} from "../../common/types.ts";
import { season } from "../core/index.ts";
import { omit, orderBy } from "../../common/utils.ts";

const sumBy = <Key extends string, T extends Record<Key, number>>(
	records: T[],
	key: Key,
): number => {
	let sum = 0;
	for (const record of records) {
		// undefined check needed for custom awards
		if (record[key] !== undefined) {
			sum += record[key];
		}
	}
	return sum;
};

const minBy = <Key extends string, T extends Record<Key, number | undefined>>(
	records: T[],
	key: Key,
) => {
	let min: undefined | number;
	for (const record of records) {
		const value = record[key];
		if (value !== undefined && (min === undefined || value < min)) {
			min = record[key];
		}
	}
	return min;
};

const maxBy = <Key extends string, T extends Record<Key, number | undefined>>(
	records: T[],
	key: Key,
) => {
	let max: undefined | number;
	for (const record of records) {
		const value = record[key];
		if (value !== undefined && (max === undefined || value > max)) {
			max = value;
		}
	}
	return max;
};

const tallyAwards = async (
	tid: number,
	seasons: Set<number>,
	awards: Awards[],
	allAllStars: AllStars[],
) => {
	const teamAwards = {
		allStar: 0,
		allStarMVP: 0,
		bestRecord: 0,
		bestRecordConf: 0,
		bestRecordDiv: 0,
		custom: {} as Record<string, number>,
	};

	for (const row of awards) {
		if (!seasons.has(row.season)) {
			continue;
		}

		if (row.bestRecord === tid) {
			teamAwards.bestRecord++;
		}
		for (const bestTid of Object.values(row.bestRecordConfs)) {
			if (bestTid === tid) {
				teamAwards.bestRecordConf++;
			}
		}
		for (const bestTid of Object.values(row.bestRecordDivs)) {
			if (bestTid === tid) {
				teamAwards.bestRecordDiv++;
			}
		}

		for (const award of row.awards) {
			// This logic needs to be duplicated from below rather than just checking seenAwardTypes because shortName could be used for both a valid and invalid award
			if (award.numTeams !== undefined) {
				// Skip team awards
				continue;
			}
			if (typeof award.statRange === "number") {
				// Skip playoff series awards - usually not that much info there, like if you won FMVP you also probably won a championship
				continue;
			}

			if (award.winner[0]?.tid === tid) {
				const shortName = award.shortName;
				teamAwards.custom[shortName] ??= 0;
				teamAwards.custom[shortName] += 1;
			}
		}
	}

	for (const allStars of allAllStars) {
		if (!seasons.has(allStars.season)) {
			continue;
		}

		for (const row of [
			...allStars.remaining,
			...allStars.teams[0],
			...allStars.teams[1],
		]) {
			if (row.tid === tid) {
				teamAwards.allStar += 1;
			}
		}

		if (allStars.mvp && allStars.mvp.tid === tid) {
			teamAwards.allStarMVP += 1;
		}
	}

	return teamAwards;
};

const getRowInfo = async (
	tid: number,
	seasonAttrs: {
		season: number;
		won: number;
		lost: number;
		tied: number;
		otl: number;
		pts: number;
		ptsMax: number;
		playoffRoundsWon: number;
	}[],
	awards: Awards[],
	allStars: AllStars[],
) => {
	let playoffs = 0;
	let finals = 0;
	let titles = 0;
	let lastPlayoffs: number | undefined;
	let lastFinals: number | undefined;
	let lastTitle: number | undefined;
	for (const record of seasonAttrs) {
		const numRounds = g.get("numGamesPlayoffSeries", record.season).length;
		if (record.playoffRoundsWon >= 0) {
			if (record.playoffRoundsWon === numRounds) {
				titles += 1;
				if (lastTitle === undefined || record.season > lastTitle) {
					lastTitle = record.season;
				}
			}

			if (record.playoffRoundsWon >= numRounds - 1) {
				finals += 1;
				if (lastFinals === undefined || record.season > lastFinals) {
					lastFinals = record.season;
				}
			}

			playoffs += 1;
			if (lastPlayoffs === undefined || record.season > lastPlayoffs) {
				lastPlayoffs = record.season;
			}
		}
	}

	const rowInfo = {
		start: minBy(seasonAttrs, "season"),
		end: maxBy(seasonAttrs, "season"),
		numSeasons: seasonAttrs.length,
		won: sumBy(seasonAttrs, "won"),
		lost: sumBy(seasonAttrs, "lost"),
		tied: sumBy(seasonAttrs, "tied"),
		otl: sumBy(seasonAttrs, "otl"),
		pts: sumBy(seasonAttrs, "pts"),
		ptsMax: sumBy(seasonAttrs, "ptsMax"),
		ptsPct: 0,
		winp: 0,
		playoffs,
		finals,
		titles,
		lastPlayoffs,
		lastFinals,
		lastTitle,
		...(await tallyAwards(
			tid,
			new Set(seasonAttrs.map((x) => x.season)),
			awards,
			allStars,
		)),
	};
	rowInfo.winp = helpers.calcWinp(rowInfo);
	rowInfo.ptsPct = rowInfo.ptsMax !== 0 ? rowInfo.pts / rowInfo.ptsMax : 0;
	return rowInfo;
};

type Team = {
	root: boolean;
	tid: number;
	disabled?: boolean; // Only for root object of team, not div/conf
	abbrev: string;
	region: string;
	name: string;
	confName?: string;
	start: number | undefined;
	numSeasons: number;
	end: number | undefined;
	won: number;
	lost: number;
	tied: number;
	otl: number;
	pts: number;
	ptsMax: number;
	ptsPct: number;
	winp: number;
	playoffs: number;
	finals: number;
	titles: number;
	lastPlayoffs: number | undefined;
	lastFinals: number | undefined;
	lastTitle: number | undefined;
	sortValue: number;
} & Awaited<ReturnType<typeof tallyAwards>>;

const sumRecordsFor = (
	name: string,
	teams: Team[],
	awardTypes: Set<string>,
) => {
	const colsSum = [
		"won",
		"lost",
		"tied",
		"otl",
		"pts",
		"ptsMax",
		"playoffs",
		"finals",
		"titles",
		"allStar",
		"allStarMVP",
		"bestRecord",
		"bestRecordConf",
		"bestRecordDiv",
	] as const;
	const colsMin = ["start"] as const;
	const colsMax = ["end", "lastPlayoffs", "lastFinals", "lastTitle"] as const;

	const output = teams[0]
		? omit(teams[0], ["disabled"])
		: ({ custom: {} } as Team);
	for (const col of colsSum) {
		output[col] = sumBy(teams, col);
	}
	for (const col of colsMin) {
		output[col] = minBy(teams, col);
	}
	for (const col of colsMax) {
		output[col] = maxBy(teams, col);
	}

	const customs = teams.map((t) => t.custom);
	for (const col of awardTypes) {
		output.custom[col] = sumBy(customs, col);
	}

	output.name = name;
	output.numSeasons =
		output.start !== undefined && output.end !== undefined
			? 1 + output.end - output.start
			: 0;
	output.sortValue = 0;
	output.winp = helpers.calcWinp(output);
	output.ptsPct = output.pts / output.ptsMax;

	return output;
};

const updateTeamRecords = async (
	{ byType, filter }: ViewInput<"teamRecords">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		byType !== state.byType ||
		filter !== state.filter
	) {
		const awards = await idb.getCopies.awards(undefined, "noCopyCache");
		const allStars = await idb.getCopies.allStars(undefined, "noCopyCache");

		// Show newest awards in leftmost columns if we scan in order from most recent
		awards.reverse();
		const awardTypes: {
			name: string;
			shortName: string;
		}[] = [];
		const seenAwardTypes = new Set<string>();
		for (const row of awards) {
			for (const award of row.awards) {
				if (award.numTeams !== undefined) {
					// Skip team awards
					continue;
				}
				if (typeof award.statRange === "number") {
					// Skip playoff series awards - usually not that much info there, like if you won FMVP you also probably won a championship
					continue;
				}

				if (!seenAwardTypes.has(award.shortName)) {
					seenAwardTypes.add(award.shortName);
					awardTypes.push({
						name: award.name,
						shortName: award.shortName,
					});
				}
			}
		}

		const teamsAll = orderBy(
			await idb.getCopies.teamsPlus(
				{
					attrs: [
						"tid",
						"abbrev",
						"region",
						"name",
						"cid",
						"did",
						"disabled",
						"imgURL",
						"imgURLSmall",
					],
					seasonAttrs: [
						"abbrev",
						"region",
						"name",
						"season",
						"won",
						"lost",
						"tied",
						"otl",
						"pts",
						"ptsMax",
						"playoffRoundsWon",
					],
				},
				"noCopyCache",
			),
			["region", "name", "tid"],
		);

		let teams: Team[] = [];

		for (const t of teamsAll) {
			const seasonAttrsFiltered =
				filter === "your_teams"
					? t.seasonAttrs.filter((ts) => t.tid === g.get("userTid", ts.season))
					: t.seasonAttrs;

			// Root object
			const row = {
				root: true,
				tid: t.tid,
				disabled: t.disabled,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				...(await getRowInfo(t.tid, seasonAttrsFiltered, awards, allStars)),
				sortValue: teams.length,
			};

			if (row.start === undefined && row.end === undefined) {
				continue;
			}

			teams.push(row);

			if (byType === "by_team") {
				// by_team only - Any name changes or season gaps? If so, separate
				const partials: typeof teams = [];
				const addPartial = async (
					tid: number,
					seasonAttrs: typeof t.seasonAttrs,
				) => {
					partials.push({
						root: false,
						tid,
						abbrev: seasonAttrs[0]!.abbrev,
						region: seasonAttrs[0]!.region,
						name: seasonAttrs[0]!.name,
						...(await getRowInfo(tid, seasonAttrs, awards, allStars)),
						sortValue: teams.length + partials.length,
					});
				};
				let prevName: string | undefined;
				let prevSeason: number | undefined;
				let seasonAttrs: typeof t.seasonAttrs = [];

				// Start with newest season
				seasonAttrsFiltered.reverse();
				for (const ts of seasonAttrsFiltered) {
					const name = `${ts.region} ${ts.name}`;
					if (prevName !== name || prevSeason !== ts.season + 1) {
						// Either this is the first iteration of the loop, or the team name/region changed, or there is a gap in seasons
						if (seasonAttrs.length > 0) {
							await addPartial(t.tid, seasonAttrs);
						}

						seasonAttrs = [];
						prevName = name;
					}
					prevSeason = ts.season;
					seasonAttrs.push(ts);
				}

				if (partials.length > 0) {
					if (seasonAttrs.length > 0) {
						await addPartial(t.tid, seasonAttrs);
					}

					teams.push(...partials);
				}
			}
		}

		if (byType === "by_conf") {
			teams = g.get("confs", "current").map((conf) =>
				sumRecordsFor(
					conf.name,
					teams.filter((t) => {
						const t2 = teamsAll.find((t2) => t2.tid === t.tid);
						if (!t2) {
							return false;
						}
						return t2.cid === conf.cid;
					}),
					seenAwardTypes,
				),
			);
		} else if (byType === "by_div") {
			teams = g.get("divs", "current").map((div) => {
				let confName;
				const conf = g
					.get("confs", "current")
					.find((conf) => conf.cid === div.cid);
				if (conf) {
					confName = conf.name;
				}

				return {
					...sumRecordsFor(
						div.name,
						teams.filter((t) => {
							const t2 = teamsAll.find((t2) => t2.tid === t.tid);
							if (!t2) {
								return false;
							}
							return t2.did === div.did;
						}),
						seenAwardTypes,
					),
					confName,
				};
			});
		}

		let ties = false;
		let otl = false;
		for (const t of teams) {
			if (t.tied > 0) {
				ties = true;
			}
			if (t.otl > 0) {
				otl = true;
			}
			if (ties && otl) {
				break;
			}
		}

		const pointsFormula = g.get("pointsFormula");
		const usePts = pointsFormula !== "";

		return {
			awardTypes,
			byType,
			filter,
			teams,
			ties: season.hasTies(Infinity) || ties,
			otl: g.get("otl") || otl,
			usePts,
		};
	}
};

export default updateTeamRecords;
