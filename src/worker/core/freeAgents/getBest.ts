import { g } from "../../util/index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { DRAFT_BY_TEAM_OVR, bySport } from "../../../common/index.ts";
import { getTeamOvrDiffs } from "../draft/runPicks.ts";
import { orderBy } from "../../../common/utils.ts";

// In some sports, extra check for certain important rare positions in case the only one was traded away. These should only be positions with weird unique skills, where you can't replace them easily with another position. Value is the number of players that should be at each position.
export const KEY_POSITIONS_NEEDED = bySport<Record<string, number> | undefined>(
	{
		baseball: undefined,
		basketball: undefined,
		football: { QB: 2, K: 1, P: 1 },
		hockey: { G: 2 },
	},
);

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
		const playersAvailableFiltered = playersAvailable.filter((p) => {
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
			teamOvrDiff: teamOvrDiffs[i]!,
		}));
		playersSorted = orderBy(wrapper, (x) => x.teamOvrDiff, "desc").map(
			(x) => x.p,
		);
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

			const allKeyPositionsNeeded = Object.keys(KEY_POSITIONS_NEEDED);
			const positionCounts: Record<
				"injured" | "healthy",
				Record<string, number>
			> = {
				injured: {},
				healthy: {},
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

			keyPositionsNeededCache = allKeyPositionsNeeded.filter((pos) => {
				const injured = positionCounts.injured[pos] ?? 0;
				const healthy = positionCounts.healthy[pos] ?? 0;

				// If we already have 4 injured ones, maybe don't sign another? idk
				if (injured >= 4) {
					return false;
				}

				return healthy === 0 || healthy + injured < KEY_POSITIONS_NEEDED[pos]!;
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
