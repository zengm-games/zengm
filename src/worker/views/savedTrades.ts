import { idb } from "../db";
import { g, random } from "../util";
import type {
	PlayerContract,
	TradeTeams,
	UpdateEvents,
} from "../../common/types";
import isUntradable from "../core/trade/isUntradable";
import makeItWork from "../core/trade/makeItWork";
import summary from "../core/trade/summary";
import { augmentOffers } from "../api";
import { fixPlayers } from "./tradeProposals";
import { PLAYER } from "../../common";

const savedTradeHashToTradeTeams = (hash: string): TradeTeams => {
	const values = JSON.parse(hash);

	return [
		{
			tid: values[0],
			pids: values[1],
			dpids: values[2],
			pidsExcluded: [],
			dpidsExcluded: [],
		},
		{
			tid: values[3],
			pids: values[4],
			dpids: values[5],
			pidsExcluded: [],
			dpidsExcluded: [],
		},
	];
};

const getOffers = async () => {
	const userTid = g.get("userTid");

	const offers = (await idb.cache.savedTrades.getAll())
		.filter(savedTrade => savedTrade.tid === userTid)
		.map(savedTrade => savedTradeHashToTradeTeams(savedTrade.hash));
	console.log("offers", offers);

	return augmentOffers(offers);
};

// What players/picks are actually eligible to be traded from a team
const getEligibleAssets = async () => {
	const eligibleAssets: {
		pids: Record<number, number[]>;
		dpids: Record<number, number[]>;
	} = {
		pids: {},
		dpids: {},
	};

	const players = await idb.cache.players.getAll();
	for (const p of players) {
		if (p.tid >= 0) {
			if (!eligibleAssets.pids[p.tid]) {
				eligibleAssets.pids[p.tid] = [];
			}
			eligibleAssets.pids[p.tid].push(p.pid);
		}
	}

	const draftPicks = await idb.cache.draftPicks.getAll();
	for (const dp of draftPicks) {
		if (!eligibleAssets.dpids[dp.tid]) {
			eligibleAssets.dpids[dp.tid] = [];
		}
		eligibleAssets.dpids[dp.tid].push(dp.dpid);
	}

	return eligibleAssets;
};

const updateSavedTrades = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const offers = await getOffers();

		for (const offer of offers) {
			fixPlayers(offer, 1, offer.players);
			fixPlayers(offer, 0, offer.playersUser);
		}

		// Add some info about players/picks no longer available
		const offers2 = [];

		type MissingAsset =
			| {
					type: "retired";
					pid: number;
					name: string;
			  }
			| {
					type: "noLongerOnTeam";
					pid: number;
					name: string;
			  }
			| {
					type: "untradable";
					pid: number;
					name: string;
			  }
			| {
					type: "deletedPlayer";
					pid: number;
			  };

		for (const offer of offers) {
			const offer2 = {
				...offer,
				missing: [] as MissingAsset[],
				missingUser: [] as MissingAsset[],
			};
			offers2.push(offer2);

			const pidInfos: {
				type: "missingUser" | "missing";
				pids: number[];
				players: any[];
				tid: number;
			}[] = [
				{
					type: "missingUser",
					pids: offer.pidsUser,
					players: offer.playersUser,
					tid: g.get("userTid"),
				},
				{
					type: "missing",
					pids: offer.pids,
					players: offer.players,
					tid: offer.tid,
				},
			];
			for (const { type, pids, players, tid } of pidInfos) {
				if (pids.length === players.length) {
					continue;
				}

				const missingPids = pids.filter(
					pid => !players.find(p => p.pid === pid),
				);

				for (const pid of missingPids) {
					const pRaw = await idb.getCopy.players({ pid }, "noCopyCache");
					if (pRaw) {
						const p = await idb.getCopy.playersPlus(pRaw, {
							attrs: ["pid", "name"],
							showRookies: true,
							showNoStats: true,
						});

						const untradableInfo = isUntradable(pRaw);
						if (p.tid === PLAYER.RETIRED) {
							offer2[type].push({
								type: "retired",
								...p,
							});
						} else if (p.tid !== tid) {
							offer2[type].push({
								type: "noLongerOnTeam",
								...p,
							});
						} else if (untradableInfo.untradable) {
							offer2[type].push({
								type: "untradable",
								message: untradableInfo.untradableMsg,
								...p,
							});
						}
					} else {
						offer2[type].push({
							type: "deletedPlayer",
							pid,
						});
					}
				}
			}
		}
		console.log("offers2", offers2);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoTrades: g.get("challengeNoTrades"),
			gameOver: g.get("gameOver"),
			luxuryPayroll: g.get("luxuryPayroll"),
			offers: offers2,
			phase: g.get("phase"),
			salaryCap: g.get("salaryCap"),
			salaryCapType: g.get("salaryCapType"),
			spectator: g.get("spectator"),
		};
	}
};

export default updateSavedTrades;
