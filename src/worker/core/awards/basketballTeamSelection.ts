// Apply the historical 25%-bench threshold to the configured formula, rather
// than replacing it with a built-in score. Missing historical GS is unpenalized.
export const applyBenchPenalty = (
	score: number,
	stats: { gp?: number; gs?: number } | undefined,
) => {
	const gp = stats?.gp ?? 0;
	const gs = stats?.gs;
	if (!Number.isFinite(score) || gs === undefined || gp <= 0 || gs >= 0.75 * gp) {
		return score;
	}
	const factor = Math.max(0, gs / (0.75 * gp));
	// Multiplication alone would improve a negative custom formula's score.
	return score - Math.abs(score) * (1 - factor);
};

const slots = ["G", "G", "F", "F", "C"];
const eligible = (pos: string, slot: string) => {
	if (slot === "G") {return ["PG", "SG", "G", "GF"].includes(pos);}
	if (slot === "F") {return ["SF", "PF", "F", "GF", "FC"].includes(pos);}
	return ["C", "FC"].includes(pos);
};

export const selectBasketballTeams = <P extends { pid: number; pos: string }>(
	players: P[],
	numTeams: number,
	getScore: (p: P) => number,
) => {
	const used = new Set<number>();
	const teams: P[][] = [];
	for (let team = 0; team < numTeams; team++) {
		// Maximum-score matching reserves flexible GF/FC players where needed,
		// without selecting one player twice or hard-coding three award teams.
		const states = new Map<number, { score: number; picks: (P | undefined)[] }>();
		states.set(0, { score: 0, picks: Array(5).fill(undefined) });
		for (const p of players) {
			const score = getScore(p);
			if (used.has(p.pid) || !Number.isFinite(score)) {continue;}
			for (const [mask, state] of Array.from(states)) {
				for (const [i, slot] of slots.entries()) {
					if ((mask & (1 << i)) !== 0 || !eligible(p.pos, slot)) {continue;}
					const nextMask = mask | (1 << i);
					const nextScore = state.score + score;
					if (states.has(nextMask) && states.get(nextMask)!.score >= nextScore) {continue;}
					const picks = [...state.picks];
					picks[i] = p;
					states.set(nextMask, { score: nextScore, picks });
				}
			}
		}
		const best = [...states.values()].sort((a, b) =>
			b.picks.filter(Boolean).length - a.picks.filter(Boolean).length || b.score - a.score,
		)[0]!;
		const selected = best.picks.filter((p): p is P => p !== undefined);
		for (const p of selected) {used.add(p.pid);}
		// Sparse positions fall back within this team, rather than shifting the
		// boundaries of all subsequent teams as in the obsolete implementation.
		for (const p of players) {
			if (selected.length === 5) {break;}
			if (!used.has(p.pid) && Number.isFinite(getScore(p))) {
				selected.push(p);
				used.add(p.pid);
			}
		}
		teams.push(selected);
	}
	return teams;
};
