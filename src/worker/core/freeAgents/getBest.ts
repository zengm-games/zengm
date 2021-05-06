import { team } from "..";
import { g } from "../../util";
import type { PlayerWithoutKey } from "../../../common/types";
import { DRAFT_BY_TEAM_OVR, isSport } from "../../../common";
import { getTeamOvrDiffs } from "../draft/runPicks";
import orderBy from "lodash-es/orderBy";

// Find the best available free agent for a team.
// playersAvailable should be sorted - best players first, worst players last. It will be mutated if a player is found, to remove the found player.
// If payroll is not supplied, don't do salary cap check (like when creating new league).
const getBest = <T extends PlayerWithoutKey>(
	playersOnRoster: T[],
	playersAvailable: T[],
	payroll?: number,
): T | void => {
	let playersSorted: T[];
	if (DRAFT_BY_TEAM_OVR) {
		const teamOvrDiffs = getTeamOvrDiffs(playersOnRoster, playersAvailable);
		const wrapper = playersAvailable.map((p, i) => ({
			p,
			teamOvrDiff: teamOvrDiffs[i],
		}));
		playersSorted = orderBy(wrapper, x => x.teamOvrDiff, "desc").map(x => x.p);
	} else {
		playersSorted = playersAvailable;
	}

	const neededPositions = team.getNeededPositions(playersOnRoster);
	const useNeededPositions = Math.random() < 0.9;

	for (let i = 0; i < playersSorted.length; i++) {
		const p = playersSorted[i];
		/*const pos = p.ratings[p.ratings.length - 1].pos;

		if (neededPositions.size > 0 && useNeededPositions) {
			// Skip players if team already has enough at this position
			if (!neededPositions.has(pos)) {
				continue;
			}
		} else if (isSport("football") && !useNeededPositions) {
			// Skip signing extra QBs, otherwise too many will be signed because values are higher
			const pos = p.ratings[p.ratings.length - 1].pos;

			if (pos === "QB") {
				continue;
			}
		}*/

		const salaryCapCheck =
			payroll === undefined ||
			p.contract.amount + payroll <= g.get("salaryCap");

		const shouldAddPlayerNormal =
			salaryCapCheck && p.contract.amount > g.get("minContract");
		const shouldAddPlayerMinContract =
			p.contract.amount <= g.get("minContract") &&
			playersOnRoster.length < g.get("maxRosterSize") - 2;

		/*let shouldAddPlayerPosition = false;
		if (
			(isSport("football") &&
				((neededPositions.has("K") && pos === "K") ||
					(neededPositions.has("P") && pos === "P"))) ||
			(isSport("hockey") && neededPositions.has("G") && pos === "G")
		) {
			shouldAddPlayerPosition = true;
		}

		// Otherwise hockey had an issue with signing and releasing a 3rd goalie repeatedly
		if (isSport("hockey")) {
			shouldAddPlayerPosition =
				shouldAddPlayerPosition &&
				playersOnRoster.length < g.get("maxRosterSize");
		}*/

		// Don't sign minimum contract players to fill out the roster
		if (
			shouldAddPlayerNormal ||
			// shouldAddPlayerPosition ||
			shouldAddPlayerMinContract
		) {
			return p;
		}
	}
};

export default getBest;
