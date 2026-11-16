import { getPeriodName } from "../../common/getPeriodName.ts";
import { formatScoringSummaryEvent } from "../../common/formatScoringSummaryEvent.football.ts";
import { helpers } from "./helpers.ts";
import { local } from "./local.ts";
import type {
	PlayByPlayEventOutput,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.football/PlayByPlayLogger.ts";
import type { ReactNode } from "react";
import { formatClock } from "../../common/formatClock.ts";
import type { PlayerInjury, TeamNum } from "../../common/types.ts";
import { formatLiveGameStat } from "./formatLiveGameStat.ts";
import type {
	PlayByPlayEvent,
	PlayByPlayEventStat,
} from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import { assertDefined } from "../../common/utils.ts";
import {
	addStat,
	getEventTeam,
	hasStat,
	LiveGamePlaybackBase,
	setStat,
	type LiveGameBoxScore,
	type LiveGameEntry,
	type LiveGameFastForward,
} from "./LiveGamePlaybackBase.ts";

type BoxScorePlayer = {
	name: string;
	pid: number;
	injury: PlayerInjury;
	seasonStats: {
		[stat: string]: number;
	};
	inGame: boolean;
};
type BoxScoreTeam = {
	abbrev: string;
	players: BoxScorePlayer[];
	pts: number;
	ptsQtrs: number[];
	sAtt?: number;
	sPts?: number;
	timeouts: number;
	[key: string]: string | number | BoxScorePlayer[] | number[] | undefined;
};
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
		// Part of yards that came from an accepted penalty, drawn in yellow
		penaltyYards: number;

		// Team with the ball after the play ends
		t: 0 | 1;
	}[];
	text: string;
	newPeriodText: ReactNode | undefined;
};

// Function rather than a constant so every game gets its own copy
const getDefaultSportState = (): SportState => ({
	awaitingAfterTouchdown: false,
	awaitingKickoff: true,
	awaitingShootout: false,
	t: 0,
	scrimmage: 0,
	toGo: 0,
	plays: [],
	text: "",
	newPeriodText: undefined,
});

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

export const getScoreInfo = (event: PlayByPlayEventOutput) => {
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
	twoPointConversion: boolean,
	touchdownText: string,
	showYdsOnTD: boolean,
	seasonTouchdownStats: [number] | [number, number] | undefined, // undefined means old box score without this data
) => {
	const tdStats = () => {
		if (twoPointConversion || !seasonTouchdownStats) {
			return "";
		}
		if (seasonTouchdownStats.length === 1) {
			return formatLiveGameStat(seasonTouchdownStats[0], "RusTD", true);
		} else if (seasonTouchdownStats.length === 2) {
			return formatLiveGameStat(seasonTouchdownStats, ["PssTD", "RecTD"], true);
		}
	};
	if (td && showYdsOnTD) {
		return `${yds} yards${td ? ` and ${touchdownText}!${tdStats()}` : ""}`;
	}

	if (td) {
		return `${touchdownText}!${tdStats()}`;
	}

	return `${yds} yards`;
};

export const getText = (event: PlayByPlayEventOutput, numPeriods: number) => {
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
			event.td
				? ` for a touchdown!${formatLiveGameStat(event.totalKrTD, "KrTD", true)}`
				: ""
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
			event.td
				? ` for a touchdown!${formatLiveGameStat(event.totalPrTD, "PrTD", true)}`
				: ""
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
		text = `${event.names[0]} fumbled the ball${formatLiveGameStat(event.totalFmb, "Fmb", true)}! Forced fumble by ${event.names[1]}${formatLiveGameStat(event.totalDefFmbFrc, "FmbFrc", true)}`;
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
			<>
				<span className="text-danger">Intercepted by {event.names[0]}!</span>
				{formatLiveGameStat(
					[event.totalPssInt, event.totalDefInt],
					["PssInt", "DefInt"],
					true,
				)}
			</>
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
		}${formatLiveGameStat(event.totalDefSk, "DefSk", true)}`;
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
				event.twoPointConversionTeam !== undefined,
				touchdownText,
				showYdsOnTD,
				event.totalPssTD !== undefined && event.totalRecTD !== undefined
					? [event.totalPssTD, event.totalRecTD]
					: undefined,
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
				event.twoPointConversionTeam !== undefined,
				touchdownText,
				showYdsOnTD,
				event.totalRusTD !== undefined ? [event.totalRusTD] : undefined,
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
			let distanceText;
			if (event.halfDistanceToGoal) {
				distanceText = `Half the distance to the goal${automaticFirstDownText}`;
			} else if (event.placeOnOne) {
				distanceText = `The ball will be placed at the 1 yard line${automaticFirstDownText}`;
			} else {
				distanceText = `${event.yds} yards${spotFoulText}${automaticFirstDownText}`;
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
						<span className="glyphicon glyphicon-stop text-body-secondary" />
					</>
				);
			decisionText = (
				<>
					{" "}
					- <b>{innerText}</b>
					<div className="text-body-secondary">{distanceText}</div>
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
		} remaining)${event.toStopClock ? " to stop the clock" : ""}`;
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
		text = `${event.names[0]} comes on for an extra point attempt`;
	} else if (event.type === "fieldGoalAttempt") {
		text = `${event.names[0]} comes on for a ${
			event.yds
		} yard field goal attempt`;
	} else if (event.type === "twoPointConversion") {
		text = "Two-point conversion attempt";
	} else if (event.type === "goingForItOn4th") {
		text = "The offense stays on the field, they're going for it on 4th down!";
	} else if (event.type === "puntTeam") {
		text = "The punt team takes the field";
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

/**
 * Split a play bar's net yards into the play's own part and the penalty's
 * part, as lengths to draw (the penalty goes at the far end). When the two
 * point opposite ways only one can show: the penalty if it decides which way
 * the ball moved, otherwise the play -- the flag icon still marks the penalty.
 */
export const penaltySegments = (yards: number, penaltyYards: number) => {
	if (penaltyYards === 0) {
		return { play: Math.abs(yards), penalty: 0 };
	}

	const playYards = yards - penaltyYards;
	if (playYards === 0 || Math.sign(playYards) === Math.sign(penaltyYards)) {
		return { play: Math.abs(playYards), penalty: Math.abs(penaltyYards) };
	}

	// Opposite directions
	if (yards === 0) {
		return { play: 0, penalty: 0 };
	}
	return Math.sign(yards) === Math.sign(penaltyYards)
		? { play: 0, penalty: Math.abs(yards) }
		: { play: Math.abs(yards), penalty: 0 };
};

type Event = PlayByPlayEvent<PlayByPlayEventOutput>;

// Events that are part of a play, rather than something happening between plays
type PlayEvent = Exclude<
	Event,
	{
		type:
			| "clock"
			| "init"
			| "overtime"
			| "quarter"
			| "removeLastScore"
			| "stat"
			| "timeouts";
	}
>;

type BoxScore = LiveGameBoxScore<BoxScoreTeam> & {
	scoringSummary: PlayByPlayEventScore[];
};

// This is designed to stop at the end of the previous possession, so you can see the prior drive leading up to it. Only exception is the start of a new quarter/overtime, because the drive is cleared before that.
// This ignores the possibility of penalties, which can delay or overturn the change of possession. I think that's fine, most people are probably interested in potential changes of possession too.
const isPossessionChange = (e: Event) => {
	const { safety, twoPointConversionTeam } = e as {
		safety?: boolean;
		twoPointConversionTeam?: TeamNum;
	};

	return (
		((e.type === "quarter" || e.type === "overtime") && e.startsWithKickoff) ||
		e.type === "punt" ||
		e.type === "interception" ||
		(e.type === "fumbleRecovery" && e.lost) ||
		e.type === "turnoverOnDowns" ||
		e.type === "fieldGoal" ||
		e.type === "extraPoint" ||
		!!safety ||
		twoPointConversionTeam !== undefined ||
		// Needed for failed 2 point conversions that end with an event without twoPointConversionTeam, like an incomplete pass
		e.type === "twoPointConversionFailed"
	);
};

export class LiveGamePlaybackFootball extends LiveGamePlaybackBase<
	PlayByPlayEventOutput,
	BoxScore
> {
	override readonly sportState = getDefaultSportState();

	// Was the latest entry from `next` a change of possession? See isPossessionChange for details.
	private possessionChange = false;

	override next() {
		this.possessionChange = false;
		return super.next();
	}

	// Only meaningful right after an entry that changed the score
	private get latestScoreInfo() {
		return this.sportState.plays.at(-1)?.scoreInfo;
	}

	protected override getScoreLabel() {
		if (this.boxScore.shootout) {
			return "It's good!";
		}

		// If no score type, then it must be a penalty overturning a score
		return `${this.latestScoreInfo?.long ?? "Penalty overturned score"}!`;
	}

	protected override getScoreTeam(entry: LiveGameEntry) {
		// A safety is credited to the other team
		if (this.latestScoreInfo?.type === "SF" && entry.t !== undefined) {
			return entry.t === 0 ? 1 : 0;
		}

		return entry.t;
	}

	// The time is shown with the down and distance, not on each entry
	protected override getClockText() {
		return undefined;
	}

	override getFastForwards(): LiveGameFastForward[] {
		if (this.boxScore.shootout) {
			return [];
		}

		return [
			{
				label: "Change of possession",
				keyboardShortcut: "c",
				start: () => {
					// If currently on a change of possession, play through it before looking for the next one
					let waitingForCurrentToEnd = this.possessionChange;

					return () => {
						if (waitingForCurrentToEnd && !this.possessionChange) {
							waitingForCurrentToEnd = false;
						}

						return !waitingForCurrentToEnd && this.possessionChange;
					};
				},
			},
		];
	}

	private get currentPlay() {
		const play = this.sportState.plays.at(-1);
		assertDefined(play);
		return play;
	}

	private addPlay({
		down,
		toGo,
		scrimmage,
		intendedPossessionChange,
		subPlay,
		t,
	}: {
		down: number;
		toGo: number;
		scrimmage: number;
		intendedPossessionChange: boolean;
		subPlay: boolean;
		t: TeamNum | undefined;
	}) {
		assertDefined(t);
		this.sportState.plays.push({
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
			penaltyYards: 0,
		});
	}

	protected override processStat(e: PlayByPlayEventStat) {
		this.addPeriodPts(e);

		const t = this.boxScore.teams[e.t];
		if (hasStat(t, e.s) && e.s !== "min") {
			if (e.pid != undefined) {
				const p = this.playersByPid[e.pid]!;
				if (e.s.endsWith("Lng")) {
					setStat(p, e.s, e.amt);
				} else {
					addStat(p, e.s, e.amt);
				}
			}
			addStat(t, e.s, e.amt);
		}
	}

	// A clock event comes before each play, with the situation at the snap
	private processClock(
		e: Extract<Event, { type: "clock" }>,
	): LiveGameEntry | undefined {
		const { boxScore, sportState } = this;
		const eventT = getEventTeam(e);
		const awaitingKickoff = e.awaitingKickoff !== undefined;

		let entry: LiveGameEntry | undefined;

		const textParts = [];
		if (!e.awaitingAfterTouchdown) {
			const time = formatClock(e.clock);

			if (awaitingKickoff) {
				textParts.push("Kick off");
			} else {
				const fieldPos = scrimmageToFieldPos(
					e.scrimmage,
					boxScore.teams[eventT!].abbrev,
					boxScore.teams[eventT === 0 ? 1 : 0].abbrev,
				);

				textParts.push(
					formatDownAndDistance(e.down, e.toGo, e.scrimmage),
					fieldPos,
				);
			}

			entry = {
				t: eventT,
				text: (
					<>
						{time}
						{textParts.map((part, i) => (
							<span className={`ps-3${i === 0 ? " fw-bold" : ""}`} key={i}>
								{part}
							</span>
						))}
					</>
				),
				textOnly: false,
			};
			boxScore.time = time;
		}

		if (eventT !== undefined && (awaitingKickoff || sportState.t !== eventT)) {
			sportState.t = eventT;
			sportState.plays = [];
		}
		sportState.awaitingAfterTouchdown = e.awaitingAfterTouchdown;
		sportState.awaitingKickoff = awaitingKickoff;
		sportState.text = textParts.join(", ");
		sportState.newPeriodText = undefined;
		sportState.scrimmage = e.scrimmage;
		sportState.toGo = e.toGo;
		this.addPlay({
			down: e.down,
			toGo: e.toGo,
			scrimmage: e.scrimmage,
			intendedPossessionChange: awaitingKickoff,
			subPlay: false,
			t: eventT,
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

		boxScore.possession = eventT;

		return entry;
	}

	// A penalty might overturn a score or a turnover or multiple turnovers. In this case, we want to immediately update the play bar on the field, so it's no longer showing a turnover or score erroneously (looks weird after yardage changes). But we don't have the event for the actual reverted turnover/score yet. Solution? Look ahead and find it!
	// We also need to handle punt returns here, in the case where a penalty on the play results in another down for the kicking team. Basically, anything that adds a subplay needs to be here, except kickoff returns because currently penalties there are always assessed on the return.
	private removeLastScoreOrTurnoversOrPuntReturnIfNecessary() {
		const { sportState } = this;

		// Look at all events up until the next "clock" event, which is the start of the next play
		for (const event of this.upcomingEvents()) {
			if (event.type === "clock") {
				break;
			}

			// For turnovers, look for a negative interception or a negative fumble recovery
			if (event.type === "stat") {
				if (
					event.amt === -1 &&
					(event.s === "defInt" || event.s === "defFmbRec" || event.s === "pnt")
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
	}

	// For penalties that are not offsetting
	private processPenalty(
		e: Extract<PlayEvent, { type: "penalty" }>,
		text: ReactNode,
	) {
		const { sportState } = this;

		// Only apply yardage from accepted penalties. Otherwise if there are 2 penalties on the same play, the end result would be the same, but yardage would show up when applying the first declined penalty, which ruins the drama.
		// Same for change of possession, don't want to show it early if 2 penalties.
		const accept = e.decision === "accept";
		if (accept) {
			/*// Penalty could have changed possession
			if (play.t !== e.possessionAfter) {
				play.t = e.possessionAfter;
			}*/

			this.removeLastScoreOrTurnoversOrPuntReturnIfNecessary();

			// Get the play only now, because the previous current play might have just been removed
			const play = this.currentPlay;

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

			// A foul added on after the play keeps the play's own yards; any
			// other accepted foul wipes the play out, so all of it is penalty
			const penaltyBase = e.tackOn
				? play.scrimmage + play.yards
				: play.scrimmage;
			play.penaltyYards = scrimmageAfter - penaltyBase;
			play.yards = scrimmageAfter - play.scrimmage;
		}

		// Realize the flag by replacing the blank flag with the penalty details. Need to search prior plays in case the current play is a sub-play (like interception return, but flag was for offsides before the interception)
		let flagFound = false;
		for (let i = sportState.plays.length - 1; i >= 0; i--) {
			const flagPlay = sportState.plays[i]!;
			const flagIndex = flagPlay.flags.indexOf(null);
			if (flagIndex >= 0) {
				flagPlay.flags[flagIndex] = {
					text,
					accept,
				};

				flagFound = true;
				break;
			}
		}
		if (!flagFound) {
			console.log("Flag not found", sportState.plays, e);
		}
	}

	// Offsetting penalties are skipped by processPenalty. But we can find them here in penaltyCount, which corresponds with when text is generated for the play-by-play. No play since the down is replayed.
	// Maybe accepted penalties that lead to replaying the down should also be considered here, but I'm not totally sure how to find those (!e.tackOn penalty events maybe?) and I'm not sure it's actually useful to do that (can have weird stuff like a 5 yard drive from 0 plays). https://www.nflpenalties.com/blog/what-is-a-play? argues similarly
	private processOffsettingPenalties(text: ReactNode) {
		this.removeLastScoreOrTurnoversOrPuntReturnIfNecessary();

		// Get the play only now, because the previous current play might have just been removed
		const play = this.currentPlay;

		play.countsTowardsNumPlays = false;
		play.yards = 0;
		play.penaltyYards = 0;

		play.flags = play.flags.map(() => {
			return {
				text,
				accept: false,
			};
		});
	}

	private processPlayEvent(
		e: PlayEvent,
		isScoringEvent: boolean,
	): LiveGameEntry | undefined {
		const { boxScore, sportState } = this;

		if (e.type === "interception") {
			// Interceptions are always turnovers, so set it here. But for fumbles we need to wait for the recovery, done elsewhere
			this.currentPlay.turnover = true;
		}

		let entry: LiveGameEntry | undefined;

		// Some events are not shown in the play-by-play, like the handoff on a QB keeper
		const text = getText(e, boxScore.numPeriods);
		if (text !== undefined) {
			if (e.type === "injury") {
				this.playersByPid[e.injuredPID]!.injury = {
					type: "Injured",
					gamesRemaining: -1,
				};
			}

			boxScore.time = formatClock(e.clock);
			entry = {
				t: getEventTeam(e),
				text,
				textOnly:
					e.type === "twoMinuteWarning" ||
					e.type === "gameOver" ||
					e.type === "shootoutStart" ||
					e.type === "shootoutTie",
			};

			this.currentPlay.texts.push(text);
		}

		if (e.type === "flag") {
			this.currentPlay.flags.push(null);
		} else if (e.type === "penalty" && e.offsetStatus !== "offset") {
			this.processPenalty(e, text);
		} else if (e.type === "penaltyCount" && e.offsetStatus === "offset") {
			this.processOffsettingPenalties(text);
		} else if (
			e.type === "dropback" ||
			e.type === "handoff" ||
			e.type === "kneel"
		) {
			if (!sportState.awaitingAfterTouchdown) {
				this.currentPlay.countsTowardsNumPlays = true;
				this.currentPlay.countsTowardsYards = true;
			}
		}

		// Get the play only now, because a penalty might have just removed the previous current play
		const play = this.currentPlay;

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

		if (e.type === "kickoff" || e.type === "onsideKick" || e.type === "punt") {
			play.intendedPossessionChange = true;
		}

		if (isScoringEvent) {
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

		return entry;
	}

	protected override processEvent(e: Event): LiveGameEntry | undefined {
		const { boxScore, sportState } = this;
		const eventT = getEventTeam(e);

		const scoringSummaryEvent = formatScoringSummaryEvent(
			e,
			this.numPeriodsStarted,
		);

		this.startPeriodIfNeeded(e.type === "quarter" || e.type === "overtime");

		if (e.type === "shootoutStart") {
			this.startShootout();

			sportState.plays = [];
			sportState.awaitingAfterTouchdown = false;
			sportState.awaitingKickoff = false;
			sportState.awaitingShootout = true;
			sportState.scrimmage = 1;
			sportState.toGo = 10;

			// Away team
			sportState.t = 1;
			this.addPlay({
				down: 1,
				toGo: 10,
				scrimmage: 100 - 33,
				intendedPossessionChange: false,
				subPlay: false,
				t: 1,
			});
		}

		// These events start a sub-play, by the team that now has the ball
		if (
			e.type === "kickoffReturn" ||
			e.type === "puntReturn" ||
			e.type === "fumbleRecovery" ||
			e.type === "interceptionReturn"
		) {
			const prevPlay = this.currentPlay;
			if (e.type === "fumbleRecovery" && e.lost) {
				prevPlay.turnover = true;
			}
			if (e.type === "fumbleRecovery") {
				// e.yds in fumble is the return yards, ydsBefore is where the turnover actually happens
				prevPlay.yards += e.ydsBefore;
			}

			this.addPlay({
				down: prevPlay.down,
				toGo: prevPlay.toGo,
				scrimmage: prevPlay.scrimmage + prevPlay.yards,
				intendedPossessionChange: false,
				subPlay: true,
				t: eventT,
			});
		}

		if (e.type === "shootoutShot") {
			if (sportState.awaitingShootout) {
				sportState.plays.pop();
				sportState.awaitingShootout = false;
			}

			this.addPlay({
				down: 1,
				toGo: 10,
				// Home team is kicking in the opposite direction
				scrimmage: eventT === 0 ? 33 : 100 - 33,
				intendedPossessionChange: false,
				subPlay: false,
				t: eventT,
			});
		}

		let entry: LiveGameEntry | undefined;

		if (e.type === "clock") {
			entry = this.processClock(e);
		} else if (e.type === "stat") {
			this.processStat(e);
		} else if (e.type === "removeLastScore") {
			// This happens a tick after sportState is updated, which I think is okay
			boxScore.scoringSummary.pop();
		} else if (e.type === "quarter" || e.type === "overtime") {
			const text = getText(e, boxScore.numPeriods);
			boxScore.time = formatClock(e.clock);
			if (e.startsWithKickoff) {
				sportState.newPeriodText = text;
				sportState.plays = [];
			}
			entry = {
				t: undefined,
				text,
				textOnly: true,
			};
		} else if (e.type === "timeouts") {
			boxScore.teams[0].timeouts = e.timeouts[0];
			boxScore.teams[1].timeouts = e.timeouts[1];
		} else if (e.type !== "init") {
			entry = this.processPlayEvent(e, scoringSummaryEvent !== undefined);
		}

		if (entry) {
			this.possessionChange = isPossessionChange(e);

			if (
				e.type === "puntReturn" ||
				e.type === "kickoffReturn" ||
				e.type === "interception" ||
				(e.type === "fumbleRecovery" && e.lost)
			) {
				boxScore.possession = eventT;
			} else if (e.type === "turnoverOnDowns") {
				boxScore.possession = eventT === 0 ? 1 : 0;
			}
		}

		if (scoringSummaryEvent) {
			boxScore.scoringSummary.push(scoringSummaryEvent);
		}

		return entry;
	}
}
