import { idb } from "../db";
import { g, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	AllStars,
	TeamFiltered,
} from "../../common/types";

const tallyAwards = (tid: number, awards: any[], allAllStars: AllStars[]) => {
	const teamAwards = {
		mvp: 0,
		dpoy: 0,
		smoy: 0,
		mip: 0,
		roy: 0,
		oroy: 0,
		droy: 0,
		allLeague: [0, 0, 0],
		allLeagueTotal: 0,
		allDefense: [0, 0, 0],
		allDefenseTotal: 0,
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

		if (a.mvp.tid === tid) {
			teamAwards.mvp++;
		}

		if (a.dpoy.tid === tid) {
			teamAwards.dpoy++;
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
				if (t.tid === tid) {
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
				if (p.tid === tid) {
					teamAwards.allLeague[i]++;
					teamAwards.allLeagueTotal++;
				}
			}
		}

		if (a.allDefensive) {
			for (let i = 0; i < a.allDefensive.length; i++) {
				for (const p of a.allDefensive[i].players) {
					if (p.tid === tid) {
						teamAwards.allDefense[i]++;
						teamAwards.allDefenseTotal++;
					}
				}
			}
		}
	}

	for (const allStars of allAllStars) {
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

const getTeamRecord = (
	t: TeamFiltered<
		["tid", "cid", "did", "abbrev", "region", "name"],
		["season", "playoffRoundsWon", "won", "lost"],
		undefined,
		undefined
	>,
	awards: any[],
	allStars: AllStars[],
) => {
	const teamAwards = tallyAwards(t.tid, awards, allStars);

	let totalWon = 0;
	let totalLost = 0;
	let playoffAppearances = 0;
	let championships = 0;
	let finals = 0;
	let lastPlayoffAppearance: number | null = null;
	let lastChampionship: number | null = null;

	for (let i = 0; i < t.seasonAttrs.length; i++) {
		totalWon += t.seasonAttrs[i].won;
		totalLost += t.seasonAttrs[i].lost;

		const numPlayoffRounds = g.get(
			"numGamesPlayoffSeries",
			t.seasonAttrs[i].season,
		).length;

		if (t.seasonAttrs[i].playoffRoundsWon >= 0) {
			playoffAppearances++;
			lastPlayoffAppearance = t.seasonAttrs[i].season;
		}

		if (t.seasonAttrs[i].playoffRoundsWon >= numPlayoffRounds - 1) {
			finals++;
		}

		if (t.seasonAttrs[i].playoffRoundsWon === numPlayoffRounds) {
			championships++;
			lastChampionship = t.seasonAttrs[i].season;
		}
	}

	const winp = helpers.roundWinp(
		totalWon > 0 ? totalWon / (totalWon + totalLost) : 0,
	);
	return {
		id: t.tid,
		team: {
			abbrev: t.abbrev,
			name: t.name,
			region: t.region,
			tid: t.tid,
		},
		cid: t.cid,
		did: t.did,
		won: totalWon,
		lost: totalLost,
		winp,
		playoffAppearances,
		lastPlayoffAppearance,
		championships,
		lastChampionship,
		finals,
		mvp: teamAwards.mvp,
		dpoy: teamAwards.dpoy,
		smoy: teamAwards.smoy,
		mip: teamAwards.mip,
		roy: teamAwards.roy,
		oroy: teamAwards.oroy,
		droy: teamAwards.droy,
		bestRecord: teamAwards.bestRecord,
		bestRecordConf: teamAwards.bestRecordConf,
		allRookie: teamAwards.allRookie,
		allLeague: teamAwards.allLeagueTotal,
		allDefense: teamAwards.allDefenseTotal,
		allStar: teamAwards.allStar,
		allStarMVP: teamAwards.allStarMVP,
	};
};

const sumRecordsFor = (
	group: "cid" | "did",
	id: number,
	name: string,
	records: ReturnType<typeof getTeamRecord>[],
) => {
	const except = [
		"id",
		"lastChampionship",
		"lastPlayoffAppearance",
		"team",
		"cid",
		"did",
		"winp",
	];
	const keys = helpers.keys(records[0]);
	const out: any = {};
	const xRecords = records.filter(r => r[group] === id);

	for (const k of keys) {
		if (except.includes(k)) {
			out[k] = null;
		} else {
			out[k] = xRecords.reduce((a, b) => a + Number(b[k]), 0);
		}
	}

	out.id = id;
	out.team = name;
	out.winp = helpers.roundWinp(helpers.calcWinp(out));

	for (const key of ["lastChampionship", "lastPlayoffAppearance"] as const) {
		const years = xRecords
			.map(r => r[key])
			.filter(year => typeof year === "number") as number[];
		out[key] = years.length === 0 ? null : Math.max(...years);
	}

	return out;
};

const updateTeamRecords = async (
	inputs: ViewInput<"teamRecords">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (updateEvents.includes("firstRun") || inputs.byType !== state.byType) {
		const teams = await idb.getCopies.teamsPlus({
			// Purposely use global team info here, not season specific!
			attrs: ["tid", "cid", "did", "abbrev", "region", "name"],
			seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"],
		});
		const awards = await idb.getCopies.awards();
		const allStars = await idb.getCopies.allStars();

		const teamRecords = teams.map(t => getTeamRecord(t, awards, allStars));

		const seasonCount = teamRecords
			.map(tr => tr.championships)
			.reduce((a, b) => Number(a) + Number(b));
		let display;

		if (inputs.byType === "by_team") {
			display = teamRecords;
		} else if (inputs.byType === "by_conf") {
			display = g
				.get("confs")
				.map(conf => sumRecordsFor("cid", conf.cid, conf.name, teamRecords));
		} else {
			display = g
				.get("divs")
				.map(div => sumRecordsFor("did", div.did, div.name, teamRecords));
		}

		const categories =
			process.env.SPORT === "basketball"
				? [
						"mvp",
						"dpoy",
						"smoy",
						"mip",
						"roy",
						"bestRecord",
						"bestRecordConf",
						"allRookie",
						"allLeague",
						"allDefense",
						"allStar",
						"allStarMVP",
				  ]
				: [
						"mvp",
						"dpoy",
						"oroy",
						"droy",
						"bestRecord",
						"bestRecordConf",
						"allRookie",
						"allLeague",
				  ];
		return {
			byType: inputs.byType,
			categories,
			seasonCount,
			teamRecords: display,
		};
	}
};

export default updateTeamRecords;
