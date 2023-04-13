import { getPeriodName } from "../../common";
import { helpers, local } from ".";
import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.baseball/PlayByPlayLogger";
import { DEFAULT_SPORT_STATE } from "../views/LiveGame";
import {
	NUM_OUTS_PER_INNING,
	POS_NUMBERS_INVERSE,
} from "../../common/constants.baseball";
import type { PlayerInjury } from "../../common/types";

export type BoxScorePlayer = {
	name: string;
	pid: number;
	injury: PlayerInjury;
};
type BoxScoreTeam = {
	abbrev: string;
	players: BoxScorePlayer[];
	ptsQtrs: number[];
};

let playersByPidGid: number | undefined;
export let playersByPid: Record<number, BoxScorePlayer> = {};

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
	getName: (pid: number) => string,
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
		if (Intl.ListFormat) {
			namesCombined = new Intl.ListFormat("en").format(scored);
		} else {
			namesCombined = `${scored.length} runners`;
		}
		texts.push(`${namesCombined} score.`);
	}

	return texts.join(" ");
};

export const getText = (
	event: PlayByPlayEvent,
	getName: (pid: number) => string,
) => {
	let text;

	let bold = false;

	switch (event.type) {
		case "sideStart": {
			text = `${event.t === 0 ? "Bottom" : "Top"} of the ${helpers.ordinal(
				event.inning,
			)}`;
			bold = true;
			break;
		}
		case "sideOver": {
			text = "The side has been retired";
			bold = true;
			break;
		}
		case "gameOver": {
			text = "End of game";
			bold = true;
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
			text = `Ball (${event.balls}-${event.strikes})`;
			break;
		}
		case "strikeOut": {
			text = event.swinging
				? `${helpers.pronoun(local.getState().gender, "He")} goes down swinging`
				: "Called strike three";
			bold = true;
			break;
		}
		case "bunt": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `${helpers.pronoun(
				local.getState().gender,
				"He",
			)} lays down a ${speedText}bunt ${getDirectionInfield(event.direction)}`;
			break;
		}
		case "ground": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `${helpers.pronoun(
				local.getState().gender,
				"He",
			)} hits a ${speedText}ground ball ${getDirectionInfield(
				event.direction,
			)}`;
			break;
		}
		case "line": {
			const speedText = event.speed !== "normal" ? `${event.speed} ` : "";
			text = `${helpers.pronoun(
				local.getState().gender,
				"He",
			)} hits a ${speedText}line drive ${getDirectionInfield(event.direction)}`;
			break;
		}
		case "fly": {
			if (event.distance === "infield") {
				text = `${helpers.pronoun(
					local.getState().gender,
					"He",
				)} hits a short popup ${getDirectionInfield(event.direction)}`;
			} else if (event.distance === "noDoubter") {
				text = `${helpers.pronoun(
					local.getState().gender,
					"He",
				)} crushes it ${getDirectionOutfield(event.direction)}`;
			} else {
				const distanceText =
					event.distance !== "normal" ? `${event.distance} ` : "";
				text = `${helpers.pronoun(
					local.getState().gender,
					"He",
				)} hits a ${distanceText}fly ball ${getDirectionOutfield(
					event.direction,
				)}`;
			}
			break;
		}
		case "walk": {
			const runnerText = formatRunners(getName, event.runners, {
				ignoreStationary: true,
			});
			text = `${event.intentional ? "Intentional walk" : "Ball 4"}, ${getName(
				event.pid,
			)} takes 1st base${runnerText ? `. ${runnerText}` : ""}`;
			bold = true;
			break;
		}
		case "hitByPitch": {
			const runnerText = formatRunners(getName, event.runners, {
				ignoreStationary: true,
			});
			text = `${helpers.pronoun(
				local.getState().gender,
				"He",
			)}'s hit by the pitch! ${getName(event.pid)} takes 1st base${
				runnerText ? `. ${runnerText}` : ""
			}`;
			bold = true;
			break;
		}
		case "balk": {
			const runnerText = formatRunners(getName, event.runners);
			text = `Balk!${runnerText ? ` ${runnerText}` : ""}`;
			bold = true;
			break;
		}
		case "passedBall": {
			const runnerText = formatRunners(getName, event.runners);
			text = `Passed ball!${runnerText ? ` ${runnerText}` : ""}`;
			bold = true;
			break;
		}
		case "wildPitch": {
			const runnerText = formatRunners(getName, event.runners);
			text = `Wild pitch!${runnerText ? ` ${runnerText}` : ""}`;
			bold = true;
			break;
		}
		case "hitResult": {
			text = "";
			if (event.result === "error") {
				text = `${helpers.pronoun(
					local.getState().gender,
					"He",
				)} reaches ${getBaseName(event.numBases)} on an error by ${getName(
					event.pidError,
				)}!`;
			} else if (event.result === "hit") {
				if (event.numBases === 1) {
					text = "Single!";
				} else if (event.numBases === 2) {
					text = "Double!";
				} else if (event.numBases === 3) {
					text = "Triple!";
				} else if (event.runners.length === 3) {
					text = "Grand slam!";
				} else {
					text = "Home run!";
				}
			} else if (event.result === "flyOut") {
				text = `Caught by the ${
					POS_NUMBERS_INVERSE[event.posDefense[0]]
				} for an out`;
			} else if (event.result === "throwOut") {
				if (event.posDefense[0] === 3) {
					text = `Fielded by the ${
						POS_NUMBERS_INVERSE[event.posDefense[0]]
					} and forced out at 1st`;
				} else {
					text = `Fielded by the ${
						POS_NUMBERS_INVERSE[event.posDefense[0]]
					} and thrown out at 1st`;
				}
			} else if (event.result === "fieldersChoice") {
				if (event.outs === NUM_OUTS_PER_INNING) {
					text = "Fielder's choice,";
				}
				text = `${helpers.pronoun(
					local.getState().gender,
					"He",
				)} reaches ${getBaseName(event.numBases)} on a fielder's choice`;
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

			let runnersText;
			if (
				event.outs === NUM_OUTS_PER_INNING &&
				event.runners.every(runner => !runner.out) &&
				!event.outAtNextBase
			) {
				// If there are 3 outs and no runner is out, then the hitter was out, in which case we don't need any runnersText
				runnersText = "";
			} else {
				runnersText = formatRunners(getName, event.runners);
			}

			if (runnersText) {
				if (!text.endsWith("!") && !text.endsWith(".") && !text.endsWith(",")) {
					text += ".";
				}
				text += ` ${runnersText}`;
			}

			bold = true;

			break;
		}
		case "stealStartAll": {
			text = "The runners all start moving on the pitch";
			break;
		}
		case "stealStart": {
			text = `${getName(event.pid)} breaks for ${getBaseName(
				event.to,
			)} on the pitch`;
			break;
		}
		case "stealEnd": {
			if (event.out) {
				text = `${getName(event.pid)} is thrown out at ${getBaseName(
					event.to,
				)}`;
			} else if (event.throw) {
				text = `${getName(
					event.pid,
				)} beats the throw and is safe at ${getBaseName(event.to)}`;
			} else {
				text = `${getName(event.pid)} steals ${getBaseName(
					event.to,
				)} with no throw`;
			}
			bold = true;
			break;
		}
		case "injury": {
			text = `${getName(event.pid)} was injured on the play!`;

			if (event.replacementPid !== undefined) {
				text += ` ${getName(
					event.replacementPid,
				)} comes on to replace ${helpers.pronoun(
					local.getState().gender,
					"him",
				)}.`;
			}

			bold = true;

			break;
		}
		case "reliefPitcher": {
			text = `Pitching change! ${getName(event.pidOn)} comes on for ${getName(
				event.pidOff,
			)}.`;
			bold = true;
			break;
		}
		default: {
			text = JSON.stringify(event);
			console.log(event);
		}
	}

	return {
		bold,
		text,
	};
};

export type SportState = {
	bases: [number | undefined, number | undefined, number | undefined];
	outs: number;
	balls: number;
	strikes: number;
	batterPid: number;
	pitcherPid: number;
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
		quarterShort: string;
		numPeriods: number;
		overtime?: string;
		teams: [BoxScoreTeam, BoxScoreTeam];
		time: string;
		scoringSummary: PlayByPlayEventScore[];
	};
	overtimes: number;
	quarters: number[];
	sportState: SportState;
}) => {
	let stop = false;
	let text;
	let bold = false;

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
				const inning = boxScore.teams[0].ptsQtrs.length;
				if (inning > boxScore.numPeriods) {
					overtimes += 1;
					boxScore.overtime = ` (${boxScore.numPeriods + overtimes})`;
				}
				const ordinal = helpers.ordinal(inning);
				boxScore.quarter = `${ordinal} ${getPeriodName(boxScore.numPeriods)}`;
				boxScore.quarterShort = `${inning}`;
			}

			Object.assign(sportState, DEFAULT_SPORT_STATE);
			sportState.pitcherPid = e.pitcherPid;
			sportState.batterPid = -1;
		} else if (e.type === "reliefPitcher") {
			sportState.pitcherPid = e.pidOn;
		} else if (e.type === "ball" || e.type === "strike" || e.type === "foul") {
			sportState.balls = e.balls;
			sportState.strikes = e.strikes;
		} else if (e.type === "plateAppearance") {
			sportState.balls = 0;
			sportState.strikes = 0;
			sportState.batterPid = e.pid;
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
			if (!e.intentional) {
				sportState.balls = 4;
			}
			sportState.bases = e.bases;
		} else if (
			e.type === "balk" ||
			e.type === "wildPitch" ||
			e.type === "passedBall" ||
			e.type === "hitByPitch"
		) {
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
				// @ts-expect-error
				if (p && p[e.s] !== undefined) {
					// @ts-expect-error
					p[e.s] += e.amt;
				}
			}
			if (Object.hasOwn(boxScore.teams[actualT], e.s)) {
				// @ts-expect-error
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type !== "init") {
			if (e.type === "injury") {
				const p = playersByPid[e.pid];
				p.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}

			const output = getText(e, getName);
			text = output.text;
			bold = output.bold;

			stop = true;
		}
	}

	return {
		bold,
		overtimes,
		quarters,
		sportState,
		text,
	};
};

export default processLiveGameEvents;
