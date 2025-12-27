import {
	DRAFT_BY_TEAM_OVR,
	PHASE,
	PLAYER,
	bySport,
} from "../../../common/index.ts";
import afterPicks from "./afterPicks.ts";
import getOrder from "./getOrder.ts";
import selectPlayer from "./selectPlayer.ts";
import { idb } from "../../db/index.ts";
import { g, local, lock, random } from "../../util/index.ts";
import type {
	Conditions,
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { player, team } from "../index.ts";

/**
 * Calculate positional needs for a team.
 * Returns a map of position -> need score (higher = more need)
 */
const getPositionalNeeds = (
	teamPlayers: PlayerWithoutKey<MinimalPlayerRatings>[],
): Map<string, number> => {
	const needs = new Map<string, number>();

	// Define ideal roster composition by sport
	const idealComposition = bySport<Record<string, number>>({
		basketball: {
			PG: 2,
			SG: 2,
			SF: 2,
			PF: 2,
			C: 2,
			G: 2,
			F: 2,
			FC: 1,
			GF: 1,
		},
		football: {
			QB: 3,
			RB: 4,
			WR: 6,
			TE: 3,
			OL: 9,
			DL: 6,
			LB: 6,
			CB: 5,
			S: 4,
			K: 1,
			P: 1,
		},
		baseball: {
			SP: 5,
			RP: 7,
			C: 2,
			"1B": 1,
			"2B": 2,
			"3B": 1,
			SS: 2,
			LF: 2,
			CF: 2,
			RF: 2,
			DH: 1,
		},
		hockey: {
			C: 4,
			W: 8,
			D: 6,
			G: 2,
		},
	});

	// Count current players by position
	const currentCount = new Map<string, number>();
	for (const p of teamPlayers) {
		const pos = p.ratings.at(-1)?.pos || "";
		currentCount.set(pos, (currentCount.get(pos) || 0) + 1);
	}

	// Calculate need scores
	for (const [pos, ideal] of Object.entries(idealComposition)) {
		const current = currentCount.get(pos) || 0;
		const deficit = ideal - current;

		if (deficit > 0) {
			// Higher score for bigger deficits
			needs.set(pos, 1 + deficit * 0.3);
		} else if (deficit === 0) {
			// At ideal count - slight positive
			needs.set(pos, 1);
		} else {
			// Over-stocked - reduced priority
			needs.set(pos, Math.max(0.5, 1 + deficit * 0.15));
		}
	}

	// Also check quality at each position - if existing players are weak, increase need
	for (const p of teamPlayers) {
		const pos = p.ratings.at(-1)?.pos || "";
		const ovr = p.ratings.at(-1)?.ovr || 0;

		if (ovr < 45 && needs.has(pos)) {
			// Weak player at position - increase need slightly
			needs.set(pos, (needs.get(pos) || 1) + 0.1);
		}
	}

	return needs;
};

/**
 * Get positional need multiplier for a prospect.
 * Returns a value typically between 0.7 and 1.5
 */
const getPositionalNeedMultiplier = (
	prospectPos: string,
	positionalNeeds: Map<string, number>,
): number => {
	return positionalNeeds.get(prospectPos) || 1.0;
};

/**
 * Draft philosophy types that affect how AI teams evaluate prospects.
 */
type DraftPhilosophy = "bpa" | "need" | "upside" | "safe" | "balanced";

/**
 * Get a team's draft philosophy based on their situation.
 * Teams in different situations have different draft tendencies.
 */
const getTeamDraftPhilosophy = async (tid: number): Promise<DraftPhilosophy> => {
	// Get team info to determine philosophy
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[tid, g.get("season") - 1],
			[tid, g.get("season")],
		],
	);

	const currentSeason = teamSeasons.find((ts) => ts.season === g.get("season"));
	const prevSeason = teamSeasons.find((ts) => ts.season === g.get("season") - 1);

	// Contending teams (made deep playoff run) prioritize need-based drafting
	if (prevSeason && prevSeason.playoffRoundsWon >= 2) {
		// Slight randomization but lean toward need
		const roll = random.random();
		if (roll < 0.5) return "need";
		if (roll < 0.75) return "safe";
		return "balanced";
	}

	// Rebuilding teams (bad record) go for upside
	if (currentSeason) {
		const winPct =
			currentSeason.won / Math.max(1, currentSeason.won + currentSeason.lost);
		if (winPct < 0.35) {
			const roll = random.random();
			if (roll < 0.4) return "upside";
			if (roll < 0.7) return "bpa";
			return "balanced";
		}
	}

	// Middle-of-the-pack teams are more random in approach
	const roll = random.random();
	if (roll < 0.25) return "bpa";
	if (roll < 0.45) return "need";
	if (roll < 0.6) return "upside";
	if (roll < 0.75) return "safe";
	return "balanced";
};

/**
 * Apply draft philosophy modifier to prospect scoring.
 */
const applyPhilosophyModifier = (
	baseScore: number,
	prospect: Player<MinimalPlayerRatings>,
	philosophy: DraftPhilosophy,
): number => {
	const ratings = prospect.ratings.at(-1)!;
	const ovr = ratings.ovr;
	const pot = ratings.pot;

	switch (philosophy) {
		case "bpa":
			// Pure best player available - slight bonus to high OVR players
			return baseScore * (1 + (ovr / 100) * 0.1);

		case "need":
			// Need-based is already handled by positionalNeeds
			// This philosophy doubles down on it
			return baseScore;

		case "upside":
			// Prioritize potential over current ability
			const upsideGap = pot - ovr;
			return baseScore * (1 + (upsideGap / 100) * 0.3);

		case "safe":
			// Prefer players with small gap between OVR and POT (safer picks)
			const safeGap = pot - ovr;
			const safePenalty = safeGap > 15 ? 0.85 : 1.0;
			return baseScore * safePenalty * (1 + (ovr / 100) * 0.15);

		case "balanced":
		default:
			// Mix of OVR and POT
			return baseScore * (1 + ((ovr + pot) / 200) * 0.05);
	}
};

export const getTeamOvrDiffs = (
	teamPlayers: PlayerWithoutKey<MinimalPlayerRatings>[],
	players: PlayerWithoutKey<MinimalPlayerRatings>[],
) => {
	if (!DRAFT_BY_TEAM_OVR) {
		return [];
	}

	const teamPlayers2 = teamPlayers.map((p) => ({
		pid: p.pid,
		injury: p.injury,
		value: p.value,
		ratings: {
			ovr: player.fuzzRating(p.ratings.at(-1)!.ovr, p.ratings.at(-1)!.fuzz),
			ovrs: player.fuzzOvrs(p.ratings.at(-1)!.ovrs, p.ratings.at(-1)!.fuzz),
			pos: p.ratings.at(-1)!.pos,
		},
	}));

	const baseline = team.ovr(teamPlayers2, {
		wholeRoster: true,
	});

	return players.map((p) => {
		const ratings = p.ratings.at(-1)!;
		const newOvr = team.ovr(
			[
				...teamPlayers2,
				{
					pid: p.pid,
					injury: p.injury,
					value: p.value,
					ratings: {
						ovr: player.fuzzRating(ratings.ovr, ratings.fuzz),
						ovrs: player.fuzzOvrs(ratings.ovrs, ratings.fuzz),
						pos: ratings.pos,
					},
				},
			],
			{
				wholeRoster: true,
			},
		);

		return newOvr - baseline;
	});
};

/**
 * Simulate draft picks until it's the user's turn or the draft is over.
 *
 * This could be made faster by passing a transaction around, so all the writes for all the picks are done in one transaction. But when calling selectPlayer elsewhere (i.e. in testing or in response to the user's pick), it needs to be sure that the transaction is complete before continuing. So I would need to create a special case there to account for it. Given that this isn't really *that* slow now, that probably isn't worth the complexity. Although... team.rosterAutoSort does precisely this... so maybe it would be a good idea...
 *
 * @memberOf core.draft
 * @param {boolean} onlyOne If true, only do one pick. If false, do all picks until the user's next pick. Default false.
 * @return {Promise.[Array.<Object>, Array.<number>]} Resolves to an array of player IDs who were drafted during this function call, in order.
 */
const runPicks = async (
	action:
		| {
				type: "onePick" | "untilYourNextPick" | "untilEnd";
		  }
		| {
				type: "untilPick";
				dpid: number;
		  },
	conditions?: Conditions,
) => {
	if (lock.get("drafting")) {
		return [];
	}

	await lock.set("drafting", true);
	const pids: number[] = [];
	let draftPicks = await getOrder();

	const expansionDraft = g.get("expansionDraft");

	let playersAll: Player<MinimalPlayerRatings>[];
	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		playersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			PLAYER.UNDRAFTED,
		);
	} else if (expansionDraft.phase === "draft") {
		playersAll = (
			await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
		).filter((p) => expansionDraft.availablePids.includes(p.pid));
	} else {
		playersAll = (
			await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
				[g.get("season")],
				[g.get("season"), Infinity],
			])
		).filter((p) => p.tid === PLAYER.UNDRAFTED);
	}
	playersAll.sort((a, b) => b.value - a.value);

	// Called after either the draft is over or it's the user's pick
	const afterDoneAuto = async () => {
		await lock.set("drafting", false);

		// Is draft over?
		await afterPicks(draftPicks.length === 0, conditions);
		return pids;
	};

	// This will actually draft "untilUserOrEnd"
	const autoSelectPlayer = async (): Promise<number[]> => {
		if (draftPicks[0]) {
			const expansionDraft2 = g.get("expansionDraft"); // Get again, might have changed
			if (
				expansionDraft2.phase === "draft" &&
				expansionDraft2.numPerTeam !== undefined
			) {
				// Keep logic in sync with draft.ts
				const tidsOverLimit: number[] = [];
				for (const [tidString, numPerTeam] of Object.entries(
					expansionDraft2.numPerTeamDrafted,
				)) {
					if (numPerTeam >= expansionDraft2.numPerTeam) {
						const tid = Number.parseInt(tidString);
						tidsOverLimit.push(tid);
					}
				}
				if (tidsOverLimit.length > 0) {
					playersAll = playersAll.filter((p) => !tidsOverLimit.includes(p.tid));
				}
			}

			// If there are no players, delete the rest of the picks and draft is done
			if (playersAll.length === 0) {
				for (const dp of draftPicks) {
					await idb.cache.draftPicks.delete(dp.dpid);
				}
				draftPicks = await getOrder();
				return afterDoneAuto();
			}

			const dp = draftPicks[0];

			const singleUserPickInSpectatorMode =
				g.get("spectator") && action.type === "onePick";
			const pauseForUserPick =
				g.get("userTids").includes(dp.tid) &&
				!local.autoPlayUntil &&
				!singleUserPickInSpectatorMode &&
				action.type !== "untilEnd" &&
				action.type !== "untilPick";

			const pauseForDpid =
				action.type === "untilPick" && dp.dpid === action.dpid;

			if (pauseForUserPick || pauseForDpid) {
				return afterDoneAuto();
			}

			draftPicks.shift();

			const teamPlayers = await idb.cache.players.indexGetAll(
				"playersByTid",
				dp.tid,
			);
			const teamOvrDiffs = await getTeamOvrDiffs(teamPlayers, playersAll);

			// Calculate positional needs for this team
			const positionalNeeds = getPositionalNeeds(teamPlayers);

			// Get team's draft philosophy
			const philosophy = await getTeamDraftPhilosophy(dp.tid);

			const score = (p: Player<MinimalPlayerRatings>, i: number) => {
				const prospectPos = p.ratings.at(-1)?.pos || "";
				let needMultiplier = getPositionalNeedMultiplier(
					prospectPos,
					positionalNeeds,
				);

				// Need-focused teams double down on positional needs
				if (philosophy === "need") {
					needMultiplier = 0.5 + needMultiplier * 0.7;
				}

				let baseScore: number;
				if (DRAFT_BY_TEAM_OVR) {
					// For football/baseball/hockey: combine team improvement with positional need
					baseScore = teamOvrDiffs[i]! + 0.05 * p.value;
					// Apply need multiplier - bigger impact for positions team really needs
					baseScore = baseScore * needMultiplier;
				} else {
					// For basketball: blend BPA with positional need
					// Need multiplier has less impact in basketball (more fluid positions)
					const adjustedNeedMultiplier = 0.8 + needMultiplier * 0.2;
					baseScore = p.value * adjustedNeedMultiplier;
				}

				// Apply philosophy modifier
				const modifiedScore = applyPhilosophyModifier(baseScore, p, philosophy);

				return modifiedScore ** (DRAFT_BY_TEAM_OVR ? 40 : 69);
			};
			/*let sum = 0;
			for (const p of playersAll) {
				sum += score(p);
			}
			for (let i = 0; i < playersAll.length; i++) {
				const p = playersAll[i];
				console.log(p.firstName, p.lastName, teamOvrDiffs[i], 0.05 * p.value, score(p) / sum);
			}
			console.log(sum);*/

			const selection = random.choice(playersAll, score);

			const pid = selection.pid;
			await selectPlayer(dp, pid);
			pids.push(pid);
			playersAll = playersAll.filter((p) => p !== selection); // Delete from the list of undrafted players

			if (action.type !== "onePick") {
				return autoSelectPlayer();
			}
		}

		return afterDoneAuto();
	};

	return autoSelectPlayer();
};

export default runPicks;
