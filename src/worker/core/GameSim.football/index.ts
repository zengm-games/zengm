import { PHASE } from "../../../common";
import { g, helpers, random } from "../../util";
import { POSITIONS } from "../../../common/constants.football";
import PlayByPlayLogger from "./PlayByPlayLogger";
import getCompositeFactor from "./getCompositeFactor";
import getPlayers from "./getPlayers";
import formations from "./formations";
import penalties from "./penalties";
import type { Position } from "../../../common/types.football";
import type {
	CompositeRating,
	PenaltyPlayType,
	PlayerGameSim,
	PlayersOnField,
	TeamGameSim,
	TeamNum,
	Formation,
} from "./types";
import isFirstPeriodAfterHalftime from "./isFirstPeriodAfterHalftime";
import possessionEndsAfterThisPeriod from "./possessionEndsAfterThisPeriod";
import thisPeriodHasTwoMinuteWarning from "./thisPeriodHasTwoMinuteWarning";
import getInjuryRate from "../GameSim.basketball/getInjuryRate";
import Play from "./Play";
import LngTracker from "./LngTracker";

const teamNums: [TeamNum, TeamNum] = [0, 1];

/**
 * Convert energy into fatigue, which can be multiplied by a rating to get a fatigue-adjusted value.
 *
 * @param {number} energy A player's energy level, from 0 to 1 (0 = lots of energy, 1 = none).
 * @return {number} Fatigue, from 0 to 1 (0 = lots of fatigue, 1 = none).
 */
const fatigue = (energy: number): number => {
	energy += 0.05;

	if (energy > 1) {
		energy = 1;
	}

	return energy;
};

class GameSim {
	id: number;

	day: number | undefined;

	team: [TeamGameSim, TeamGameSim];

	playersOnField: [PlayersOnField, PlayersOnField];

	subsEveryN: number;

	overtime: boolean;

	overtimes: number;

	/**
	 * "initialKickoff" -> (right after kickoff) "firstPossession" -> (after next call to possessionChange) -> "secondPossession" -> (after next call to possessionChange) -> "bothTeamPossessed" -> (based on conditions below) "over"
	 * - "initialKickoff", "firstPossession": when touchdown or safety is scored, set state to "over"
	 * - "secondPossession": when any points are scored, if scoring team is winning, set state to "over"
	 * - "bothTeamsPossessed": after each play, if (!this.awaitingAfterTouchdown or point differential is more than 2) then end game if score is not equal, set state to "over"
	 */
	overtimeState:
		| undefined
		| "initialKickoff"
		| "firstPossession"
		| "secondPossession"
		| "bothTeamsPossessed"
		| "over";

	clock: number;

	numPeriods: number;

	isClockRunning: boolean;

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	awaitingAfterTouchdown: boolean;

	awaitingAfterSafety: boolean;

	awaitingKickoff: TeamNum | undefined;

	scrimmage: number;

	down: number;

	toGo: number;

	timeouts: [number, number];

	twoMinuteWarningHappened: boolean;

	currentPlay: Play;

	lngTracker: LngTracker;

	constructor({
		gid,
		day,
		teams,
		doPlayByPlay = false,
		homeCourtFactor = 1,
		disableHomeCourtAdvantage = false,
	}: {
		gid: number;
		day?: number;
		teams: [TeamGameSim, TeamGameSim];
		doPlayByPlay?: boolean;
		homeCourtFactor?: number;
		disableHomeCourtAdvantage?: boolean;
	}) {
		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);
		this.id = gid;
		this.day = day;
		this.team = teams; // If a team plays twice in a day, this needs to be a deep copy

		this.playersOnField = [{}, {}];

		// Record "gs" stat for starters
		this.o = 0;
		this.d = 1;
		this.updatePlayersOnField("starters");
		this.o = 1;
		this.d = 0;
		this.updatePlayersOnField("starters");
		this.subsEveryN = 6; // How many possessions to wait before doing substitutions

		this.overtime = false;
		this.overtimes = 0;
		this.clock = g.get("quarterLength"); // Game clock, in minutes
		this.numPeriods = g.get("numPeriods");

		this.isClockRunning = false;
		this.awaitingAfterTouchdown = false;
		this.awaitingAfterSafety = false;
		this.awaitingKickoff = Math.random() < 0.5 ? 0 : 1;
		this.down = 1;
		this.toGo = 10;
		this.scrimmage = 20;
		this.timeouts = [3, 3];
		this.twoMinuteWarningHappened = false;
		this.currentPlay = new Play(this);
		this.lngTracker = new LngTracker();

		if (!disableHomeCourtAdvantage) {
			this.homeCourtAdvantage(homeCourtFactor);
		}
	}

	homeCourtAdvantage(homeCourtFactor: number) {
		const homeCourtModifier =
			homeCourtFactor *
			helpers.bound(1 + g.get("homeCourtAdvantage") / 100, 0.01, Infinity);

		for (let t = 0; t < 2; t++) {
			let factor;

			if (t === 0) {
				factor = homeCourtModifier; // Bonus for home team
			} else {
				factor = 1.0 / homeCourtModifier; // Penalty for away team
			}

			for (let p = 0; p < this.team[t].player.length; p++) {
				for (const r of Object.keys(this.team[t].player[p].compositeRating)) {
					if (r !== "endurance") {
						this.team[t].player[p].compositeRating[r] *= factor;
					}
				}
			}
		}
	}

	run() {
		// Simulate the game up to the end of regulation
		this.simRegulation();

		while (this.team[0].stat.pts === this.team[1].stat.pts) {
			// this.checkGameTyingShot();
			this.simOvertime();

			// More than one overtime only if no ties are allowed or if it's the playoffs
			if (g.get("phase") !== PHASE.PLAYOFFS && g.get("ties", "current")) {
				break;
			}
		}

		this.playByPlay.logEvent("gameOver", {
			clock: this.clock,
		});
		// this.checkGameWinner();

		// Delete stuff that isn't needed before returning
		for (let t = 0; t < 2; t++) {
			delete this.team[t].compositeRating;
			// @ts-expect-error
			delete this.team[t].pace;

			for (let p = 0; p < this.team[t].player.length; p++) {
				// @ts-expect-error
				delete this.team[t].player[p].age;
				// @ts-expect-error
				delete this.team[t].player[p].valueNoPot;
				delete this.team[t].player[p].compositeRating;
				// @ts-expect-error
				delete this.team[t].player[p].ptModifier;
				delete this.team[t].player[p].stat.benchTime;
				delete this.team[t].player[p].stat.courtTime;
				delete this.team[t].player[p].stat.energy;
			}
		}

		const scoringSummaryAndRemove = this.playByPlay.playByPlay.filter(
			event => event.scoringSummary || event.type === "removeLastScore",
		);

		const scoringSummary: any[] = [];

		// Remove any scores that were negated by penalties
		for (let i = 0; i < scoringSummaryAndRemove.length; i++) {
			const current = scoringSummaryAndRemove[i];
			const next = scoringSummaryAndRemove[i + 1];

			if (next && next.type === "removeLastScore") {
				continue;
			}

			if (current.scoringSummary) {
				const y = { ...current };
				delete y.scoringSummary;
				scoringSummary.push(y);
			}
		}

		const out = {
			gid: this.id,
			day: this.day,
			overtimes: this.overtimes,
			team: this.team,
			clutchPlays: [],
			playByPlay: this.playByPlay.getPlayByPlay(this.team),
			scoringSummary,
		};
		return out;
	}

	simRegulation() {
		const oAfterHalftime = this.d;
		let quarter = 1;

		while (true) {
			while (this.clock > 0 || this.awaitingAfterTouchdown) {
				this.simPlay();
			}

			quarter += 1;

			// Who gets the ball after halftime?
			if (isFirstPeriodAfterHalftime(quarter, this.numPeriods)) {
				this.awaitingKickoff = this.o;
				this.timeouts = [3, 3];
				this.twoMinuteWarningHappened = false;
				this.o = oAfterHalftime;
				this.d = this.o === 0 ? 1 : 0;
			} else if (quarter > this.numPeriods) {
				break;
			}

			this.team[0].stat.ptsQtrs.push(0);
			this.team[1].stat.ptsQtrs.push(0);
			this.clock = g.get("quarterLength");
			this.playByPlay.logEvent("quarter", {
				clock: this.clock,
				quarter: this.team[0].stat.ptsQtrs.length,
			});
		}
	}

	simOvertime() {
		this.clock = Math.ceil((g.get("quarterLength") * 2) / 3); // 10 minutes by default, but scales

		if (this.clock === 0) {
			this.clock = 10;
		}

		this.overtime = true;
		this.overtimes += 1;
		this.overtimeState = "initialKickoff";
		this.team[0].stat.ptsQtrs.push(0);
		this.team[1].stat.ptsQtrs.push(0);
		this.timeouts = [2, 2];
		this.twoMinuteWarningHappened = false;
		this.playByPlay.logEvent("overtime", {
			clock: this.clock,
			overtimes: this.overtimes,
		});
		this.o = Math.random() < 0.5 ? 0 : 1;
		this.d = this.o === 0 ? 1 : 0;
		this.awaitingKickoff = this.o;

		// @ts-expect-error
		while (this.clock > 0 && this.overtimeState !== "over") {
			this.simPlay();
		}
	}

	getTopPlayerOnField(t: TeamNum, pos: Position) {
		const players = this.playersOnField[t][pos];

		if (!players || players.length === 0) {
			throw new Error(`No player found at position ${pos}`);
		}

		return players[0];
	}

	probPass() {
		// Hack!! Basically, we want to see what kind of talent we have before picking if it's a run or pass play, so put the starter (minus fatigue) out there and compute these
		this.updatePlayersOnField("starters");
		this.updateTeamCompositeRatings();

		const ptsDown = this.team[this.d].stat.pts - this.team[this.o].stat.pts;
		const quarter = this.team[0].stat.ptsQtrs.length;
		const desperation =
			quarter >= this.numPeriods &&
			((quarter > this.numPeriods && ptsDown > 0) ||
				(ptsDown > 0 && this.clock <= 2) ||
				(ptsDown > 8 && this.clock <= 3) ||
				(ptsDown > 16 && this.clock <= 4) ||
				(ptsDown > 24 && this.clock <= 6));
		if (desperation) {
			return 0.98;
		}

		let offPassing = 0;
		let offRushing = 0;
		let defPassing = 0;
		let defRushing = 0;

		// Calculate offPassing only if there is a quarterback in the formation
		if (this.playersOnField[this.o].QB) {
			const qb = this.getTopPlayerOnField(this.o, "QB");
			const qbFactor = qb ? qb.ovrs.QB / 100 : 0;
			offPassing =
				(5 * qbFactor +
					this.team[this.o].compositeRating.receiving +
					this.team[this.o].compositeRating.passBlocking) /
				7;
		}

		offRushing =
			(this.team[this.o].compositeRating.rushing +
				this.team[this.o].compositeRating.runBlocking) /
			2;
		defPassing =
			(this.team[this.d].compositeRating.passRushing +
				this.team[this.d].compositeRating.passCoverage) /
			2;
		defRushing = this.team[this.d].compositeRating.runStopping;

		// Arbitrary rescale - .45-.7 -> .25-.75
		offPassing = helpers.bound((offPassing - 0.45) * (0.5 / 0.25) + 0.25, 0, 1);

		// Arbitrary rescale - .5-.7 -> .25-.75
		offRushing = helpers.bound((offRushing - 0.5) * (0.5 / 0.2) + 0.25, 0, 1);

		// Arbitrary rescale - .4-.65 -> .25-.75
		defPassing = helpers.bound((defPassing - 0.4) * (0.5 / 0.25) + 0.25, 0, 1);

		// Arbitrary rescale - .4-.6 -> .25-.75
		defRushing = helpers.bound((defRushing - 0.4) * (0.5 / 0.2) + 0.25, 0, 1);

		const passingTendency =
			1.1 * helpers.bound(offPassing - 0.25 * defPassing, 0, 1);
		const rushingTendency =
			0.9 * helpers.bound(offRushing - 0.25 * defRushing, 0, 1);

		let passOdds = 0.57;
		if (passingTendency > 0 || rushingTendency > 0) {
			// Always pass at least 45% of the time, and always rush at least 35% of the time
			passOdds = helpers.bound(
				(1.5 * passingTendency) / (1.5 * passingTendency + rushingTendency),
				0.45,
				0.65,
			);
		}

		return passOdds;
	}

	// Probability that a kickoff should be an onside kick
	probOnside() {
		if (this.awaitingAfterSafety) {
			return 0;
		}

		// Roughly 1 surprise onside kick per season, but never in the 4th quarter because some of those could be really stupid
		if (this.team[0].stat.ptsQtrs.length < this.numPeriods) {
			return 0.01;
		}

		// Does game situation dictate an onside kick in the 4th quarter?
		if (this.team[0].stat.ptsQtrs.length !== this.numPeriods) {
			return 0;
		}

		const numScoresDown = Math.ceil(
			(this.team[this.d].stat.pts - this.team[this.o].stat.pts) / 8,
		);

		if (numScoresDown <= 0 || numScoresDown >= 4) {
			// Either winning, or being blown out so there's no point
			return 0;
		}

		if (this.clock < 2) {
			return 1;
		}

		if (numScoresDown >= 2 && this.clock < 2.5) {
			return 0.9;
		}

		if (numScoresDown >= 3 && this.clock < 3.5) {
			return 0.8;
		}

		if (numScoresDown >= 2 && this.clock < 5) {
			return numScoresDown / 20;
		}

		return 0;
	}

	hurryUp() {
		const ptsDown = this.team[this.d].stat.pts - this.team[this.o].stat.pts;
		const quarter = this.team[0].stat.ptsQtrs.length;
		return (
			((isFirstPeriodAfterHalftime(quarter + 1, this.numPeriods) &&
				this.scrimmage >= 50) ||
				(quarter === this.numPeriods && ptsDown >= 0)) &&
			this.clock <= 2
		);
	}

	getPlayType() {
		if (this.awaitingKickoff !== undefined) {
			return Math.random() < this.probOnside() ? "onsideKick" : "kickoff";
		}

		const ptsDown = this.team[this.d].stat.pts - this.team[this.o].stat.pts;
		const quarter = this.team[0].stat.ptsQtrs.length;

		if (this.awaitingAfterTouchdown) {
			if (ptsDown === 2 && Math.random() < 0.7) {
				return "twoPointConversion";
			}

			if (quarter >= this.numPeriods - 1) {
				if (ptsDown === 0) {
					return "extraPoint";
				}
				if (ptsDown === 1) {
					return "extraPoint";
				}
				if (ptsDown === 2) {
					return "twoPointConversion";
				}
				if (ptsDown === 4) {
					return "extraPoint";
				}
				if (ptsDown === 5) {
					return "twoPointConversion";
				}
				if (ptsDown === 7) {
					return "extraPoint";
				}
				if (ptsDown === 8) {
					return "extraPoint";
				}
				if (ptsDown === 10) {
					return "twoPointConversion";
				}
				if (ptsDown === 11) {
					return "extraPoint";
				}
				if (ptsDown === 13) {
					return "twoPointConversion";
				}
				if (ptsDown === 14) {
					return "extraPoint";
				}
				if (ptsDown === 15) {
					return "extraPoint";
				}
				if (ptsDown === 18) {
					return "twoPointConversion";
				}
				if (ptsDown === -1) {
					return "twoPointConversion";
				}
				if (ptsDown === -2) {
					return "extraPoint";
				}
				if (ptsDown === -3) {
					return "extraPoint";
				}
				if (ptsDown === -5) {
					return "twoPointConversion";
				}
				if (ptsDown === -6) {
					return "extraPoint";
				}
				if (ptsDown === -7) {
					return "extraPoint";
				}
				if (ptsDown === -8) {
					return "extraPoint";
				}
				if (ptsDown === -9) {
					return "extraPoint";
				}
				if (ptsDown === -10) {
					return "extraPoint";
				}
				if (ptsDown === -12) {
					return "twoPointConversion";
				}
				if (ptsDown === -13) {
					return "extraPoint";
				}
				if (ptsDown === -14) {
					return "extraPoint";
				}
			}

			return Math.random() < 0.95 ? "extraPoint" : "twoPointConversion";
		}

		if (quarter >= this.numPeriods && ptsDown < 0 && this.scrimmage > 10) {
			// Does it make sense to kneel? Depends on clock time and opponent timeouts
			const downsRemaining = 4 - this.down;
			const timeoutDownsRemaining = Math.min(
				this.timeouts[this.d] + (this.clock > 2 ? 1 : 0),
				downsRemaining,
			);
			const clockRunningDownsRemaining = downsRemaining - timeoutDownsRemaining;

			const timeRemainingAfterKeels =
				this.clock -
				(timeoutDownsRemaining * 2 + clockRunningDownsRemaining * 42) / 60;
			if (timeRemainingAfterKeels < 0) {
				return "kneel";
			}
		}

		// Don't kick a FG when we really need a touchdown!
		const needTouchdown =
			quarter >= this.numPeriods && ptsDown > 3 && this.clock <= 2;

		const neverPunt =
			(quarter === this.numPeriods && ptsDown > 0 && this.clock <= 2) ||
			(quarter > this.numPeriods && ptsDown > 0);

		// If there are under 10 seconds left in the half/overtime, maybe try a field goal
		if (
			this.clock <= 10 / 60 &&
			possessionEndsAfterThisPeriod(quarter, this.numPeriods) &&
			!needTouchdown &&
			this.probMadeFieldGoal() >= 0.02
		) {
			return "fieldGoalLate";
		}

		if (this.down === 4) {
			// Don't kick a FG when we really need a touchdown!
			if (!needTouchdown) {
				const probMadeFieldGoal = this.probMadeFieldGoal();

				// If it's 4th and short, maybe go for it
				const probGoForIt = (() => {
					// In overtime, if tied and a field goal would win, try it
					if (
						this.overtimeState !== "firstPossession" &&
						ptsDown === 0 &&
						probMadeFieldGoal >= 0.7
					) {
						return 0;
					}
					if (this.scrimmage < 40) {
						return 0;
					}
					if (this.toGo <= 1) {
						return 0.75;
					}
					if (this.toGo <= 2) {
						return 0.5;
					}
					if (this.toGo <= 3) {
						return 0.35;
					}
					if (this.toGo <= 4) {
						return 0.2;
					}
					if (this.toGo <= 5) {
						return 0.05;
					}
					if (this.toGo <= 7) {
						return 0.01;
					}
					if (this.toGo <= 10) {
						return 0.001;
					}
					return 0;
				})();

				if (Math.random() > probGoForIt) {
					// If it's a makeable field goal, take it
					if (probMadeFieldGoal >= 0.7) {
						return "fieldGoal";
					}

					// If it's a hard field goal, maybe take it
					const probTryFieldGoal = helpers.bound(
						(probMadeFieldGoal - 0.3) / 0.5,
						0,
						1,
					);

					if (Math.random() < probTryFieldGoal) {
						return "fieldGoal";
					}

					// Default option - punt
					if (!neverPunt) {
						return "punt";
					}
				}
			}
		}

		if (Math.random() < this.probPass()) {
			return "pass";
		}

		return "run";
	}

	simPlay() {
		this.currentPlay = new Play(this);

		if (!this.awaitingAfterTouchdown) {
			this.playByPlay.logClock({
				awaitingKickoff: this.awaitingKickoff,
				clock: this.clock,
				down: this.down,
				scrimmage: this.scrimmage,
				t: this.o,
				toGo: this.toGo,
			});
		}

		const playType = this.getPlayType();
		let dt;

		if (playType === "kickoff") {
			dt = this.doKickoff();
		} else if (playType === "onsideKick") {
			dt = this.doKickoff(true);
		} else if (
			playType === "extraPoint" ||
			playType === "fieldGoal" ||
			playType === "fieldGoalLate"
		) {
			dt = this.doFieldGoal(playType);
		} else if (playType === "twoPointConversion") {
			dt = this.doTwoPointConversion();
		} else if (playType === "punt") {
			dt = this.doPunt();
		} else if (playType === "pass") {
			dt = this.doPass();
		} else if (playType === "run") {
			dt = this.doRun();
		} else if (playType === "kneel") {
			dt = this.doKneel();
		} else {
			throw new Error(`Unknown playType "${playType}"`);
		}

		this.currentPlay.commit();

		const quarter = this.team[0].stat.ptsQtrs.length;
		dt /= 60;

		// Two minute warning
		if (
			thisPeriodHasTwoMinuteWarning(quarter, this.numPeriods) &&
			this.clock - dt <= 2 &&
			!this.twoMinuteWarningHappened
		) {
			this.twoMinuteWarningHappened = true;
			this.isClockRunning = false;
			this.playByPlay.logEvent("twoMinuteWarning", {
				clock: this.clock - dt,
			});
		}

		const clockAtEndOfPlay = this.clock - dt;
		if (clockAtEndOfPlay > 0) {
			let twoMinuteWarningHappening = false;
			if (
				thisPeriodHasTwoMinuteWarning(quarter, this.numPeriods) &&
				clockAtEndOfPlay <= 2 &&
				!this.twoMinuteWarningHappened
			) {
				twoMinuteWarningHappening = true;
			}

			if (!twoMinuteWarningHappening) {
				// Timeouts - small chance at any time
				if (Math.random() < 0.01) {
					this.doTimeout(this.o);
				} else if (Math.random() < 0.003) {
					this.doTimeout(this.d);
				}

				// Timeouts - late in game when clock is running
				if (
					thisPeriodHasTwoMinuteWarning(quarter, this.numPeriods) &&
					this.isClockRunning
				) {
					const diff = this.team[this.o].stat.pts - this.team[this.d].stat.pts;

					// No point in the 4th quarter of a blowout
					if (diff < 24 || quarter < this.numPeriods) {
						if (diff > 0) {
							// If offense is winning, defense uses timeouts when near the end
							if (this.clock < 2.5) {
								this.doTimeout(this.d);
							}
						} else if (this.clock < 1.5) {
							// If offense is losing or tied, offense uses timeouts when even nearer the end
							this.doTimeout(this.o);
						}
					}
				}
			}
		}

		// Time between plays (can be more than 40 seconds because there is time before the play clock starts)
		let dtClockRunning = 0;

		if (this.isClockRunning) {
			if (this.hurryUp()) {
				dtClockRunning = random.randInt(5, 13) / 60;

				// Leave some time for a FG attempt!
				if (this.clock - dt - dtClockRunning < 0) {
					dtClockRunning = random.randInt(0, 4) / 60;
				}
			} else {
				dtClockRunning = random.randInt(37, 62) / 60;
			}
		}

		// Check two minute warning again
		if (
			thisPeriodHasTwoMinuteWarning(quarter, this.numPeriods) &&
			this.clock - dt - dtClockRunning <= 2 &&
			!this.twoMinuteWarningHappened
		) {
			this.twoMinuteWarningHappened = true;
			this.isClockRunning = false;
			this.playByPlay.logEvent("twoMinuteWarning", {
				clock: 2,
			});

			// Clock only runs until it hits 2 minutes exactly
			dtClockRunning = helpers.bound(this.clock - dt - 2, 0, Infinity);
		}

		// Clock
		dt += dtClockRunning;
		this.clock -= dt;

		if (this.clock < 0) {
			dt += this.clock;
			this.clock = 0;
		}

		this.updatePlayingTime(dt);
		if (playType !== "kneel") {
			this.injuries();
		}

		if (
			this.overtimeState === "bothTeamsPossessed" &&
			this.team[0].stat.pts !== this.team[1].stat.pts &&
			(!this.awaitingAfterTouchdown ||
				Math.abs(this.team[0].stat.pts - this.team[1].stat.pts) > 2)
		) {
			this.overtimeState = "over";
		}
	}

	doTackle({ loss }: { loss: boolean }) {
		const d = this.currentPlay.state.current.d;

		// For non-sacks, record tackler(s)
		if (Math.random() < 0.9) {
			let playersDefense: PlayerGameSim[] = [];

			for (const playersAtPos of Object.values(this.playersOnField[d])) {
				if (playersAtPos) {
					playersDefense = playersDefense.concat(playersAtPos);
				}
			}

			// Bias away from DL and CB
			const positions: Position[] | undefined =
				this.playersOnField[d].LB &&
				this.playersOnField[d].LB!.length > 0 &&
				Math.random() < 0.25
					? ["LB", "S"]
					: undefined;

			const tacklers =
				Math.random() < 0.25
					? new Set([
							this.pickPlayer(d, "tackling", positions, 1.5),
							this.pickPlayer(d, "tackling", positions, 1.5),
					  ])
					: new Set([this.pickPlayer(d, "tackling", positions, 1.5)]);

			this.currentPlay.addEvent({
				type: "tck",
				tacklers,
				loss,
			});
		}
	}

	updateTeamCompositeRatings() {
		// Top 3 receivers, plus a bit more for others
		this.team[this.o].compositeRating.receiving = getCompositeFactor({
			playersOnField: this.playersOnField[this.o],
			positions: ["WR", "TE", "RB"],
			orderField: "ovrs.WR",
			weightsMain: [5, 3, 2],
			weightsBonus: [0.5, 0.25],
			valFunc: p => p.ovrs.WR / 100,
		});
		this.team[this.o].compositeRating.rushing = getCompositeFactor({
			playersOnField: this.playersOnField[this.o],
			positions: ["RB", "WR", "QB"],
			orderField: "ovrs.RB",
			weightsMain: [1],
			weightsBonus: [0.1],
			valFunc: p => (p.ovrs.RB / 100 + p.compositeRating.rushing) / 2,
		});

		// Top 5 blockers, plus a bit more from TE/RB if they exist
		this.team[this.o].compositeRating.passBlocking = getCompositeFactor({
			playersOnField: this.playersOnField[this.o],
			positions: ["OL", "TE", "RB"],
			orderField: "ovrs.OL",
			weightsMain: [5, 4, 3, 3, 3],
			weightsBonus: [1, 0.5],
			valFunc: p => (p.ovrs.OL / 100 + p.compositeRating.passBlocking) / 2,
		});
		this.team[this.o].compositeRating.runBlocking = getCompositeFactor({
			playersOnField: this.playersOnField[this.o],
			positions: ["OL", "TE", "RB"],
			orderField: "ovrs.OL",
			weightsMain: [5, 4, 3, 3, 3],
			weightsBonus: [1, 0.5],
			valFunc: p => (p.ovrs.OL / 100 + p.compositeRating.runBlocking) / 2,
		});
		this.team[this.d].compositeRating.passRushing = getCompositeFactor({
			playersOnField: this.playersOnField[this.d],
			positions: ["DL", "LB"],
			orderField: "ovrs.DL",
			weightsMain: [5, 4, 3, 2, 1],
			weightsBonus: [],
			valFunc: p => (p.ovrs.DL / 100 + p.compositeRating.passRushing) / 2,
		});
		this.team[this.d].compositeRating.runStopping = getCompositeFactor({
			playersOnField: this.playersOnField[this.d],
			positions: ["DL", "LB", "S"],
			orderField: "ovrs.DL",
			weightsMain: [5, 4, 3, 2, 2, 1, 1],
			weightsBonus: [0.5, 0.5],
			valFunc: p => (p.ovrs.DL / 100 + p.compositeRating.runStopping) / 2,
		});
		this.team[this.d].compositeRating.passCoverage = getCompositeFactor({
			playersOnField: this.playersOnField[this.d],
			positions: ["CB", "S", "LB"],
			orderField: "ovrs.CB",
			weightsMain: [5, 4, 3, 2],
			weightsBonus: [1, 0.5],
			valFunc: p => (p.ovrs.CB / 100 + p.compositeRating.passCoverage) / 2,
		});
	}

	updatePlayersOnField(
		playType:
			| "starters"
			| "run"
			| "pass"
			| "extraPoint"
			| "fieldGoal"
			| "punt"
			| "kickoff",
	) {
		let formation: Formation;

		if (playType === "starters") {
			formation = formations.normal[0];
		} else if (playType === "run" || playType === "pass") {
			formation = random.choice(formations.normal);
		} else if (playType === "extraPoint" || playType === "fieldGoal") {
			formation = random.choice(formations.fieldGoal);
		} else if (playType === "punt") {
			formation = random.choice(formations.punt);
		} else if (playType === "kickoff") {
			formation = random.choice(formations.kickoff);
		} else {
			throw new Error(`Unknown playType "${playType}"`);
		}

		const sides = ["off", "def"] as const;

		for (let i = 0; i < 2; i++) {
			const t = i === 0 ? this.o : this.d;
			const side = sides[i];

			// Don't let one player be used at two positions!
			const pidsUsed = new Set();
			this.playersOnField[t] = {};

			for (const pos of helpers.keys(formation[side])) {
				const numPlayers = formation[side][pos];
				const players = this.team[t].depth[pos]
					.filter(p => !p.injured)
					.filter(p => !pidsUsed.has(p.id))
					.filter(p => {
						// For some positions, filter out some players based on fatigue
						const positions = ["RB", "WR", "TE", "DL", "LB", "CB", "S"];

						if (!positions.includes(pos)) {
							return true;
						}

						return Math.random() < fatigue(p.stat.energy);
					});
				this.playersOnField[t][pos] = players.slice(0, numPlayers);

				// @ts-expect-error
				for (const p of this.playersOnField[t][pos]) {
					pidsUsed.add(p.id);
				}

				if (playType === "starters") {
					// @ts-expect-error
					for (const p of this.playersOnField[t][pos]) {
						this.recordStat(t, p, "gs");
					}
				}
			}
		}

		this.updateTeamCompositeRatings();
	}

	doTimeout(t: TeamNum) {
		if (this.timeouts[t] <= 0) {
			return;
		}

		this.timeouts[t] -= 1;
		this.isClockRunning = false;
		this.playByPlay.logEvent("timeout", {
			clock: this.clock,
			offense: t === this.o,
			t,
		});
	}

	doKickoff(onside: boolean = false) {
		this.updatePlayersOnField("kickoff");
		const kicker = this.getTopPlayerOnField(this.o, "K");
		let dt = 0;

		if (onside) {
			dt = random.randInt(2, 5);
			const kickTo = random.randInt(40, 55);
			this.currentPlay.addEvent({
				type: "onsideKick",
				kickTo,
			});
			this.playByPlay.logEvent("onsideKick", {
				clock: this.clock,
				t: this.o,
				names: [kicker.name],
			});
			const success = Math.random() < 0.1;

			const p = success ? this.pickPlayer(this.o) : this.pickPlayer(this.d);

			let yds = 0;
			if (!success) {
				this.currentPlay.addEvent({
					type: "possessionChange",
					yds: 0,
					kickoff: true,
				});

				const rawLength = Math.random() < 0.003 ? 100 : random.randInt(0, 5);
				yds = this.currentPlay.boundedYds(rawLength);
				dt += Math.abs(yds) / 8;
			}

			const { td } = this.currentPlay.addEvent({
				type: "onsideKickRecovery",
				success,
				p,
				yds,
			});

			if (td) {
				this.currentPlay.addEvent({
					type: "krTD",
					p,
				});
			} else {
				this.doTackle({
					loss: false,
				});
			}

			this.playByPlay.logEvent("onsideKickRecovery", {
				clock: this.clock,
				t: this.currentPlay.state.current.o,
				names: [p.name],
				success,
				td,
			});
		} else {
			const kickReturner = this.getTopPlayerOnField(this.d, "KR");
			const touchback = Math.random() > 0.5;
			const kickTo = this.awaitingAfterSafety
				? random.randInt(15, 35)
				: random.randInt(-9, 10);
			this.currentPlay.addEvent({
				type: "k",
				kickTo,
			});
			this.playByPlay.logEvent("kickoff", {
				clock: this.clock,
				t: this.o,
				names: [kicker.name],
				touchback,
				yds: kickTo,
			});

			this.currentPlay.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});
			if (touchback) {
				this.currentPlay.addEvent({
					type: "touchbackKick",
				});
			} else {
				let ydsRaw = Math.round(random.truncGauss(20, 5, -10, 109));

				if (Math.random() < 0.02) {
					ydsRaw += random.randInt(0, 109);
				}

				const returnLength = this.currentPlay.boundedYds(ydsRaw);
				dt = Math.abs(returnLength) / 8;

				this.checkPenalties("kickoffReturn", {
					ballCarrier: kickReturner,
					playYds: returnLength,
				});

				const { td } = this.currentPlay.addEvent({
					type: "kr",
					p: kickReturner,
					yds: returnLength,
				});

				if (td) {
					this.currentPlay.addEvent({
						type: "krTD",
						p: kickReturner,
					});
				} else {
					this.doTackle({
						loss: false,
					});
				}

				this.playByPlay.logEvent("kickoffReturn", {
					clock: this.clock,
					t: this.currentPlay.state.current.o,
					names: [kickReturner.name],
					td,
					yds: returnLength,
				});
			}
		}

		this.recordStat(this.currentPlay.state.current.o, undefined, "drives");
		this.recordStat(
			this.currentPlay.state.current.o,
			undefined,
			"totStartYds",
			this.currentPlay.state.current.scrimmage,
		);

		return dt;
	}

	doPunt() {
		this.updatePlayersOnField("punt");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			return 0;
		}

		const punter = this.getTopPlayerOnField(this.o, "P");
		const puntReturner = this.getTopPlayerOnField(this.d, "PR");
		const adjustment = (punter.compositeRating.punting - 0.6) * 20; // 100 ratings - 8 yd bonus. 0 ratings - 12 yard penalty

		const distance = Math.round(random.truncGauss(44 + adjustment, 8, 25, 90));
		let dt = random.randInt(5, 9);

		this.checkPenalties("punt");

		const { touchback } = this.currentPlay.addEvent({
			type: "p",
			p: punter,
			yds: distance,
		});

		this.playByPlay.logEvent("punt", {
			clock: this.clock,
			t: this.o,
			names: [punter.name],
			touchback,
			yds: distance,
		});

		this.currentPlay.addEvent({
			type: "possessionChange",
			yds: 0,
		});

		if (touchback) {
			this.currentPlay.addEvent({
				type: "touchbackPunt",
				p: punter,
			});
		} else {
			const maxReturnLength = 100 - this.currentPlay.state.current.scrimmage;
			let ydsRaw = Math.round(random.truncGauss(10, 10, -10, 109));

			if (Math.random() < 0.03) {
				ydsRaw += random.randInt(0, 109);
			}

			const returnLength = helpers.bound(ydsRaw, 0, maxReturnLength);
			dt += Math.abs(returnLength) / 8;
			this.checkPenalties("puntReturn", {
				ballCarrier: puntReturner,
				playYds: returnLength,
			});

			const { td } = this.currentPlay.addEvent({
				type: "pr",
				p: puntReturner,
				yds: returnLength,
			});

			if (td) {
				this.currentPlay.addEvent({
					type: "prTD",
					p: puntReturner,
				});
			} else {
				this.doTackle({
					loss: false,
				});
			}

			this.playByPlay.logEvent("puntReturn", {
				clock: this.clock,
				t: this.currentPlay.state.current.o,
				names: [puntReturner.name],
				td,
				yds: returnLength,
			});
		}

		this.recordStat(this.currentPlay.state.current.o, undefined, "drives");
		this.recordStat(
			this.currentPlay.state.current.o,
			undefined,
			"totStartYds",
			this.currentPlay.state.current.scrimmage,
		);

		return dt;
	}

	probMadeFieldGoal(kickerInput?: PlayerGameSim, extraPoint?: boolean) {
		const kicker =
			kickerInput !== undefined
				? kickerInput
				: this.team[this.o].depth.K.find(p => !p.injured);
		let baseProb = 0;
		let distance = extraPoint ? 33 : 100 - this.scrimmage + 17;

		if (!kicker) {
			// Would take an absurd amount of injuries to get here, but technically possible
			return 0;
		}

		// Kickers with strong/weak legs effectively have adjusted distances: -5 yds for 100, +15 yds for 0
		distance += -(kicker.compositeRating.kickingPower - 0.75) * 20;

		if (distance < 20) {
			baseProb = 0.99;
		} else if (distance < 30) {
			baseProb = 0.98;
		} else if (distance < 35) {
			baseProb = 0.95;
		} else if (distance < 37) {
			baseProb = 0.94;
		} else if (distance < 38) {
			baseProb = 0.93;
		} else if (distance < 39) {
			baseProb = 0.92;
		} else if (distance < 40) {
			baseProb = 0.91;
		} else if (distance < 41) {
			baseProb = 0.89;
		} else if (distance < 42) {
			baseProb = 0.87;
		} else if (distance < 43) {
			baseProb = 0.85;
		} else if (distance < 44) {
			baseProb = 0.83;
		} else if (distance < 45) {
			baseProb = 0.81;
		} else if (distance < 46) {
			baseProb = 0.79;
		} else if (distance < 47) {
			baseProb = 0.77;
		} else if (distance < 48) {
			baseProb = 0.75;
		} else if (distance < 49) {
			baseProb = 0.73;
		} else if (distance < 50) {
			baseProb = 0.71;
		} else if (distance < 51) {
			baseProb = 0.69;
		} else if (distance < 52) {
			baseProb = 0.65;
		} else if (distance < 53) {
			baseProb = 0.61;
		} else if (distance < 54) {
			baseProb = 0.59;
		} else if (distance < 55) {
			baseProb = 0.55;
		} else if (distance < 56) {
			baseProb = 0.51;
		} else if (distance < 57) {
			baseProb = 0.47;
		} else if (distance < 58) {
			baseProb = 0.43;
		} else if (distance < 59) {
			baseProb = 0.39;
		} else if (distance < 60) {
			baseProb = 0.35;
		} else if (distance < 61) {
			baseProb = 0.3;
		} else if (distance < 62) {
			baseProb = 0.25;
		} else if (distance < 63) {
			baseProb = 0.2;
		} else if (distance < 64) {
			baseProb = 0.1;
		} else if (distance < 65) {
			baseProb = 0.05;
		} else if (distance < 70) {
			baseProb = 0.005;
		} else if (distance < 75) {
			baseProb = 0.0001;
		} else if (distance < 80) {
			baseProb = 0.000001;
		} else {
			baseProb = 0;
		}

		// Accurate kickers get a boost. Max boost is the min of (.1, (1-baseProb)/2, and baseProb/2)
		const baseBoost = (kicker.compositeRating.kickingAccuracy - 0.7) / 3;
		const boost = Math.min(baseBoost, (1 - baseProb) / 2, baseProb / 2);
		return baseProb + boost;
	}

	doFieldGoal(playType: "extraPoint" | "fieldGoal" | "fieldGoalLate") {
		const extraPoint = playType === "extraPoint";

		if (extraPoint) {
			this.playByPlay.logEvent("extraPointAttempt", {
				clock: this.clock,
				t: this.o,
			});
		}

		this.updatePlayersOnField("fieldGoal");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			return 0;
		}

		const distance = extraPoint ? 33 : 100 - this.scrimmage + 17;
		const kicker = this.getTopPlayerOnField(this.o, "K");
		const made = Math.random() < this.probMadeFieldGoal(kicker, extraPoint);
		const dt = extraPoint ? 0 : random.randInt(4, 6);
		this.checkPenalties("fieldGoal");

		if (extraPoint) {
			this.currentPlay.addEvent({
				type: "xp",
				p: kicker,
				made,
				distance,
			});
		} else {
			this.currentPlay.addEvent({
				type: "fg",
				p: kicker,
				made,
				distance,
				late: playType === "fieldGoalLate",
			});

			if (!made) {
				this.currentPlay.addEvent({
					type: "possessionChange",
					yds: -7,
				});
			}
		}

		this.playByPlay.logEvent(extraPoint ? "extraPoint" : "fieldGoal", {
			clock: this.clock,
			t: this.o,
			made,
			names: [kicker.name],
			yds: distance,
		});

		return dt;
	}

	doTwoPointConversion() {
		const getPts = () =>
			this.currentPlay.state.current.pts[0] +
			this.currentPlay.state.current.pts[1];

		const twoPointConversionTeam = this.o;

		this.currentPlay.addEvent({
			type: "twoPointConversion",
			t: twoPointConversionTeam,
		});

		this.playByPlay.twoPointConversionTeam = twoPointConversionTeam;

		this.playByPlay.logEvent("twoPointConversion", {
			clock: this.clock,
			t: twoPointConversionTeam,
		});

		const ptsBefore = getPts();

		if (Math.random() > 0.5) {
			this.doPass();
		} else {
			this.doRun();
		}

		const ptsAfter = getPts();

		this.currentPlay.addEvent({
			type: "twoPointConversionDone",
			t: twoPointConversionTeam,
		});

		if (ptsBefore === ptsAfter) {
			// Must have failed!
			this.playByPlay.logEvent("twoPointConversionFailed", {
				clock: this.clock,
				t: twoPointConversionTeam,
			});
		}

		this.playByPlay.twoPointConversionTeam = undefined;

		return 0;
	}

	probFumble(p: PlayerGameSim) {
		return 0.0125 * (1.5 - p.compositeRating.ballSecurity);
	}

	doFumble(pFumbled: PlayerGameSim, spotYds: number) {
		const { o, d } = this.currentPlay.state.current;
		const pForced = this.pickPlayer(d, "tackling");
		this.currentPlay.addEvent({
			type: "fmb",
			pFumbled,
			pForced,
			yds: spotYds,
		});

		this.playByPlay.logEvent("fumble", {
			clock: this.clock,
			t: o,
			names: [pFumbled.name, pForced.name],
		});

		const lost = Math.random() > 0.5;
		const tRecovered = lost ? d : o;
		const pRecovered = this.pickPlayer(tRecovered);

		let ydsRaw = Math.round(random.truncGauss(2, 6, -5, 15));

		if (Math.random() < (lost ? 0.01 : 0.0001)) {
			ydsRaw += random.randInt(0, 109);
		}

		if (lost) {
			this.currentPlay.addEvent({
				type: "possessionChange",
				yds: 0,
			});
		}

		const yds = this.currentPlay.boundedYds(ydsRaw);

		const { safety, td, touchback } = this.currentPlay.addEvent({
			type: "fmbRec",
			pFumbled,
			pRecovered,
			yds,
			lost,
		});

		let dt = Math.abs(yds) / 6;

		let fumble = false;

		if (!touchback) {
			if (td) {
				this.currentPlay.addEvent({
					type: "fmbTD",
					p: pRecovered,
				});
			} else if (safety) {
				this.doSafety();
			} else if (Math.random() < this.probFumble(pRecovered)) {
				fumble = true;
			} else {
				this.doTackle({
					loss: false,
				});
			}
		}

		this.playByPlay.logEvent("fumbleRecovery", {
			clock: this.clock,
			lost,
			t: tRecovered,
			names: [pRecovered.name],
			safety,
			td,
			touchback,
			yds,
		});

		if (fumble) {
			dt += this.doFumble(pRecovered, 0);
		}

		return dt;
	}

	doInterception(qb: PlayerGameSim, ydsPass: number) {
		this.currentPlay.addEvent({
			type: "possessionChange",
			yds: ydsPass,
		});

		const p = this.pickPlayer(this.d, "passCoverage");
		let ydsRaw = Math.round(random.truncGauss(4, 6, -5, 15));

		if (Math.random() < 0.075) {
			ydsRaw += random.randInt(0, 109);
		}

		const yds = this.currentPlay.boundedYds(ydsRaw);
		let dt = Math.abs(yds) / 8;

		const { td, touchback } = this.currentPlay.addEvent({
			type: "int",
			qb,
			defender: p,
			ydsReturn: yds,
		});

		let fumble = false;

		if (touchback) {
			this.currentPlay.addEvent({
				type: "touchbackInt",
			});
		} else if (td) {
			this.currentPlay.addEvent({
				type: "intTD",
				p,
			});
		} else if (Math.random() < this.probFumble(p)) {
			fumble = true;
		} else {
			this.doTackle({
				loss: false,
			});
		}

		this.playByPlay.logEvent("interception", {
			clock: this.clock,
			t: this.currentPlay.state.current.o,
			names: [p.name],
			td,
			touchback,
			yds,
		});

		if (fumble) {
			dt += this.doFumble(p, 0);
		}

		return dt;
	}

	doSafety(p?: PlayerGameSim) {
		if (!p) {
			p = this.pickPlayer(
				this.d,
				Math.random() < 0.5 ? "passRushing" : "runStopping",
			);
		}

		this.currentPlay.addEvent({
			type: "defSft",
			p,
		});
	}

	doSack(qb: PlayerGameSim) {
		const p = this.pickPlayer(
			this.currentPlay.state.initial.d,
			"passRushing",
			undefined,
			5,
		);
		const ydsRaw = random.randInt(-1, -15);
		const yds = this.currentPlay.boundedYds(ydsRaw);

		const { safety } = this.currentPlay.addEvent({
			type: "sk",
			qb,
			p,
			yds,
		});

		if (safety) {
			this.doSafety(p);
		}

		this.playByPlay.logEvent("sack", {
			clock: this.clock,
			t: this.currentPlay.state.initial.o,
			names: [qb.name, p.name],
			safety,
			yds,
		});

		return random.randInt(3, 8);
	}

	probSack(qb: PlayerGameSim) {
		return (
			(0.06 * this.team[this.d].compositeRating.passRushing) /
			(0.5 *
				(qb.compositeRating.avoidingSacks +
					this.team[this.o].compositeRating.passBlocking))
		);
	}

	probInt(qb: PlayerGameSim) {
		return (
			(((0.02 * this.team[this.d].compositeRating.passCoverage) /
				(0.5 *
					(qb.compositeRating.passingVision +
						qb.compositeRating.passingAccuracy))) *
				this.team[this.d].compositeRating.passRushing) /
			this.team[this.o].compositeRating.passBlocking
		);
	}

	probComplete(
		qb: PlayerGameSim,
		target: PlayerGameSim,
		defender: PlayerGameSim,
	) {
		const factor =
			((0.2 *
				(target.compositeRating.catching +
					target.compositeRating.gettingOpen +
					qb.compositeRating.passingAccuracy +
					qb.compositeRating.passingDeep +
					qb.compositeRating.passingVision)) /
				(0.5 *
					(defender.compositeRating.passCoverage +
						this.team[this.d].compositeRating.passCoverage))) *
			Math.sqrt(
				this.team[this.o].compositeRating.passBlocking /
					this.team[this.d].compositeRating.passRushing,
			);
		const p = 0.24 + 0.4 * factor ** 1.25;
		return helpers.bound(p, 0, 0.95);
	}

	probScramble(qb?: PlayerGameSim) {
		const qbOvrRB = qb?.ovrs.RB ?? 0;
		return 0.01 + Math.max(0, (0.4 * (qbOvrRB - 30)) / 100);
	}

	doPass() {
		const o = this.o;
		const d = this.d;

		this.updatePlayersOnField("pass");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			return 0;
		}

		const qb = this.getTopPlayerOnField(o, "QB");
		this.currentPlay.addEvent({
			type: "dropback",
		});
		this.playByPlay.logEvent("dropback", {
			clock: this.clock,
			t: o,
			names: [qb.name],
		});
		let dt = random.randInt(2, 6);

		if (Math.random() < this.probFumble(qb)) {
			const yds = this.currentPlay.boundedYds(random.randInt(-1, -10));
			return dt + this.doFumble(qb, yds);
		}

		const sack = Math.random() < this.probSack(qb);

		if (sack) {
			return this.doSack(qb);
		}

		if (this.probScramble(this.playersOnField[o].QB?.[0]) > Math.random()) {
			return this.doRun(true);
		}

		const target = this.pickPlayer(
			o,
			Math.random() < 0.2 ? "catching" : "gettingOpen",
			["WR", "TE", "RB"],
		);
		let ydsRaw = Math.round(
			random.truncGauss(
				9.2 *
					(this.team[o].compositeRating.passBlocking /
						this.team[d].compositeRating.passRushing),
				7,
				-5,
				100,
			),
		);

		if (Math.random() < qb.compositeRating.passingDeep * 0.07) {
			ydsRaw += random.randInt(0, 109);
		}

		const yds = this.currentPlay.boundedYds(ydsRaw);

		const defender = this.pickPlayer(d, "passCoverage", ["CB", "S", "LB"]);
		const complete = Math.random() < this.probComplete(qb, target, defender);
		const interception = Math.random() < this.probInt(qb);

		this.checkPenalties("pass", {
			ballCarrier: target,
			playYds: yds,
			incompletePass: !complete && !interception,
		});

		this.currentPlay.addEvent({
			type: "pss",
			qb,
			target,
		});

		if (interception) {
			dt += this.doInterception(qb, yds);
		} else {
			dt += Math.abs(yds) / 20;

			if (complete) {
				const { td, safety } = this.currentPlay.addEvent({
					type: "pssCmp",
					qb,
					target,
					yds,
				});

				// Don't log here, because we need to log all the stats first, otherwise live box score will update slightly out of order
				const completeEvent = {
					clock: this.clock,
					t: o,
					names: [qb.name, target.name],
					safety,
					td,
					yds,
				};

				// Fumble after catch... only if nothing else is going on, too complicated otherwise
				if (!td && !safety) {
					if (Math.random() < this.probFumble(target)) {
						this.playByPlay.logEvent("passComplete", completeEvent);
						return dt + this.doFumble(target, 0);
					}
				}

				if (td) {
					this.currentPlay.addEvent({
						type: "pssTD",
						qb,
						target,
					});
				}

				this.playByPlay.logEvent("passComplete", completeEvent);

				if (safety) {
					this.doSafety();
				} else if (!td) {
					this.doTackle({
						loss: yds < 0,
					});
				}
			} else {
				this.currentPlay.addEvent({
					type: "pssInc",
					defender: Math.random() < 0.28 ? defender : undefined,
				});

				this.playByPlay.logEvent("passIncomplete", {
					clock: this.clock,
					t: o,
					names: [qb.name, target.name],
					yds,
				});
			}
		}

		return dt;
	}

	doRun(qbScramble: boolean = false) {
		const o = this.o;
		const d = this.d;

		if (!qbScramble) {
			this.updatePlayersOnField("run");
			const penInfo = this.checkPenalties("beforeSnap");

			if (penInfo) {
				return 0;
			}
		}

		// Usually do normal run, but sometimes do special stuff
		let positions: Position[];
		if (qbScramble) {
			positions = ["QB"];
		} else {
			positions = ["RB"];
			const rand = Math.random();

			const rbs = this.playersOnField[o].RB || [];

			if (rand < 0.5 || rbs.length === 0) {
				positions.push("QB");
			} else if (rand < 0.59 || rbs.length === 0) {
				positions.push("WR");
			}
		}

		const p = this.pickPlayer(o, "rushing", positions);
		const qb = this.getTopPlayerOnField(o, "QB");
		this.playByPlay.logEvent("handoff", {
			clock: this.clock,
			t: o,
			names: p === qb ? [qb.name] : [qb.name, p.name],
		});
		const meanYds =
			(3.5 *
				0.5 *
				(p.compositeRating.rushing +
					this.team[o].compositeRating.runBlocking)) /
			this.team[d].compositeRating.runStopping;
		let ydsRaw = Math.round(random.truncGauss(meanYds, 6, -5, 15));

		if (Math.random() < 0.01) {
			ydsRaw += random.randInt(0, 109);
		}

		const yds = this.currentPlay.boundedYds(ydsRaw);
		const dt = random.randInt(2, 4) + Math.abs(yds) / 10;

		this.checkPenalties("run", {
			ballCarrier: p,
			playYds: yds,
		});

		const { td, safety } = this.currentPlay.addEvent({
			type: "rus",
			p,
			yds,
		});

		// Fumble after run... only if nothing else is going on, too complicated otherwise
		if (!td && !safety) {
			if (Math.random() < this.probFumble(p)) {
				this.awaitingAfterTouchdown = false; // In case set by this.advanceYds

				return dt + this.doFumble(p, 0);
			}
		}

		if (td) {
			this.currentPlay.addEvent({
				type: "rusTD",
				p,
			});
		} else if (safety) {
			this.doSafety();
		} else {
			this.doTackle({
				loss: yds < 0,
			});
		}

		this.playByPlay.logEvent("run", {
			clock: this.clock,
			t: o,
			names: [p.name],
			safety,
			td,
			yds,
		});

		return dt;
	}

	doKneel() {
		const o = this.o;

		this.updatePlayersOnField("run");

		const qb = this.getTopPlayerOnField(o, "QB");

		const yds = random.randInt(0, -3);

		this.currentPlay.addEvent({
			type: "kneel",
			p: qb,
			yds,
		});

		this.playByPlay.logEvent("kneel", {
			clock: this.clock,
			t: o,
			names: [qb.name],
		});

		const dt = random.randInt(42, 44);

		return dt;
	}

	// Call this before actually advancing the ball, because different logic will apply if it's a spot foul or not
	checkPenalties(
		playType: PenaltyPlayType,
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			ballCarrier,
			incompletePass = false,
			playYds = 0,
		}: {
			ballCarrier?: PlayerGameSim;
			incompletePass?: boolean;
			playYds?: number;
		} = {
			ballCarrier: undefined,
			incompletePass: false,
			playYds: 0,
		},
	): boolean {
		// No penalties during two point conversion, because it is not handled well currently (no logic to support retrying conversion/xp)
		if (this.currentPlay.state.current.twoPointConversionTeam !== undefined) {
			return false;
		}

		// At most 2 penalties on a play, otherwise it can get tricky to figure out what to accept (need to consider the other coach as intelligent and anticipate what he would do, minimax)
		const maxNumPenaltiesAllowed = 2 - this.currentPlay.numPenalties;
		if (maxNumPenaltiesAllowed <= 0) {
			return false;
		}

		const foulRateFactor = g.get("foulRateFactor");

		let called = penalties.filter(pen => {
			if (!pen.playTypes.includes(playType)) {
				return false;
			}

			return Math.random() < pen.probPerPlay * foulRateFactor;
		});

		if (called.length === 0) {
			// if (called.length === 0 && playType !== "puntReturn") {
			return false;
		}

		// Always do multiple penalties for testing
		/*called = penalties.filter(pen => {
			if (!pen.playTypes.includes(playType)) {
				return false;
			}

			return true;
		});*/

		if (called.length > maxNumPenaltiesAllowed) {
			random.shuffle(called);
			called = called.slice(0, maxNumPenaltiesAllowed);
		}

		const scrimmage = this.currentPlay.state.current.scrimmage;

		const penInfos = called.map(pen => {
			let spotYds: number | undefined;

			const t =
				pen.side === "offense"
					? this.currentPlay.state.current.o
					: this.currentPlay.state.current.d;

			const isReturn =
				playType === "kickoffReturn" || playType === "puntReturn";

			const tackOn =
				(pen.tackOn && playYds > 0 && !incompletePass) ||
				(isReturn && pen.side === "defense");

			if ((pen.spotFoul || (isReturn && pen.side === "offense")) && !tackOn) {
				if (pen.side === "offense" && playYds > 0) {
					// Offensive spot foul - only when past the line of scrimmage
					spotYds = random.randInt(1, playYds);

					// Don't let it be in the endzone, otherwise shit gets weird with safeties
					if (spotYds + scrimmage < 1) {
						spotYds = 1 - scrimmage;
					}
				} else if (pen.side === "defense" && !isReturn) {
					// Defensive spot foul - could be in secondary too
					spotYds = random.randInt(0, playYds);
				}

				if (spotYds !== undefined) {
					// On kickoff returns, penalties are very unlikely to occur extremely deep
					if (playType === "kickoffReturn" && spotYds + scrimmage <= 10) {
						spotYds += random.randInt(10, playYds);
					}
				}
			} else if (tackOn) {
				spotYds = playYds;
			}

			if (spotYds !== undefined) {
				if (spotYds + scrimmage > 99) {
					spotYds = 99 - scrimmage;
				}
			}

			return {
				automaticFirstDown: !!pen.automaticFirstDown,
				name: pen.name,
				penYds: pen.yds,
				posOdds: pen.posOdds,
				spotYds,
				t,
				tackOn,
			};
		});

		for (const penInfo of penInfos) {
			let p: PlayerGameSim | undefined;

			const posOdds = penInfo.posOdds;

			if (posOdds !== undefined) {
				const positionsOnField = helpers.keys(this.playersOnField[penInfo.t]);
				const positionsForPenalty = helpers.keys(posOdds);
				const positions = positionsOnField.filter(pos =>
					positionsForPenalty.includes(pos),
				);

				if (positions.length > 0) {
					// https://github.com/microsoft/TypeScript/issues/21732
					// @ts-expect-error
					const pos = random.choice(positions, pos2 => posOdds[pos2]);

					const players = this.playersOnField[penInfo.t][pos];

					if (players !== undefined && players.length > 0) {
						p = random.choice(players);
					}
				}

				if (!p) {
					p = this.pickPlayer(penInfo.t);
				}

				// Ideally, when notBallCarrier is set, we should ensure that p is not the ball carrier.
			}

			this.currentPlay.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: penInfo.automaticFirstDown,
				name: penInfo.name,
				penYds: penInfo.penYds,
				spotYds: penInfo.spotYds,
				t: penInfo.t,
				tackOn: penInfo.tackOn,
			});

			this.playByPlay.logEvent("flag", {
				clock: this.clock,
			});
		}

		return true;
	}

	updatePlayingTime(possessionTime: number) {
		this.recordStat(this.o, undefined, "timePos", possessionTime);
		const onField = new Set();

		for (const t of teamNums) {
			// Get rid of this after making sure playersOnField is always set, even for special teams
			if (this.playersOnField[t] === undefined) {
				continue;
			}

			for (const pos of helpers.keys(this.playersOnField[t])) {
				// Update minutes (overall, court, and bench)
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-expect-error
				for (const p of this.playersOnField[t][pos]) {
					onField.add(p.id);
					this.recordStat(t, p, "min", possessionTime);
					this.recordStat(t, p, "courtTime", possessionTime);

					// This used to be 0.04. Increase more to lower PT
					this.recordStat(
						t,
						p,
						"energy",
						-0.08 * (1 - p.compositeRating.endurance),
					);

					if (p.stat.energy < 0) {
						p.stat.energy = 0;
					}
				}
			}

			for (const p of this.team[t].player) {
				if (!onField.has(p.id)) {
					this.recordStat(t, p, "benchTime", possessionTime);
					this.recordStat(t, p, "energy", 0.5);

					if (p.stat.energy > 1) {
						p.stat.energy = 1;
					}
				}
			}
		}
	}

	injuries() {
		if ((g as any).disableInjuries) {
			return;
		}

		for (const t of teamNums) {
			// Get rid of this after making sure playersOnField is always set, even for special teams
			if (this.playersOnField[t] === undefined) {
				continue;
			}

			const onField = new Set<any>();

			for (const pos of helpers.keys(this.playersOnField[t])) {
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-expect-error
				for (const p of this.playersOnField[t][pos]) {
					onField.add(p);
				}
			}

			for (const p of onField) {
				// Modulate injuryRate by age - assume default is 25 yo, and increase/decrease by 3%
				const injuryRate = getInjuryRate(
					g.get("injuryRate"),
					p.age,
					p.injury.playingThrough,
				);

				if (Math.random() < injuryRate) {
					// 50% as many injuries for QB
					if (p.pos === "QB" && Math.random() < 0.5) {
						continue;
					}

					p.injured = true;
					p.newInjury = true;
					this.playByPlay.logEvent("injury", {
						clock: this.clock,
						t,
						names: [`${p.pos} ${p.name} (ABBREV)`],
						injuredPID: p.id,
					});
				}
			}
		}
	}

	pickPlayer(
		t: TeamNum,
		rating?: CompositeRating,
		positions: Position[] = POSITIONS,
		power: number = 1,
	) {
		const players = getPlayers(this.playersOnField[t], positions);
		const weightFunc =
			rating !== undefined
				? (p: PlayerGameSim) =>
						(p.compositeRating[rating] * fatigue(p.stat.energy)) ** power
				: undefined;
		return random.choice(players, weightFunc);
	}

	// Pass undefined as p for some team-only stats
	recordStat(
		t: TeamNum,
		p: PlayerGameSim | undefined,
		s: string,
		amt: number = 1,
		remove?: boolean,
	) {
		const qtr = this.team[t].stat.ptsQtrs.length - 1;

		const signedAmount = remove ? -amt : amt;

		const isLng = s.endsWith("Lng");

		if (p !== undefined) {
			if (s === "gs") {
				// In case player starts on offense and defense, only record once
				p.stat[s] = 1;
			} else if (isLng) {
				p.stat[s] = this.lngTracker.log("player", p.id, s, amt, remove);
			} else {
				p.stat[s] += signedAmount;
			}
		}

		if (
			s !== "gs" &&
			s !== "courtTime" &&
			s !== "benchTime" &&
			s !== "energy"
		) {
			if (isLng) {
				this.team[t].stat[s] = this.lngTracker.log("player", t, s, amt, remove);
			} else {
				this.team[t].stat[s] += signedAmount;
			}

			if (s === "pts") {
				this.team[t].stat.ptsQtrs[qtr] += signedAmount;
				this.playByPlay.logStat(qtr, t, undefined, "pts", signedAmount);

				if (remove) {
					this.playByPlay.removeLastScore();
				}
			}

			if (p !== undefined && s !== "min") {
				const logAmount = isLng ? p.stat[s] : signedAmount;
				this.playByPlay.logStat(qtr, t, p.id, s, logAmount);
			}
		}
	}
}

export default GameSim;
