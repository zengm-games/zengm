import { PHASE } from "../../common";
import { g } from "../util";

class GameSimBase {
	id: number;
	day: number | undefined;
	allStarGame: boolean;
	baseInjuryRate: number;

	overtime = false;
	overtimes = 0;

	// In the playoffs, no ties so maxOvertimes is infinity. Otherwise, just go with the setting
	maxOvertimes =
		g.get("phase") === PHASE.PLAYOFFS
			? Infinity
			: g.get("maxOvertimes", "current") ?? Infinity;

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
