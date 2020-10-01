import { PLAYER } from "../../../common";
import { draft, player, season, team } from "..";
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
} from "../../util";
import type {
	Conditions,
	PhaseReturn,
	MinimalPlayerRatings,
	Player,
} from "../../../common/types";

const newPhaseBeforeDraft = async (
	conditions: Conditions,
	liveGameInProgress: boolean = false,
): Promise<PhaseReturn> => {
	achievement.check("afterPlayoffs", conditions);
	await season.doAwards(conditions);
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: ["playoffRoundsWon"],
		season: g.get("season"),
		active: true,
	});

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
				const ovr = p.ratings[p.ratings.length - 1].ovr;
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

	if (!g.get("repeatSeason")) {
		// Do annual tasks for each player, like checking for retirement
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);

		const retiredPlayersByTeam: Record<
			number,
			Player<MinimalPlayerRatings>[]
		> = {};

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
			if (p.injury.type !== "Healthy") {
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

	// Don't redirect if we're viewing a live game now
	let url;
	if (!liveGameInProgress) {
		url = helpers.leagueUrl(["history"]);
	} else {
		local.unviewedSeasonSummary = true;
	}

	toUI("bbgmPing", ["season", g.get("season")], conditions);
	return {
		url,
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseBeforeDraft;
