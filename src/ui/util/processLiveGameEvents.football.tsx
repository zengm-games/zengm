import { getPeriodName } from "../../common";
import { formatScoringSummaryEvent } from "../../common/formatScoringSummaryEvent.football";
import { helpers, local } from ".";
import type { PlayByPlayEvent } from "../../worker/core/GameSim.football/PlayByPlayLogger";
import type { ReactNode } from "react";

let playersByPidGid: number | undefined;
let playersByPid:
	| Record<
			number,
			{
				name: string;
				inGame: boolean;
			}
	  >
	| undefined;

export type SportState = {
	awaitingAfterTouchdown: boolean;
	awaitingKickoff: boolean;
	awaitingShootout: boolean;
	t: 0 | 1;
	scrimmage: number;
	toGo: number;
	plays: {
		down: number;
		toGo: number;
		scrimmage: number;
		yards: number;
		texts: ReactNode[];
		scoreInfo: ReturnType<typeof getScoreInfo> | undefined;
		intendedPossessionChange: boolean; // For punts and kickoffs
		turnover: boolean;
		flags: (null | { text: ReactNode; accept: boolean })[];
		countsTowardsNumPlays: boolean;
		countsTowardsYards: boolean;
		tagOverride: string | undefined;
		subPlay: boolean; // subPlay is like a kick return or turnover return

		// Team with the ball after the play ends
		t: 0 | 1;
	}[];
	text: string;
	newPeriodText: ReactNode | undefined;
};

export const DEFAULT_SPORT_STATE: SportState = {
	awaitingAfterTouchdown: false,
	awaitingKickoff: true,
	awaitingShootout: false,
	t: 0,
	scrimmage: 0,
	toGo: 0,
	plays: [],
	text: "",
	newPeriodText: undefined,
};

export const scrimmageToFieldPos = (
	scrimmage: number,
	ownAbbrev: string,
	oppAbbrev: string,
) => {
	if (scrimmage === 50) {
		return "50 yd line";
	} else if (scrimmage > 50) {
		return `${oppAbbrev} ${100 - scrimmage}`;
	} else {
		return `${ownAbbrev} ${scrimmage}`;
	}
};

export const getScoreInfo = (event: PlayByPlayEvent) => {
	let type: "XP" | "FG" | "TD" | "2P" | "SF" | "SH" | undefined;
	let long: string | undefined;
	let points = 0;
	let sPts = 0;

	const eAny = event as any;

	if (event.type === "extraPoint") {
		type = "XP";
		long = "Extra point";
		if (event.made) {
			points = 1;
		}
	} else if (event.type === "fieldGoal") {
		type = "FG";
		long = "Field goal";
		if (event.made) {
			points = 3;
		}
	} else if (event.type === "shootoutShot") {
		type = "SH";
		long = "Shootout";
		if (event.made) {
			sPts = 1;
		}
	} else if (eAny.td) {
		if (eAny.twoPointConversionTeam !== undefined) {
			type = "2P";
			long = "Two-point conversion";
			points = 2;
		} else {
			type = "TD";
			long = "Touchdown";
			points = 6;
		}
	} else if (event.type === "twoPointConversionFailed") {
		type = "2P";
		long = "Two-point conversion";
	} else if (eAny.safety) {
		type = "SF";
		long = "Safety";

		// Safety is recorded as part of a play by the team with the ball, so for scoring purposes we need to swap the teams here and below
		points = 2;
	}

	if (type !== undefined && long !== undefined) {
		const scoreInfo = {
			type,
			long,
			points,
			sPts: undefined as undefined | number,
		};
		if (sPts > 0) {
			return {
				...scoreInfo,
				sPts,
			};
		}

		return scoreInfo;
	}
};

// This is needed for scoringSummary in box scores from back when the events were stored as text
export const getScoreInfoOld = (text: string) => {
	let type: "XP" | "FG" | "TD" | "2P" | "SF" | undefined;
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

	if (type !== undefined) {
		return {
			type,
			long: "",
			points,
			sPts: undefined as undefined | number,
		};
	}
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

export const formatDownAndDistance = (
	down: number,
	toGo: number,
	scrimmage: number,
) => {
	const toGoText = scrimmage + toGo >= 100 ? "goal" : toGo;

	return `${helpers.ordinal(down)} & ${toGoText}`;
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
			touchdownText = "a two-point conversion";
			showYdsOnTD = false;
		} else {
			touchdownText = "two points";
		}
	}

	let text: ReactNode | undefined;

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
			text = (
				<>
					{event.lost ? (
						<>
							<span className="text-danger">Turnover!</span>{" "}
						</>
					) : (
						""
					)}
					{event.names[0]} recovered the fumble in the endzone, resulting in a{" "}
					{event.safety ? "safety!" : "touchback"}
				</>
			);
		} else if (event.lost) {
			text = (
				<>
					<span className="text-danger">Turnover!</span> {event.names[0]}{" "}
					recovered the fumble
					{event.td && event.yds < 1
						? ` in the endzone for ${touchdownText}!`
						: ` and returned it ${event.yds} yards${
								event.td ? ` for ${touchdownText}!` : ""
							}`}
				</>
			);
		} else {
			text = `${event.names[0]} recovered the fumble${
				event.td ? ` and carried it into the endzone for ${touchdownText}!` : ""
			}`;
		}
	} else if (event.type === "interception") {
		text = (
			<span className="text-danger">Intercepted by {event.names[0]}!</span>
		);
	} else if (event.type === "interceptionReturn") {
		text = `${event.names[0]} `;
		if (event.touchback) {
			text += "stays in the endzone for a touchback";
		} else {
			text += `returned the interception ${event.yds} yards${
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
		let decisionText;
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

			const innerText =
				event.decision === "accept" ? (
					<>
						{event.offsetStatus === "overrule" ? "enforced" : "accepted"}{" "}
						<span className="glyphicon glyphicon-stop text-danger" />
					</>
				) : (
					<>
						{event.offsetStatus === "overrule" ? "overruled" : "declined"}{" "}
						<span className="glyphicon glyphicon-stop text-secondary" />
					</>
				);
			decisionText = (
				<>
					{" "}
					- <b>{innerText}</b>
				</>
			);
		}

		text = (
			<>
				Penalty - {event.penaltyName.toLowerCase()}
				{event.names.length > 0 ? ` on ${event.names[0]}` : ""}
				{decisionText}
			</>
		);
	} else if (event.type === "timeout") {
		text = `Timeout, ${event.offense ? "offense" : "defense"} (${
			event.numLeft
		} remaining)`;
	} else if (event.type === "twoMinuteWarning") {
		text = "Two minute warning";
	} else if (event.type === "kneel") {
		text = `${event.names[0]} kneels`;
	} else if (event.type === "flag") {
		text = (
			<>
				<span className="glyphicon glyphicon-stop text-warning" /> Flag on the
				play <span className="glyphicon glyphicon-stop text-warning" />
			</>
		);
	} else if (event.type === "extraPointAttempt") {
		text = "Extra point attempt";
	} else if (event.type === "twoPointConversion") {
		text = "Two-point conversion attempt";
	} else if (event.type === "twoPointConversionFailed") {
		text = "Two-point conversion failed";
	} else if (event.type === "turnoverOnDowns") {
		text = <span className="text-danger">Turnover on downs</span>;
	} else if (event.type === "shootoutStart") {
		text = `The game will now be decided by a field goal shootout with ${event.rounds} rounds!`;
	} else if (event.type === "shootoutShot") {
		text = `Kick ${event.att}: ${event.names[0]} ${event.made ? "made" : "missed"} a ${
			event.yds
		} yard field goal`;
	} else if (event.type === "shootoutTie") {
		text = `The shootout is tied! Teams will alternate kicks until there is a winner`;
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
	if (
		!playersByPid ||
		boxScore.gid !== playersByPidGid ||
		events[0]?.type === "init"
	) {
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
	let possessionChange: boolean = false;

	while (!stop && events.length > 0) {
		const e = events.shift();
		if (!e) {
			continue;
		}

		const eAny = e as any;

		// Swap teams order, so home team is at bottom in box score
		const actualT = eAny.t === 0 ? 1 : eAny.t === 1 ? 0 : undefined;
		const otherT = actualT === 0 ? 1 : 0;

		const scoringSummaryEvent = formatScoringSummaryEvent(e, quarters.length);
		if (scoringSummaryEvent) {
			// Swap rather than using actualT in case it's a score for the other team
			(scoringSummaryEvent as any).t =
				(scoringSummaryEvent as any).t === 0 ? 1 : 0;
		}

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
					boxScore.overtime = "(OT)";
				} else if (overtimes > 1) {
					boxScore.overtime = `(${overtimes}OT)`;
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
			tOverride,
		}: {
			down: number;
			toGo: number;
			scrimmage: number;
			intendedPossessionChange: boolean;
			subPlay: boolean;
			tOverride?: 0 | 1;
		}) => {
			const t = tOverride ?? actualT;
			if (t === undefined) {
				throw new Error("Should never happen");
			}
			sportState.plays.push({
				t,
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

		if (e.type === "shootoutStart") {
			boxScore.shootout = true;
			boxScore.teams[0].sPts = 0;
			boxScore.teams[0].sAtt = 0;
			boxScore.teams[1].sPts = 0;
			boxScore.teams[1].sAtt = 0;

			sportState.plays = [];
			sportState.awaitingAfterTouchdown = false;
			sportState.awaitingKickoff = false;
			sportState.awaitingShootout = true;
			sportState.scrimmage = 1;
			sportState.toGo = 10;
			sportState.t = 0;
			addNewPlay({
				down: 1,
				toGo: 10,
				scrimmage: 100 - 33,
				intendedPossessionChange: false,
				subPlay: false,
				tOverride: 0,
			});
		}

		// Update team with possession
		if (
			e.type === "kickoffReturn" ||
			e.type === "puntReturn" ||
			e.type === "fumbleRecovery" ||
			e.type === "interceptionReturn"
		) {
			const prevPlay = sportState.plays.at(-1)!;
			if (e.type === "fumbleRecovery" && e.lost) {
				prevPlay.turnover = true;
			}
			if (e.type === "fumbleRecovery") {
				// e.yds in fumble is the return yards, ydsBefore is where the turnover actually happens
				prevPlay.yards += e.ydsBefore;
			}

			const scrimmage = prevPlay.scrimmage + prevPlay.yards;

			addNewPlay({
				down: prevPlay.down,
				toGo: prevPlay.toGo,
				scrimmage,
				intendedPossessionChange: false,
				subPlay: true,
			});
		}

		if (e.type === "shootoutShot") {
			if (sportState.awaitingShootout) {
				sportState.plays.pop();
				sportState.awaitingShootout = false;
			}

			addNewPlay({
				down: 1,
				toGo: 10,
				scrimmage: actualT === 1 ? 33 : 100 - 33,
				intendedPossessionChange: false,
				subPlay: false,
			});
		}

		if (e.type === "clock") {
			const awaitingKickoff = e.awaitingKickoff !== undefined;

			const textParts = [];
			if (!e.awaitingAfterTouchdown) {
				const time = formatClock(e.clock);

				if (awaitingKickoff) {
					textParts.push("Kick off");
				} else {
					const fieldPos = scrimmageToFieldPos(
						e.scrimmage,
						boxScore.teams[actualT!].abbrev,
						boxScore.teams[otherT].abbrev,
					);

					textParts.push(formatDownAndDistance(e.down, e.toGo, e.scrimmage));
					textParts.push(fieldPos);
				}
				t = actualT;

				text = (
					<>
						{time}
						{textParts.map((part, i) => (
							<span className={`ps-3${i === 0 ? " fw-bold" : ""}`} key={i}>
								{part}
							</span>
						))}
					</>
				);
				boxScore.time = time;
				stop = true;
			}

			if (
				actualT !== undefined &&
				(awaitingKickoff || sportState.t !== actualT)
			) {
				sportState.t = actualT;
				sportState.plays = [];
			}
			sportState.awaitingAfterTouchdown = e.awaitingAfterTouchdown;
			sportState.awaitingKickoff = awaitingKickoff;
			sportState.text = textParts.join(", ");
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
						console.log(
							"Yards mismatch",
							prevPlay.yards,
							e.scrimmage,
							sportState,
							e,
						);
					}
					prevPlay.yards = e.scrimmage - prevPlay.scrimmage;
				}
			}

			boxScore.possession = actualT;
		} else if (e.type === "stat") {
			// Quarter-by-quarter score
			if (e.s === "pts") {
				const ptsQtrs = boxScore.teams[actualT!].ptsQtrs;
				ptsQtrs[ptsQtrs.length - 1] += e.amt;
				boxScore.teams[actualT!].ptsQtrs = ptsQtrs;
			}

			// Everything else
			if (boxScore.teams[actualT!][e.s] !== undefined && e.s !== "min") {
				if (e.pid != undefined) {
					const p = playersByPid[e.pid] as any;
					if (e.s.endsWith("Lng")) {
						p[e.s] = e.amt;
					} else {
						p[e.s] += e.amt;
					}
				}
				boxScore.teams[actualT!][e.s] += e.amt;
			}
		} else if (e.type === "removeLastScore") {
			// This happens a tick after sportState is updated, which I think is okay
			boxScore.scoringSummary.pop();
		} else if (e.type === "quarter" || e.type === "overtime") {
			text = getText(e, boxScore.numPeriods);
			textOnly = true;
			boxScore.time = formatClock(e.clock);
			stop = true;
			if (e.startsWithKickoff) {
				sportState.newPeriodText = text;
				sportState.plays = [];
			}
		} else if (e.type === "timeouts") {
			// Reversed for actualT
			boxScore.teams[0].timeouts = e.timeouts[1];
			boxScore.teams[1].timeouts = e.timeouts[0];
		} else if (e.type !== "init") {
			let play = sportState.plays.at(-1);
			if (!play) {
				throw new Error("Should never happen");
			}

			if (e.type === "interception") {
				// Interceptions are always turnovers, so set it here. But for fumbles we need to wait for the recovery, done elsewhere
				play.turnover = true;
			}

			const initialText = getText(e, boxScore.numPeriods);
			if (initialText !== undefined) {
				if (e.type === "injury") {
					const p = playersByPid[e.injuredPID] as any;
					p.injury = {
						type: "Injured",
						gamesRemaining: -1,
					};
				}

				text = initialText;
				boxScore.time = formatClock(e.clock);
				stop = true;
				t = actualT;
				textOnly =
					e.type === "twoMinuteWarning" ||
					e.type === "gameOver" ||
					e.type === "shootoutStart" ||
					e.type === "shootoutTie";

				play.texts.push(text);
			}

			// A penalty might overturn a score or a turnover or multiple turnovers. In this case, we want to immediately update the play bar on the field, so it's no longer showing a turnover or score erroneously (looks weird after yardage changes). But we don't have the event for the actual reverted turnover/score yet. Solution? Look ahead and find it!
			// We also need to handle punt returns here, in the case where a penalty on the play results in another down for the kicking team. Basically, anything that adds a subplay needs to be here, except kickoff returns because currently penalties there are always assessed on the return.
			const removeLastScoreOrTurnoversOrPuntReturnIfNecessary = () => {
				// Look at all events up until the next "clock" event, which is the start of the next play
				for (const event of events) {
					if (event.type === "clock") {
						break;
					}

					// For turnovers, look for a negative interception or a negative fumble recovery
					if (event.type === "stat") {
						if (
							event.amt === -1 &&
							(event.s === "defInt" ||
								event.s === "defFmbRec" ||
								event.s === "pnt")
						) {
							sportState.plays.pop();

							// If we removed a sub-play, then the parent play can't be a turnover
							const prevPlay = sportState.plays.at(-1);
							if (prevPlay?.turnover) {
								prevPlay.turnover = false;
							}
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
					/*// Penalty could have changed possession
					const actualT2 = e.possessionAfter === 0 ? 1 : 0;
					if (play.t !== actualT2) {
						play.t = actualT2;
					}*/

					removeLastScoreOrTurnoversOrPuntReturnIfNecessary();

					// play might have been removed by removeLastScoreOrTurnoversIfNecessary
					play = sportState.plays.at(-1);
					if (!play) {
						throw new Error("Should never happen");
					}

					// For penalties before the snap, still count them (except awaitingAfterTouchdown, where these should never be true)
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
				}

				// Realize the flag by replacing the blank flag with the penalty details. Need to search prior plays in case the current play is a sub-play (like interception return, but flag was for offsides before the interception)
				let flagFound = false;
				for (let i = sportState.plays.length - 1; i >= 0; i--) {
					const flagPlay = sportState.plays[i];
					const flagIndex = flagPlay.flags.indexOf(null);
					if (flagIndex >= 0) {
						flagPlay.flags[flagIndex] = {
							text: text!,
							accept,
						};

						flagFound = true;
						break;
					}
				}
				if (!flagFound) {
					console.log("Flag not found", sportState.plays, e);
				}
			} else if (e.type === "penaltyCount" && e.offsetStatus === "offset") {
				removeLastScoreOrTurnoversOrPuntReturnIfNecessary();

				// play might have been removed by removeLastScoreOrTurnoversIfNecessary
				play = sportState.plays.at(-1);
				if (!play) {
					throw new Error("Should never happen");
				}

				// Offsetting penalties don't make it this far in the penalty event, because they have are filtered out above. But we can find them here in penaltyCount, which corresponds with when text is generated for the play-by-play. No play since the down is replayed.
				// Maybe accepted penalties that lead to replaying the down should also be considered here, but I'm not totally sure how to find those (!e.tackOn penalty events maybe?) and I'm not sure it's actually useful to do that (can have weird stuff like a 5 yard drive from 0 plays). https://www.nflpenalties.com/blog/what-is-a-play? argues similarly
				play.countsTowardsNumPlays = false;
				play.yards = 0;

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
				e.type === "interceptionReturn" ||
				e.type === "sack" ||
				e.type === "passComplete" ||
				e.type === "run" ||
				e.type === "kneel"
			) {
				const reversedField = play.t !== sportState.t;

				// Temporarily update play.yards with the from yardage in this play. Final value for next line of scrimmage comes in subsequent clock event
				if (
					(e.type === "fumbleRecovery" || e.type === "interceptionReturn") &&
					e.touchback
				) {
					const SCRIMMAGE_TOUCHBACK = 20;

					// (100 - play.scrimmage) is for the case when scrimmage is further than 100 (never happens?) or less than 100 (presumably momentum carried defender a yard or two into the endzone)
					play.yards = -SCRIMMAGE_TOUCHBACK + (100 - play.scrimmage);
				} else {
					play.yards += (reversedField ? -1 : 1) * e.yds;
				}
			}

			if (
				e.type === "kickoff" ||
				e.type === "onsideKick" ||
				e.type === "punt"
			) {
				play.intendedPossessionChange = true;
			}

			// Extra fieldGoal check is to include missed field goals
			if (scoringSummaryEvent) {
				const scoreInfo = getScoreInfo(e);
				if (scoreInfo) {
					play.scoreInfo = scoreInfo;
				}
			}

			if (e.type === "extraPointAttempt") {
				play.tagOverride = "XPA";
			} else if (e.type === "twoPointConversion") {
				play.tagOverride = "2PA";
			} else if (e.type === "shootoutShot") {
				play.tagOverride = "FGA";
			}
		}

		if (text !== undefined) {
			// This is designed to stop at the end of the previous possession, so you can see the prior drive leading up to it. Only exception is the start of a new quarter/overtime, because the drive is cleared before that.
			// This ignores the possibility of penalties, which can delay or overturn the change of possession. I think that's fine, most people are probably interested in potential changes of possession too.
			possessionChange =
				((e.type === "quarter" || e.type === "overtime") &&
					e.startsWithKickoff) ||
				e.type === "punt" ||
				e.type === "interception" ||
				(e.type === "fumbleRecovery" && e.lost) ||
				e.type === "turnoverOnDowns" ||
				e.type === "fieldGoal" ||
				e.type === "extraPoint" ||
				(e as any).twoPointConversionTeam !== undefined;

			if (
				e.type === "puntReturn" ||
				e.type === "kickoffReturn" ||
				e.type === "interception" ||
				(e.type === "fumbleRecovery" && e.lost)
			) {
				boxScore.possession = actualT;
			} else if (e.type === "turnoverOnDowns") {
				boxScore.possession = otherT;
			}
		}

		if (scoringSummaryEvent) {
			boxScore.scoringSummary.push(scoringSummaryEvent);
		}
	}

	return {
		overtimes,
		possessionChange,
		quarters,
		sportState,
		t,
		text,
		textOnly,
	};
};

export default processLiveGameEvents;
