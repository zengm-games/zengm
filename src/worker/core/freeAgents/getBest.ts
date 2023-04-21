import { g } from "../../util";
import type { PlayerWithoutKey } from "../../../common/types";
import { DRAFT_BY_TEAM_OVR, bySport } from "../../../common";
import { getTeamOvrDiffs } from "../draft/runPicks";
import orderBy from "lodash-es/orderBy";

// In some sports, extra check for certain important rare positions in case the only one was traded away. These should only be positions with weird unique skills, where you can't replace them easily with another position.
export const KEY_POSITIONS_NEEDED = bySport({
	baseball: undefined,
	basketball: undefined,
	football: ["QB", "K", "P"],
	hockey: ["G"],
});

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
	const salaryCapType = g.get("salaryCapType");
	const numActiveTeams = g.get("numActiveTeams");

	let playersSorted: T[];
	if (DRAFT_BY_TEAM_OVR) {
		// playersAvailable is sorted by value. So if we hit a player at a minimum contract at a position, no player with lower value needs to be considered
		const seenMinContractAtPos = new Set();
		const playersAvailableFiltered = playersAvailable.filter(p => {
			const pos = p.ratings.at(-1).pos;
			if (seenMinContractAtPos.has(pos)) {
				return false;
			}

			if (p.contract.amount <= minContract && p.injury.gamesRemaining === 0) {
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

	const skipSalaryCapCheck =
		salaryCapType === "none" && Math.random() < 2 / numActiveTeams;

	let keyPositionsNeededCache: string[] | undefined;
	const getKeyPositionsNeeded = () => {
		if (KEY_POSITIONS_NEEDED) {
			if (keyPositionsNeededCache) {
				return keyPositionsNeededCache;
			}

			const allKeyPositionsNeeded = [...KEY_POSITIONS_NEEDED];
			const positionCounts = {
				injured: {} as Record<string, number>,
				healthy: {} as Record<string, number>,
			};

			for (const p of playersOnRoster) {
				const pos = p.ratings.at(-1)!.pos;
				const injured = p.injury.gamesRemaining > 0;
				const object = positionCounts[injured ? "injured" : "healthy"];
				if (object[pos] === undefined) {
					object[pos] = 1;
				} else {
					object[pos] += 1;
				}
			}

			keyPositionsNeededCache = allKeyPositionsNeeded.filter(pos => {
				const injured = positionCounts.injured[pos] ?? 0;
				const healthy = positionCounts.healthy[pos] ?? 0;

				// If we already have 3 injured ones, maybe don't sign another? idk
				return injured <= 3 && healthy === 0;
			});

			return keyPositionsNeededCache;
		}
	};

	for (const p of playersSorted) {
		const salaryCapCheck =
			payroll === undefined ||
			skipSalaryCapCheck ||
			p.contract.amount + payroll <= salaryCap;

		// Don't sign minimum contract players to fill out the roster
		const shouldAddPlayerNormal =
			salaryCapCheck && p.contract.amount > minContract;
		const shouldAddPlayerMinContract =
			p.contract.amount <= minContract &&
			playersOnRoster.length < maxRosterSize - 2;

		// If none of the other checks were true and we can afford this player and it's at a position we have nobody at (like hockey goalie), go for it
		const shouldAddPlayerPosition =
			p.injury.gamesRemaining === 0 &&
			!shouldAddPlayerNormal &&
			!shouldAddPlayerMinContract &&
			(salaryCapCheck || p.contract.amount <= minContract) &&
			getKeyPositionsNeeded()?.includes(p.ratings.at(-1)!.pos);

		if (
			shouldAddPlayerNormal ||
			shouldAddPlayerPosition ||
			shouldAddPlayerMinContract
		) {
			return p;
		}
	}
};

export default getBest;
