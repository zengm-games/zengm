import { penalties, penaltyTypes } from "./penalties";
import type { PlayerGameSim, TeamNum } from "./types";

type PenaltyBoxEntry = {
	p: PlayerGameSim;
	penalty: typeof penalties[number];
	minutesLeft: number;
	ppo: number;
};

const teamNums: [TeamNum, TeamNum] = [0, 1];

class PenaltyBox {
	onPenaltyOver;

	players: [PenaltyBoxEntry[], PenaltyBoxEntry[]];

	constructor(
		onPenaltyOver: (arg: {
			t: TeamNum;
			p: PlayerGameSim;
			minutesAgo: number;
			ppo: number;
		}) => void,
	) {
		this.onPenaltyOver = onPenaltyOver;
		this.players = [[], []];
	}

	add(t: TeamNum, p: PlayerGameSim, penalty: typeof penalties[number]) {
		const penaltyType = penaltyTypes[penalty.type];

		this.players[t].push({
			p,
			penalty,
			minutesLeft: penaltyType.minutes,

			// Always initialize at 0, because even if this seems like a power play, there could be an offsetting penalty set immediately after this
			ppo: 0,
		});
	}

	count(t: TeamNum) {
		return this.players[t].length;
	}

	has(t: TeamNum, p: PlayerGameSim) {
		return this.players[t].some(entry => entry.p === p);
	}

	getPowerPlayTeam() {
		const counts = teamNums.map(t => this.count(t));
		let powerPlayTeam: TeamNum | undefined;
		if (counts[0] > counts[1]) {
			powerPlayTeam = 1;
		} else if (counts[1] > counts[0]) {
			powerPlayTeam = 0;
		}

		return {
			powerPlayTeam,
			strengthDifference: Math.abs(counts[0] - counts[1]),
		};
	}

	getShortHandedTeam() {
		const { powerPlayTeam } = this.getPowerPlayTeam();

		if (powerPlayTeam === 0) {
			return 1;
		}

		if (powerPlayTeam === 1) {
			return 0;
		}

		return undefined;
	}

	goal(scoringTeam: TeamNum) {
		const shortHandedTeam = this.getShortHandedTeam();

		// If no team has advantage (such as 4 on 4), then nobody gets out of the penalty box
		if (shortHandedTeam === undefined) {
			return;
		}

		// If it's a shorthanded goal, then nobody gets out of the penalty box
		if (scoringTeam === shortHandedTeam) {
			return;
		}

		// Must have been a power play goal!

		for (const entry of this.players[shortHandedTeam]) {
			const penaltyType = penaltyTypes[entry.penalty.type];
			if (penaltyType.minutesReducedAfterGoal > 0) {
				entry.minutesLeft -= penaltyType.minutesReducedAfterGoal;
				if (entry.minutesLeft < 0) {
					entry.minutesLeft = 0;
				}

				// Only let one guy out of the penalty box
				break;
			}
		}

		this.checkIfPenaltiesOver();

		for (const entry of this.players[shortHandedTeam]) {
			// http://fs.ncaa.org/Docs/stats/Stats_Manuals/IceHockey/2012EZ.pdf - since a major does not expire, after N goals have been scored during that penalty, it counts as N+1 PPO
			if (entry.penalty.type === "major") {
				entry.ppo += 1;
			}
		}
	}

	advanceClock(minutes: number) {
		const shortHandedTeam = this.getShortHandedTeam();

		for (const t of teamNums) {
			for (const entry of this.players[t]) {
				entry.minutesLeft -= minutes;

				// Some time has passed with an advantage. Track it as a PPO. This would double count two simultaneous penalties, but that would be a very contrived situation in the current game sim code.
				if (t === shortHandedTeam && entry.ppo === 0) {
					entry.ppo = 1;
				}
			}
		}

		this.checkIfPenaltiesOver();
	}

	checkIfPenaltiesOver() {
		for (const t of [0, 1] as const) {
			this.players[t] = this.players[t].filter(entry => {
				if (entry.minutesLeft > 0) {
					return true;
				}

				this.onPenaltyOver({
					t,
					p: entry.p,
					minutesAgo: -entry.minutesLeft,
					ppo: entry.ppo,
				});

				return false;
			});
		}
	}

	splitUpAdvanceClock(minutes: number) {
		const needToStopAt = new Set<number>([minutes]);

		for (const t of [0, 1] as const) {
			for (const entry of this.players[t]) {
				if (entry.minutesLeft < minutes) {
					needToStopAt.add(entry.minutesLeft);
				}
			}
		}

		const minutesArray = Array.from(needToStopAt).sort((a, b) => a - b);

		return minutesArray.map((x, i) => {
			if (i === 0) {
				return x;
			}

			return x - minutesArray[i - 1];
		});
	}
}

export default PenaltyBox;
