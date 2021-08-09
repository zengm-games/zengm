import { g } from "../../util";
import type { PlayerWithoutKey } from "../../../common/types";
import { DRAFT_BY_TEAM_OVR } from "../../../common";
import { getTeamOvrDiffs } from "../draft/runPicks";
import orderBy from "lodash-es/orderBy";

// Find the best available free agent for a team.
// playersAvailable should be sorted - best players first, worst players last.
// If payroll is not supplied, don't do salary cap check (like when creating new league).
const getBest = <T extends PlayerWithoutKey>(
	playersOnRoster: T[],
	playersAvailable: T[],
	payroll?: number,
): T | void => {
	const maxRosterSize = g.get("maxRosterSize");
	const minContract = g.get("minContract");
	const salaryCap = g.get("salaryCap");

	let playersSorted: T[];
	if (DRAFT_BY_TEAM_OVR) {
		// playersAvailable is sorted by value. So if we hit a player at a minimum contract at a position, no player with lower value needs to be considered
		const seenMinContractAtPos = new Set();
		const playersAvailableFiltered = playersAvailable.filter(p => {
			const pos = p.ratings.at(-1).pos;
			if (seenMinContractAtPos.has(pos)) {
				return false;
			}

			if (p.contract.amount <= minContract) {
				seenMinContractAtPos.add(pos);
			}

			return true;
		});

		const teamOvrDiffs = getTeamOvrDiffs(
			playersOnRoster,
			playersAvailableFiltered,
		);
		const wrapper = playersAvailableFiltered.map((p, i) => ({
			p,
			teamOvrDiff: teamOvrDiffs[i],
		}));
		playersSorted = orderBy(wrapper, x => x.teamOvrDiff, "desc").map(x => x.p);
	} else {
		playersSorted = playersAvailable;
	}

	for (const p of playersSorted) {
		const salaryCapCheck =
			payroll === undefined || p.contract.amount + payroll <= salaryCap;

		const shouldAddPlayerNormal =
			salaryCapCheck && p.contract.amount > minContract;
		const shouldAddPlayerMinContract =
			p.contract.amount <= minContract &&
			playersOnRoster.length < maxRosterSize - 2;

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
