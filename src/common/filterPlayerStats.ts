import bySport from "./bySport";

// Filter based on if player has any stats, for use in box score and player game log
const filterPlayerStats = (p: any, stats: string[], type: string) => {
	return bySport({
		basketball: () => {
			return p.min > 0;
		},
		football: () => {
			for (const stat of stats) {
				if (
					p.processed[stat] !== undefined &&
					p.processed[stat] !== 0 &&
					stat !== "fmbLost" &&
					stat !== "fp"
				) {
					return true;
				}
			}
			return false;
		},
		hockey: () => {
			return (
				(type === "skaters" && p.gpSkater > 0) ||
				(type === "goalies" && p.gpGoalie > 0)
			);
		},
	})();
};

export default filterPlayerStats;
