import { getPeriodName } from "../../common";
import { helpers } from ".";
import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.hockey/PlayByPlayLogger";

// For strings of a format like 1:23 (times), which is greater? 1 for first, -1 for second, 0 for tie
const cmpTime = (t1: string, t2: string) => {
	const [min1, sec1] = t1.split(":").map(x => parseInt(x));
	const [min2, sec2] = t2.split(":").map(x => parseInt(x));

	if (min1 > min2) {
		return 1;
	}
	if (min1 < min2) {
		return -1;
	}
	if (sec1 > sec2) {
		return 1;
	}
	if (sec1 < sec2) {
		return -1;
	}
	return 0;
};

// Convert clock in minutes to min:sec, like 1.5 -> 1:30
export const formatClock = (clock: number) => {
	const secNum = Math.ceil((clock % 1) * 60);

	let sec;
	if (secNum >= 60) {
		sec = "59";
	} else if (secNum < 10) {
		sec = `0${secNum}`;
	} else {
		sec = `${secNum}`;
	}

	return `${Math.floor(clock)}:${sec}`;
};

const getText = (
	event: PlayByPlayEvent,
	boxScore: {
		numPeriods: number;
		time: string;
		teams: [{ abbrev: string }, { abbrev: string }];
	},
) => {
	let text;

	let showTeamAndClock = true;

	if (event.type === "injury") {
		text = `${event.names[0]} was injured!`;
	}
	if (event.type === "quarter") {
		text = `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
			boxScore.numPeriods,
		)}`;
		showTeamAndClock = false;
	}
	if (event.type === "overtime") {
		const overtimes = event.quarter - boxScore.numPeriods;
		text = `Start of ${
			overtimes === 1 ? "" : `${helpers.ordinal(overtimes)} `
		} overtime`;
		showTeamAndClock = false;
	}
	if (event.type === "gameOver") {
		text = "End of game";
		showTeamAndClock = false;
	}
	if (event.type === "hit") {
		text = `${event.names[0]} hit ${event.names[1]}`;
	}
	if (event.type === "gv") {
		text = `Giveaway by ${event.names[0]}`;
	}
	if (event.type === "tk") {
		text = `Takeaway by ${event.names[0]}`;
	}
	if (event.type === "slapshot") {
		text = `Slapshot from ${event.names[0]}`;
	}
	if (event.type === "wristshot") {
		text = `Wristshot by ${event.names[0]}`;
	}
	if (event.type === "shot") {
		text = `Shot by ${event.names[0]}`;
	}
	if (event.type === "reboundShot") {
		text = `Shot by ${event.names[0]} off the rebound`;
	}
	if (event.type === "deflection") {
		text = `Deflected by ${event.names[0]}`;
	}
	if (event.type === "block") {
		text = `Blocked by ${event.names[0]}`;
	}
	if (event.type === "miss") {
		text = "Shot missed the goal";
	}
	if (event.type === "save") {
		text = `Saved by ${event.names[0]}`;
	}
	if (event.type === "save-freeze") {
		text = `Saved by ${event.names[0]}, and he freezes the puck`;
	}
	if (event.type === "faceoff") {
		text = `${event.names[0]} wins the faceoff against ${event.names[1]}`;
	}
	if (event.type === "goal") {
		text = "Goal!!!";
		if (event.names.length > 1) {
			text += ` (assist: ${event.names.slice(1).join(", ")})`;
		}
	}
	if (event.type === "offensiveLineChange") {
		text = "Offensive line change";
	}
	if (event.type === "fullLineChange") {
		text = "Full line change";
	}
	if (event.type === "defensiveLineChange") {
		text = "Defensive line change";
	}
	if (event.type === "penalty") {
		const type =
			event.penaltyType === "major"
				? "Major"
				: event.penaltyType === "minor"
				? "Minor"
				: "Double minor";
		text = `${type} penalty on ${event.names[0]} for ${event.penaltyName}`;
	}
	if (event.type === "penaltyOver") {
		text = `${event.names[0]} is released from the penalty box`;
	}
	if (event.type === "pullGoalie") {
		text = `Pulled goalie! ${event.name} takes the ice`;
	}
	if (event.type === "noPullGoalie") {
		text = `Goalie ${event.name} comes back into the game`;
	}

	if (text === undefined) {
		throw new Error(`Invalid event type "${event.type}"`);
	}

	if (showTeamAndClock) {
		const actualT = (event as any).t === 0 ? 1 : 0;
		text = `${formatClock((event as any).clock)} - ${
			boxScore.teams[actualT].abbrev
		} - ${text}`;
	}

	return text;
};

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
}: {
	events: PlayByPlayEvent[];
	boxScore: {
		quarter: string;
		numPeriods: number;
		overtime?: string;
		teams: any;
		time: string;
		scoringSummary: PlayByPlayEventScore[];
	};
	overtimes: number;
	quarters: number[];
}) => {
	let stop = false;
	let text;
	let prevGoal: PlayByPlayEvent | undefined;

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		// Swap teams order, so home team is at bottom in box score
		// @ts-expect-error
		const actualT = e.t === 0 ? 1 : 0;

		if (e.type !== "init" && !quarters.includes(e.quarter)) {
			quarters.push(e.quarter);
			boxScore.teams[0].ptsQtrs.push(0);
			boxScore.teams[1].ptsQtrs.push(0);

			const ptsQtrs = boxScore.teams[0].ptsQtrs;
			if (ptsQtrs.length > boxScore.numPeriods) {
				overtimes += 1;
				if (overtimes === 1) {
					boxScore.overtime = " (OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = ` (${overtimes}OT)`;
				}
				boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
			} else {
				boxScore.quarter = `${helpers.ordinal(ptsQtrs.length)} ${getPeriodName(
					boxScore.numPeriods,
				)}`;
			}

			if (e.type !== "stat" && e.type !== "playersOnIce") {
				boxScore.time = formatClock(e.clock);
			}
		}

		const findPlayer = (pid: number) => {
			const p = boxScore.teams[actualT].players.find(
				(p2: any) => p2.pid === pid,
			);
			if (p === undefined) {
				console.log("Can't find player", e);
			}
			return p;
		};

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (e.pid != undefined) {
				const p = findPlayer(e.pid);
				if (p && p[e.s] !== undefined) {
					p[e.s] += e.amt;
				}
			}
			if (boxScore.teams[actualT].hasOwnProperty(e.s)) {
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type === "playersOnIce") {
			for (const p of boxScore.teams[actualT].players) {
				p.inGame = e.pids.includes(p.pid);
			}
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = findPlayer(e.injuredPID);
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			} else if (e.type === "penalty") {
				const p = findPlayer(e.penaltyPID);
				p.inPenaltyBox = true;
			} else if (e.type === "penaltyOver") {
				const p = findPlayer(e.penaltyPID);
				p.inPenaltyBox = false;
			}

			if (e.type === "goal") {
				prevGoal = e;
			}

			text = getText(e, boxScore);
			boxScore.time = formatClock(e.clock);
			stop = true;
		}
	}

	//  Handle filtering of scoringSummary
	if (boxScore.scoringSummary && boxScore.time !== undefined) {
		for (const event of boxScore.scoringSummary) {
			if (event.hide === false) {
				// Already past, no need to check again
				continue;
			}

			if (!quarters.includes(event.quarter)) {
				// Future quarters
				event.hide = true;
			} else if (event.quarter !== quarters.at(-1)) {
				// Past quarters
				event.hide = false;
			} else {
				const cmp = cmpTime(formatClock(event.clock), boxScore.time);
				const show =
					cmp === 1 ||
					(cmp === 0 && prevGoal && (prevGoal as any).clock === event.clock);
				event.hide = !show;
			}
		}
	}

	return {
		overtimes,
		quarters,
		text,
	};
};

export default processLiveGameEvents;
