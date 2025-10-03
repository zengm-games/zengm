import { bySport, isSport, PHASE, POSITIONS } from "../../common/index.ts";
import { finances, season, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	Player,
	UpdateEvents,
	ViewInput,
	TeamSeasonAttr,
} from "../../common/types.ts";
import { addMood } from "./freeAgents.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getActualPlayThroughInjuries } from "../core/game/loadTeams.ts";

export const sortByPos = (p: {
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
		updateEvents.includes("firstRun") ||
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
			baseball: ["gp", "keyStats", "war"],
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
			"note",
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
			"firstName",
			"lastName",
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
			"awards",
		]; // tid and draft are used for checking if a player can be released without paying his salary

		const ratings = ["ovr", "pot", "dovr", "dpot", "skills", "pos", "ovrs"];
		const stats2 = [...stats, "yearsWithTeam", "jerseyNumber", "min", "gp"];

		let players: any[];
		let payroll: number | undefined;
		let luxuryTaxAmount: number | undefined;
		let minPayrollAmount: number | undefined;

		if (inputs.season === g.get("season")) {
			const schedule = await season.getSchedule();

			// Show players currently on the roster
			const playersAll = await addMood(
				await idb.cache.players.indexGetAll("playersByTid", inputs.tid),
			);
			payroll = await team.getPayroll(inputs.tid);
			luxuryTaxAmount = finances.getLuxuryTaxAmount(payroll) / 1000;
			minPayrollAmount = finances.getMinPayrollAmount(payroll) / 1000;
			payroll /= 1000;

			// numGamesRemaining doesn't need to be calculated except for userTid, but it is.
			let numGamesRemaining = 0;

			for (const matchup of schedule) {
				if (inputs.tid === matchup.homeTid || inputs.tid === matchup.awayTid) {
					numGamesRemaining += 1;
				}
			}

			players = await idb.getCopies.playersPlus(playersAll, {
				attrs,
				ratings,
				playoffs: inputs.playoffs === "playoffs",
				regularSeason: inputs.playoffs === "regularSeason",
				combined: inputs.playoffs === "combined",
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
				players.sort((a, b) => sortByPos(b) - sortByPos(a));
			}

			for (const p of players) {
				// Can alway release player, even if below the minimum roster limit, cause why not. Except in the playoffs.
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
					activeSeason: inputs.season,
					statsTid: inputs.tid,
				},
				"noCopyCache",
			);
			players = await idb.getCopies.playersPlus(playersAll, {
				attrs,
				ratings,
				playoffs: inputs.playoffs === "playoffs",
				regularSeason: inputs.playoffs === "regularSeason",
				combined: inputs.playoffs === "combined",
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
				players.sort((a, b) => sortByPos(b) - sortByPos(a));
			}

			for (const p of players) {
				p.canRelease = false;
			}

			const teamSeason = await idb.getCopy.teamSeasons({
				season: inputs.season,
				tid: inputs.tid,
			});

			// >0 check handles old leagues that might have it undefined, and real players leagues that have a dummy negative value
			if (teamSeason && teamSeason.payrollEndOfSeason > 0) {
				payroll = teamSeason.payrollEndOfSeason / 1000;
				luxuryTaxAmount = teamSeason.expenses.luxuryTax / 1000;
				minPayrollAmount = teamSeason.expenses.minTax / 1000;
			}
		}

		const playoffsOvr =
			(g.get("phase") === PHASE.PLAYOFFS &&
				g.get("season") === inputs.season) ||
			inputs.playoffs === "playoffs";

		const t2 = {
			...t,
			ovr: team.ovr(players, {
				playoffs: playoffsOvr,
			}),
			ovrCurrent: team.ovr(players, {
				accountForInjuredPlayers: {
					numDaysInFuture: 0,
					playThroughInjuries: getActualPlayThroughInjuries(t),
				},
				playoffs: playoffsOvr,
			}),
			roundsWonText: helpers.roundsWonText({
				playoffRoundsWon: t.seasonAttrs.playoffRoundsWon,
				numPlayoffRounds: g.get("numGamesPlayoffSeries", inputs.season).length,
				playoffsByConf: await season.getPlayoffsByConf(inputs.season),
				season: inputs.season,
			}),
		};
		t2.seasonAttrs.avgAge = t2.seasonAttrs.avgAge ?? team.avgAge(players);

		for (const p of players) {
			p.awards = p.awards.filter(
				(award: Player["awards"][number]) => award.season === inputs.season,
			);
		}

		return {
			abbrev: inputs.abbrev,
			budget: g.get("budget"),
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			editable,
			godMode: g.get("godMode"),
			salaryCapType: g.get("salaryCapType"),
			maxRosterSize: g.get("maxRosterSize"),
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			luxuryTaxAmount,
			minPayroll: g.get("minPayroll") / 1000,
			minPayrollAmount,
			payroll,
			phase: g.get("phase"),
			playoffs: inputs.playoffs,
			players: addFirstNameShort(players),
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
