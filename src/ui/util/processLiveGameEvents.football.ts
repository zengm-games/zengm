import { getPeriodName } from "../../common";
import { isScoringPlay } from "../../common/isScoringPlay.football";
import { helpers, local } from "../../ui/util";
import type { PlayByPlayEvent } from "../../worker/core/GameSim.football/PlayByPlayLogger";

export type SportState = {
	awaitingAfterTouchdown: boolean;
	awaitingKickoff: boolean;
	t: 0 | 1;
	scrimmage: number;
	toGo: number;
	plays: {
		down: number;
		toGo: number;
		scrimmage: number;
		yards: number;
		texts: string[];
		scoreInfo: ReturnType<typeof getScoreInfo> | undefined;
		intendedPossessionChange: boolean; // For punts and kickoffs
		turnover: boolean;
		flags: (null | { text: string; accept: boolean })[];
		countsTowardsNumPlays: boolean;
		countsTowardsYards: boolean;
		tagOverride: string | undefined;
		subPlay: boolean; // subPlay is like a kick return or turnover return

		// Team with the ball after the play ends
		t: 0 | 1;
	}[];
	text: string;
	newPeriodText: string | undefined;
};

export const DEFAULT_SPORT_STATE: SportState = {
	awaitingAfterTouchdown: false,
	awaitingKickoff: true,
	t: 0,
	scrimmage: 0,
	toGo: 0,
	plays: [],
	text: "",
	newPeriodText: undefined,
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
		}penalties on the play${
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
		text = `Timeout, ${event.offense ? "offense" : "defense"} (${
			event.numLeft
		} remaining)`;
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

		const addNewPlay = ({
			down,
			toGo,
			scrimmage,
			intendedPossessionChange,
			subPlay,
		}: {
			down: number;
			toGo: number;
			scrimmage: number;
			intendedPossessionChange: boolean;
			subPlay: boolean;
		}) => {
			sportState.plays.push({
				t: actualT,
				down,
				toGo,
				scrimmage,
				yards: 0,
				texts: [],
				scoreInfo: undefined,
				intendedPossessionChange,
				turnover: false,
				flags: [],
				countsTowardsNumPlays: false,
				countsTowardsYards: false,
				tagOverride: undefined,
				subPlay,
			});
		};

		// Update team with possession
		if (
			e.type === "kickoffReturn" ||
			e.type === "puntReturn" ||
			e.type === "fumbleRecovery" ||
			e.type === "interception"
		) {
			const prevPlay = sportState.plays.at(-1)!;
			if (e.type === "fumbleRecovery" || e.type === "interception") {
				prevPlay.turnover = true;
			}

			const scrimmage = sportState.scrimmage + prevPlay.yards;

			addNewPlay({
				down: prevPlay.down,
				toGo: prevPlay.toGo,
				scrimmage,
				intendedPossessionChange: false,
				subPlay: true,
			});
		}

		if (e.type === "clock") {
			const awaitingKickoff = e.awaitingKickoff !== undefined;
			let textWithoutTime;

			if (!e.awaitingAfterTouchdown) {
				const time = formatClock(e.clock);

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
			}

			if (awaitingKickoff || sportState.t !== actualT) {
				sportState.t = actualT;
				sportState.plays = [];
			}
			sportState.awaitingAfterTouchdown = e.awaitingAfterTouchdown;
			sportState.awaitingKickoff = awaitingKickoff;
			sportState.text = textWithoutTime ?? "";
			sportState.newPeriodText = undefined;
			sportState.scrimmage = e.scrimmage;
			sportState.toGo = e.toGo;
			addNewPlay({
				down: e.down,
				toGo: e.toGo,
				scrimmage: e.scrimmage,
				intendedPossessionChange: awaitingKickoff,
				subPlay: false,
			});

			// After touchdown, scrimmage is moved weirdly for the XP
			if (!sportState.awaitingAfterTouchdown) {
				const prevPlay = sportState.plays.at(-2);
				if (prevPlay) {
					if (prevPlay.yards !== e.scrimmage - prevPlay.scrimmage) {
						console.log("YARDS MISMATCH");
						console.log(prevPlay.yards, e.scrimmage - prevPlay.scrimmage);
						debugger;
					}
					prevPlay.yards = e.scrimmage - prevPlay.scrimmage;
				}
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
			// This happens a tick after sportState is updated, which I think is okay
			boxScore.scoringSummary.pop();
		} else if (e.type === "quarter" || e.type === "overtime") {
			text = getText(e, boxScore.numPeriods);
			boxScore.time = formatClock(e.clock);
			stop = true;
			if (e.startsWithKickoff) {
				sportState.newPeriodText = text;
				sportState.plays = [];
			}
		} else if (e.type !== "init") {
			const play = sportState.plays.at(-1);
			if (!play) {
				throw new Error("Should never happen");
			}

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

				play.texts.push(
					text
						.replace("ABBREV0", boxScore.teams[1].abbrev)
						.replace("ABBREV1", boxScore.teams[0].abbrev),
				);
			}

			// A penalty might overturn a score or a turnover or multiple turnovers. In this case, we want to immediately update the play bar on the field, so it's no longer showing a turnover or score erroneously (looks weird after yardage changes). But we don't have the event for the actual reverted turnover/score yet. Solution? Look ahead and find it!
			const removeLastScoreOrTurnoversIfNecessary = () => {
				// Look at all events up until the next "clock" event, which is the start of the next play
				for (const event of events) {
					if (event.type === "clock") {
						break;
					}

					// For turnovers, look for a negative interception or a negative fumble recovery
					if (event.type === "stat") {
						if (
							event.amt === -1 &&
							(event.s === "defInt" || event.s === "defFmbRec")
						) {
							sportState.plays.pop();
						}
					}

					// For scoring, there is a dedicated removeLastScore event which we can use rather than looking for negative values of scoring stats
					if (event.type === "removeLastScore") {
						sportState.plays.at(-1)!.scoreInfo = undefined;
					}
				}
			};

			if (e.type === "flag") {
				play.flags.push(null);
			} else if (e.type === "penalty" && e.offsetStatus !== "offset") {
				// Only apply yardage from accepted penalties. Otherwise if there are 2 penalties on the same play, the end result would be the same, but yardage would show up when applying the first declined penatly, which ruins the drama.
				// Same for change of possession, don't want to show it early if 2 penatlies.
				const accept = e.decision === "accept";
				if (accept) {
					// Penalty could have changed possession
					const actualT2 = e.possessionAfter === 0 ? 1 : 0;
					if (play.t !== actualT2) {
						play.t = actualT2;
					}

					// For penalties before the snap, still count them
					if (!sportState.awaitingAfterTouchdown) {
						play.countsTowardsNumPlays = true;
						play.countsTowardsYards = true;
					}

					const reversedField = play.t !== sportState.t;
					let scrimmageAfter = e.scrimmageAfter;
					if (reversedField) {
						scrimmageAfter = 100 - scrimmageAfter;
					}
					play.yards = scrimmageAfter - play.scrimmage;

					removeLastScoreOrTurnoversIfNecessary();
				}

				const flagIndex = play.flags.indexOf(null);
				if (flagIndex >= 0) {
					play.flags[flagIndex] = {
						text: text!
							.replace("ABBREV0", boxScore.teams[1].abbrev)
							.replace("ABBREV1", boxScore.teams[0].abbrev),
						accept,
					};
				}
			} else if (e.type === "penaltyCount" && e.offsetStatus === "offset") {
				// Offsetting penalties don't make it this far in the penalty event, because they have are filtered out above. But we can find them here in penaltyCount, which corresponds with when text is generated for the play-by-play. No play since the down is replayed.
				// Maybe accepted penalties that lead to replaying the down should also be considered here, but I'm not totally sure how to find those (!e.tackOn penalty events maybe?) and I'm not sure it's actually useful to do that (can have weird stuff like a 5 yard drive from 0 plays). https://www.nflpenalties.com/blog/what-is-a-play? argues similarly
				play.countsTowardsNumPlays = false;
				play.yards = 0;

				removeLastScoreOrTurnoversIfNecessary();

				play.flags = play.flags.map(() => {
					return {
						text: text!,
						accept: false,
					};
				});
			} else if (
				e.type === "dropback" ||
				e.type === "handoff" ||
				e.type === "kneel"
			) {
				if (!sportState.awaitingAfterTouchdown) {
					play.countsTowardsNumPlays = true;
					play.countsTowardsYards = true;
				}
			}

			if (e.type === "kickoff") {
				// yds is the distance kicked to
				play.yards = 100 - sportState.scrimmage - e.yds;
			} else if (
				e.type === "kickoffReturn" ||
				e.type === "punt" ||
				e.type === "puntReturn" ||
				e.type === "fumbleRecovery" ||
				e.type === "interception" ||
				e.type === "sack" ||
				e.type === "passComplete" ||
				e.type === "run" ||
				e.type === "kneel"
			) {
				const reversedField = play.t !== sportState.t;

				if (e.type === "interception" || e.type === "fumbleRecovery") {
					// e.yds in interception/fumble is the return yards, ydsBefore is where the turnover actually happens
					play.yards += e.ydsBefore;
				}

				// Temporarily update with the from yardage in this play. Final value for next line of scrimmage comes in subsequent clock event
				play.yards += (reversedField ? -1 : 1) * e.yds;
			}

			if (
				e.type === "kickoff" ||
				e.type === "onsideKick" ||
				e.type === "punt"
			) {
				play.intendedPossessionChange = true;
			}

			// Extra fieldGoal check is to include missed field goals
			if ((e.type === "fieldGoal" || scoringSummary) && text) {
				const scoreInfo = getScoreInfo(text);
				if (
					scoreInfo.type !== null &&
					(scoreInfo.points > 0 || scoreInfo.type === "FG")
				) {
					play.scoreInfo = scoreInfo;
				}
			}

			if (e.type === "extraPointAttempt") {
				play.tagOverride = "XPA";
			} else if (e.type === "twoPointConversion") {
				play.tagOverride = "2PA";
			}
		}

		if (scoringSummary) {
			boxScore.scoringSummary.push({
				...e,
				quarter: quarters.length,
			});
		}
	}

	window.sportState = sportState;

	return {
		overtimes,
		possessionChange,
		quarters,
		sportState,
		text,
	};
};

export default processLiveGameEvents;
