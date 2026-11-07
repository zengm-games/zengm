import { PHASE } from "../../../common/constants.ts";
import { g } from "../../util/index.ts";

class GameSimBase {
	id: number;
	day: number | undefined;
	allStarGame: boolean;
	baseInjuryRate: number;
	neutralSite: boolean;

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
		neutralSite,
	}: {
		gid: number;
		day: number | undefined;
		allStarGame: boolean;
		baseInjuryRate: number;
		neutralSite: boolean;
	}) {
		this.id = gid;
		this.day = day;
		this.allStarGame = allStarGame;
		this.baseInjuryRate = baseInjuryRate;
		this.neutralSite = neutralSite;
	}

	// Runs the shots of a shootout, after each sport sets it up. Away team shoots first. "teamByTeam" means each team takes all of its shots before the other team shoots, "alternating" means the teams alternate shots. If still tied after that, the teams alternate shots until there's a winner.
	runShootoutShots({
		format,
		getSPts,
		onTeamStart,
		onTie,
		shoot,
	}: {
		format: "teamByTeam" | "alternating";
		getSPts: () => [number, number];
		onTeamStart?: (t: 0 | 1) => void;
		onTie: () => void;
		shoot: (t: 0 | 1) => void;
	}) {
		const order = [1, 0] as const;

		if (format === "teamByTeam") {
			for (const t of order) {
				onTeamStart?.(t);

				for (let i = 0; i < this.shootoutRounds; i++) {
					const sPts = getSPts();
					if (t === order[1]) {
						const ptsNeeded = sPts[order[0]] - sPts[t];
						if (ptsNeeded < 0) {
							// Already clinched a win even without the remaining shots
							break;
						}
						const remainingShots = this.shootoutRounds - i;
						if (remainingShots < ptsNeeded) {
							// Can't possibly win, so just give up
							break;
						}
					}

					shoot(t);
				}
			}
		} else {
			ROUNDS: for (let i = 0; i < this.shootoutRounds; i++) {
				for (const t of order) {
					shoot(t);

					const sPts = getSPts();
					const t2 = t === 0 ? 1 : 0;
					const minPts = sPts[t];
					const maxPts = minPts + this.shootoutRounds - i - 1;
					const minPtsOther = sPts[t2];
					const maxPtsOther =
						minPtsOther + this.shootoutRounds - i - (t === order[1] ? 1 : 0);
					if (minPts > maxPtsOther || maxPts < minPtsOther) {
						// Either already clinched a win even without the remaining shots, or can't possibly win
						break ROUNDS;
					}
				}
			}
		}

		if (getSPts()[0] === getSPts()[1]) {
			onTie();

			while (getSPts()[0] === getSPts()[1]) {
				for (const t of order) {
					shoot(t);
				}
			}
		}
	}

	deleteGameSimOnlyProperties(
		teams: {
			compositeRating?: unknown;
			pace?: unknown;
			player: {
				age?: unknown;
				valueNoPot?: unknown;
				compositeRating?: unknown;
				ptModifier?: unknown;
				numConsecutiveGamesG?: unknown;
				pFatigue?: unknown;
				stat: {
					benchTime?: unknown;
					courtTime?: unknown;
					energy?: unknown;
				};
			}[];
		}[],
	) {
		for (const t of teams) {
			delete t.compositeRating;
			delete t.pace;

			for (const p of t.player) {
				delete p.age;
				delete p.valueNoPot;
				delete p.compositeRating;
				delete p.ptModifier;
				delete p.numConsecutiveGamesG;
				delete p.pFatigue;
				delete p.stat.benchTime;
				delete p.stat.courtTime;
				delete p.stat.energy;
			}
		}
	}

	getOvertimeLength() {
		if (__SPORT === "baseball") {
			throw new Error("Should never happen");
		}

		const playoffs = g.get("phase") === PHASE.PLAYOFFS;
		if (playoffs) {
			return g.get("overtimeLengthPlayoffs") ?? g.get("overtimeLength");
		}
		return g.get("overtimeLength");
	}
}

export default GameSimBase;
