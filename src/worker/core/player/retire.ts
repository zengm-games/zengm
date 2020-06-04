import { PLAYER } from "../../../common";
import { g, helpers, logEvent } from "../../util";
import madeHof from "./madeHof";
import type { Conditions, Player } from "../../../common/types";

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
const retire = (
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
			},
			conditions,
		);
	}

	p.tid = PLAYER.RETIRED;
	p.retiredYear = g.get("season");

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
			},
			conditions,
		);
	}
};

export default retire;
