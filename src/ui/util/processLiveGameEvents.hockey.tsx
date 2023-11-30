import { getPeriodName } from "../../common";
import { helpers, local } from ".";
import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.hockey/PlayByPlayLogger";
import type { PlayerInjury } from "../../common/types";

let playersByPidGid: number | undefined;
let playersByPid:
	| Record<
			number,
			{
				name: string;
				inGame: boolean;
				inPenaltyBox: boolean;
				injury: PlayerInjury;
			}
	  >
	| undefined;

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

	if (event.type === "injury") {
		text = `${event.names[0]} was injured!`;
	}
	if (event.type === "quarter") {
		text = `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
			boxScore.numPeriods,
		)}`;
	}
	if (event.type === "overtime") {
		const overtimes = event.quarter - boxScore.numPeriods;
		text = `Start of ${
			overtimes === 1 ? "" : `${helpers.ordinal(overtimes)} `
		} overtime`;
	}
	if (event.type === "gameOver") {
		text = "End of game";
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
		text = `Saved by ${event.names[0]}, and ${helpers.pronoun(
			local.getState().gender,
			"he",
		)} freezes the puck`;
	}
	if (event.type === "faceoff") {
		text = `${event.names[0]} wins the faceoff against ${event.names[1]}`;
	}
	if (event.type === "goal") {
		// text empty because PlayByPlayEntry handles it
		text = "";
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
		text = (
			<span className="text-danger">
				{type} penalty on {event.names[0]} for {event.penaltyName}
			</span>
		);
	}
	if (event.type === "penaltyOver") {
		text = (
			<span className="text-danger">
				{event.names[0]} is released from the penalty box
			</span>
		);
	}
	if (event.type === "pullGoalie") {
		text = (
			<span className="text-danger">
				Pulled goalie! {event.name} takes the ice
			</span>
		);
	}
	if (event.type === "noPullGoalie") {
		text = (
			<span className="text-danger">
				Goalie {event.name} comes back into the game
			</span>
		);
	}

	if (text === undefined) {
		throw new Error(`Invalid event type "${event.type}"`);
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
		gid: number;
		quarter: string;
		quarterShort: string;
		numPeriods: number;
		overtime?: string;
		teams: any;
		time: string;
		scoringSummary: PlayByPlayEventScore[];
	};
	overtimes: number;
	quarters: number[];
}) => {
	if (!playersByPid || boxScore.gid !== playersByPidGid) {
		playersByPidGid = boxScore.gid;
		playersByPid = {};
		for (const t of boxScore.teams) {
			for (const p of t.players) {
				playersByPid[p.pid] = p;
			}
		}
	}
	let stop = false;
	let text;
	let t: 0 | 1 | undefined;
	let textOnly = false;
	let prevGoal: PlayByPlayEvent | undefined;

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		const eAny = e as any;

		// Swap teams order, so home team is at bottom in box score
		const actualT = eAny.t === 0 ? 1 : eAny.t === 1 ? 0 : undefined;

		if (e.type !== "init" && !quarters.includes(e.quarter)) {
			quarters.push(e.quarter);
			boxScore.teams[0].ptsQtrs.push(0);
			boxScore.teams[1].ptsQtrs.push(0);

			const quarter = boxScore.teams[0].ptsQtrs.length;
			if (quarter > boxScore.numPeriods) {
				overtimes += 1;
				if (overtimes === 1) {
					boxScore.overtime = " (OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = ` (${overtimes}OT)`;
				}
				boxScore.quarter = `${helpers.ordinal(overtimes)} overtime`;
				boxScore.quarterShort = overtimes === 1 ? "OT" : `${overtimes}OT`;
			} else {
				boxScore.quarter = `${helpers.ordinal(quarter)} ${getPeriodName(
					boxScore.numPeriods,
				)}`;
				boxScore.quarterShort = `${getPeriodName(
					boxScore.numPeriods,
					true,
				)}${quarter}`;
			}

			if (e.type !== "stat" && e.type !== "playersOnIce") {
				boxScore.time = formatClock(e.clock);
			}
		}

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT!].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT!].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (e.pid != undefined) {
				const p = playersByPid[e.pid];
				if ((p as any)?.[e.s] !== undefined) {
					(p as any)[e.s] += e.amt;
				}
			}
			if (boxScore.teams[actualT!][e.s] !== undefined) {
				boxScore.teams[actualT!][e.s] += e.amt;
			}
		} else if (e.type === "playersOnIce") {
			for (const p of boxScore.teams[actualT!].players) {
				p.inGame = e.pids.includes(p.pid);
			}
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = playersByPid[e.injuredPID];
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			} else if (e.type === "penalty") {
				const p = playersByPid[e.penaltyPID];
				p.inPenaltyBox = true;
			} else if (e.type === "penaltyOver") {
				const p = playersByPid[e.penaltyPID];
				p.inPenaltyBox = false;
			}

			if (e.type === "goal") {
				prevGoal = e;
			}

			text = getText(e, boxScore);
			t = actualT;
			textOnly =
				e.type === "gameOver" || e.type === "quarter" || e.type === "overtime";
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
		t,
		text,
		textOnly,
	};
};

export default processLiveGameEvents;
