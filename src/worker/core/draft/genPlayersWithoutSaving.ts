import { bySport, isSport, PLAYER } from "../../../common";
import { player } from "..";
import { defaultGameAttributes, g, random } from "../../util";
import type {
	MinimalPlayerRatings,
	PlayerWithoutKey,
} from "../../../common/types";

const genPlayersWithoutSaving = async (
	draftYear: number,
	scoutingRank: number,
	existingPlayers: PlayerWithoutKey<MinimalPlayerRatings>[],
	forceScrubs?: boolean,
): Promise<PlayerWithoutKey<MinimalPlayerRatings>[]> => {
	// If user has increased the number of rounds - code below ensures excess players are scrubs.
	// If user has descreased the number of rounds - keep number of prospects the same, more will go undrafted.
	const normalNumPlayers = Math.round(
		(defaultGameAttributes.numDraftRounds * g.get("numActiveTeams") * 7) / 6,
	);
	const baseNumPlayers = Math.max(
		Math.round((g.get("numDraftRounds") * g.get("numActiveTeams") * 7) / 6),
		normalNumPlayers,
	);

	const numPlayers = baseNumPlayers - existingPlayers.length;
	if (numPlayers <= 0) {
		return [];
	}

	if (!forceScrubs) {
		// If it's mostly real players, generate scrubs
		const numRealPlayers = existingPlayers.filter(p => p.real).length;
		forceScrubs = numRealPlayers > 0.5 * normalNumPlayers;
	}

	const draftAge = g.get("draftAge");
	let baseAge = draftAge[0] - (draftYear - g.get("season"));
	if (isSport("football")) {
		// See below comment about FBGM
		baseAge -= 2;
	}
	const minMaxAgeDiff = draftAge[1] - draftAge[0];

	let remaining = [];
	for (let i = 0; i < numPlayers; i++) {
		const p: any = player.generate(
			PLAYER.UNDRAFTED,
			baseAge,
			draftYear,
			false,
			scoutingRank,
		);

		// Just for ovr/pot
		await player.develop(p, 0);

		// Add a fudge factor, used when sorting below to add a little randomness to players entering draft. This may
		// seem quite large, but empirically it seems to work well.
		p.fudgeFactor = random.randInt(-50, 50);

		remaining.push(p);
	}

	// Do one season at a time, keeping the lowest pot players in college for another season
	let enteringDraft: typeof remaining = [];

	// To improve the distribution of DP ages in leagues with modified draftAge, this code will change
	// the % of players who declare for draft to work better with modified draftAge settings
	const fractionRemainingInLastYear = bySport({
		basketball: 1 / 16,
		football: 1 / 4,
		hockey: 1 / 256,
	});
	// By default: Football/Basketball = 0.5, Hockey = 0.75
	const fractionPerYear =
		1 - fractionRemainingInLastYear ** (1 / (minMaxAgeDiff + 1));

	// FBGM was originally written to assume players were generated at 19 and developed for two seasons before declaring.
	// If `draftAge` existed when FBGM was written, it would not make sense to do that. Doing something about that now
	// is difficult, so we want to keep developing prospects for 2 seasons currently.
	if (isSport("football")) {
		for (let i = 0; i < 2; i++) {
			for (const p of remaining) {
				await player.develop(p, 1, true);
			}
		}
	}

	for (let i = 0; i < minMaxAgeDiff + 1; i++) {
		// The % of players declaring each year is determined by fractionPerYear, except in last year when all players declare.
		const cutoff =
			i === minMaxAgeDiff
				? remaining.length
				: Math.round(fractionPerYear * remaining.length);

		remaining.sort(
			(a, b) =>
				b.ratings[0].pot + b.fudgeFactor - (a.ratings[0].pot + a.fudgeFactor),
		);
		enteringDraft = enteringDraft.concat(remaining.slice(0, cutoff));
		remaining = remaining.slice(cutoff); // Each player staying in college, develop 1 year more

		for (const p of remaining) {
			await player.develop(p, 1, true);
		}
	}

	// Small chance of making top 4 players (in 70 player draft) special - on average, one per draft class
	if (existingPlayers.length === 0) {
		const numSpecialPlayerChances = Math.round((4 / 70) * numPlayers);

		for (let i = 0; i < numSpecialPlayerChances; i++) {
			if (Math.random() < 1 / numSpecialPlayerChances) {
				const p = enteringDraft[i];
				player.bonus(p);
				await player.develop(p, 0); // Recalculate ovr/pot
			}
		}
	}

	// If user has increased the number of rounds, ensure excess players are scrubs
	if (normalNumPlayers < baseNumPlayers || forceScrubs) {
		const worstPlayer = [...existingPlayers, ...enteringDraft].sort(
			(a, b) => a.ratings[0].ovr - b.ratings[0].ovr,
		)[0];

		let numPlayersToNerf;
		if (forceScrubs) {
			numPlayersToNerf = enteringDraft.length;
		} else {
			// Any new players created beyond normalNumPlayers, make sure to nerf them
			const playersRemainingToHitNormalNumPlayers =
				normalNumPlayers - existingPlayers.length;
			if (playersRemainingToHitNormalNumPlayers <= 0) {
				numPlayersToNerf = enteringDraft.length;
			} else {
				numPlayersToNerf =
					enteringDraft.length - playersRemainingToHitNormalNumPlayers;
			}
		}

		random.shuffle(enteringDraft);
		for (let i = 0; i < numPlayersToNerf; i++) {
			const p = enteringDraft[i];
			const ovrDiff = p.ratings[0].ovr - worstPlayer.ratings[0].ovr;
			if (ovrDiff > 0) {
				player.bonus(p, -ovrDiff / 2);
				await player.develop(p, 0);
			}
		}
	}

	for (const p of enteringDraft) {
		delete p.fudgeFactor; // Update player values after ratings changes
	}

	return enteringDraft;
};

export default genPlayersWithoutSaving;
