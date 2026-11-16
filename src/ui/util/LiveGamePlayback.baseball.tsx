import { getPeriodName } from "../../common/getPeriodName.ts";
import { helpers } from "./helpers.ts";
import { local } from "./local.ts";
import type {
	PlayByPlayEventInput,
	PlayByPlayEventScore,
} from "../../worker/core/GameSim.baseball/PlayByPlayLogger.ts";
import {
	NUM_OUTS_PER_INNING,
	POS_NUMBERS_INVERSE,
} from "../../common/constants.baseball.ts";
import type { PlayerInjury } from "../../common/types.ts";
import { formatScoringSummaryEvent } from "../../common/formatScoringSummaryEvent.baseball.ts";
import { formatLiveGameStat } from "./formatLiveGameStat.ts";
import type { PlayByPlayEvent } from "../../worker/core/GameSim/PlayByPlayLoggerBase.ts";
import {
	LiveGamePlaybackBase,
	type LiveGameBoxScore,
	type LiveGameEntry,
	type LiveGameFastForward,
} from "./LiveGamePlaybackBase.ts";
import { formatList } from "../../common/formatList.ts";

export type BoxScorePlayer = {
	name: string;
	pid: number;
	injury: PlayerInjury;
	seasonStats: {
		[stat: string]: number;
	};
};
type BoxScoreTeam = {
	abbrev: string;
	hr: number;
	players: BoxScorePlayer[];
	pts: number;
	ptsQtrs: number[];
	sAtt?: number;
	sPts?: number;
};

const getDirectionInfield = (
	direction: Extract<PlayByPlayEventInput, { type: "fly" }>["direction"],
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
	direction: Extract<PlayByPlayEventInput, { type: "fly" }>["direction"],
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
	runners: Extract<PlayByPlayEventInput, { type: "walk" }>["runners"],
	{
		ignoreStationary,
		sideRetired,
		gameWinningRunScoredWithLiveBall,
	}: {
		ignoreStationary?: boolean;

		// When true, only report runners who are out, since the side is retired the other ones don't matter
		sideRetired?: boolean;

		// When true, only report runners who are out or scored, since anything else is not really relevant and it's meaningless where runners wind up
		gameWinningRunScoredWithLiveBall?: boolean;
	} = {},
) => {
	const filtered = runners.filter(
		(runner) => runner.to !== runner.from || !ignoreStationary,
	);

	// Show most important runner (furthest along the bases) first
	filtered.reverse();

	let texts = [];
	const scored = [];
	let numStationary = 0;
	for (const runner of filtered) {
		const name = getName(runner.pid);
		if (runner.out) {
			texts.push(`${name} out at ${getBaseName(runner.to)}.`);
		} else if (!sideRetired) {
			if (runner.from === runner.to) {
				if (!ignoreStationary && !gameWinningRunScoredWithLiveBall) {
					numStationary += 1;
					texts.push(`${name} stays at ${getBaseName(runner.to)}.`);
				}
			} else if (runner.to === 4) {
				scored.push(name);
			} else if (!gameWinningRunScoredWithLiveBall) {
				texts.push(`${name} advances to ${getBaseName(runner.to)}.`);
			}
		}
	}

	if (numStationary > 1 && numStationary === filtered.length) {
		// This means all the runners stayed
		texts = ["The runners hold."];
	} else if (scored.length === 1) {
		texts.unshift(`${scored[0]} scores.`);
	} else if (scored.length > 1) {
		texts.unshift(`${formatList(scored)} score.`);
	}

	return texts.join(" ");
};

export const getText = (
	event: PlayByPlayEventInput,
	getName: (pid: number) => string,

	// undefined when there is no live game, like when showing the scoring summary of a completed game
	pitcher: BoxScorePlayer | undefined,
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
			const statTotal = pitcher ? formatLiveGameStat(pitcher, "soPit") : "";
			text = event.swinging
				? `${helpers.pronoun(local.getState().gender, "He")} goes down swinging${statTotal}`
				: `Called strike three ${statTotal}`;
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
			const sideRetired = event.outs === NUM_OUTS_PER_INNING;
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
					text = "Single";
				} else if (event.numBases === 2) {
					text = `Double${event.totalHits !== undefined ? ` (${event.totalHits})` : ""}`;
				} else if (event.numBases === 3) {
					text = `Triple${event.totalHits !== undefined ? ` (${event.totalHits})` : ""}`;
				} else if (event.runners.length === 3) {
					text = `Grand slam${formatLiveGameStat(event.totalHits, "hr")}`;
				} else {
					text = `Home run${event.totalHits !== undefined ? ` (${event.totalHits})` : ""}`;
				}
			} else if (event.result === "flyOut") {
				text = `Caught by the ${
					POS_NUMBERS_INVERSE[event.posDefense[0]!]
				} for an out`;
			} else if (event.result === "throwOut") {
				if (event.posDefense[0] === 3) {
					text = `Fielded by the ${
						POS_NUMBERS_INVERSE[event.posDefense[0]]
					} and forced out at 1st`;
				} else {
					text = `Fielded by the ${
						POS_NUMBERS_INVERSE[event.posDefense[0]!]
					} and thrown out at 1st`;
				}
			} else if (event.result === "fieldersChoice") {
				if (sideRetired) {
					text = "Fielder's choice,";
				} else {
					text = `${helpers.pronoun(
						local.getState().gender,
						"He",
					)} reaches ${getBaseName(event.numBases)} on a fielder's choice`;
				}
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
				event.runners.every((runner) => !runner.out) &&
				!event.outAtNextBase
			) {
				// If there are 3 outs and no runner is out, then the hitter was out, in which case we don't need any runnersText
				runnersText = "";
			} else {
				runnersText = formatRunners(getName, event.runners, {
					sideRetired,
					gameWinningRunScoredWithLiveBall:
						event.gameWinningRunScoredWithLiveBall,
				});
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
				)} beats the throw and is safe at ${getBaseName(event.to)}${formatLiveGameStat(event.totalSb, "sb")}`;
			} else {
				text = `${getName(event.pid)} steals ${getBaseName(
					event.to,
				)} with no throw${formatLiveGameStat(event.totalSb, "sb")}`;
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
		case "shootoutStart": {
			text = `The game will now be decided by a home run derby with ${event.rounds} rounds!`;
			bold = true;
			break;
		}
		case "shootoutTeam": {
			text = `${getName(event.pid)} steps up to the plate.`;
			bold = true;
			break;
		}
		case "shootoutShot": {
			const he = helpers.pronoun(local.getState().gender, "He");
			text = `Try ${event.att}: ${
				(event.made
					? [
							`${he} hits a deep fly ball.. and it's gone!`,
							`${he} rockets one down the line... and it's fair!`,
							`${he} blasts one way over the fence!`,
							"Home run!",
						]
					: [
							`${he} hits a deep fly ball.. and it falls short.`,
							`${he} rockets one down the line... and it's foul.`,
							"A swing and a miss",
							`${he} makes contact, but it falls short`,
						]
				)[event.flavor]
			}`;
			break;
		}
		case "shootoutTie": {
			text =
				"The home run derby is tied! Players will alternate swings until there is a winner";
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
	o: 0 | 1;
};

// Function rather than a constant so every caller gets its own copy
const getDefaultSportState = (): SportState => ({
	bases: [undefined, undefined, undefined],
	outs: 0,
	balls: 0,
	strikes: 0,
	batterPid: -1,
	pitcherPid: -1,
	o: 0,
});

type BoxScore = LiveGameBoxScore<BoxScoreTeam> & {
	scoringSummary: PlayByPlayEventScore[];
};

export class LiveGamePlaybackBaseball extends LiveGamePlaybackBase<
	PlayByPlayEventInput,
	BoxScore
> {
	override sportState = getDefaultSportState();

	private inning = 0;

	private getName = (pid: number) => this.playersByPid[pid]?.name ?? "???";

	override next() {
		const prevOuts = this.sportState.outs;

		const entry = super.next();

		if (entry && this.sportState.outs > prevOuts) {
			entry.outs = this.sportState.outs;
		}

		return entry;
	}

	// Each half inning is a side
	private get numSidesStarted() {
		const [t0, t1] = this.boxScore.teams;
		return t0.ptsQtrs.length + t1.ptsQtrs.length;
	}

	override getFastForwards(): LiveGameFastForward[] {
		const { boxScore } = this;

		if (boxScore.shootout) {
			return [];
		}

		const fastForwards: LiveGameFastForward[] = [
			{
				label: "Next batter",
				keyboardShortcut: "o",
				start: () => {
					const initialBatter = this.sportState.batterPid;

					return () => {
						// No batter between sides
						const currentBatter = this.sportState.batterPid;
						return currentBatter >= 0 && currentBatter !== initialBatter;
					};
				},
			},
			{
				label: "Next baserunner",
				keyboardShortcut: "t",
				start: () => {
					const getNumHomeRuns = () =>
						boxScore.teams[0].hr + boxScore.teams[1].hr;

					const initialBaserunners = new Set(
						this.sportState.bases.filter((pid) => pid !== undefined),
					);
					const initialNumHomeRuns = getNumHomeRuns();

					return () => {
						const baserunners = this.sportState.bases.filter(
							(pid) => pid !== undefined,
						);
						if (baserunners.length === 0) {
							// Handle case where it's a new inning and the same guy gets on base
							initialBaserunners.clear();
						}

						return (
							baserunners.some((pid) => !initialBaserunners.has(pid)) ||
							// Home run counts as new baserunner
							getNumHomeRuns() !== initialNumHomeRuns
						);
					};
				},
			},
			{
				label: "Side is retired",
				keyboardShortcut: "c",
				start: () => {
					const initialNumSides = this.numSidesStarted;

					return () =>
						this.numSidesStarted !== initialNumSides || !!boxScore.shootout;
				},
			},
			{
				label: "End of inning",
				keyboardShortcut: "q",
				start: () => {
					const initialNumSides = this.numSidesStarted;

					return () =>
						// Odd number means the top of an inning just started
						(this.numSidesStarted !== initialNumSides &&
							this.numSidesStarted % 2 === 1) ||
						!!boxScore.shootout;
				},
			},
		];

		// Only before the last inning starts
		const numSidesBeforeLastInning = (boxScore.numPeriods - 1) * 2;
		if (this.numSidesStarted <= numSidesBeforeLastInning) {
			fastForwards.push({
				label: `${helpers.ordinal(boxScore.numPeriods)} inning`,
				keyboardShortcut: "u",
				start: () => () => this.numSidesStarted > numSidesBeforeLastInning,
			});
		}

		return fastForwards;
	}

	private updateSportState(e: PlayByPlayEvent<PlayByPlayEventInput>) {
		const { boxScore } = this;

		if (e.type === "sideStart") {
			this.inning = e.inning;
			boxScore.teams[e.t].ptsQtrs.push(0);

			if (e.t === 1) {
				const inning = boxScore.teams[1].ptsQtrs.length;
				if (inning > boxScore.numPeriods) {
					boxScore.overtime = `(${inning})`;
				}
				const ordinal = helpers.ordinal(inning);
				boxScore.quarter = `${ordinal} ${getPeriodName(boxScore.numPeriods)}`;
				boxScore.quarterShort = `${inning}`;
			}

			this.sportState = {
				...getDefaultSportState(),
				pitcherPid: e.pitcherPid,
				o: e.t,
			};
			boxScore.possession = e.t;
		} else if (e.type === "reliefPitcher") {
			this.sportState.pitcherPid = e.pidOn;
		} else if (e.type === "ball" || e.type === "strike" || e.type === "foul") {
			this.sportState.balls = e.balls;
			this.sportState.strikes = e.strikes;
		} else if (e.type === "plateAppearance") {
			this.sportState.balls = 0;
			this.sportState.strikes = 0;
			this.sportState.batterPid = e.pid;
		} else if (
			e.type === "hitResult" ||
			e.type === "strikeOut" ||
			e.type === "stealEnd"
		) {
			if (e.type === "strikeOut") {
				this.sportState.strikes = 3;
			}

			if (e.outs < NUM_OUTS_PER_INNING) {
				// If the side is retired, don't update bases, since it didn't happen
				this.sportState.bases = e.bases;
			}
			this.sportState.outs = e.outs;
		} else if (e.type === "walk") {
			if (!e.intentional) {
				this.sportState.balls = 4;
			}
			this.sportState.bases = e.bases;
		} else if (
			e.type === "balk" ||
			e.type === "wildPitch" ||
			e.type === "passedBall" ||
			e.type === "hitByPitch"
		) {
			this.sportState.bases = e.bases;
		} else if (e.type === "shootoutStart") {
			this.startShootout();
			this.sportState = getDefaultSportState();
		} else if (e.type === "shootoutTeam" || e.type === "shootoutShot") {
			this.sportState.batterPid = e.pid;
			this.sportState.pitcherPid = e.pitcherPid;
			this.sportState.o = e.t;
		} else if (e.type === "injury") {
			const p = this.playersByPid[e.pid]!;
			p.injury = {
				type: "Injured",
				gamesRemaining: -1,
			};

			const { replacementPid } = e;
			if (replacementPid !== undefined) {
				if (this.sportState.pitcherPid === e.pid) {
					this.sportState.pitcherPid = replacementPid;
				}

				// Purposely don't update batterPid, because injury only happens after an at bat, so they'll be replaced in bases

				this.sportState.bases = this.sportState.bases.map((base) => {
					return base === e.pid ? replacementPid : base;
				}) as SportState["bases"];
			}
		}
	}

	protected override processEvent(
		e: PlayByPlayEvent<PlayByPlayEventInput>,
	): LiveGameEntry | undefined {
		const { boxScore } = this;

		this.updateSportState(e);

		if (e.type === "stat") {
			this.processStat(e);
			return;
		}

		if (e.type === "init") {
			return;
		}

		const output = getText(
			e,
			this.getName,
			this.playersByPid[this.sportState.pitcherPid],
		);

		const scoringSummaryEvent = formatScoringSummaryEvent(e, this.inning);
		if (scoringSummaryEvent) {
			boxScore.scoringSummary = [
				...boxScore.scoringSummary,
				scoringSummaryEvent,
			];
		}

		return {
			// Always the batting team
			t: this.sportState.o,
			text: output.bold ? <b>{output.text}</b> : output.text,
			textOnly:
				e.type === "sideStart" ||
				e.type === "sideOver" ||
				e.type === "gameOver",
		};
	}
}
