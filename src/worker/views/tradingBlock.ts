import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport } from "../../common";
import addFirstNameShort from "../util/addFirstNameShort";
import { augmentOffers } from "../api";
import { team } from "../core";
import { addMissingAssets } from "./savedTrades";

const updateUserRoster = async (
	inputs: ViewInput<"tradingBlock">,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
			basketball: ["gp", "min", "pts", "trb", "ast", "per"],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});
		const userRosterAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		const userRoster = addFirstNameShort(
			await idb.getCopies.playersPlus(userRosterAll, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"contract",
					"injury",
					"watch",
					"untradable",
					"jerseyNumber",
					"draft",
				],
				ratings: ["ovr", "pot", "skills", "pos"],
				stats,
				season: g.get("season"),
				tid: g.get("userTid"),
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);

		const userPicks = await idb.getCopies.draftPicks(
			{
				tid: g.get("userTid"),
			},
			"noCopyCache",
		);

		const userPicks2 = await Promise.all(
			userPicks.map(async dp => {
				return {
					...dp,
					desc: await helpers.pickDesc(dp),
				};
			}),
		);

		let savedTradingBlock;
		if (inputs.pid === undefined && inputs.dpid === undefined) {
			const savedTradingBlockRaw = await idb.cache.savedTradingBlock.get(0);
			if (savedTradingBlockRaw?.tid === g.get("userTid")) {
				// If a pid/dpid is no longer valid on the user's team, ignore
				const userValidPids = new Set(savedTradingBlockRaw.pids).isSubsetOf(
					new Set(userRoster.filter(p => !p.untradable).map(p => p.pid)),
				);
				const userValidDpids = new Set(savedTradingBlockRaw.dpids).isSubsetOf(
					new Set(userPicks2.map(dp => dp.dpid)),
				);
				if (userValidPids && userValidDpids) {
					const offers = await Promise.all(
						(
							await addMissingAssets(
								await augmentOffers(
									savedTradingBlockRaw.offers.map(offer => {
										return [
											{
												dpids: savedTradingBlockRaw.dpids,
												dpidsExcluded: [],
												pids: savedTradingBlockRaw.pids,
												pidsExcluded: [],
												tid: g.get("userTid"),
											},
											{
												dpids: offer.dpids,
												dpidsExcluded: [],
												pids: offer.pids,
												pidsExcluded: [],
												tid: offer.tid,
											},
										];
									}),
								),
							)
						).map(async offer => {
							const dv = await team.valueChange(
								offer.tid,
								offer.pidsUser,
								offer.pids,
								offer.dpidsUser,
								offer.dpids,
								undefined,
								g.get("userTid"),
							);
							const willing = dv > 0;

							return {
								...offer,
								willing,
							};
						}),
					);

					savedTradingBlock = {
						dpids: savedTradingBlockRaw.dpids,
						pids: savedTradingBlockRaw.pids,
						offers,
					};
				} else {
					await idb.cache.savedTradingBlock.clear();
				}
			}
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoTrades: g.get("challengeNoTrades"),
			gameOver: g.get("gameOver"),
			initialPid: inputs.pid,
			initialDpid: inputs.dpid,
			phase: g.get("phase"),
			salaryCap: g.get("salaryCap"),
			salaryCapType: g.get("salaryCapType"),
			savedTradingBlock,
			spectator: g.get("spectator"),
			stats,
			userPicks: userPicks2,
			userRoster,
		};
	}
};

export default updateUserRoster;
