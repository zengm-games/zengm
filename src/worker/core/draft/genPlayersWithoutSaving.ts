import { bySport, isSport, PLAYER } from "../../../common";
import { player } from "..";
import { defaultGameAttributes, g, random } from "../../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";

// To improve the distribution of DP ages in leagues with modified draftAges, this code will change the % of players who declare for draft each year to work better with modified draftAges settings. Previously, it was just a constant defaultFractionPerYear.
const defaultFractionPerYear = bySport({
	basketball: 0.5,
	football: 0.5,
	hockey: 0.75,
});

// For default values of numYearsBeforeLastYear, output is: basketball/football = 0.5, hockey = 0.75
const getFractionPerYear = (ageGap: number) => {
	if (ageGap === 0) {
		return 1;
	}

	// For small number of years, just do default - this handles the defaults for all sports currently
	if (ageGap <= 3) {
		return defaultFractionPerYear;
	}

	// Find fractionPerYear such that the amount remaining in the last year is below 1/ageGap. This will result in a larger number of players in the last year than the year before (or possibly many years before), but that's okay I guess.
	for (let fractionPerYear = 0; fractionPerYear < 1; fractionPerYear += 0.01) {
		let result = 1;
		let enteringDraftThisYear = 0;
		for (let i = 0; i < ageGap; i++) {
			enteringDraftThisYear = result * fractionPerYear;
			result -= enteringDraftThisYear;
		}
		if (result < 1 / ageGap) {
			return fractionPerYear;
		}
	}

	// Should never happen
	return 1 / ageGap;
};

const developOneSeason = async (p: Player) => {
	await player.develop(p, 1, true);
};

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
	let baseNumPlayers = Math.max(
		Math.round((g.get("numDraftRounds") * g.get("numActiveTeams") * 7) / 6),
		normalNumPlayers,
	);

	// Based on draftAges and forceRetireAge settings, check how many players we need per draft class to fill the league. KEEP IN SYNC WITH LEAGUE CREATION seasonsSimmed
	const draftAges = g.get("draftAges");
	const forceRetireAge = g.get("forceRetireAge");
	const averageDraftAge = Math.round((draftAges[0] + draftAges[1]) / 2); // Ideally this would be more intelligently determined, based on getFractionPerYear
	const forceRetireAgeDiff = forceRetireAge - averageDraftAge;
	if (forceRetireAgeDiff > 0) {
		const numActivePlayers =
			(g.get("maxRosterSize") + 1) * g.get("numActiveTeams");

		const numSeasonsPerPlayer = forceRetireAgeDiff;
		const numPlayersNeededPerYear = Math.ceil(
			numActivePlayers / numSeasonsPerPlayer,
		);

		if (numPlayersNeededPerYear > baseNumPlayers) {
			baseNumPlayers = numPlayersNeededPerYear;
		}
	}

	const numPlayers = baseNumPlayers - existingPlayers.length;

	if (numPlayers <= 0) {
		return [];
	}

	if (!forceScrubs) {
		// If it's mostly real players, generate scrubs
		const numRealPlayers = existingPlayers.filter(p => p.real).length;
		forceScrubs = numRealPlayers > 0.5 * normalNumPlayers;
	}

	let baseAge = draftAges[0] - (draftYear - g.get("season"));
	if (isSport("football")) {
		// See below comment about FBGM
		baseAge -= 2;
	}
	const minMaxAgeDiff = draftAges[1] - draftAges[0];

	let remaining = [];
	for (let i = 0; i < numPlayers; i++) {
		const name = await player.name();
		const p: any = await player.generate(
			PLAYER.UNDRAFTED,
			baseAge,
			draftYear,
			false,
			scoutingRank,
			name,
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

	const fractionPerYear = getFractionPerYear(minMaxAgeDiff);

	// FBGM was originally written to assume players were generated at 19 and developed for two seasons before declaring.
	// If `draftAges` existed when FBGM was written, it would not make sense to do that. Doing something about that now
	// is difficult, so we want to keep developing prospects for 2 seasons currently.
	if (isSport("football")) {
		for (let i = 0; i < 2; i++) {
			for (const p of remaining) {
				await developOneSeason(p);
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
			await developOneSeason(p);
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

	// No college for players 18 or younger
	for (const p of enteringDraft) {
		const ageAtDraft = p.draft.year - p.born.year;
		if (ageAtDraft <= 18) {
			p.college = "";
		}
	}

	return enteringDraft;
};

export default genPlayersWithoutSaving;
