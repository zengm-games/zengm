import { getPeriodName } from "../../common";
import { isScoringPlay } from "../../common/isScoringPlay.football";
import { helpers, local } from "../../ui/util";
import type { PlayByPlayEvent } from "../../worker/core/GameSim.football/PlayByPlayLogger";

export type SportState = {
	awaitingKickoff: boolean;
	t: 0 | 1;
	numPlays: number;
	initialScrimmage: number;
	scrimmage: number;
	toGo: number;
	plays: {
		down: number;
		toGo: number;
		scrimmage: number;
		yards: number;
		texts: string[];
		scoreInfos: ReturnType<typeof getScoreInfo>[];
		intendedChangeOfPossession: boolean; // For punts and kickoffs

		// Team with the ball after the play ends
		t: 0 | 1;
	}[];
	text: string;
};

export const DEFAULT_SPORT_STATE: SportState = {
	awaitingKickoff: true,
	t: 0,
	numPlays: 0,
	initialScrimmage: 0,
	scrimmage: 0,
	toGo: 0,
	plays: [],
	text: "",
};

export const scrimmageToFieldPos = (scrimmage: number) => {
	if (scrimmage === 50) {
		return "50 yd line";
	} else if (scrimmage > 50) {
		return `opp ${100 - scrimmage}`;
	} else {
		return `own ${scrimmage}`;
	}
};

export const getScoreInfo = (text: string) => {
	let type: "XP" | "FG" | "TD" | "2P" | "SF" | null = null;
	let points = 0;

	if (text.includes("extra point")) {
		type = "XP";
		if (text.includes("made")) {
			points = 1;
		}
	} else if (text.includes("field goal")) {
		type = "FG";
		if (text.includes("made")) {
			points = 3;
		}
	} else if (text.includes("touchdown")) {
		type = "TD";
		points = 6;
	} else if (text.toLowerCase().includes("two point")) {
		type = "2P";
		if (!text.includes("failed")) {
			points = 2;
		}
	} else if (text.includes("safety")) {
		type = "SF";

		// Safety is recorded as part of a play by the team with the ball, so for scoring purposes we need to swap the teams here and below
		points = 2;
	}

	return {
		type,
		points,
	};
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

const descriptionYdsTD = (
	yds: number,
	td: boolean,
	touchdownText: string,
	showYdsOnTD: boolean,
) => {
	if (td && showYdsOnTD) {
		return `${yds} yards${td ? ` and ${touchdownText}!` : ""}`;
	}

	if (td) {
		return `${touchdownText}!`;
	}

	return `${yds} yards`;
};

export const getText = (event: PlayByPlayEvent, numPeriods: number) => {
	// Handle touchdowns, 2 point conversions, and 2 point conversion returns by the defense
	let touchdownText = "a touchdown";
	let showYdsOnTD = true;

	const eAny = event as any;
	if (eAny.twoPointConversionTeam !== undefined) {
		if (eAny.twoPointConversionTeam === eAny.t) {
			touchdownText = "a two point conversion";
			showYdsOnTD = false;
		} else {
			touchdownText = "two points";
		}
	}

	let text: string | undefined;

	if (event.type === "injury") {
		text = `${event.names[0]} was injured!`;
	} else if (event.type === "quarter") {
		text = `Start of ${helpers.ordinal(event.quarter)} ${getPeriodName(
			numPeriods,
		)}`;
	} else if (event.type === "overtime") {
		text = `Start of ${
			event.overtimes === 1 ? "" : `${helpers.ordinal(event.overtimes)} `
		} overtime`;
	} else if (event.type === "gameOver") {
		text = "End of game";
	} else if (event.type === "kickoff") {
		text = `${event.names[0]} kicked off${
			event.touchback
				? " for a touchback"
				: event.yds < 0
				? " into the end zone"
				: ` to the ${event.yds} yard line`
		}`;
	} else if (event.type === "kickoffReturn") {
		text = `${event.names[0]} returned the kickoff ${event.yds} yards${
			event.td ? " for a touchdown!" : ""
		}`;
	} else if (event.type === "onsideKick") {
		text = `${event.names[0]} gets ready to attempt an onside kick`;
	} else if (event.type === "onsideKickRecovery") {
		text = `The onside kick was recovered by ${
			event.success
				? "the kicking team!"
				: `the receiving team${
						event.td ? " and returned for a touchdown!" : ""
				  }`
		}`;
	} else if (event.type === "punt") {
		text = `${event.names[0]} punted ${event.yds} yards${
			event.touchback
				? " for a touchback"
				: event.yds < 0
				? " into the end zone"
				: ""
		}`;
	} else if (event.type === "puntReturn") {
		text = `${event.names[0]} returned the punt ${event.yds} yards${
			event.td ? " for a touchdown!" : ""
		}`;
	} else if (event.type === "extraPoint") {
		text = `${event.names[0]} ${
			event.made ? "made" : "missed"
		} the extra point`;
	} else if (event.type === "fieldGoal") {
		text = `${event.names[0]} ${event.made ? "made" : "missed"} a ${
			event.yds
		} yard field goal`;
	} else if (event.type === "fumble") {
		text = `${event.names[0]} fumbled the ball!`;
	} else if (event.type === "fumbleRecovery") {
		if (event.safety || event.touchback) {
			text = `${
				event.names[0]
			} recovered the fumble in the endzone, resulting in a ${
				event.safety ? "safety!" : "touchback"
			}`;
		} else if (event.lost) {
			text = `${event.names[0]} recovered the fumble for the defense ${
				event.td && event.yds < 1
					? `in the endzone for ${touchdownText}!`
					: `and returned it ${event.yds} yards${
							event.td ? ` for ${touchdownText}!` : ""
					  }`
			}`;
		} else {
			text = `${event.names[0]} recovered the fumble for the offense${
				event.td ? ` and carried it into the endzone for ${touchdownText}!` : ""
			}`;
		}
	} else if (event.type === "interception") {
		text = `${event.names[0]} intercepted the pass `;
		if (event.touchback) {
			text += "in the endzone";
		} else {
			text += `and returned it ${event.yds} yards${
				event.td ? ` for ${touchdownText}!` : ""
			}`;
		}
	} else if (event.type === "sack") {
		text = `${event.names[0]} was sacked by ${event.names[1]} for a ${
			event.safety ? "safety!" : `${Math.abs(event.yds)} yard loss`
		}`;
	} else if (event.type === "dropback") {
		text = `${event.names[0]} drops back to pass`;
	} else if (event.type === "passComplete") {
		if (event.safety) {
			text = `${event.names[0]} completed a pass to ${
				event.names[1]
			} but ${helpers.pronoun(
				local.getState().gender,
				"he",
			)} was tackled in the endzone for a safety!`;
		} else {
			const result = descriptionYdsTD(
				event.yds,
				event.td,
				touchdownText,
				showYdsOnTD,
			);
			text = `${event.names[0]} completed a pass to ${event.names[1]} for ${result}`;
		}
	} else if (event.type === "passIncomplete") {
		text = `Incomplete pass to ${event.names[1]}`;
	} else if (event.type === "handoff") {
		if (event.names.length > 1) {
			// If names.length is 1, its a QB keeper, no need to log the handoff
			text = `${event.names[0]} hands the ball off to ${event.names[1]}`;
		}
	} else if (event.type === "run") {
		if (event.safety) {
			text = `${event.names[0]} was tackled in the endzone for a safety!`;
		} else {
			const result = descriptionYdsTD(
				event.yds,
				event.td,
				touchdownText,
				showYdsOnTD,
			);
			text = `${event.names[0]} rushed for ${result}`;
		}
	} else if (event.type === "penaltyCount") {
		text = `There are ${event.count} ${
			event.offsetStatus === "offset" ? "offsetting " : ""
		}fouls on the play${
			event.offsetStatus === "offset"
				? ", the previous down will be replayed"
				: ""
		}`;
	} else if (event.type === "penalty") {
		text = `Penalty, ABBREV${event.t} - ${event.penaltyName.toLowerCase()}${
			event.names.length > 0 ? ` on ${event.names[0]}` : ""
		}`;

		if (event.offsetStatus !== "offset") {
			const spotFoulText = event.tackOn
				? " from the end of the play"
				: event.spotFoul
				? " from the spot of the foul"
				: "";
			const automaticFirstDownText = event.automaticFirstDown
				? " and an automatic first down"
				: "";
			if (event.halfDistanceToGoal) {
				text += `, half the distance to the goal${spotFoulText}`;
			} else if (event.placeOnOne) {
				text += `, the ball will be placed at the 1 yard line${automaticFirstDownText}`;
			} else {
				text += `, ${event.yds} yards${spotFoulText}${automaticFirstDownText}`;
			}

			let decisionText;
			if (event.offsetStatus === "overrule") {
				decisionText = event.decision === "accept" ? "enforced" : "overruled";
			} else {
				decisionText = event.decision === "accept" ? "accepted" : "declined";
			}

			text += ` - ${decisionText}`;
		}
	} else if (event.type === "timeout") {
		text = `Time out, ${event.offense ? "offense" : "defense"}`;
	} else if (event.type === "twoMinuteWarning") {
		text = "Two minute warning";
	} else if (event.type === "kneel") {
		text = `${event.names[0]} kneels`;
	} else if (event.type === "flag") {
		text = "Flag on the play";
	} else if (event.type === "extraPointAttempt") {
		text = "Extra point attempt";
	} else if (event.type === "twoPointConversion") {
		text = "Two point conversion attempt";
	} else if (event.type === "twoPointConversionFailed") {
		text = "Two point conversion failed";
	} else if (event.type === "turnoverOnDowns") {
		text = "Turnover on downs";
	} else {
		throw new Error(`No text for "${event.type}"`);
	}

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
	boxScore: any;
	overtimes: number;
	quarters: string[];
	sportState: SportState;
}) => {
	let stop = false;
	let text;
	let possessionChange: boolean = false;

	// Would be better to use event type, if it was available here like in hockey
	const possessionChangeTexts = [
		" kicked off ",
		" punted ",
		" recovered the fumble for the defense",
		" recovered the fumble in the endzone, resulting in a safety!",
		" intercepted the pass ",
		" gets ready to attempt an onside kick",
		"Turnover on downs",
	];

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		// Swap teams order, so home team is at bottom in box score
		const actualT = (e as any).t === 0 ? 1 : 0;

		const scoringSummary = isScoringPlay(e);

		let quarterText;
		if (quarters.length === 0) {
			quarterText = "Q1";
		} else if (e.type === "quarter") {
			quarterText = `Q${e.quarter}`;
		} else if (e.type === "overtime") {
			quarterText = `OT${e.overtimes}`;
		}

		if (quarterText !== undefined && !quarters.includes(quarterText)) {
			quarters.push(quarterText);
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

			if ((e as any).clock !== undefined) {
				boxScore.time = formatClock((e as any).clock);
			}
		}

		if (e.type === "clock") {
			const time = formatClock(e.clock);

			let textWithoutTime;
			const awaitingKickoff = e.awaitingKickoff !== undefined;
			if (awaitingKickoff) {
				textWithoutTime = `${boxScore.teams[actualT].abbrev} kicking off`;
			} else {
				const fieldPos = scrimmageToFieldPos(e.scrimmage);

				textWithoutTime = `${
					boxScore.teams[actualT].abbrev
				} ball, ${helpers.ordinal(e.down)} & ${e.toGo}, ${fieldPos}`;
			}
			text = `${time} - ${textWithoutTime}`;

			boxScore.time = time;
			stop = true;

			if (awaitingKickoff || sportState.t !== actualT) {
				sportState.t = actualT;
				sportState.numPlays = 0;
				sportState.initialScrimmage = e.scrimmage;
				sportState.plays = [];
			}
			sportState.awaitingKickoff = awaitingKickoff;
			sportState.text = textWithoutTime;
			sportState.scrimmage = e.scrimmage;
			sportState.toGo = e.toGo;
			sportState.plays.push({
				t: actualT,
				down: e.down,
				toGo: e.toGo,
				scrimmage: e.scrimmage,
				yards: 0,
				texts: [],
				scoreInfos: [],
				intendedChangeOfPossession: false,
			});

			const prevPlay = sportState.plays.at(-2);
			if (prevPlay) {
				prevPlay.yards = e.scrimmage - prevPlay.scrimmage;
			}
		} else if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (boxScore.teams[actualT][e.s] !== undefined && e.s !== "min") {
				if (e.pid !== undefined) {
					const p = boxScore.teams[actualT].players.find(
						(p2: any) => p2.pid === e.pid,
					);
					if (p === undefined) {
						console.log("Can't find player", e);
					}
					if (p) {
						if (e.s.endsWith("Lng")) {
							p[e.s] = e.amt;
						} else {
							p[e.s] += e.amt;
						}
					}
				}
				boxScore.teams[actualT][e.s] += e.amt;
			}
		} else if (e.type === "removeLastScore") {
			boxScore.scoringSummary.pop();
		} else if (e.type !== "init") {
			const initialText = getText(e, boxScore.numPeriods);
			if (initialText !== undefined) {
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

				possessionChange =
					possessionChangeTexts.some(text => initialText.includes(text)) ||
					!!initialText.match(/missed.*yard field goal/);

				// Must include parens so it does not collide with ABBREV0 and ABBREV1 for penalties lol
				text = initialText.replace(
					"(ABBREV)",
					`(${boxScore.teams[actualT].abbrev})`,
				);
				boxScore.time = formatClock(e.clock);
				stop = true;

				const play = sportState.plays.at(-1);
				if (!play) {
					throw new Error("Should never happen");
				}
				play.texts.push(
					text
						.replace("ABBREV0", boxScore.teams[1].abbrev)
						.replace("ABBREV1", boxScore.teams[0].abbrev),
				);

				// Update team with possession
				if (
					e.type === "kickoffReturn" ||
					e.type === "puntReturn" ||
					e.type === "fumbleRecovery" ||
					e.type === "interception"
				) {
					play.t = actualT;
				}
				if (e.type === "penalty") {
					// Penalty could have changed possession
					const actualT2 = e.possessionAfterPenalty === 0 ? 1 : 0;
					play.t = actualT2;
				}

				if (e.type === "kickoff") {
					// yds is the distance kicked to
					play.yards = 100 - sportState.initialScrimmage - e.yds;
				} else if (
					e.type === "kickoffReturn" ||
					e.type === "punt" ||
					e.type === "puntReturn" ||
					e.type === "fumbleRecovery" ||
					e.type === "interception" ||
					e.type === "sack" ||
					e.type === "passComplete" ||
					e.type === "run" ||
					e.type === "penalty"
				) {
					let reversedField = play.t !== sportState.t;

					// Penalty on offense
					if (
						e.type === "penalty" &&
						actualT === play.t &&
						e.decision === "accept"
					) {
						reversedField = !reversedField;
					}

					// Temporarily update with the from yardage in this play. Final value for next line of scrimmage comes in subsequent clock event
					play.yards += (reversedField ? -1 : 1) * e.yds;
				}

				if (
					e.type === "kickoff" ||
					e.type === "onsideKick" ||
					e.type === "punt"
				) {
					play.intendedChangeOfPossession = true;
				}

				if (scoringSummary) {
					const scoreInfo = getScoreInfo(text);
					if (scoreInfo.type !== null && scoreInfo.points > 0) {
						play.scoreInfos.push(scoreInfo);
					}
				}
			}
		}

		if (scoringSummary) {
			boxScore.scoringSummary.push({
				...e,
				quarter: quarters.length,
			});
		}
	}

	return {
		overtimes,
		possessionChange,
		quarters,
		sportState,
		text,
	};
};

export default processLiveGameEvents;
