import { idb } from "../db";
import { g } from "../util";
import type { TradeTeams, UpdateEvents } from "../../common/types";
import isUntradable from "../core/trade/isUntradable";
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

	const savedTrades = (await idb.cache.savedTrades.getAll()).filter(
		savedTrade => savedTrade.tid === userTid,
	);

	const offers = savedTrades.map(savedTrade =>
		savedTradeHashToTradeTeams(savedTrade.hash),
	);
	console.log("offers", offers);

	return (await augmentOffers(offers)).map((offer, i) => {
		return {
			...offer,
			hash: savedTrades[i].hash,
		};
	});
};

export type MissingAsset =
	| {
			type: "retired";
			pid: number;
			name: string;
			pos: string;
	  }
	| {
			type: "noLongerOnTeam";
			pid: number;
			name: string;
			pos: string;
	  }
	| {
			type: "untradable";
			pid: number;
			name: string;
			pos: string;
			message: string;
	  }
	| {
			type: "deletedPlayer";
			pid: number;
	  };

const updateSavedTrades = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("savedTrades") ||
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
						const p = {
							pid: pRaw.pid,
							name: `${pRaw.firstName} ${pRaw.lastName}`,
							pos: pRaw.ratings.at(-1).pos,
						};

						const untradableInfo = isUntradable(pRaw);
						if (pRaw.tid === PLAYER.RETIRED) {
							offer2[type].push({
								type: "retired",
								...p,
							});
						} else if (pRaw.tid !== tid) {
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
