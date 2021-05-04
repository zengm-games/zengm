import { team } from "..";
import { idb } from "../../db";
import type { TradeTeams } from "../../../common/types";
import isUntradable from "./isUntradable";
import { helpers } from "../../util";

type AssetPlayer = {
	type: "player";
	dv: number;
	pid: number;
	tid: number;
};
type AssetPick = {
	type: "draftPick";
	dv: number;
	dpid: number;
	tid: number;
};
type Asset = AssetPlayer | AssetPick;

// Add either the highest value asset or the lowest value one that makes the trade good for the AI team.
const tryAddAsset = async (
	teams: TradeTeams,
	holdUserConstant: boolean,
	valueChangeKey: number,
): Promise<TradeTeams | void> => {
	const assets: Asset[] = [];

	if (!holdUserConstant) {
		// Get all players not in userPids
		const players = await idb.cache.players.indexGetAll(
			"playersByTid",
			teams[0].tid,
		);

		for (const p of players) {
			if (
				!teams[0].pids.includes(p.pid) &&
				!teams[0].pidsExcluded.includes(p.pid) &&
				!isUntradable(p).untradable
			) {
				assets.push({
					type: "player",
					dv: 0,
					pid: p.pid,
					tid: teams[0].tid,
				});
			}
		}
	}

	// Get all players not in otherPids
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		teams[1].tid,
	);

	for (const p of players) {
		if (
			!teams[1].pids.includes(p.pid) &&
			!teams[1].pidsExcluded.includes(p.pid) &&
			!isUntradable(p).untradable
		) {
			assets.push({
				type: "player",
				dv: 0,
				pid: p.pid,
				tid: teams[1].tid,
			});
		}
	}

	if (!holdUserConstant) {
		// Get all draft picks not in userDpids
		const draftPicks = await idb.cache.draftPicks.indexGetAll(
			"draftPicksByTid",
			teams[0].tid,
		);

		for (const dp of draftPicks) {
			if (
				!teams[0].dpids.includes(dp.dpid) &&
				!teams[0].dpidsExcluded.includes(dp.dpid)
			) {
				assets.push({
					type: "draftPick",
					dv: 0,
					dpid: dp.dpid,
					tid: teams[0].tid,
				});
			}
		}
	}

	// Get all draft picks not in otherDpids
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksByTid",
		teams[1].tid,
	);

	for (const dp of draftPicks) {
		if (
			!teams[1].dpids.includes(dp.dpid) &&
			!teams[1].dpidsExcluded.includes(dp.dpid)
		) {
			assets.push({
				type: "draftPick",
				dv: 0,
				dpid: dp.dpid,
				tid: teams[1].tid,
			});
		}
	}

	// If there are no more to try, stop
	if (assets.length === 0) {
		return;
	}

	// Calculate the value for each asset added to the trade, for use in forward selection
	for (const asset of assets) {
		const userPids = teams[0].pids.slice();
		const otherPids = teams[1].pids.slice();
		const userDpids = teams[0].dpids.slice();
		const otherDpids = teams[1].dpids.slice();

		if (asset.type === "player") {
			if (asset.tid === teams[0].tid) {
				userPids.push(asset.pid);
			} else {
				otherPids.push(asset.pid);
			}
		} else if (asset.tid === teams[0].tid) {
			userDpids.push(asset.dpid);
		} else {
			otherDpids.push(asset.dpid);
		}

		asset.dv = await team.valueChange(
			teams[1].tid,
			userPids,
			otherPids,
			userDpids,
			otherDpids,
			valueChangeKey,
			teams[0].tid,
		);
	}
	assets.sort((a, b) => b.dv - a.dv); // Find the asset that will push the trade value the smallest amount above 0

	let j;

	for (j = 0; j < assets.length; j++) {
		if (assets[j].dv < 0) {
			break;
		}
	}

	if (j > 0) {
		j -= 1;
	}

	const asset = assets[j];

	const newTeams = helpers.deepCopy(teams);
	if (asset.type === "player") {
		if (asset.tid === newTeams[0].tid) {
			newTeams[0].pids.push(asset.pid);
		} else {
			newTeams[1].pids.push(asset.pid);
		}
	} else if (asset.tid === newTeams[0].tid) {
		newTeams[0].dpids.push(asset.dpid);
	} else {
		newTeams[1].dpids.push(asset.dpid);
	}

	return newTeams;
};

/**
 * Make a trade work
 *
 * Have the AI add players/picks until they like the deal. Uses forward selection to try to find the first deal the AI likes.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @param {boolean} holdUserConstant If true, then players/picks will only be added from the other team. This is useful for the trading block feature.
 * @param {?Object} estValuesCached Estimated draft pick values from trade.getPickValues, or null. Only pass if you're going to call this repeatedly, then it'll be faster if you cache the values up front.
 * @return {Promise.<?Object>} If it works, resolves to a teams object (similar to first input) with the "made it work" trade info. Otherwise, resolves to undefined
 */
const makeItWork = async (
	teams: TradeTeams,
	holdUserConstant: boolean,
	maxAssetsToAdd = Infinity,
	valueChangeKey: number = Math.random(),
): Promise<TradeTeams | undefined> => {
	let initialSign: -1 | 1;
	let added = 0;

	let prevDv = await team.valueChange(
		teams[1].tid,
		teams[0].pids,
		teams[1].pids,
		teams[0].dpids,
		teams[1].dpids,
		valueChangeKey,
		teams[0].tid,
	);

	if (prevDv > 0) {
		// Try to make trade better for user's team
		initialSign = 1;
	} else {
		// Try to make trade better for AI team
		initialSign = -1;
	}

	let prevTeams: TradeTeams = teams;
	while (true) {
		// Add assets until this trade is just barely good enough for the AI
		const newTeams = await tryAddAsset(
			prevTeams,
			holdUserConstant,
			valueChangeKey,
		);

		if (!newTeams) {
			// No improvement to offer found

			const dv = await team.valueChange(
				prevTeams[1].tid,
				prevTeams[0].pids,
				prevTeams[1].pids,
				prevTeams[0].dpids,
				prevTeams[1].dpids,
				valueChangeKey,
				prevTeams[0].tid,
			);

			if (dv > 0) {
				return prevTeams;
			}

			return;
		}

		added += 1;

		const dv = await team.valueChange(
			newTeams[1].tid,
			newTeams[0].pids,
			newTeams[1].pids,
			newTeams[0].dpids,
			newTeams[1].dpids,
			valueChangeKey,
			newTeams[0].tid,
		);

		// If adding assets moves the trade in the wrong direction, stop
		const dvDiffSign = Math.sign(prevDv - dv);

		if (dvDiffSign !== initialSign) {
			if (prevDv > 0) {
				return prevTeams;
			}

			return;
		}

		if (initialSign === -1) {
			// Looking for a trade that the AI will accept
			if (dv > 0) {
				// Run another round of makeItWork in the opposite direction, which will make the end result of this stable (clicking the "What would make this deal work?" button won't do anything)

				const newMaxAssetsToAdd = maxAssetsToAdd - added;
				if (newMaxAssetsToAdd > 0) {
					return makeItWork(
						newTeams,
						holdUserConstant,
						newMaxAssetsToAdd,
						valueChangeKey,
					);
				}
				return newTeams;
			}
		} else {
			// Looking for the closest to dv=0 that the AI will accept
			if (dv < 0 && prevDv > 0) {
				return prevTeams;
			}
		}

		if (added >= maxAssetsToAdd) {
			if (dv > 0) {
				return newTeams;
			}

			return;
		}

		prevTeams = newTeams;
		prevDv = dv;
	}
};

export default makeItWork;
