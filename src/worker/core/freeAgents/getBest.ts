import { team } from "..";
import { g } from "../../util";
import type { PlayerWithoutKey } from "../../../common/types"; // Find the best available free agent for a team.
// playersAvailable should be sorted - best players first, worst players last. It will be mutated if a player is found, to remove the found player.
// If payroll is not supplied, don't do salary cap check (like when creating new league).

const getBest = <T extends PlayerWithoutKey>(
	playersOnRoster: T[],
	playersAvailable: T[],
	payroll?: number,
): T | void => {
	const neededPositions = team.getNeededPositions(playersOnRoster);
	const useNeededPositions = Math.random() < 0.9;

	for (let i = 0; i < playersAvailable.length; i++) {
		const p = playersAvailable[i];

		if (neededPositions.size > 0 && useNeededPositions) {
			// Skip players if team already has enough at this position
			const pos = p.ratings[p.ratings.length - 1].pos;

			if (!neededPositions.has(pos)) {
				continue;
			}
		} else if (process.env.SPORT === "football" && !useNeededPositions) {
			// Skip signing extra QBs, otherwise too many will be signed because values are higher
			const pos = p.ratings[p.ratings.length - 1].pos;

			if (pos === "QB") {
				continue;
			}
		}

		const salaryCapCheck =
			payroll === undefined ||
			p.contract.amount + payroll <= g.get("salaryCap"); // Don't sign minimum contract players to fill out the roster

		if (
			salaryCapCheck ||
			(p.contract.amount <= g.get("minContract") &&
				playersOnRoster.length < g.get("maxRosterSize") - 2)
		) {
			playersAvailable.splice(i, 1); // Remove from list of free agents

			return p;
		}
	}
};

export default getBest;
