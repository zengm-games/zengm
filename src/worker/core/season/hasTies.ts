import { g } from "../../util";

// This replaces old calls to g.get("ties") from before maxOvertimes existed. Call with season=Infinity for g.get("ties") exact behavior (no season parameter)
const hasTies = (season: number | "current") => {
	return (
		g.get("maxOvertimes", season) !== null &&
		g.get("shootoutRounds", season) <= 0
	);
};

export default hasTies;
