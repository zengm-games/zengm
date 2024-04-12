import { PHASE, bySport } from "../../common";
import { g } from "../util";

class GameSimBase {
	id: number;
	day: number | undefined;
	allStarGame: boolean;
	baseInjuryRate: number;

	overtime = false;
	overtimes = 0;

	shootout = false;
	shootoutRounds =
		g.get("phase") === PHASE.PLAYOFFS
			? g.get("shootoutRoundsPlayoffs", "current")
			: g.get("shootoutRounds", "current");

	maxOvertimes =
		(g.get("phase") === PHASE.PLAYOFFS
			? g.get("maxOvertimesPlayoffs", "current")
			: g.get("maxOvertimes", "current")) ?? Infinity;

	constructor({
		gid,
		day,
		allStarGame,
		baseInjuryRate,
	}: {
		gid: number;
		day: number | undefined;
		allStarGame: boolean;
		baseInjuryRate: number;
	}) {
		this.id = gid;
		this.day = day;
		this.allStarGame = allStarGame;
		this.baseInjuryRate = baseInjuryRate;
	}

	shouldEndShootoutEarly(t: 0 | 1, i: number, sPts: [number, number]) {
		const SECOND_TEAM = 0;

		if (
			bySport({
				baseball: true,
				basketball: true,
				football: false,
				hockey: false,
			})
		) {
			// Each team takes all their shots at once
			if (t === SECOND_TEAM) {
				const ptsNeeded = sPts[t === 0 ? 1 : 0] - sPts[t];
				if (ptsNeeded < 0) {
					// Already clinched a win even without the remaining shots
					return true;
				}
				const remainingShots = this.shootoutRounds - i;
				if (remainingShots < ptsNeeded) {
					// Can't possibly win, so just give up
					return true;
				}

				return false;
			}
		} else {
			// Alternating shots
			const t2 = t === 0 ? 1 : 0;
			const minPts = sPts[t];
			const maxPts = minPts + this.shootoutRounds - i - 1;
			const minPtsOther = sPts[t2];
			const maxPtsOther =
				minPtsOther + this.shootoutRounds - i - (t === SECOND_TEAM ? 1 : 0);
			if (minPts > maxPtsOther) {
				// Already clinched a win even without the remaining shots
				return true;
			}
			if (maxPts < minPtsOther) {
				// Can't possibly win, so just give up
				return true;
			}

			return false;
		}
	}
}

export default GameSimBase;
