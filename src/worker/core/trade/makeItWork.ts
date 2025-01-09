import { team } from "..";
import { idb } from "../../db";
import type { DraftPick, Player, TradeTeams } from "../../../common/types";
import isUntradable from "./isUntradable";
import { helpers } from "../../util";
import { isSport, POSITIONS } from "../../../common";

export type LookingFor = {
	positions: Set<string>;
	skills: Set<string>;
	draftPicks: boolean;
	prospects: boolean;
	bestCurrentPlayers: boolean;
};

type AssetPlayer = {
	type: "player";
	dv: number;
	tid: number;
	p: Player;
};
type AssetPick = {
	type: "draftPick";
	dv: number;
	tid: number;
	dp: DraftPick;
};
type Asset = AssetPlayer | AssetPick;

// Add either the highest value asset or the lowest value one that makes the trade good for the AI team.
const tryAddAsset = async (
	teams: TradeTeams,
	holdUserConstant: boolean,
	valueChangeKey: number,
	firstTry: boolean,
	lookingFor?: LookingFor,
): Promise<TradeTeams | void> => {
	let assets: Asset[] = [];

	if (!holdUserConstant) {
		// Get all players not in userPids
		const players = await idb.cache.players.indexGetAll(
			"playersByTid",
			teams[0].tid,
		);

		for (const p of players) {
			if (
				teams[0].pids.includes(p.pid) ||
				teams[0].pidsExcluded.includes(p.pid) ||
				isUntradable(p).untradable
			) {
				continue;
			}

			assets.push({
				type: "player",
				dv: 0,
				tid: teams[0].tid,
				p,
			});
		}
	}

	// Get all players not in otherPids
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		teams[1].tid,
	);

	// If lookingFor is set, make sure first asset added is from one of the requested positions only
	let lookingForSpecificPositions;
	if (firstTry && lookingFor && lookingFor.positions.size > 0) {
		if (isSport("basketball")) {
			// For basketball, convert G/F/C into real positions
			lookingForSpecificPositions = new Set(
				POSITIONS.filter(pos => {
					for (const pos2 of lookingFor.positions) {
						if (pos.includes(pos2)) {
							return true;
						}
					}
				}),
			);
		} else {
			// Other sports, pass right through
			lookingForSpecificPositions = lookingFor.positions;
		}
	}

	for (const p of players) {
		if (
			teams[1].pids.includes(p.pid) ||
			teams[1].pidsExcluded.includes(p.pid) ||
			isUntradable(p).untradable
		) {
			continue;
		}

		if (
			lookingForSpecificPositions &&
			!lookingForSpecificPositions.has(p.ratings.at(-1)!.pos)
		) {
			continue;
		}

		assets.push({
			type: "player",
			dv: 0,
			tid: teams[1].tid,
			p,
		});
	}

	if (!lookingForSpecificPositions) {
		if (!holdUserConstant) {
			// Get all draft picks not in userDpids
			const draftPicks = await idb.cache.draftPicks.indexGetAll(
				"draftPicksByTid",
				teams[0].tid,
			);

			for (const dp of draftPicks) {
				if (
					teams[0].dpids.includes(dp.dpid) ||
					teams[0].dpidsExcluded.includes(dp.dpid)
				) {
					continue;
				}

				assets.push({
					type: "draftPick",
					dv: 0,
					tid: teams[0].tid,
					dp,
				});
			}
		}

		// Get all draft picks not in otherDpids
		const draftPicks = await idb.cache.draftPicks.indexGetAll(
			"draftPicksByTid",
			teams[1].tid,
		);

		for (const dp of draftPicks) {
			if (
				teams[1].dpids.includes(dp.dpid) ||
				teams[1].dpidsExcluded.includes(dp.dpid)
			) {
				continue;
			}

			assets.push({
				type: "draftPick",
				dv: 0,
				tid: teams[1].tid,
				dp,
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
				userPids.push(asset.p.pid);
			} else {
				otherPids.push(asset.p.pid);
			}
		} else if (asset.tid === teams[0].tid) {
			userDpids.push(asset.dp.dpid);
		} else {
			otherDpids.push(asset.dp.dpid);
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

	// Here we are trying to find a single asset for the AI to give up while still having the trade be favorable to them. So we are discarding assets that are too good to give up. If there is no asset remaining (dv is negative for all assets) then just give up.
	assets = assets.filter(asset => asset.dv >= 0);
	if (assets.length === 0) {
		return;
	}

	// Sort the assets such that the best assets are listed first. Why best and not worst? Because we already got rid of assets that are so good they would make the trade negative value for the AI. So the AI wants to offer the best asset of its remaining assets, otherwise the trade will remain too unbalanced.

	// High dv means the trade is highly favorable to the AI, so this is sorting from the best asset (lowest dv) to the worst asset (high dv). AI wants to give up the most possible (best asset) while still minimizing dv (so the trade is favorable to them, but at least semi-close to favorable for the other team too).
	assets.sort((a, b) => a.dv - b.dv);

	let asset;

	if (!lookingForSpecificPositions && lookingFor?.draftPicks) {
		// If we're looking for draft picks (and we're done looking for 1 player for a specific position, if necessary), add draft picks first before players. If there are no draft picks that the AI team is willing to give up, then asset will be undefined and it will try to find a player below.
		asset = assets.find(asset => asset.type === "draftPick");
	}

	// Find the asset that will push the trade value the smallest amount above 0 (i.e. the best asset the AI is willing to give up without making the trade unfavorable to them), or fall back to just adding the worst asset if no single asset is good enough
	if (!asset) {
		// asset is now guaranteed to be defined, since there was a length check above
		asset = assets[0];
	}

	const newTeams = helpers.deepCopy(teams);
	if (asset.type === "player") {
		if (asset.tid === newTeams[0].tid) {
			newTeams[0].pids.push(asset.p.pid);
		} else {
			newTeams[1].pids.push(asset.p.pid);
		}
	} else {
		if (asset.tid === newTeams[0].tid) {
			newTeams[0].dpids.push(asset.dp.dpid);
		} else {
			newTeams[1].dpids.push(asset.dp.dpid);
		}
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
	{
		holdUserConstant,
		lookingFor,
		maxAssetsToAdd = Infinity,
		valueChangeKey = Math.random(),
	}: {
		holdUserConstant: boolean;
		lookingFor?: LookingFor;
		maxAssetsToAdd?: number;
		valueChangeKey?: number;
	},
): Promise<TradeTeams | undefined> => {
	console.log("lookingFor", lookingFor);
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
			added === 0,
			lookingFor,
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
					return makeItWork(newTeams, {
						holdUserConstant,
						maxAssetsToAdd: newMaxAssetsToAdd,
						valueChangeKey,
					});
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
