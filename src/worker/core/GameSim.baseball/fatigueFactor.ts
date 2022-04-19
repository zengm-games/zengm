export const fatigueFactor = (pFatigue: number, endu: number): number => {
	// 30 pitches before any fatigue starts to show
	const adjustedFatigue = Math.max(0, pFatigue - 30);

	// How fast a player's fatigue factor drops is based on endu. 20 at 0 endu means that, when starting a game with no fatigue, after 30 pitches (free above) fatigueFactor starts to decline, and then after 20 more pitches it's at 50% (the max fatigue). For 100 endu, the decline would happen over 100 more pitches, so from pitch 31 to 130.
	const maxFatigueLimit = 20 + 0.8 * endu;

	const ratio = Math.min(1, adjustedFatigue / maxFatigueLimit);

	const fatigueFactor = 1 - 0.5 * ratio;

	return fatigueFactor;
};
