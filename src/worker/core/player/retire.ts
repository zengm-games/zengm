import { PLAYER } from "../../../common";
import { g, helpers, logEvent } from "../../util";
import madeHof from "./madeHof";
import type { Conditions, Player } from "../../../common/types";
import { idb } from "../../db";
import { player } from "..";

/**
 * Have a player retire, including all event and HOF bookkeeping.
 *
 * This just updates a player object. You need to write it to the database after.
 *
 * @memberOf core.player
 * @param {IDBTransaction} ot An IndexedDB transaction on events.
 * @param {Object} p Player object.
 * @return {Object} p Updated (retired) player object.
 */
const retire = async (
	p: Player,
	conditions?: Conditions,
	{
		logRetiredEvent = true,
		forceHofNotification = false,
	}: {
		logRetiredEvent?: boolean;
		forceHofNotification?: boolean;
	} = {},
) => {
	if (conditions && logRetiredEvent) {
		logEvent(
			{
				type: "retired",
				text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
					p.firstName
				} ${p.lastName}</a> retired.`,
				showNotification: false,
				pids: [p.pid],
				tids: [p.tid],
				score: p.tid >= 0 ? 10 : 0,
			},
			conditions,
		);
	}

	// Add to Hall of Fame?
	if (conditions && madeHof(p)) {
		p.hof = true;
		p.awards.push({
			season: g.get("season"),
			type: "Inducted into the Hall of Fame",
		});

		logEvent(
			{
				type: "hallOfFame",
				text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
					p.firstName
				} ${p.lastName}</a> was inducted into the <a href="${helpers.leagueUrl([
					"hall_of_fame",
				])}">Hall of Fame</a>.`,
				showNotification:
					p.statsTids.includes(g.get("userTid")) || forceHofNotification,
				pids: [p.pid],
				tids: p.statsTids,
				score: 20,
			},
			conditions,
		);
	}

	if (p.tid !== PLAYER.FREE_AGENT) {
		// Remove any old contracts from releasedPlayers
		const releasedPlayers = await idb.cache.releasedPlayers.getAll();
		for (const rp of releasedPlayers) {
			if (rp.pid === p.pid) {
				await idb.cache.releasedPlayers.delete(rp.rid);
			}
		}
	}

	p.tid = PLAYER.RETIRED;
	p.retiredYear = g.get("season");
	p.injury = {
		type: "Healthy",
		gamesRemaining: 0,
	};

	await player.checkJerseyNumberRetirement(p);
};

export default retire;
