import { getPeriodName } from "../../common";
import { helpers } from "../../ui/util";
import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.hockey/PlayByPlayLogger";

// For strings of a format like 1:23 (times), which is greater? 1 for first, -1 for second, 0 for tie
const cmpTime = (t1: string, t2: string) => {
	const [min1, sec1] = t1.split(":").map(x => parseInt(x, 10));
	const [min2, sec2] = t2.split(":").map(x => parseInt(x, 10));

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

export const getText = (event: PlayByPlayEvent, numPeriods: number) => {
	if (event.type === "injury") {
		return `${event.names[0]} was injured!`;
	}
	if (event.type === "quarter") {
		return `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
			numPeriods,
		)}`;
	}
	if (event.type === "overtime") {
		return "Start of overtime";
	}
	if (event.type === "gameOver") {
		return "End of game";
	}
	if (event.type === "hit") {
		return `${event.names[0]} hit ${event.names[1]}`;
	}
	if (event.type === "gv") {
		return `Giveaway by ${event.names[0]}`;
	}
	if (event.type === "tk") {
		return `Takeaway by ${event.names[0]}`;
	}
	if (event.type === "slapshot") {
		return `Slapshot from ${event.names[0]}`;
	}
	if (event.type === "wristshot") {
		return `Wristshot by ${event.names[0]}`;
	}
	if (event.type === "shot") {
		return `Shot by ${event.names[0]}`;
	}
	if (event.type === "block") {
		return `Blocked by ${event.names[0]}`;
	}
	if (event.type === "miss") {
		return "Shot missed the goal";
	}
	if (event.type === "save") {
		return `Saved by ${event.names[0]}`;
	}
	if (event.type === "save-freeze") {
		return `Saved by ${event.names[0]}, and he freezes the puck`;
	}
	if (event.type === "faceoff") {
		return `${event.names[0]} wins the faceoff against ${event.names[1]}`;
	}
	if (event.type === "goal") {
		let text = "Goal!!!";
		if (event.names.length > 1) {
			text += ` (assist: ${event.names.slice(1).join(", ")})`;
		}
		return text;
	}
	if (event.type === "offensiveLineChange") {
		return "Offensive line change";
	}
	if (event.type === "fullLineChange") {
		return "Full line change";
	}
	if (event.type === "defensiveLineChange") {
		return "Defensive line change";
	}

	console.log(event);
	return `??? ${event.type}`;
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
	let prevText;
	let e2: PlayByPlayEvent | undefined;

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}
		e2 = e;

		// Swap teams order, so home team is at bottom in box score
		// @ts-ignore
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

			if (e.type !== "stat") {
				boxScore.time = formatClock(e.clock);
			}
		}

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (boxScore.teams[actualT].hasOwnProperty(e.s) && e.s !== "min") {
				if (e.pid !== undefined) {
					const p = boxScore.teams[actualT].players.find(
						(p2: any) => p2.pid === e.pid,
					);
					if (p === undefined) {
						console.log("Can't find player", e);
					}
					if (p) {
						p[e.s] += e.amt;
					}
				}
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = boxScore.teams[actualT].players.find(
					(p2: any) => p2.pid === e.injuredPID,
				);
				if (p === undefined) {
					console.log("Can't find injured player", e);
				}
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}

			prevText = text;
			text = getText(e, boxScore.numPeriods);
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
			} else if (event.quarter !== quarters[quarters.length - 1]) {
				// Past quarters
				event.hide = false;
			} else {
				// Current quarter - this is the normal way all events will be shown. Used to just check time, but then scoring summary would update at the beginning of a play, since the scoring event has the same timestamp. So now also check for the internal properties of the event object, since it should always come through as "e" from above. Don't check event.t because that gets flipped in box score display
				const show =
					cmpTime(formatClock(event.clock), boxScore.time) !== -1 &&
					prevText === getText(event, boxScore.numPeriods) &&
					e2 &&
					(e2 as any).clock === event.clock &&
					(e2 as any).quarter === event.quarter;
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
