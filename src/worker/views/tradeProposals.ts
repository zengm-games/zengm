import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { TradeTeams } from "../../common/types.ts";
import isUntradable from "../core/trade/isUntradable.ts";
import makeItWork from "../core/trade/makeItWork.ts";
import summary from "../core/trade/summary.ts";
import { augmentOffers } from "../api/index.ts";
import { shuffle, uniformSeed, choice } from "../../common/random.ts";
import { ValueChangeCalculator } from "../core/team/ValueChangeCalculator.ts";
import { orderBy } from "../../common/utils.ts";
import { defineView } from "../util/defineView.ts";

const getOffers = async (seed: number) => {
	const NUM_OFFERS = 5;
	const NUM_TRIES_PER_TEAM = 10;

	const userTid = g.get("userTid");

	const teams = (await idb.cache.teams.getAll()).filter(
		(t) => !t.disabled && t.tid !== userTid,
	);
	shuffle(teams, seed);

	const players = orderBy(
		(await idb.cache.players.indexGetAll("playersByTid", userTid)).filter(
			(p) => !isUntradable(p).untradable,
		),
		"pid",
	);
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksByTid",
		userTid,
	);

	if (players.length === 0 && draftPicks.length === 0) {
		return [];
	}

	const offers: TradeTeams[] = [];

	const valueChangeCalculator = new ValueChangeCalculator();

	for (const t of teams) {
		for (let i = 0; i < NUM_TRIES_PER_TEAM; i++) {
			const seedBase = seed + NUM_TRIES_PER_TEAM * t.tid + i;
			const r = uniformSeed(seedBase);
			const pids: number[] = [];
			const dpids: number[] = [];

			if ((r < 0.7 || draftPicks.length === 0) && players.length > 0) {
				// Weight by player value - good player more likely to be in trade
				pids.push(choice(players, (p) => p.value, seedBase + 1).pid);
			} else if ((r < 0.85 || players.length === 0) && draftPicks.length > 0) {
				dpids.push(choice(draftPicks, undefined, seedBase + 2).dpid);
			} else {
				pids.push(choice(players, (p) => p.value, seedBase + 3).pid);
				dpids.push(choice(draftPicks, undefined, seedBase + 4).dpid);
			}

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

			const teams = await makeItWork(teams0, {
				holdUserConstant: false,
				maxAssetsToAdd: 5,
				valueChangeCalculator,
			});

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

			offers.push(teams);
			break;
		}

		if (offers.length >= NUM_OFFERS) {
			break;
		}
	}

	return augmentOffers(offers);
};

type AugmentedOffer = Awaited<ReturnType<typeof augmentOffers>>[number];

// offer.summary.teams[number].trade only has basic player info, but offer.players and offer.playersUser also have age, ratings, and stats, so add those to the summary for display
export const addInlinePlayerInfo = <T extends AugmentedOffer>(offer: T) => {
	const addToTeam = (
		t: T["summary"]["teams"][number],
		playersWithInfo: T["players"],
	) => {
		return {
			...t,
			trade: t.trade.map((p) => {
				const p2 = playersWithInfo.find((p2) => p2.pid === p.pid);
				if (!p2) {
					// Should never happen, since summary and augmentOffers get players the same way
					throw new Error(`Player ${p.pid} not found for trade summary`);
				}

				return {
					...p,
					age: p2.age,
					ratings: p2.ratings,
					stats: p2.stats,
				};
			}),
		};
	};

	return {
		...offer,
		summary: {
			...offer.summary,
			teams: [
				addToTeam(offer.summary.teams[0], offer.playersUser),
				addToTeam(offer.summary.teams[1], offer.players),
			] as const,
		},
	};
};

export default defineView({
	id: "tradeProposals",
	load: async ({ updateEvents }) => {
		if (
			updateEvents.includes("firstRun") ||
			updateEvents.includes("playerMovement") ||
			updateEvents.includes("gameSim") ||
			updateEvents.includes("newPhase") ||
			updateEvents.includes("g.tradeProposalsSeed")
		) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			const gp = teamSeason ? helpers.getTeamSeasonGp(teamSeason) : 0;

			const NUM_GAMES_BEFORE_NEW_OFFERS = 10;

			const seed =
				Math.floor(gp / NUM_GAMES_BEFORE_NEW_OFFERS) +
				g.get("season") +
				g.get("phase") +
				g.get("tradeProposalsSeed");

			const offers = (await getOffers(seed)).map((offer) =>
				addInlinePlayerInfo(offer),
			);

			return {
				offers,
				seed,
			};
		}
	},
});
