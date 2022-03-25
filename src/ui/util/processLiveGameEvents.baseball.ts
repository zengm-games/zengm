import { getPeriodName } from "../../common";
import { helpers } from ".";
import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.baseball/PlayByPlayLogger";
import { DEFAULT_SPORT_STATE } from "../views/LiveGame";
import { POS_NUMBERS_INVERSE } from "../../common/constants.baseball";

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

type BoxScorePlayer = {
	name: string;
	pid: number;
};
type BoxScoreTeam = {
	abbrev: string;
	players: BoxScorePlayer[];
	ptsQtrs: number[];
};

let playersByPidGid: number | undefined;
let playersByPid: Record<number, BoxScorePlayer> = {};

const getName = (pid: number) => playersByPid[pid].name ?? "???";

const getDirectionInfield = (
	direction: Extract<PlayByPlayEvent, { type: "fly" }>["direction"],
) => {
	if (direction === "left" || direction === "right") {
		return `to the ${direction} side of the field`;
	}

	if (direction === "middle") {
		return "up the middle";
	}

	if (direction === "farLeft" || direction === "farLeftFoul") {
		return "down the 3rd base line";
	}

	if (direction === "farRight" || direction === "farRightFoul") {
		return "down the 1st base line";
	}

	throw new Error("Should never happen");
};

const getDirectionOutfield = (
	direction: Extract<PlayByPlayEvent, { type: "fly" }>["direction"],
) => {
	if (direction === "left" || direction === "right") {
		return `to ${direction} field`;
	}

	if (direction === "middle") {
		return "to center field";
	}

	if (direction === "farLeft" || direction === "farLeftFoul") {
		return "down the left field line";
	}

	if (direction === "farRight" || direction === "farRightFoul") {
		return "down the right field line";
	}

	throw new Error("Should never happen");
};

const getBaseName = (base: 1 | 2 | 3 | 4) => {
	if (base === 4) {
		return "home";
	}

	return helpers.ordinal(base);
};

const formatRunners = (
	runners: Extract<PlayByPlayEvent, { type: "walk" }>["runners"],
	{
		ignoreStationary,
	}: {
		ignoreStationary?: boolean;
	} = {},
) => {
	const filtered = runners.filter(
		runner => runner.to !== runner.from || !ignoreStationary,
	);

	const texts = [];
	const scored = [];
	for (const runner of filtered) {
		const name = getName(runner.pid);
		if (runner.out) {
			texts.push(`${name} out at ${getBaseName(runner.to)}.`);
		} else if (runner.from === runner.to) {
			if (!ignoreStationary) {
				texts.push(`${name} stays at ${getBaseName(runner.to)}.`);
			}
		} else if (runner.to === 4) {
			scored.push(name);
		} else {
			texts.push(`${name} advances to ${getBaseName(runner.to)}.`);
		}
	}

	if (scored.length === 1) {
		texts.push(`${scored[0]} scores.`);
	} else if (scored.length > 1) {
		let namesCombined;
		// @ts-expect-error
		if (Intl.ListFormat) {
			// @ts-expect-error
			namesCombined = new Intl.ListFormat("en").format(scored);
		} else {
			namesCombined = `${scored.length} runners`;
		}
		texts.push(`${namesCombined} score.`);
	}

	return texts.join(" ");
};

const getText = (
	event: PlayByPlayEvent,
	boxScore: {
		gid: number;
		numPeriods: number;
		time: string;
		teams: [BoxScoreTeam, BoxScoreTeam];
	},
) => {
	let text;

	switch (event.type) {
		case "sideStart": {
			text = `${event.t === 0 ? "Bottom" : "Top"} of the ${helpers.ordinal(
				event.inning,
			)}`;
			break;
		}
		case "sideOver": {
			text = "The side has been retired";
			break;
		}
		case "gameOver": {
			text = "End of game";
			break;
		}
		case "plateAppearance": {
			text = `${getName(event.pid)} steps to the plate`;
			break;
		}
		case "strike": {
			text = `${event.swinging ? "A swing and a miss" : "Called strike"} (${
				event.balls
			}-${event.strikes})`;
			break;
		}
		case "foul": {
			text = `Foul ball (${event.balls}-${event.strikes})`;
			break;
		}
		case "ball": {
			text = `${event.intentional ? "Intentional ball" : "Ball"} (${
				event.balls
			}-${event.strikes})`;
			break;
		}
		case "strikeOut": {
			text = event.swinging ? "He goes down swinging" : "Called strike three";
			break;
		}
		case "bunt": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `He lays down a ${speedText}bunt ${getDirectionInfield(
				event.direction,
			)}`;
			break;
		}
		case "ground": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `He hits a ${speedText}ground ball ${getDirectionInfield(
				event.direction,
			)}`;
			break;
		}
		case "line": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `He hits a ${speedText}line drive ${getDirectionInfield(
				event.direction,
			)}`;
			break;
		}
		case "fly": {
			if (event.distance === "infield") {
				text = `He hits a short popup ${getDirectionInfield(event.direction)}`;
			} else {
				const distanceText =
					event.distance !== "normal" ? `${event.distance} ` : "";
				text = `He hits a ${distanceText}fly ball ${getDirectionOutfield(
					event.direction,
				)}`;
			}
			break;
		}
		case "walk": {
			const runnerText = formatRunners(event.runners, {
				ignoreStationary: true,
			});
			text = `${event.intentional ? "Intentional walk" : "Ball 4"}, ${getName(
				event.pid,
			)} takes 1st base${runnerText ? `. ${runnerText}` : ""}`;
			break;
		}
		case "balk": {
			const runnerText = formatRunners(event.runners);
			text = `Balk!${runnerText ? ` ${runnerText}` : ""}`;
			break;
		}
		case "hitResult": {
			text = "";
			if (event.result === "error") {
				text = "ERROR TODO!";
			} else if (event.result === "hit") {
				if (event.numBases === 1) {
					text = "Single!";
				} else if (event.numBases === 2) {
					text = "Double!";
				} else if (event.numBases === 3) {
					text = "Triple!";
				} else {
					text = "Home run!";
				}
			} else if (event.result === "flyOut") {
				text = `Caught by the ${
					POS_NUMBERS_INVERSE[event.posDefense[0]]
				} for an out`;
			} else if (event.result === "throwOut") {
				text = `Fielded by the ${
					POS_NUMBERS_INVERSE[event.posDefense[0]]
				} and thrown out at 1st`;
			} else if (event.result === "fieldersChoice") {
				text = `He reaches ${getBaseName(
					event.numBases,
				)} on a fielder's choice`;
			} else if (event.result === "doublePlay") {
				text = "Double play!";
			}

			if (event.outAtNextBase) {
				if (!text.endsWith("!") && !text.endsWith(".")) {
					text += ".";
				}
				text += ` Thrown out advancing to ${getBaseName(
					(event.numBases + 1) as any,
				)}.`;
			}

			const runnersText = formatRunners(event.runners);

			if (runnersText) {
				if (!text.endsWith("!") && !text.endsWith(".")) {
					text += ".";
				}
				text += ` ${runnersText}`;
			}
			break;
		}
		default: {
			text = JSON.stringify(event);
			console.log(event);
		}
	}

	/*if (event.type === "injury") {
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
	}*/

	/*if (text === undefined) {
		throw new Error(`Invalid event type "${event.type}"`);
	}*/

	return text;
};

// Mutates boxScore!!!
const processLiveGameEvents = ({
	events,
	boxScore,
	overtimes,
	quarters,
	sportState,
}: {
	events: PlayByPlayEvent[];
	boxScore: {
		gid: number;
		quarter: string;
		numPeriods: number;
		overtime?: string;
		teams: [BoxScoreTeam, BoxScoreTeam];
		time: string;
		scoringSummary: PlayByPlayEventScore[];
	};
	overtimes: number;
	quarters: number[];
	sportState: {
		bases: [number | undefined, number | undefined, number | undefined];
		outs: number;
		balls: number;
		strikes: number;
	};
}) => {
	let stop = false;
	let text;
	let prevGoal: PlayByPlayEvent | undefined;

	if (!playersByPid || boxScore.gid !== playersByPidGid) {
		playersByPid = {};
		for (const t of boxScore.teams) {
			for (const p of t.players) {
				playersByPid[p.pid] = p;
			}
		}
	}

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		// Swap teams order, so home team is at bottom in box score
		// @ts-expect-error
		const actualT = e.t === 0 ? 1 : 0;

		if (e.type === "sideStart") {
			quarters.push(e.inning);
			boxScore.teams[actualT].ptsQtrs.push(0);

			if (actualT === 0) {
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
					boxScore.quarter = `${helpers.ordinal(
						ptsQtrs.length,
					)} ${getPeriodName(boxScore.numPeriods)}`;
				}
			}

			Object.assign(sportState, DEFAULT_SPORT_STATE);
		}

		if (e.type === "ball" || e.type === "strike" || e.type === "foul") {
			sportState.balls = e.balls;
			sportState.strikes = e.strikes;
		} else if (e.type === "plateAppearance") {
			sportState.balls = 0;
			sportState.strikes = 0;
		} else if (
			e.type === "hitResult" ||
			e.type === "strikeOut" ||
			e.type === "stealEnd"
		) {
			if (e.type === "strikeOut") {
				sportState.strikes = 3;
			}

			if (e.outs >= 3) {
				// Don't update bases, since it didn't happen
				sportState.outs = e.outs;
			} else {
				sportState.bases = e.bases;
				sportState.outs = e.outs;
			}
		} else if (e.type === "walk") {
			sportState.balls = 4;
			sportState.bases = e.bases;
		} else if (e.type === "balk") {
			sportState.bases = e.bases;
		}

		if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (e.pid != undefined) {
				const p = playersByPid[e.pid];
				if (p && p[e.s] !== undefined) {
					p[e.s] += e.amt;
				}
			}
			if (boxScore.teams[actualT].hasOwnProperty(e.s)) {
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type === "playersOnIce") {
			/*for (const p of boxScore.teams[actualT].players) {
				p.inGame = e.pids.includes(p.pid);
			}*/
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = playersByPid[e.injuredPID];
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}

			text = getText(e, boxScore);
			//boxScore.time = formatClock(e.clock);
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
		sportState,
		text,
	};
};

export default processLiveGameEvents;
