import { idb } from "../db";
import { g, random } from "../util";
import type { TradeTeams, UpdateEvents, ViewInput } from "../../common/types";
import isUntradable from "../core/trade/isUntradable";
import makeItWork from "../core/trade/makeItWork";
import summary from "../core/trade/summary";
import { getSummary } from "./trade";

const getOffers = async (seed: number) => {
	const NUM_OFFERS = 5;
	const NUM_TRIES_PER_TEAM = 10;

	const userTid = g.get("userTid");

	const teams = (await idb.cache.teams.getAll()).filter(
		t => !t.disabled && t.tid !== userTid,
	);
	random.shuffle(teams, seed);

	const offers: Awaited<ReturnType<typeof getSummary>>[] = [];

	const players = (
		await idb.cache.players.indexGetAll("playersByTid", userTid)
	).filter(p => !isUntradable(p).untradable);
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksByTid",
		userTid,
	);

	if (players.length === 0 && draftPicks.length === 0) {
		return offers;
	}

	const valueChangeKey = Math.random();

	for (const t of teams) {
		for (let i = 0; i < NUM_TRIES_PER_TEAM; i++) {
			const r = random.uniformSeed(seed + NUM_TRIES_PER_TEAM * t.tid + i);
			const pids: number[] = [];
			const dpids: number[] = [];

			if ((r < 0.7 || draftPicks.length === 0) && players.length > 0) {
				// Weight by player value - good player more likely to be in trade
				pids.push(
					random.choice(
						players,
						p => p.value,
						seed + NUM_TRIES_PER_TEAM * t.tid + i + 1,
					).pid,
				);
			} else if ((r < 0.85 || players.length === 0) && draftPicks.length > 0) {
				dpids.push(
					random.choice(
						draftPicks,
						undefined,
						seed + NUM_TRIES_PER_TEAM * t.tid + i + 2,
					).dpid,
				);
			} else {
				pids.push(
					random.choice(
						players,
						p => p.value,
						seed + NUM_TRIES_PER_TEAM * t.tid + i + 3,
					).pid,
				);
				dpids.push(
					random.choice(
						draftPicks,
						undefined,
						seed + NUM_TRIES_PER_TEAM * t.tid + i + 4,
					).dpid,
				);
			}
			console.log(pids);

			const teams0: TradeTeams = [
				{
					dpids,
					dpidsExcluded: [],
					pids,
					pidsExcluded: [],
					tid: userTid,
				},
				{
					dpids: [],
					dpidsExcluded: [],
					pids: [],
					pidsExcluded: [],
					tid: t.tid,
				},
			];

			const teams = await makeItWork(teams0, false, 5, valueChangeKey);

			if (!teams) {
				continue;
			}

			// Don't do trades of just picks, it's weird usually
			if (teams[0].pids.length === 0 && teams[1].pids.length === 0) {
				continue;
			}

			// Don't do trades for nothing, it's weird usually
			if (teams[1].pids.length === 0 && teams[1].dpids.length === 0) {
				continue;
			}

			const tradeSummary = await summary(teams);

			// Try to find a no warning one
			if (tradeSummary.warning && i < NUM_TRIES_PER_TEAM - 1) {
				continue;
			}

			offers.push(await getSummary(teams));
			break;
		}

		if (offers.length >= NUM_OFFERS) {
			break;
		}
	}

	return offers;
};

const updateTradeOffers = async (
	inputs: ViewInput<"tradingBlock">,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		const gp = teamSeason?.gp ?? 0;

		const NUM_GAMES_BEFORE_NEW_OFFERS = 10;

		const seed =
			Math.floor(gp / NUM_GAMES_BEFORE_NEW_OFFERS) +
			g.get("season") +
			g.get("phase");

		const offers = await getOffers(seed);
		console.log("offers", offers);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoTrades: g.get("challengeNoTrades"),
			gameOver: g.get("gameOver"),
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			offers,
			phase: g.get("phase"),
			salaryCap: g.get("salaryCap") / 1000,
			salaryCapType: g.get("salaryCapType"),
			spectator: g.get("spectator"),
		};
	}
};

export default updateTradeOffers;
