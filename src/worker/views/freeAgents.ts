import { PHASE, PLAYER } from "../../common/constants.ts";
import type { Phase, Player } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { loadAbbrevs } from "./gameLog.ts";
import { bySport } from "../../common/sportFunctions.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { helpers } from "../util/index.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"freeAgents">) => {
	if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
		return {
			redirectUrl: helpers.leagueUrl(["negotiation"]),
		};
	}

	let season: number | "current";
	if (params.season && params.season !== "current") {
		season = validateSeason(params.season);
	} else {
		season = "current";
	}

	let type: "available" | "signed" | "both";
	if (season !== "current") {
		// If this is a previous season, force type to be "both" because "available" will be none and "both" looks better when switching to current season than "signed"
		type = "both";
	} else if (params.type === "signed") {
		type = "signed";
	} else if (params.type === "both") {
		type = "both";
	} else {
		type = "available";
	}

	return {
		season,
		type,
	};
};

// Call this after playersPlus, with the raw player objects that were passed to playersPlus. getContractAmount can override the contract amount used for each player's mood
export const addMood = async <T extends { pid: number }>(
	players: T[],
	playersRaw: Player[],
	getContractAmount?: (p: T) => number,
) => {
	const playersRawByPid = groupByUnique(playersRaw, "pid");

	const output: (T & {
		mood: Awaited<ReturnType<(typeof player)["moodInfos"]>>;
	})[] = [];
	for (const p of players) {
		const pRaw = playersRawByPid[p.pid];
		if (!pRaw) {
			throw new Error(`Raw player not found for pid ${p.pid}`);
		}

		output.push({
			...p,
			mood: await player.moodInfos(pRaw, {
				contractAmount: getContractAmount?.(p),
			}),
		});
	}

	return output;
};

export const freeAgentStats = bySport({
	baseball: ["gp", "keyStats", "war"],
	basketball: ["min", "pts", "trb", "ast", "per"],
	football: ["gp", "keyStats", "av"],
	hockey: ["gp", "keyStats", "ops", "dps", "ps"],
} as const);

const isSeason = (
	freeAgencySeason: number,
	toCheck: {
		season: number;
		phase: Phase;
	},
) => {
	return (
		(toCheck.season === freeAgencySeason && toCheck.phase >= PHASE.PLAYOFFS) ||
		(toCheck.season === freeAgencySeason + 1 && toCheck.phase < PHASE.PLAYOFFS)
	);
};

export type FreeAgentTransaction = Extract<
	NonNullable<Player["transactions"]>[number],
	{ type: "freeAgent" }
>;

const getPlayers = async (
	season: number | "current",
	freeAgencySeason: number,
	type: "both" | "available" | "signed",
) => {
	let available: Player[] = [];
	let signed: Player[] = [];
	let user: Player[] = [];

	if (season === "current") {
		user = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);

		if (type !== "signed") {
			available = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.FREE_AGENT,
			);
		}

		if (type !== "available") {
			signed = await idb.cache.players.getAll();
		}

		if (type === "both") {
			// Ensure players don't appear both available and signed, like they were signed and then released again
			const availablePids = new Set(available.map((p) => p.pid));
			signed = signed.filter((p) => !availablePids.has(p.pid));
		}
	} else {
		if (type !== "available") {
			signed = await idb.getCopies.players(
				{ activeSeason: season },
				"noCopyCache",
			);
		}
	}

	const signedWithTransactions: {
		p: Player;
		freeAgentTransaction: FreeAgentTransaction;
	}[] = [];
	for (const p of signed) {
		const freeAgentTransaction = p.transactions?.findLast(
			(row): row is FreeAgentTransaction =>
				row.type === "freeAgent" && isSeason(freeAgencySeason, row),
		);
		if (freeAgentTransaction) {
			signedWithTransactions.push({ p, freeAgentTransaction });
		}
	}

	return {
		available,
		signed: signedWithTransactions,
		user,
	};
};

export default defineView({
	id: "freeAgents",
	processInputs,
	load: async ({ inputs: { season, type }, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			season === "current" ||
			(updateEvents.has("newPhase") && g.get("phase") === PHASE.FREE_AGENCY) ||
			season !== prevInputs?.season ||
			type !== prevInputs?.type
		) {
			const userTid = g.get("userTid");

			let freeAgencySeason;
			if (season === "current") {
				if (g.get("phase") >= PHASE.PLAYOFFS) {
					freeAgencySeason = g.get("season");
				} else {
					freeAgencySeason = g.get("season") - 1;
				}
			} else {
				// Starting free agency in season, up until right before free agency in season + 1
				freeAgencySeason = season;
			}

			const payroll = await team.getPayroll(userTid);
			const playersByType = await getPlayers(season, freeAgencySeason, type);
			const capSpace = (g.get("salaryCap") - payroll) / 1000;

			const getPlayersFiltered = (players: Player[]) =>
				idb.getCopies.playersPlus(players, {
					attrs: [
						"pid",
						"name",
						"firstName",
						"lastName",
						"tid",
						"age",
						"contract",
						"injury",
						"watch",
						"jerseyNumber",
						"draft",
					],
					ratings: ["ovr", "pot", "skills", "pos"],
					stats: freeAgentStats,
					season: season === "current" ? g.get("season") : freeAgencySeason,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
					oldStats: true,
					mergeStats: "totOnly",
				});

			const availablePlayers = (
				await addMood(
					await getPlayersFiltered(playersByType.available),
					playersByType.available,
				)
			).map((p) => ({
				...p,
				freeAgentType: "available" as const,
			}));

			const signedByPid = groupByUnique(
				playersByType.signed,
				(row) => row.p.pid,
			);

			// + 1 because it should consider abbrevs from the next game actually played, which will be the following calendar year after free agency starts
			const abbrevs =
				playersByType.signed.length > 0
					? await loadAbbrevs(freeAgencySeason + 1)
					: {};

			const signedPlayers = (
				await getPlayersFiltered(playersByType.signed.map((row) => row.p))
			).map((p) => {
				const row = signedByPid[p.pid];
				if (!row) {
					throw new Error(`Signed player not found for pid ${p.pid}`);
				}
				const freeAgentTransaction: FreeAgentTransaction & { abbrev: string } =
					{
						...row.freeAgentTransaction,
						abbrev: abbrevs[row.freeAgentTransaction.tid] ?? "???",
					};
				return {
					...p,
					freeAgentType: "signed" as const,
					freeAgentTransaction,
				};
			});

			let players = addFirstNameShort([...availablePlayers, ...signedPlayers]);

			// Apply contract
			for (const p of players) {
				if (p.freeAgentType === "available") {
					p.contract.amount = p.mood.user.contractAmount / 1000;
				} else {
					let event;
					if (p.freeAgentTransaction.eid !== undefined) {
						event = await idb.getCopy.events(
							{ eid: p.freeAgentTransaction.eid },
							"noCopyCache",
						);
					}
					if (event && event.type === "freeAgent" && event.contract) {
						p.contract = {
							amount: event.contract.amount / 1000,
							exp: event.contract.exp,
						};
					} else {
						p.contract = {
							amount: 0,
							exp: p.freeAgentTransaction.season,
						};
					}
				}
			}

			// Default sort, used for the compare players link
			players = orderBy(players, (p) => p.contract.amount, "desc");

			const userPlayers = await idb.getCopies.playersPlus(playersByType.user, {
				attrs: [],
				ratings: ["pos"],
				stats: [],
				season: g.get("season"),
				showNoStats: true,
				showRookies: true,
			});

			return {
				capSpace,
				challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
				freeAgencySeason,
				numRosterSpots: g.get("maxRosterSize") - userPlayers.length,
				payroll: payroll / 1000,
				players,
				season,
				stats: freeAgentStats,
				type,
				userPlayers,
			};
		}
	},
});
