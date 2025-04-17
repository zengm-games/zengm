import { bySport, PHASE, PLAYER } from "../../common/index.ts";
import type {
	Phase,
	Player,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import { orderBy } from "../../common/utils.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { loadAbbrevs } from "./gameLog.ts";

export const addMood = async (players: Player[]) => {
	const moods: Awaited<ReturnType<(typeof player)["moodInfos"]>>[] = [];
	for (const p of players) {
		moods.push(await player.moodInfos(p));
	}

	return players.map((p, i) => ({
		...p,
		mood: moods[i],
	}));
};

export const freeAgentStats = bySport({
	baseball: ["gp", "keyStats", "war"],
	basketball: ["min", "pts", "trb", "ast", "per"],
	football: ["gp", "keyStats", "av"],
	hockey: ["gp", "keyStats", "ops", "dps", "ps"],
});

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

	const processedSigned: (Player & {
		freeAgentType: "signed";
		freeAgentTransaction: FreeAgentTransaction;
	})[] = [];
	for (const p of signed) {
		const freeAgentTransaction = p.transactions?.findLast(
			(row) => row.type === "freeAgent" && isSeason(freeAgencySeason, row),
		);
		if (freeAgentTransaction) {
			processedSigned.push({
				...p,
				freeAgentType: "signed",

				// @ts-expect-error
				freeAgentTransaction,
			});
		}
	}

	return {
		freeAgents: [
			...(await addMood(
				available.map((p) => {
					return {
						...p,
						freeAgentType: "available",
					};
				}),
			)),
			...processedSigned,
		],
		user,
	};
};

const updateFreeAgents = async (
	{ season, type }: ViewInput<"freeAgents">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		season === "current" ||
		(updateEvents.includes("newPhase") &&
			g.get("phase") === PHASE.FREE_AGENCY) ||
		season !== state.season ||
		type !== state.type
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

		let players = addFirstNameShort(
			await idb.getCopies.playersPlus(playersByType.freeAgents, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"contract",
					"injury",
					"watch",
					"jerseyNumber",
					"mood",
					"draft",

					// Added in getPlayers
					"freeAgentType",
					"freeAgentTransaction",
				],
				ratings: ["ovr", "pot", "skills", "pos"],
				stats: freeAgentStats,
				season: season === "current" ? g.get("season") : freeAgencySeason,
				showNoStats: true,
				showRookies: true,
				fuzz: true,
				oldStats: true,
			}),
		);

		// Apply contract
		let abbrevs;
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

				if (!abbrevs) {
					// + 1 because it should consider abbrevs from the next game actually played, which will be the following calendar year after free agency starts
					abbrevs = await loadAbbrevs(freeAgencySeason + 1);
				}
				p.freeAgentTransaction.abbrev = abbrevs[p.freeAgentTransaction.tid];
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
			challengeNoRatings: g.get("challengeNoRatings"),
			freeAgencySeason,
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			salaryCapType: g.get("salaryCapType"),
			maxContract: g.get("maxContract"),
			minContract: g.get("minContract"),
			numRosterSpots: g.get("maxRosterSize") - userPlayers.length,
			spectator: g.get("spectator"),
			payroll: payroll / 1000,
			phase: g.get("phase"),
			players,
			season,
			startingSeason: g.get("startingSeason"),
			stats: freeAgentStats,
			type,
			userPlayers,
		};
	}
};

export default updateFreeAgents;
