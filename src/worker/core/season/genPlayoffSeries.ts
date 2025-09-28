import { g, logEvent, orderTeams } from "../../util/index.ts";
import type {
	TeamFiltered,
	PlayoffSeries,
	PlayoffSeriesTeam,
	PlayInTournament,
	ByConf,
} from "../../../common/types.ts";
import genPlayoffSeeds from "./genPlayoffSeeds.ts";
import { idb } from "../../db/index.ts";
import getPlayoffsByConf from "./getPlayoffsByConf.ts";
import validatePlayoffSettings from "./validatePlayoffSettings.ts";
import { groupBy, range } from "../../../common/utils.ts";
import { getNumPlayoffByes } from "./getNumPlayoffByes.ts";

type MyTeam = TeamFiltered<
	["tid"],
	[
		"cid",
		"did",
		"won",
		"lost",
		"tied",
		"otl",
		"winp",
		"pts",
		"wonDiv",
		"lostDiv",
		"tiedDiv",
		"otlDiv",
		"wonConf",
		"lostConf",
		"tiedConf",
		"otlConf",
	],
	["pts", "oppPts", "gp"],
	number
>;

type MinimalTeam = TeamFiltered<["tid"], ["cid", "winp"], any, number>;

const genTeam = (t: MinimalTeam, seed: number): PlayoffSeriesTeam => {
	return {
		tid: t.tid,
		cid: t.seasonAttrs.cid,
		seed,
		won: 0,
	};
};

// In a byConf playoff, this should be called once for each conference
export const makeMatchups = (
	teams: MinimalTeam[],
	numPlayoffTeams: number,
	numPlayoffByes: number,
) => {
	const seeds = genPlayoffSeeds(numPlayoffTeams, numPlayoffByes);

	const round = seeds.map((matchup) => {
		const home = genTeam(teams[matchup[0]]!, matchup[0] + 1);
		const away =
			matchup[1] !== undefined
				? genTeam(teams[matchup[1]]!, matchup[1] + 1)
				: undefined;

		return {
			home,
			away,
		};
	});

	let playIn: PlayInTournament | undefined;
	if (g.get("playIn")) {
		// Find the 2 last teams in the playoffs, and the 2 first teams out
		const playInTeams = teams.slice(numPlayoffTeams - 2, numPlayoffTeams + 2);

		if (playInTeams.length < 4) {
			throw new Error("Not enough teams found for play-in tournament");
		}

		playIn = [
			{
				home: genTeam(playInTeams[0]!, numPlayoffTeams - 1),
				away: genTeam(playInTeams[1]!, numPlayoffTeams),
			},
			{
				home: genTeam(playInTeams[2]!, numPlayoffTeams + 1),
				away: genTeam(playInTeams[3]!, numPlayoffTeams + 2),
			},
		];
	}

	return {
		round,
		playIn,
	};
};

export const getTidPlayIns = (playIns: PlayInTournament[]) => {
	const tids = [];
	for (const playIn of playIns) {
		for (const matchup of playIn) {
			tids.push(matchup.home.tid);
			if (matchup.away !== undefined) {
				tids.push(matchup.away.tid);
			}
		}
	}

	return tids;
};

const getTidPlayoffs = (series: PlayoffSeries["series"]) => {
	const tids = [];
	for (const matchup of series[0]!) {
		tids.push(matchup.home.tid);
		if (matchup.away !== undefined) {
			tids.push(matchup.away.tid);
		}
	}

	return tids;
};

const myValidatePlayoffSettings = ({
	numRounds,
	numPlayoffByes,
	byConf,
}: Pick<
	Parameters<typeof validatePlayoffSettings>[0],
	"numRounds" | "numPlayoffByes" | "byConf"
>) => {
	try {
		validatePlayoffSettings({
			numRounds,
			numPlayoffByes,
			numActiveTeams: g.get("numActiveTeams"),
			playIn: g.get("playIn"),
			byConf,
		});
	} catch (error) {
		logEvent({
			type: "error",
			text: error.message,
			saveToDb: false,
		});

		// We need to stop executing because otherwise it will somehow have some other error due to invalid settings
		throw error;
	}
};

export const genPlayoffSeriesFromTeams = async (
	teams: MyTeam[],
	orderTeamsOptions?: {
		skipTiebreakers?: boolean;
	},
) => {
	const numRounds = g.get("numGamesPlayoffSeries", "current").length;

	if (numRounds === 0) {
		return {
			byConf: false,
			series: [],
			tidPlayIn: [],
			tidPlayoffs: [],
		} satisfies {
			byConf: ByConf;
			series: PlayoffSeries["series"];
			tidPlayIn: number[];
			tidPlayoffs: number[];
		};
	}

	// Playoffs are split into two branches by conference only if there are exactly 2 conferences
	let playoffsByConf = await getPlayoffsByConf(g.get("season"));

	let series: PlayoffSeries["series"] = range(numRounds).map(() => []);

	let playIns: PlayoffSeries["playIns"] = [];

	// We need enough playoff teams to have at least one per conference
	if (playoffsByConf !== false) {
		const numPlayoffByes = getNumPlayoffByes({
			numPlayoffByes: g.get("numPlayoffByes", "current"),
			byConf: playoffsByConf,
		});

		// Mostly for TypeScript to know this never changes to false
		const byConf = playoffsByConf;

		myValidatePlayoffSettings({
			numRounds,
			numPlayoffByes,
			byConf,
		});

		const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

		const teamsByCid = groupBy(teams, (t) => t.seasonAttrs.cid);

		const numRoundsNeeded = Math.log2(byConf);

		if (numRounds === numRoundsNeeded) {
			// Special case - we have just enough teams, meaning every team in the playoffs is a 1 seed from their conference (like 2 conferences with 1 round, or 4 conferences and 2 rounds, or 8 and 3, etc.)
			let teamsMatchup = [];
			for (const conf of g.get("confs", "current")) {
				const teamsConf = teamsByCid[conf.cid];

				if (teamsConf && teamsConf.length >= 1) {
					// This sort determines conference champ. Sort inside makeMatchups call will determine home court advantage
					const sorted = await orderTeams(teamsConf, teams, orderTeamsOptions);
					teamsMatchup.push(sorted[0]!);

					if (teamsMatchup.length === 2) {
						const { round } = await makeMatchups(
							await orderTeams(teamsMatchup, teams, orderTeamsOptions),
							numPlayoffTeams / byConf,
							numPlayoffByes / byConf,
						);
						series[0]!.push(...round);
						teamsMatchup = [];
					}
				} else {
					// Not enough teams in conference for playoff bracket
					playoffsByConf = false;
					break;
				}
			}
		} else if (numRounds > numRoundsNeeded) {
			for (const conf of g.get("confs", "current")) {
				const teamsConf = teamsByCid[conf.cid];

				if (teamsConf && teamsConf.length >= numPlayoffTeams / byConf) {
					const { round, playIn } = await makeMatchups(
						await orderTeams(teamsConf, teams, orderTeamsOptions),
						numPlayoffTeams / byConf,
						numPlayoffByes / byConf,
					);
					series[0]!.push(...round);
					if (playIn) {
						playIns.push(playIn);
					}
				} else {
					// Not enough teams in conference for playoff bracket
					playoffsByConf = false;
					playIns = [];
					break;
				}
			}
		} else {
			playoffsByConf = false;
		}
	}

	// Not an "else" because if the (playoffsByConf) branch fails it sets it to false and runs this as backup
	if (playoffsByConf === false) {
		const numPlayoffByes = getNumPlayoffByes({
			numPlayoffByes: g.get("numPlayoffByes", "current"),
			byConf: playoffsByConf,
		});

		myValidatePlayoffSettings({
			numRounds,
			numPlayoffByes,
			byConf: playoffsByConf,
		});

		const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

		// Reset, in case it was partially set in prior branch
		series = range(numRounds).map(() => []);

		const { round, playIn } = await makeMatchups(
			await orderTeams(teams, teams, orderTeamsOptions),
			numPlayoffTeams,
			numPlayoffByes,
		);
		series[0]!.push(...round);
		if (playIn) {
			playIns.push(playIn);
		}
	}

	const tidPlayIn = getTidPlayIns(playIns);
	const tidPlayoffs = getTidPlayoffs(series).filter(
		(tid) => !tidPlayIn.includes(tid),
	);

	for (const matchup of series[0]!) {
		for (const type of ["home", "away"] as const) {
			const t = matchup[type];
			if (t && tidPlayIn.includes(t.tid)) {
				t.pendingPlayIn = true;
			}
		}
	}

	if (playIns.length > 0) {
		return {
			byConf: playoffsByConf,
			playIns,
			series,
			tidPlayIn,
			tidPlayoffs,
		};
	}

	return {
		byConf: playoffsByConf,
		series,
		tidPlayIn,
		tidPlayoffs,
	};
};

const genPlayoffSeries = async () => {
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: [
				"cid",
				"did",
				"won",
				"lost",
				"tied",
				"otl",
				"winp",
				"pts",
				"wonDiv",
				"lostDiv",
				"tiedDiv",
				"otlDiv",
				"wonConf",
				"lostConf",
				"tiedConf",
				"otlConf",
			],
			stats: ["pts", "oppPts", "gp"],
			season: g.get("season"),
			showNoStats: true,
		},
		"noCopyCache",
	);

	return genPlayoffSeriesFromTeams(teams);
};

export default genPlayoffSeries;
