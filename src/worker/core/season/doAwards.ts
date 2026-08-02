import type {
	Awards2,
	Conditions,
	Player,
	PlayerFiltered,
} from "../../../common/types.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { g, helpers } from "../../util/index.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "./getLeaderRequirements.ts";
import { idb } from "../../db/index.ts";
import { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball.ts";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import FormulaEvaluator from "../../util/FormulaEvaluator.ts";
import { orderBy } from "../../../common/utils.ts";

const awardStats = bySport({
	baseball: [
		"keyStats",
		"gpPit",
		"gsPit",
		"w",
		"l",
		"sv",
		"era",
		"ip",
		"war",
		"rpit",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",

		// For all-offense/defense teams
		"rbat",
		"rbr",
		"rfld",

		// For position determination
		"gpF",

		// For season leaders (and requirements)
		"hr",
		"rbi",
		"r",
		"sb",
		"bb",
		"soPit",
		"ba",
		"ops",
	],
	basketball: [
		"gp",
		"gs",
		"min",
		"pts",
		"trb",
		"ast",
		"blk",
		"stl",
		"per",
		"ewa",
		"ws",
		"dws",
		"vorp",
		"ws48",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
	],
	football: [
		"keyStats",
		"pntYds",
		"fg",
		"krTD",
		"krYds",
		"prTD",
		"prYds",
		"pssYds",
		"pssTD",
		"pssInt",
		"rusYds",
		"rusTD",
		"recYds",
		"recTD",
		"fmbLost",
		"prTD",
		"krTD",
		"ydsFromScrimmage",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
		"defIntTD",
		"defFmbTD",
		"defSft",
		"defSk",
		"defInt",
		"defPssDef",
		"defFmbFrc",
		"defFmbRec",
		"defTckSolo",
		"defTckAst",
		"defTckLoss",
		"totTD",
		"pbw",
		"pba",
		"pbwr",
		"rbw",
		"rba",
		"rbwr",
	],
	hockey: [
		"keyStats",
		"gpGoalie",
		"g",
		"a",
		"pts",
		"hit",
		"tk",
		"gaa",
		"svPct",
		"ops",
		"dps",
		"gps",
		"ps",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
	],
});

const getProcessedPlayers = async (
	playersAll: Player[],
	season: number,
	playoffs?: boolean,
) => {
	const stats = Array.from(
		new Set([
			...awardStats,
			...getLeaderRequirementsStats(getLeaderRequirements(), awardStats),
		]),
	);

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"lastName",
			"tid",
			"abbrev",
			"draft",
			"injury",
			"born",
			"watch",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats,
		playoffs,
		regularSeason: !playoffs,
		fuzz: true,
		mergeStats: "totOnly",
	});

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter((p) =>
		p.stats.some((ps: any) => ps.season === season),
	);

	// This can happen if there are 0 games in the regular season - in that case, might as well look for playoff stats too
	if (players.length === 0 && !playoffs) {
		return getProcessedPlayers(playersAll, season, true);
	}

	return players;
};

const getPlayers = async (season: number): Promise<PlayerFiltered[]> => {
	let playersAll;
	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	const players = await getProcessedPlayers(playersAll, season);

	// Add winp, for later
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);
	const teamInfos: Record<
		number,
		{
			gp: number;
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		teamInfos[teamSeason.tid] = {
			gp: helpers.getTeamSeasonGp(teamSeason),
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// For convenience later
	for (const p of players) {
		p.currentStats = p.stats.at(-1);
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		p.pos = p.ratings.at(-1).pos;
		if (isSport("baseball")) {
			// Overwrite position with actual position played
			const gpF = (p.currentStats.gpF as (number | undefined)[]).map((gp) =>
				gp === undefined ? 0 : gp,
			);
			let maxGP = 0; // Start at 0 rather than -Infinity because we're not interested in positions with 0 games played
			let maxIndex;
			for (const [i, gp] of gpF.entries()) {
				if (gp > maxGP) {
					maxGP = gp;
					maxIndex = i;
				}
			}

			if (maxIndex !== undefined) {
				p.pos = (POS_NUMBERS_INVERSE as any)[maxIndex + 1];
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		// Player somehow on an inactive team needs this fallback, should only happen in a weird custom roster
		p.teamInfo = teamInfos[p.currentStats.tid] ?? {
			gp: 0,
			winp: 0,
		};
	}

	// Add fracWS for basketball current season
	if (isSport("basketball")) {
		const totalWS: Record<number, number> = {};
		for (const p of players) {
			if (totalWS[p.currentStats.tid] === undefined) {
				totalWS[p.currentStats.tid] = 0;
			}
			totalWS[p.currentStats.tid] += p.currentStats.ws;
		}

		for (const p of players) {
			p.currentStats.fracWS = Math.min(
				// Inner max is to handle negative totalWS
				p.currentStats.ws / Math.max(totalWS[p.currentStats.tid]!, 1),

				// In the rare case that a team has very low or even negative WS, don't let anybody have a crazy high fracWS
				0.8,
			);
		}
	}

	return players;
};

const NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD = 5;

const doAwards = async (conditions: Conditions) => {
	const players = await getPlayers(g.get("season"));

	const awards = g.get("awards");

	const formulaEvaluators = awards.map((award) => {
		const formulaEvaluator = new FormulaEvaluator(
			award.formula,
			Object.keys(players[0].currentStats),
		);
		return formulaEvaluator;
	});

	for (const p of players) {
		p.scores = formulaEvaluators.map((formulaEvaluator) => {
			return formulaEvaluator.evaluate(p.currentStats);
		});
	}

	const realizedAwards: Awards2["awards"] = [];
	for (const [i, award] of awards.entries()) {
		if (award.numTeams === undefined) {
			// Individual award
			const winner = orderBy(players, (p) => p.scores[i], "desc")
				.slice(0, NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD)
				.map((p) => {
					console.log(award.shortName, p.firstName, p.lastName);
					return {
						pid: p.pid as number,
					};
				});
			realizedAwards.push({
				...award,
				numTeams: undefined,
				group: undefined,
				winner,
			});
		} else {
			// Team award
		}
	}

	console.log(realizedAwards);
};

export default doAwards;
