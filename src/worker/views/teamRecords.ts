import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, AllStars, ViewInput } from "../../common/types";
import orderBy from "lodash-es/orderBy";

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

const minBy = <Key extends string, T extends Record<Key, number | undefined>>(
	records: T[],
	key: Key,
) => {
	let min: undefined | number;
	for (const record of records) {
		if (record[key] !== undefined && (min === undefined || record[key] < min)) {
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
		if (record[key] !== undefined && (max === undefined || record[key] > max)) {
			max = record[key];
		}
	}
	return max;
};

const tallyAwards = (
	tid: number,
	seasons: number[],
	awards: any[],
	allAllStars: AllStars[],
) => {
	const teamAwards = {
		mvp: 0,
		dpoy: 0,
		dfoy: 0,
		goy: 0,
		smoy: 0,
		mip: 0,
		roy: 0,
		oroy: 0,
		droy: 0,
		allLeague: 0,
		allDefense: 0,
		allRookie: 0,
		allStar: 0,
		allStarMVP: 0,
		bestRecord: 0,
		bestRecordConf: 0,
	};

	for (const a of awards) {
		if (!a) {
			continue;
		}

		if (!seasons.includes(a.season)) {
			continue;
		}

		if (a.mvp && a.mvp.tid === tid) {
			teamAwards.mvp++;
		}

		if (a.dpoy && a.dpoy.tid === tid) {
			teamAwards.dpoy++;
		}

		if (a.dfoy && a.dfoy.tid === tid) {
			teamAwards.dfoy++;
		}

		if (a.goy && a.goy.tid === tid) {
			teamAwards.goy++;
		}

		if (a.smoy && a.smoy.tid === tid) {
			teamAwards.smoy++;
		}

		if (a.mip && a.mip.tid === tid) {
			teamAwards.mip++;
		}

		if (a.roy && a.roy.tid === tid) {
			teamAwards.roy++;
		}

		if (a.oroy && a.oroy.tid === tid) {
			teamAwards.oroy++;
		}

		if (a.droy && a.droy.tid === tid) {
			teamAwards.droy++;
		}

		if (a.bre && a.brw) {
			// For old league files, this format is obsolete now
			if (a.bre.tid === tid) {
				teamAwards.bestRecordConf++;
			}

			if (a.brw.tid === tid) {
				teamAwards.bestRecordConf++;
			}

			if (a.bre.won >= a.brw.won) {
				if (a.bre.tid === tid) {
					teamAwards.bestRecord++;
				}
			} else {
				// eslint-disable-next-line no-lonely-if
				if (a.brw.tid === tid) {
					teamAwards.bestRecord++;
				}
			}
		} else {
			for (const t of a.bestRecordConfs) {
				if (t && t.tid === tid) {
					teamAwards.bestRecordConf++;
				}
			}

			if (a.bestRecord.tid === tid) {
				teamAwards.bestRecord++;
			}

			for (const t of a.allRookie) {
				if (t && t.tid === tid) {
					teamAwards.allRookie++;
				}
			}
		}

		for (let i = 0; i < a.allLeague.length; i++) {
			for (const p of a.allLeague[i].players) {
				if (p && p.tid === tid) {
					teamAwards.allLeague++;
				}
			}
		}

		if (a.allDefensive) {
			for (let i = 0; i < a.allDefensive.length; i++) {
				for (const p of a.allDefensive[i].players) {
					if (p && p.tid === tid) {
						teamAwards.allDefense++;
					}
				}
			}
		}
	}

	for (const allStars of allAllStars) {
		if (!seasons.includes(allStars.season)) {
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

const getRowInfo = (
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
	awards: any[],
	allStars: AllStars[],
) => {
	let playoffs = 0;
	let finals = 0;
	let titles = 0;
	let lastPlayoffs: number | undefined = undefined;
	let lastFinals: number | undefined = undefined;
	let lastTitle: number | undefined = undefined;
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
		...tallyAwards(
			tid,
			seasonAttrs.map(x => x.season),
			awards,
			allStars,
		),
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
} & ReturnType<typeof tallyAwards>;

const sumRecordsFor = (name: string, teams: Team[]) => {
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
		"mvp",
		"dpoy",
		"dfoy",
		"goy",
		"smoy",
		"mip",
		"roy",
		"oroy",
		"droy",
		"allLeague",
		"allDefense",
		"allRookie",
		"allStar",
		"allStarMVP",
		"bestRecord",
		"bestRecordConf",
	] as const;
	const colsMin = ["start"] as const;
	const colsMax = ["end", "lastPlayoffs", "lastFinals", "lastTitle"] as const;

	const output = { ...teams[0] };
	delete output.disabled;
	for (const col of [...colsSum]) {
		output[col] = sumBy(teams, col);
	}
	for (const col of colsMin) {
		output[col] = minBy(teams, col);
	}
	for (const col of colsMax) {
		output[col] = maxBy(teams, col);
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
		const awards = await idb.getCopies.awards();
		const allStars = await idb.getCopies.allStars();

		const teamsAll = orderBy(
			await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev", "region", "name", "cid", "did", "disabled"],
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
			}),
			["region", "name", "tid"],
		);

		let teams: Team[] = [];

		for (const t of teamsAll) {
			const seasonAttrsFiltered =
				filter === "your_teams"
					? t.seasonAttrs.filter(ts => t.tid === g.get("userTid", ts.season))
					: t.seasonAttrs;

			// Root object
			const row = {
				root: true,
				tid: t.tid,
				disabled: t.disabled,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				...getRowInfo(t.tid, seasonAttrsFiltered, awards, allStars),
				sortValue: teams.length,
			};

			if (row.start === undefined && row.end === undefined) {
				continue;
			}

			teams.push(row);

			if (byType === "by_team") {
				// by_team only - Any name changes or season gaps? If so, separate
				const partials: typeof teams = [];
				const addPartial = (tid: number, seasonAttrs: typeof t.seasonAttrs) => {
					partials.push({
						root: false,
						tid: tid,
						abbrev: seasonAttrs[0].abbrev,
						region: seasonAttrs[0].region,
						name: seasonAttrs[0].name,
						...getRowInfo(tid, seasonAttrs, awards, allStars),
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

					teams.push(...partials);
				}
			}
		}

		if (byType === "by_conf") {
			teams = g.get("confs", "current").map(conf =>
				sumRecordsFor(
					conf.name,
					teams.filter(t => {
						const t2 = teamsAll.find(t2 => t2.tid === t.tid);
						if (!t2) {
							return false;
						}
						return t2.cid === conf.cid;
					}),
				),
			);
		} else if (byType === "by_div") {
			teams = g.get("divs", "current").map(div => {
				let confName;
				const conf = g
					.get("confs", "current")
					.find(conf => conf.cid === div.cid);
				if (conf) {
					confName = conf.name;
				}

				return {
					...sumRecordsFor(
						div.name,
						teams.filter(t => {
							const t2 = teamsAll.find(t2 => t2.tid === t.tid);
							if (!t2) {
								return false;
							}
							return t2.did === div.did;
						}),
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
			byType,
			filter,
			teams,
			ties: g.get("ties") || ties,
			otl: g.get("otl") || otl,
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateTeamRecords;
