import { bySport, isSport, PHASE, POSITIONS } from "../../common";
import { season, team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	TeamSeasonAttr,
} from "../../common/types";
import { addMood } from "./freeAgents";

const footballScore = (p: {
	ratings: {
		pos: string;
		ovr: number;
	};
}) => {
	const ind = POSITIONS.indexOf(p.ratings.pos);
	return (POSITIONS.length - ind) * 1000 + p.ratings.ovr;
};

const updateRoster = async (
	inputs: ViewInput<"roster">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("watchList") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("team") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("newPhase"))) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		inputs.abbrev !== state.abbrev ||
		inputs.playoffs !== state.playoffs ||
		inputs.season !== state.season
	) {
		const stats = bySport({
			basketball: ["gp", "min", "pts", "trb", "ast", "per"],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "amin", "keyStats", "ops", "dps", "ps"],
		});

		const editable =
			inputs.season === g.get("season") &&
			inputs.tid === g.get("userTid") &&
			!g.get("spectator") &&
			isSport("basketball");

		const showRelease =
			inputs.season === g.get("season") &&
			inputs.tid === g.get("userTid") &&
			!g.get("spectator");

		const seasonAttrs: TeamSeasonAttr[] = [
			"profit",
			"won",
			"lost",
			"tied",
			"otl",
			"playoffRoundsWon",
			"imgURL",
			"region",
			"name",
			"avgAge",
		];
		const t = await idb.getCopy.teamsPlus(
			{
				season: inputs.season,
				tid: inputs.tid,
				attrs: [
					"tid",
					"strategy",
					"region",
					"name",
					"keepRosterSorted",
					"playThroughInjuries",
				],
				seasonAttrs,
				stats: ["pts", "oppPts", "gp"],
				addDummySeason: true,
			},
			"noCopyCache",
		);

		if (!t) {
			const returnValue = {
				errorMessage: "Invalid team ID.",
			};
			return returnValue;
		}

		const attrs = [
			"pid",
			"tid",
			"draft",
			"name",
			"age",
			"born",
			"contract",
			"cashOwed",
			"rosterOrder",
			"injury",
			"ptModifier",
			"watch",
			"untradable",
			"hof",
			"latestTransaction",
			"mood",
			"value",
		]; // tid and draft are used for checking if a player can be released without paying his salary

		const ratings = ["ovr", "pot", "dovr", "dpot", "skills", "pos", "ovrs"];
		const stats2 = [...stats, "yearsWithTeam", "jerseyNumber", "min", "gp"];

		let players: any[];
		let payroll: number | undefined;

		if (inputs.season === g.get("season")) {
			const schedule = await season.getSchedule();

			// Show players currently on the roster
			const playersAll = await addMood(
				await idb.cache.players.indexGetAll("playersByTid", inputs.tid),
			);
			payroll = (await team.getPayroll(inputs.tid)) / 1000;

			// numGamesRemaining doesn't need to be calculated except for userTid, but it is.
			let numGamesRemaining = 0;

			for (let i = 0; i < schedule.length; i++) {
				if (
					inputs.tid === schedule[i].homeTid ||
					inputs.tid === schedule[i].awayTid
				) {
					numGamesRemaining += 1;
				}
			}

			players = await idb.getCopies.playersPlus(playersAll, {
				attrs,
				ratings,
				playoffs: inputs.playoffs === "playoffs",
				regularSeason: inputs.playoffs !== "playoffs",
				stats: stats2,
				season: inputs.season,
				tid: inputs.tid,
				showNoStats: true,
				showRookies: true,
				fuzz: true,
				numGamesRemaining,
			});

			if (isSport("basketball")) {
				players.sort((a, b) => a.rosterOrder - b.rosterOrder);
			} else {
				players.sort((a, b) => footballScore(b) - footballScore(a));
			}

			for (const p of players) {
				// Can alway release player, even if below the minimum roster limit, cause why not .Except in the playoffs.
				if (
					inputs.tid === g.get("userTid") &&
					(g.get("phase") !== PHASE.PLAYOFFS ||
						(g.get("phase") === PHASE.PLAYOFFS &&
							players.length > g.get("minRosterSize"))) &&
					!g.get("gameOver") &&
					!g.get("otherTeamsWantToHire") &&
					g.get("phase") !== PHASE.FANTASY_DRAFT &&
					g.get("phase") !== PHASE.EXPANSION_DRAFT
				) {
					p.canRelease = true;
				} else {
					p.canRelease = false;
				}

				// Convert ptModifier to string so it doesn't cause unneeded knockout re-rendering
				p.ptModifier = String(p.ptModifier);
			}
		} else {
			// Show all players with stats for the given team and year
			const playersAll = await idb.getCopies.players(
				{
					statsTid: inputs.tid,
				},
				"noCopyCache",
			);
			players = await idb.getCopies.playersPlus(playersAll, {
				attrs,
				ratings,
				playoffs: inputs.playoffs === "playoffs",
				regularSeason: inputs.playoffs !== "playoffs",
				stats: stats2,
				season: inputs.season,
				tid: inputs.tid,
				fuzz: true,
			});

			if (isSport("basketball")) {
				players.sort(
					(a, b) => b.stats.gp * b.stats.min - a.stats.gp * a.stats.min,
				);
			} else {
				players.sort((a, b) => footballScore(b) - footballScore(a));
			}

			for (const p of players) {
				p.canRelease = false;
			}
		}

		const playoffsOvr =
			(g.get("phase") === PHASE.PLAYOFFS &&
				g.get("season") === inputs.season) ||
			inputs.playoffs === "playoffs";

		const playersCurrent = players.filter(
			(p: any) => p.injury.gamesRemaining === 0,
		);
		const t2 = {
			...t,
			ovr: team.ovr(players, {
				playoffs: playoffsOvr,
			}),
			ovrCurrent: team.ovr(playersCurrent, {
				playoffs: playoffsOvr,
			}),
		};
		t2.seasonAttrs.avgAge = t2.seasonAttrs.avgAge ?? team.avgAge(players);

		return {
			abbrev: inputs.abbrev,
			budget: g.get("budget"),
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			editable,
			godMode: g.get("godMode"),
			salaryCapType: g.get("salaryCapType"),
			maxRosterSize: g.get("maxRosterSize"),
			numConfs: g.get("confs", "current").length,
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			numPlayoffRounds: g.get("numGamesPlayoffSeries", inputs.season).length,
			payroll,
			phase: g.get("phase"),
			playoffs: inputs.playoffs,
			players,
			salaryCap: g.get("salaryCap") / 1000,
			season: inputs.season,
			showSpectatorWarning:
				inputs.season === g.get("season") &&
				inputs.tid === g.get("userTid") &&
				g.get("spectator"),
			showRelease,
			showTradeFor:
				inputs.season === g.get("season") &&
				inputs.tid !== g.get("userTid") &&
				!g.get("spectator"),
			showTradingBlock:
				inputs.season === g.get("season") &&
				inputs.tid === g.get("userTid") &&
				!g.get("spectator"),
			stats,
			t: t2,
			tid: inputs.tid,
			userTid: g.get("userTid"),
		};
	}
};

export default updateRoster;
