import { PLAYER } from "../../../common";
import { draft, player, season, team, league } from "..";
import { idb } from "../../db";
import {
	achievement,
	defaultGameAttributes,
	g,
	genMessage,
	helpers,
	local,
	toUI,
	logEvent,
	random,
	orderTeams,
} from "../../util";
import type {
	Conditions,
	PhaseReturn,
	MinimalPlayerRatings,
	Player,
	LogEventType,
	GameAttributesLeague,
} from "../../../common/types";
import setGameAttributes from "../league/setGameAttributes";

const INFLATION_GAME_ATTRIBUTES = [
	"salaryCap",
	"minContract",
	"maxContract",
	"minPayroll",
	"luxuryPayroll",
] as const;

const upcomingScheduledEventBlocksInflation = async () => {
	const scheduledEvents = await idb.getCopies.scheduledEvents(
		undefined,
		"noCopyCache",
	);
	return scheduledEvents.some(event => {
		if (event.type === "gameAttributes") {
			for (const key of INFLATION_GAME_ATTRIBUTES) {
				if (event.info.hasOwnProperty(key)) {
					return true;
				}
			}
		}
	});
};

const doInflation = async (conditions: Conditions) => {
	if (await upcomingScheduledEventBlocksInflation()) {
		return;
	}

	const inflationMin = g.get("inflationMin");
	const inflationMax = g.get("inflationMax");
	const inflationAvg = g.get("inflationAvg");
	const inflationStd = g.get("inflationStd");

	let inflation;

	if (inflationMin === inflationMax) {
		inflation = inflationMin;
	} else if (inflationStd === 0) {
		inflation = helpers.bound(inflationAvg, inflationMin, inflationMax);
	} else {
		try {
			inflation = random.truncGauss(
				inflationAvg,
				inflationStd,
				inflationMin,
				inflationMax,
			);
		} catch (error) {
			inflation = random.randInt(inflationMin, inflationMax);
		}
	}

	// Round to 0.1%
	inflation = Math.round(inflation * 10) / 10;

	if (inflation === 0) {
		return;
	}

	const updatedGameAttributes: Partial<GameAttributesLeague> = {};

	for (const key of INFLATION_GAME_ATTRIBUTES) {
		const oldValue = g.get(key);
		const newValue = helpers.roundContract(oldValue * (1 + inflation / 100));
		if (oldValue !== newValue) {
			updatedGameAttributes[key] = helpers.roundContract(
				g.get(key) * (1 + inflation / 100),
			);
		}
	}

	if (Object.keys(updatedGameAttributes).length > 0) {
		await league.setGameAttributes(updatedGameAttributes);

		logEvent(
			{
				type: "gameAttribute",
				text: `An inflation rate of ${inflation}% ${
					inflation > 0 ? "increased" : "decreased"
				} the salary cap to ${helpers.formatCurrency(
					g.get("salaryCap") / 1000,
					"M",
				)}.`,
				tids: [],
				persistent: true,
				hideInLiveGame: true,
				extraClass: "",
				score: 20,
			},
			conditions,
		);
	}
};

const setChampNoPlayoffs = async (conditions: Conditions) => {
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

	const ordered = await orderTeams(teams, teams);

	const { tid } = ordered[0];

	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[tid, g.get("season")],
	);
	if (!teamSeason) {
		return;
	}

	teamSeason.playoffRoundsWon = 0;
	teamSeason.hype += 0.2;

	logEvent(
		{
			type: "playoffs",
			text: `The <a href="${helpers.leagueUrl([
				"roster",
				`${g.get("teamInfoCache")[tid]?.abbrev}_${tid}`,
				g.get("season"),
			])}">${
				g.get("teamInfoCache")[tid]?.name
			}</a> finished in 1st place and are league champions!`,
			showNotification: true,
			tids: [tid],
			score: 20,
			saveToDb: true,
		},
		conditions,
	);

	await idb.cache.teamSeasons.put(teamSeason);
};

const newPhaseBeforeDraft = async (
	conditions: Conditions,
	liveGameInProgress: boolean = false,
): Promise<PhaseReturn> => {
	if (g.get("numGamesPlayoffSeries").length === 0) {
		// Set champ of the league!
		await setChampNoPlayoffs(conditions);
	}

	achievement.check("afterPlayoffs", conditions);
	await season.doAwards(conditions);
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: ["playoffRoundsWon"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);

	// Give award to all players on the championship team
	const t = teams.find(
		t2 =>
			t2.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length,
	);

	if (t !== undefined) {
		const players = await idb.cache.players.indexGetAll("playersByTid", t.tid);

		for (const p of players) {
			p.awards.push({
				season: g.get("season"),
				type: "Won Championship",
			});
			await idb.cache.players.put(p);
		}
	}

	if (g.get("challengeLoseBestPlayer")) {
		const tids = g.get("userTids");
		for (const tid of tids) {
			const players = await idb.cache.players.indexGetAll("playersByTid", tid);

			let bestOvr = 0;
			let bestPlayer: Player | undefined;
			for (const p of players) {
				const ovr = p.ratings.at(-1).ovr;
				if (ovr > bestOvr) {
					bestOvr = ovr;
					bestPlayer = p;
				}
			}

			if (bestPlayer) {
				// Kill/retire player, depending on if he's a real player or not
				if (bestPlayer.real) {
					await player.retire(bestPlayer, conditions);
					await idb.cache.players.put(bestPlayer);

					// Similar to the tragic death notification
					logEvent(
						{
							type: "tragedy",
							text: `<a href="${helpers.leagueUrl([
								"player",
								bestPlayer.pid,
							])}">${bestPlayer.firstName} ${
								bestPlayer.lastName
							}</a> decided to retire in the prime of his career.`,
							showNotification: true,
							pids: [bestPlayer.pid],
							tids: [tid],
							persistent: true,
							score: 20,
						},
						conditions,
					);
				} else {
					await player.killOne(conditions, bestPlayer);
				}
			}
		}
	}

	const thanosCooldownEnd = g.get("thanosCooldownEnd");
	if (
		g.get("challengeThanosMode") &&
		(thanosCooldownEnd === undefined || g.get("season") >= thanosCooldownEnd) &&
		Math.random() < 0.2
	) {
		const activePlayers = await idb.cache.players.indexGetAll("playersByTid", [
			0,
			Infinity,
		]);
		random.shuffle(activePlayers);
		const snappedPlayers = activePlayers.slice(0, activePlayers.length / 2);

		const userSnappedPlayers = [];

		for (const p of snappedPlayers) {
			// Real players are retired, random players are  killed
			if (p.tid === g.get("userTid")) {
				userSnappedPlayers.push(p);
			}

			let action;
			let type: LogEventType;
			if (p.real) {
				action = "retired due to";
				type = "retired";
			} else {
				p.diedYear = g.get("season");
				action = "was killed in";
				type = "tragedy";
			}
			logEvent(
				{
					type,
					text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
						p.firstName
					} ${p.lastName}</a> ${action} a Thanos snap.`,
					showNotification: false,
					pids: [p.pid],
					tids: [p.tid],
					score: 20,
				},
				conditions,
			);

			await player.retire(p, conditions, {
				logRetiredEvent: false,
			});
			await idb.cache.players.put(p);
		}

		let text = "A Thanos event has occured! ";
		const numPlayers = userSnappedPlayers.length;
		if (numPlayers === 0) {
			text += "Somehow your team did not lose any players.";
		} else {
			text += `Your team lost ${numPlayers} player${
				numPlayers === 1 ? "" : "s"
			}: `;
			for (let i = 0; i < numPlayers; i++) {
				const p = userSnappedPlayers[i];
				if (i > 0 && numPlayers === 2) {
					text += " and ";
				} else if (i > 0 && i === numPlayers - 1) {
					text += ", and ";
				} else if (i > 0) {
					text += ", ";
				}

				text += `<a href="${helpers.leagueUrl(["player", p.pid])}">${
					p.firstName
				} ${p.lastName}</a>`;
			}
			text += ".";
		}
		logEvent(
			{
				type: "tragedy",
				text,
				showNotification: true,
				pids: [],
				tids: [g.get("userTid")],
				persistent: true,
			},
			conditions,
		);

		// Make sure another event won't happen within the next 2 seasons to prevent running out of players
		await league.setGameAttributes({
			thanosCooldownEnd: g.get("season") + 3,
		});
	}

	if (!g.get("repeatSeason")) {
		// Do annual tasks for each player, like checking for retirement
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);

		const retiredPlayersByTeam: Record<number, Player<MinimalPlayerRatings>[]> =
			{};

		for (const p of players) {
			let update = false;

			if (player.shouldRetire(p)) {
				if (p.tid >= 0) {
					if (!retiredPlayersByTeam[p.tid]) {
						retiredPlayersByTeam[p.tid] = [];
					}
					retiredPlayersByTeam[p.tid].push(p);
				}
				await player.retire(p, conditions);
				update = true;
			}

			// Update "free agent years" counter and retire players who have been free agents for more than one years
			if (p.tid === PLAYER.FREE_AGENT) {
				if (p.yearsFreeAgent >= 1) {
					await player.retire(p, conditions);
					update = true;
				} else {
					p.yearsFreeAgent += 1;
				}

				update = true;
			} else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
				p.yearsFreeAgent = 0;
				update = true;
			}

			// Heal injures
			if (p.injury.gamesRemaining > 0 || p.injury.type !== "Healthy") {
				// This doesn't use g.get("numGames") because that would unfairly make injuries last longer if it was lower - if anything injury duration should be modulated based on that, but oh well
				if (p.injury.gamesRemaining <= defaultGameAttributes.numGames) {
					p.injury = {
						type: "Healthy",
						gamesRemaining: 0,
					};
				} else {
					p.injury.gamesRemaining -= defaultGameAttributes.numGames;
				}

				update = true;
			}

			if (update) {
				await idb.cache.players.put(p);
			}
		}

		for (const [tidString, retiredPlayers] of Object.entries(
			retiredPlayersByTeam,
		)) {
			const tid = parseInt(tidString);
			const text = retiredPlayers
				.map(
					p =>
						`<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${
							p.lastName
						}</a> retired.`,
				)
				.join("<br>");
			logEvent(
				{
					type: "retiredList",
					text,
					showNotification: tid === g.get("userTid"),
					pids: retiredPlayers.map(p => p.pid),
					tids: [tid],
					saveToDb: false,
				},
				conditions,
			);
		}

		const releasedPlayers = await idb.cache.releasedPlayers.getAll();

		for (const rp of releasedPlayers) {
			if (rp.contract.exp <= g.get("season") && typeof rp.rid === "number") {
				await idb.cache.releasedPlayers.delete(rp.rid);
			}
		}

		await team.updateStrategies();
		achievement.check("afterAwards", conditions);
		const response = await season.updateOwnerMood();
		if (response) {
			await genMessage(response.deltas, response.cappedDeltas);
		}

		if (
			g.get("draftType") === "noLottery" ||
			g.get("draftType") === "noLotteryReverse" ||
			g.get("draftType") === "random"
		) {
			await draft.genOrder(false, conditions);
		}
	}

	if (g.get("gameOver")) {
		achievement.check("afterFired", conditions);
	}

	await doInflation(conditions);

	// Don't redirect if we're viewing a live game now
	let url;
	if (!liveGameInProgress) {
		url = helpers.leagueUrl(["history"]);
	} else {
		local.unviewedSeasonSummary = true;
	}

	await setGameAttributes({
		riggedLottery: undefined,
	});

	toUI("bbgmPing", ["season", g.get("season")], conditions);
	return {
		url,
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseBeforeDraft;
