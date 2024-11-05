import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport } from "../../common";
import addFirstNameShort from "../util/addFirstNameShort";
import { augmentOffers } from "../api";
import { team } from "../core";

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
					new Set(userRoster.map(p => p.pid)),
				);
				const userValidDpids = new Set(savedTradingBlockRaw.dpids).isSubsetOf(
					new Set(userPicks2.map(dp => dp.dpid)),
				);
				if (userValidPids && userValidDpids) {
					const offers = await augmentOffers(
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
					);

					savedTradingBlock = {
						dpids: savedTradingBlockRaw.dpids,
						pids: savedTradingBlockRaw.pids,
						offers: await Promise.all(
							offers.map(async offer => {
								let invalidReason: "asset" | "willing" | undefined;

								// Is offer invalid becuase asset no longer exists on AI team?
								const teamPlayers = await idb.cache.players.indexGetAll(
									"playersByTid",
									offer.tid,
								);
								const validPids = new Set(offer.pids).isSubsetOf(
									new Set(teamPlayers.map(p => p.pid)),
								);
								if (!validPids) {
									invalidReason = "asset";
								} else {
									const teamDraftPicks = await idb.getCopies.draftPicks(
										{
											tid: offer.tid,
										},
										"noCopyCache",
									);
									const validDpids = new Set(offer.dpids).isSubsetOf(
										new Set(teamDraftPicks.map(dp => dp.dpid)),
									);
									if (!validDpids) {
										invalidReason = "asset";
									} else {
										// Is offer invalid because AI team no longer wants to make the trade?
										if (invalidReason === undefined) {
											const dv = await team.valueChange(
												offer.tid,
												offer.pidsUser,
												offer.pids,
												offer.dpidsUser,
												offer.dpids,
												undefined,
												g.get("userTid"),
											);

											if (dv < 0) {
												invalidReason = "willing";
											}
										}
									}
								}
								console.log(offer.tid, invalidReason);

								return {
									invalidReason,
									...offer,
								};
							}),
						),
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
