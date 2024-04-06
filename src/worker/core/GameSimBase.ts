import { PHASE } from "../../common";
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
}

export default GameSimBase;
