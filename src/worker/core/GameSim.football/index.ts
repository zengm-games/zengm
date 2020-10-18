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

	isClockRunning: boolean;

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	awaitingAfterTouchdown: boolean;

	awaitingAfterSafety: boolean;

	awaitingKickoff: TeamNum | undefined;

	twoPointConversionTeam: number | undefined;

	scrimmage: number;

	down: number;

	toGo: number;

	timeouts: [number, number];

	twoMinuteWarningHappened: boolean;

	constructor(
		gid: number,
		teams: [TeamGameSim, TeamGameSim],
		doPlayByPlay: boolean,
		homeCourtFactor: number = 1,
	) {
		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);
		this.id = gid;
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

		this.isClockRunning = false;
		this.awaitingAfterTouchdown = false;
		this.awaitingAfterSafety = false;
		this.awaitingKickoff = Math.random() < 0.5 ? 0 : 1;
		this.down = 1;
		this.toGo = 10;
		this.scrimmage = 20;
		this.timeouts = [3, 3];
		this.twoMinuteWarningHappened = false;
		this.homeCourtAdvantage(homeCourtFactor);
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
			// @ts-ignore
			delete this.team[t].pace;

			for (let p = 0; p < this.team[t].player.length; p++) {
				// @ts-ignore
				delete this.team[t].player[p].age;
				// @ts-ignore
				delete this.team[t].player[p].valueNoPot;
				delete this.team[t].player[p].compositeRating;
				// @ts-ignore
				delete this.team[t].player[p].ptModifier;
				delete this.team[t].player[p].stat.benchTime;
				delete this.team[t].player[p].stat.courtTime;
				delete this.team[t].player[p].stat.energy;
			}
		}

		const out = {
			gid: this.id,
			overtimes: this.overtimes,
			team: this.team,
			clutchPlays: [],
			playByPlay: this.playByPlay.getPlayByPlay(this.team),
			scoringSummary: this.playByPlay.scoringSummary,
		};
		return out;
	}

	simRegulation() {
		const oAfterHalftime = this.d;
		let quarter = 1;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			while (this.clock > 0 || this.awaitingAfterTouchdown) {
				this.simPlay();
			}

			quarter += 1;

			if (quarter === 3) {
				this.awaitingKickoff = this.o;
				this.timeouts = [3, 3];
				this.twoMinuteWarningHappened = false;
				this.o = oAfterHalftime;
				this.d = this.o === 0 ? 1 : 0;
			} else if (quarter === 5) {
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
		});
		this.o = Math.random() < 0.5 ? 0 : 1;
		this.d = this.o === 0 ? 1 : 0;
		this.awaitingKickoff = this.o;

		// @ts-ignore
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
		if (this.team[0].stat.ptsQtrs.length <= 3) {
			return 0.01;
		}

		// Does game situation dictate an onside kick in the 4th quarter?
		if (this.team[0].stat.ptsQtrs.length !== 4) {
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
			((quarter === 2 && this.scrimmage >= 50) ||
				(quarter >= 4 && ptsDown >= 0)) &&
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

			if (quarter >= 4) {
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

		// Don't kick a FG when we really need a touchdown!
		const needTouchdown = quarter >= 4 && ptsDown > 3 && this.clock <= 2;

		// If there are under 10 seconds left in the half/overtime, maybe try a field goal
		if (
			this.clock <= 10 / 60 &&
			quarter !== 1 &&
			quarter !== 3 &&
			!needTouchdown &&
			this.probMadeFieldGoal() >= 0.02
		) {
			return "fieldGoal";
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
					return "punt";
				}
			}
		}

		if (Math.random() < this.probPass()) {
			return "pass";
		}

		return "run";
	}

	simPlay() {
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
		} else if (playType === "extraPoint") {
			dt = this.doFieldGoal(true);
		} else if (playType === "twoPointConversion") {
			dt = this.doTwoPointConversion();
		} else if (playType === "fieldGoal") {
			dt = this.doFieldGoal();
		} else if (playType === "punt") {
			dt = this.doPunt();
		} else if (playType === "pass") {
			dt = this.doPass();
		} else if (playType === "run") {
			dt = this.doRun();
		} else {
			throw new Error(`Unknown playType "${playType}"`);
		}

		const quarter = this.team[0].stat.ptsQtrs.length;
		dt /= 60;

		// Two minute warning
		if (
			(quarter === 2 || quarter >= 4) &&
			this.clock - dt <= 2 &&
			!this.twoMinuteWarningHappened
		) {
			this.twoMinuteWarningHappened = true;
			this.isClockRunning = false;
			this.playByPlay.logEvent("twoMinuteWarning", {
				clock: this.clock - dt,
			});
		}

		// Timeouts - small chance at any time
		if (Math.random() < 0.01) {
			this.doTimeout(this.o);
		} else if (Math.random() < 0.003) {
			this.doTimeout(this.d);
		}

		// Timeouts - late in game when clock is running
		if ((quarter === 2 || quarter >= 4) && this.isClockRunning) {
			const diff = this.team[this.o].stat.pts - this.team[this.d].stat.pts;

			// No point in the 4th quarter of a blowout
			if (diff < 24) {
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
			(quarter === 2 || quarter >= 4) &&
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
		this.injuries();

		if (
			this.overtimeState === "bothTeamsPossessed" &&
			this.team[0].stat.pts !== this.team[1].stat.pts &&
			(!this.awaitingAfterTouchdown ||
				Math.abs(this.team[0].stat.pts - this.team[1].stat.pts) > 2)
		) {
			this.overtimeState = "over";
		}
	}

	boundedYds(yds: number) {
		const ydsTD = 100 - this.scrimmage;
		const ydsSafety = -this.scrimmage;

		if (yds > ydsTD) {
			return ydsTD;
		}

		if (yds < ydsSafety) {
			return ydsSafety;
		}

		return yds;
	}

	advanceYds(
		yds: number,
		{
			automaticFirstDown,
			repeatDown,
			sack,
		}: {
			automaticFirstDown?: boolean;
			repeatDown?: boolean;
			sack?: boolean;
		} = {},
	) {
		// Touchdown?
		const ydsTD = 100 - this.scrimmage;

		if (yds >= ydsTD) {
			this.awaitingAfterTouchdown = true;
			return {
				safetyOrTouchback: false,
				td: true,
			};
		}

		this.scrimmage += yds;

		// For non-sacks, record tackler(s)
		if (!sack && Math.random() < 0.8) {
			let playersDefense: PlayerGameSim[] = [];

			for (const playersAtPos of Object.values(this.playersOnField[this.d])) {
				if (playersAtPos) {
					playersDefense = playersDefense.concat(playersAtPos);
				}
			}

			// Bias away from DL and CB
			const positions: Position[] | undefined =
				this.playersOnField[this.d].LB &&
				this.playersOnField[this.d].LB!.length > 0 &&
				Math.random() < 0.25
					? ["LB", "S"]
					: undefined;

			const tacklers =
				Math.random() < 0.25
					? new Set([
							this.pickPlayer(this.d, "tackling", positions, 0.9),
							this.pickPlayer(this.d, "tackling", positions, 0.9),
					  ])
					: new Set([this.pickPlayer(this.d, "tackling", positions, 0.9)]);

			for (const tackler of tacklers) {
				this.recordStat(
					this.d,
					tackler,
					tacklers.size === 1 ? "defTckSolo" : "defTckAst",
				);

				if (yds < 0) {
					this.recordStat(this.d, tackler, "defTckLoss");
				}
			}
		}

		// Safety or touchback?
		if (this.scrimmage <= 0) {
			return {
				safetyOrTouchback: true,
				td: false,
			};
		}

		// First down?
		if (yds >= this.toGo || automaticFirstDown) {
			this.down = 1;
			const maxToGo = 100 - this.scrimmage;
			this.toGo = maxToGo < 10 ? maxToGo : 10;
			return {
				safetyOrTouchback: false,
				td: false,
			};
		}

		// Turnover on downs?
		if (!repeatDown) {
			if (this.down === 4) {
				this.o = this.o === 0 ? 1 : 0;
				this.d = this.d === 0 ? 1 : 0;
				this.scrimmage = 100 - this.scrimmage;
				this.down = 1;
				const maxToGo = 100 - this.scrimmage;
				this.toGo = maxToGo < 10 ? maxToGo : 10;
				return {
					safetyOrTouchback: false,
					td: false,
				};
			}

			this.down += 1;
		}

		this.toGo -= yds;
		return {
			safetyOrTouchback: false,
			td: false,
		};
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

	updatePlayersOnField(playType: string) {
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

				// @ts-ignore
				for (const p of this.playersOnField[t][pos]) {
					pidsUsed.add(p.id);
				}

				if (playType === "starters") {
					// @ts-ignore
					for (const p of this.playersOnField[t][pos]) {
						this.recordStat(t, p, "gs");
					}
				}
			}
		}

		this.updateTeamCompositeRatings();
	}

	possessionChange() {
		if (this.overtimeState === "firstPossession") {
			this.overtimeState = "secondPossession";
		} else if (this.overtimeState === "secondPossession") {
			this.overtimeState = "bothTeamsPossessed";
		}

		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
		this.down = 1;
		this.toGo = 10;
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
			this.playByPlay.logEvent("onsideKick", {
				clock: this.clock,
				t: this.o,
				names: [kicker.name],
			});
			dt = random.randInt(2, 5);
			const kickTo = random.randInt(40, 55);
			this.scrimmage = kickTo;
			const success = Math.random() < 0.1;

			if (success) {
				const recoverer = this.pickPlayer(this.o);
				this.playByPlay.logEvent("onsideKickRecovery", {
					clock: this.clock,
					t: this.o,
					names: [recoverer.name],
					success: true,
					td: false,
				});
				this.down = 1;
				this.toGo = 10;
			} else {
				this.possessionChange();
				const kickReturner = this.pickPlayer(this.o);
				const rawLength = Math.random() < 0.003 ? 100 : random.randInt(0, 5);
				const returnLength = this.boundedYds(rawLength);
				const { td } = this.advanceYds(returnLength);
				dt += Math.abs(returnLength) / 8;
				this.recordStat(this.o, kickReturner, "kr");
				this.recordStat(this.o, kickReturner, "krYds", returnLength);
				this.recordStat(this.o, kickReturner, "krLng", returnLength);
				this.playByPlay.logEvent("onsideKickRecovery", {
					clock: this.clock,
					t: this.o,
					names: [kickReturner.name],
					success: false,
					td,
				});

				if (td) {
					this.recordStat(this.o, kickReturner, "krTD");
					this.isClockRunning = false;
				} else {
					this.down = 1;
					this.toGo = 10;
				}
			}
		} else {
			const kickReturner = this.getTopPlayerOnField(this.d, "KR");
			const touchback = Math.random() > 0.5;
			const kickTo = this.awaitingAfterSafety
				? random.randInt(15, 35)
				: random.randInt(-9, 10);
			this.playByPlay.logEvent("kickoff", {
				clock: this.clock,
				t: this.o,
				names: [kicker.name],
				touchback,
				yds: kickTo,
			});
			this.possessionChange();

			if (touchback) {
				this.scrimmage = 25;
				this.down = 1;
				this.toGo = 10;
			} else {
				this.scrimmage = kickTo;
				let ydsRaw = Math.round(random.truncGauss(20, 5, -10, 109));

				if (Math.random() < 0.02) {
					ydsRaw += random.randInt(0, 109);
				}

				let returnLength = this.boundedYds(ydsRaw);
				dt = Math.abs(returnLength) / 8;
				let td = false;
				const returnLengthBeforePenalty = returnLength;
				const penInfo = this.checkPenalties("kickoffReturn", {
					ballCarrier: kickReturner,
					playYds: returnLength,
				});

				if (penInfo && penInfo.type !== "offsetting") {
					if (penInfo.side === "offense" && penInfo.spotYds !== undefined) {
						returnLength = penInfo.spotYds;
					}
				} else {
					const info = this.advanceYds(returnLength);
					td = info.td;
				}

				this.recordStat(this.o, kickReturner, "kr");
				this.recordStat(this.o, kickReturner, "krYds", returnLength);
				this.recordStat(this.o, kickReturner, "krLng", returnLength);
				this.playByPlay.logEvent("kickoffReturn", {
					clock: this.clock,
					t: this.o,
					names: [kickReturner.name],
					td,
					yds: returnLengthBeforePenalty,
				});

				if (penInfo && penInfo.type !== "offsetting") {
					penInfo.doLog();
				}

				if (td) {
					this.recordStat(this.o, kickReturner, "krTD");
					this.isClockRunning = false;
				} else {
					this.down = 1;
					this.toGo = 10;
				}
			}
		}

		this.awaitingKickoff = undefined;
		this.awaitingAfterSafety = false;
		this.isClockRunning = false;

		if (this.overtimeState === "initialKickoff") {
			this.overtimeState = "firstPossession";
		}

		this.recordStat(this.o, undefined, "drives");
		this.recordStat(this.o, undefined, "totStartYds", this.scrimmage);
		return dt;
	}

	doPunt() {
		this.updatePlayersOnField("punt");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			penInfo.doLog();
			return 0;
		}

		const punter = this.getTopPlayerOnField(this.o, "P");
		const puntReturner = this.getTopPlayerOnField(this.d, "PR");
		const adjustment = (punter.compositeRating.punting - 0.6) * 20; // 100 ratings - 8 yd bonus. 0 ratings - 12 yard penalty

		const distance = Math.round(random.truncGauss(44 + adjustment, 8, 25, 90));
		const kickTo = 100 - this.scrimmage - distance;
		const touchback = kickTo < 0;
		let dt = random.randInt(5, 9);
		this.playByPlay.logEvent("punt", {
			clock: this.clock,
			t: this.o,
			names: [punter.name],
			touchback,
			yds: distance,
		});
		const penInfo2 = this.checkPenalties("punt", {
			ballCarrier: punter,
			playYds: distance,
		});

		if (penInfo2) {
			penInfo2.doLog();
			return dt;
		}

		this.recordStat(this.o, punter, "pnt");
		this.recordStat(this.o, punter, "pntYds", distance);
		this.recordStat(this.o, punter, "pntLng", distance);
		this.possessionChange();

		if (touchback) {
			this.recordStat(this.d, punter, "pntTB");
			this.scrimmage = 20;
			this.down = 1;
			this.toGo = 10;
		} else {
			if (kickTo < 20) {
				this.recordStat(this.d, punter, "pntIn20");
			}

			const maxReturnLength = 100 - kickTo;
			let ydsRaw = Math.round(random.truncGauss(10, 10, -10, 109));

			if (Math.random() < 0.03) {
				ydsRaw += random.randInt(0, 109);
			}

			let returnLength = helpers.bound(ydsRaw, 0, maxReturnLength);
			this.scrimmage = kickTo;
			dt += Math.abs(returnLength) / 8;
			let td = false;
			const returnLengthBeforePenalty = returnLength;
			const penInfo3 = this.checkPenalties("kickoffReturn", {
				ballCarrier: puntReturner,
				playYds: returnLength,
			});

			if (penInfo3 && penInfo3.type !== "offsetting") {
				if (penInfo3.side === "offense" && penInfo3.spotYds !== undefined) {
					returnLength = penInfo3.spotYds;
				}
			} else {
				const info = this.advanceYds(returnLength);
				td = info.td;
			}

			this.recordStat(this.o, puntReturner, "pr");
			this.recordStat(this.o, puntReturner, "prYds", returnLength);
			this.recordStat(this.o, puntReturner, "prLng", returnLength);
			this.playByPlay.logEvent("puntReturn", {
				clock: this.clock,
				t: this.o,
				names: [puntReturner.name],
				td,
				yds: returnLengthBeforePenalty,
			});

			if (penInfo3 && penInfo3.type !== "offsetting") {
				penInfo3.doLog();
			}

			if (td) {
				this.recordStat(this.o, puntReturner, "prTD");
				this.isClockRunning = false;
			} else {
				this.down = 1;
				this.toGo = 10;
			}
		}

		this.recordStat(this.o, undefined, "drives");
		this.recordStat(this.o, undefined, "totStartYds", this.scrimmage);
		this.isClockRunning = false;
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

	doFieldGoal(extraPoint: boolean = false) {
		this.updatePlayersOnField("fieldGoal");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			penInfo.doLog();
			return 0;
		}

		const distance = extraPoint ? 33 : 100 - this.scrimmage + 17;
		const kicker = this.getTopPlayerOnField(this.o, "K");
		const made = Math.random() < this.probMadeFieldGoal(kicker, extraPoint);
		const dt = extraPoint ? 0 : random.randInt(4, 6);
		const penInfo2 = this.checkPenalties("fieldGoal", {
			made,
		});

		if (penInfo2) {
			penInfo2.doLog();
			return dt;
		}

		this.playByPlay.logEvent(extraPoint ? "extraPoint" : "fieldGoal", {
			clock: this.clock,
			t: this.o,
			made,
			names: [kicker.name],
			yds: distance,
		});
		let statAtt;
		let statMade;

		if (extraPoint) {
			statAtt = "xpa";
			statMade = "xp";
		} else if (distance < 20) {
			statAtt = "fga0";
			statMade = "fg0";
		} else if (distance < 30) {
			statAtt = "fga20";
			statMade = "fg20";
		} else if (distance < 40) {
			statAtt = "fga30";
			statMade = "fg30";
		} else if (distance < 50) {
			statAtt = "fga40";
			statMade = "fg40";
		} else {
			statAtt = "fga50";
			statMade = "fg50";
		}

		this.recordStat(this.o, kicker, statAtt);

		if (made) {
			this.recordStat(this.o, kicker, statMade);

			if (!extraPoint) {
				this.recordStat(this.o, kicker, "fgLng", distance);
			}
		} else if (!extraPoint) {
			this.possessionChange();
			this.scrimmage = helpers.bound(100 - this.scrimmage + 7, 20, Infinity);
		}

		if (extraPoint || made) {
			this.awaitingKickoff = this.o;
		}

		this.awaitingAfterTouchdown = false;
		this.isClockRunning = false;
		return dt;
	}

	doTwoPointConversion() {
		this.twoPointConversionTeam = this.o;
		this.down = 1;
		this.scrimmage = 98; // Put this before the play, in case there is a turnover during conversion!

		this.awaitingKickoff = this.o;

		if (Math.random() > 0.5) {
			this.doPass();
		} else {
			this.doRun();
		}

		this.twoPointConversionTeam = undefined;
		this.awaitingAfterTouchdown = false;
		this.isClockRunning = false;
		return 0;
	}

	probFumble(p: PlayerGameSim) {
		return 0.0125 * (1.5 - p.compositeRating.ballSecurity);
	}

	doFumble(pFumbled: PlayerGameSim, priorYdsRaw: number) {
		this.recordStat(this.o, pFumbled, "fmb");
		this.scrimmage = helpers.bound(this.scrimmage + priorYdsRaw, -9, 100);
		const lost = Math.random() > 0.5;
		const pForced = this.pickPlayer(this.d, "tackling");
		this.recordStat(this.d, pForced, "defFmbFrc");
		this.playByPlay.logEvent("fumble", {
			clock: this.clock,
			t: this.o,
			names: [pFumbled.name, pForced.name],
		});
		const recoveringTeam = lost ? this.d : this.o;
		const pRecovered = this.pickPlayer(recoveringTeam);
		this.recordStat(recoveringTeam, pRecovered, "defFmbRec");

		if (lost) {
			this.recordStat(this.o, pFumbled, "fmbLost");
			this.possessionChange();
			this.scrimmage = 100 - this.scrimmage;
			this.isClockRunning = false;
		} else {
			// Stops if fumbled out of bounds
			this.isClockRunning = Math.random() > 0.05;
		}

		let ydsRaw = Math.round(random.truncGauss(4, 6, -5, 15));

		if (Math.random() < (lost ? 0.01 : 0.0001)) {
			ydsRaw += random.randInt(0, 109);
		}

		const yds = this.boundedYds(ydsRaw);
		const { safetyOrTouchback, td } = this.advanceYds(yds);
		let dt = Math.abs(yds) / 6;
		this.playByPlay.logEvent("fumbleRecovery", {
			clock: this.clock,
			lost,
			t: this.o,
			names: [pRecovered.name],
			safety: safetyOrTouchback && !lost,
			td,
			touchback: safetyOrTouchback && lost,
			twoPointConversionTeam: this.twoPointConversionTeam,
			yds,
		});

		if (safetyOrTouchback) {
			if (lost) {
				this.scrimmage = 20;
			} else {
				this.doSafety();
			}

			this.isClockRunning = false;
		} else {
			this.recordStat(recoveringTeam, pRecovered, "defFmbYds", yds);
			this.recordStat(recoveringTeam, pRecovered, "defFmbLng", yds);

			if (td) {
				this.recordStat(recoveringTeam, pRecovered, "defFmbTD");
				this.isClockRunning = false;
			} else if (Math.random() < this.probFumble(pRecovered)) {
				dt += this.doFumble(pRecovered, 0);
			}
		}

		// Since other things might have happened after this.possessionChange()
		if (lost) {
			this.down = 1;
			this.toGo = 10;
		}

		return dt;
	}

	doInterception(passYdsRaw: number) {
		this.possessionChange();
		this.scrimmage = helpers.bound(100 - this.scrimmage - passYdsRaw, -9, 100);
		const p = this.pickPlayer(this.o, "passCoverage");
		let ydsRaw = Math.round(random.truncGauss(4, 6, -5, 15));

		if (Math.random() < 0.075) {
			ydsRaw += random.randInt(0, 109);
		}

		const yds = this.boundedYds(ydsRaw);
		const { safetyOrTouchback, td } = this.advanceYds(yds);
		let dt = Math.abs(yds) / 8;
		this.recordStat(this.o, p, "defInt");
		this.playByPlay.logEvent("interception", {
			clock: this.clock,
			t: this.o,
			names: [p.name],
			td,
			twoPointConversionTeam: this.twoPointConversionTeam,
			yds,
		});

		if (safetyOrTouchback) {
			this.scrimmage = 20;
		} else {
			this.recordStat(this.o, p, "defIntYds", yds);
			this.recordStat(this.o, p, "defIntLng", yds);

			if (td) {
				this.recordStat(this.o, p, "defIntTD");
				this.isClockRunning = false;
			} else if (Math.random() < this.probFumble(p)) {
				dt += this.doFumble(p, 0);
			}
		}

		this.isClockRunning = false;

		// Since other things might have happened after this.possessionChange()
		this.down = 1;
		this.toGo = 10;
		return dt;
	}

	doSafety(p?: PlayerGameSim) {
		if (!p) {
			p = this.pickPlayer(
				this.d,
				Math.random() < 0.5 ? "passRushing" : "runStopping",
			);
		}

		this.recordStat(this.d, p, "defSft");
		this.awaitingKickoff = this.o;
		this.awaitingAfterSafety = true;
		this.isClockRunning = false;
	}

	doSack(qb: PlayerGameSim) {
		const p = this.pickPlayer(this.d, "passRushing", undefined, 5);
		const ydsRaw = random.randInt(-1, -15);
		const yds = this.boundedYds(ydsRaw);
		const { safetyOrTouchback } = this.advanceYds(yds, {
			sack: true,
		});
		this.playByPlay.logEvent("sack", {
			clock: this.clock,
			t: this.o,
			names: [qb.name, p.name],
			safety: safetyOrTouchback,
			yds,
		});
		this.recordStat(this.o, qb, "pssSk");
		this.recordStat(this.o, qb, "pssSkYds", Math.abs(yds));
		this.recordStat(this.d, p, "defSk");

		if (safetyOrTouchback) {
			this.doSafety(p);
		}

		this.isClockRunning = Math.random() < 0.02;
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
			(((0.03 * this.team[this.d].compositeRating.passCoverage) /
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
		const p = 0.13 + 0.4 * factor ** 1.25;
		return helpers.bound(p, 0, 0.95);
	}

	doPass() {
		this.updatePlayersOnField("pass");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			penInfo.doLog();
			return 0;
		}

		const qb = this.getTopPlayerOnField(this.o, "QB");
		this.playByPlay.logEvent("dropback", {
			clock: this.clock,
			t: this.o,
			names: [qb.name],
		});
		let dt = random.randInt(2, 6);

		if (Math.random() < this.probFumble(qb)) {
			const yds = random.randInt(-1, -10);
			return dt + this.doFumble(qb, yds);
		}

		const sack = Math.random() < this.probSack(qb);

		if (sack) {
			return this.doSack(qb);
		}

		const target = this.pickPlayer(
			this.o,
			Math.random() < 0.2 ? "catching" : "gettingOpen",
			["WR", "TE", "RB"],
		);
		const defender = this.pickPlayer(this.d, "passCoverage", ["CB", "S", "LB"]);
		const interception = Math.random() < this.probInt(qb);
		let ydsRaw = Math.round(
			random.truncGauss(
				9.2 *
					(this.team[this.o].compositeRating.passBlocking /
						this.team[this.d].compositeRating.passRushing),
				7,
				-10,
				100,
			),
		);

		if (Math.random() < qb.compositeRating.passingDeep * 0.07) {
			ydsRaw += random.randInt(0, 109);
		}

		let yds = this.boundedYds(ydsRaw);

		if (interception) {
			this.recordStat(this.o, qb, "pssInt");
			this.recordStat(this.o, qb, "pss");
			this.recordStat(this.o, target, "tgt");
			this.recordStat(this.d, defender, "defPssDef");
			dt += this.doInterception(yds);
		} else {
			dt += Math.abs(yds) / 20;
			let safetyOrTouchback = false;
			let td = false;
			const penInfo2 = this.checkPenalties("pass", {
				ballCarrier: target,
				playYds: yds,
			});

			if (penInfo2) {
				const spotYds = penInfo2.spotYds;
				if (spotYds !== undefined) {
					if (penInfo2.side === "offense") {
						yds = spotYds;
					}
				} else if (
					penInfo2.type === "offsetting" ||
					penInfo2.side === "offense" ||
					penInfo2.name === "Pass interference"
				) {
					penInfo2.doLog();
					return dt;
				}
			}

			this.recordStat(this.o, qb, "pss");
			this.recordStat(this.o, target, "tgt");

			if (Math.random() < 1 / 8) {
				this.recordStat(this.d, defender, "defPssDef");
			}

			const complete = Math.random() < this.probComplete(qb, target, defender);

			if (complete) {
				if (!penInfo2) {
					const info = this.advanceYds(yds);
					safetyOrTouchback = info.safetyOrTouchback;
					td = info.td;
				}

				this.recordStat(this.o, qb, "pssCmp");
				this.recordStat(this.o, qb, "pssYds", yds);
				this.recordStat(this.o, qb, "pssLng", yds);
				this.recordStat(this.o, target, "rec");
				this.recordStat(this.o, target, "recYds", yds);
				this.recordStat(this.o, target, "recLng", yds);

				this.playByPlay.logEvent("passComplete", {
					clock: this.clock,
					t: this.o,
					names: [qb.name, target.name],
					safety: safetyOrTouchback,
					td,
					twoPointConversionTeam: this.twoPointConversionTeam,
					yds,
				});

				// Fumble after catch... only if nothing else is going on, too complicated otherwise
				if (!penInfo2 && !td && !safetyOrTouchback) {
					if (Math.random() < this.probFumble(target)) {
						this.awaitingAfterTouchdown = false; // In case set by this.advanceYds

						return dt + this.doFumble(target, yds);
					}
				}
				this.isClockRunning = Math.random() < 0.75;

				if (td) {
					this.recordStat(this.o, qb, "pssTD");
					this.recordStat(this.o, target, "recTD");
					this.isClockRunning = false;
				}

				if (safetyOrTouchback) {
					this.doSafety();
				}
			} else {
				if (!penInfo2) {
					this.advanceYds(0);
				}
				this.playByPlay.logEvent("passIncomplete", {
					clock: this.clock,
					t: this.o,
					names: [qb.name, target.name],
					twoPointConversionTeam: this.twoPointConversionTeam,
					yds,
				});
				this.isClockRunning = false;
			}

			if (penInfo2) {
				penInfo2.doLog();
			}
		}

		return dt;
	}

	doRun() {
		this.updatePlayersOnField("run");
		const penInfo = this.checkPenalties("beforeSnap");

		if (penInfo) {
			penInfo.doLog();
			return 0;
		}

		// Usually do normal run, but sometimes do special stuff
		const positions: Position[] = ["RB"];
		const rand = Math.random();

		const rbs = this.playersOnField[this.o].RB || [];

		if (rand < 0.5 || rbs.length === 0) {
			positions.push("QB");
		} else if (rand < 0.6 || rbs.length === 0) {
			positions.push("WR");
		}

		const p = this.pickPlayer(this.o, "rushing", positions);
		this.recordStat(this.o, p, "rus");
		const qb = this.getTopPlayerOnField(this.o, "QB");
		this.playByPlay.logEvent("handoff", {
			clock: this.clock,
			t: this.o,
			names: p === qb ? [qb.name] : [qb.name, p.name],
		});
		const meanYds =
			(3.5 *
				0.5 *
				(p.compositeRating.rushing +
					this.team[this.o].compositeRating.runBlocking)) /
			this.team[this.d].compositeRating.runStopping;
		let ydsRaw = Math.round(random.truncGauss(meanYds, 6, -5, 15));

		if (Math.random() < 0.01) {
			ydsRaw += random.randInt(0, 109);
		}

		let yds = this.boundedYds(ydsRaw);
		const dt = random.randInt(2, 4) + Math.abs(yds) / 10;
		let safetyOrTouchback = false;
		let td = false;
		const penInfo2 = this.checkPenalties("run", {
			ballCarrier: p,
			playYds: yds,
		});

		if (penInfo2) {
			const spotYds = penInfo2.spotYds;
			if (spotYds !== undefined) {
				if (penInfo2.side === "offense") {
					yds = spotYds;
				}
			} else if (
				penInfo2.type === "offsetting" ||
				penInfo2.side === "offense"
			) {
				// If it's an offensive penalty or a non-spot foul, it's as if the run never happened
				penInfo2.doLog();
				return dt;
			}
		} else {
			const info = this.advanceYds(yds);
			safetyOrTouchback = info.safetyOrTouchback;
			td = info.td;
		}

		this.recordStat(this.o, p, "rusYds", yds);
		this.recordStat(this.o, p, "rusLng", yds);

		if (Math.random() < this.probFumble(p)) {
			this.awaitingAfterTouchdown = false; // In case set by this.advanceYds

			return dt + this.doFumble(p, yds);
		}

		this.playByPlay.logEvent("run", {
			clock: this.clock,
			t: this.o,
			names: [p.name],
			safety: safetyOrTouchback,
			twoPointConversionTeam: this.twoPointConversionTeam,
			td,
			yds,
		});
		this.isClockRunning = Math.random() < 0.85;

		if (td) {
			this.recordStat(this.o, p, "rusTD");
			this.isClockRunning = false;
		}

		if (safetyOrTouchback) {
			this.doSafety();
		}

		if (penInfo2) {
			penInfo2.doLog();
		}

		return dt;
	}

	// Call this before actually advancing the ball, because different logic will apply if it's a spot foul or not
	checkPenalties(
		playType: PenaltyPlayType,
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			ballCarrier,
			made,
			playYds = 0,
		}: {
			ballCarrier?: PlayerGameSim;
			made?: boolean;
			playYds?: number;
		} = {
			ballCarrier: undefined,
			made: undefined,
			playYds: 0,
		},
	) {
		// No penalties during two point conversion, because it is not handled well currently
		if (this.twoPointConversionTeam !== undefined) {
			return;
		}

		// Handle plays in endzone
		let wouldHaveBeenTD = false;

		if (this.scrimmage + playYds > 99) {
			playYds = 99 - this.scrimmage;
			wouldHaveBeenTD = true;
		}

		let wouldHaveBeenSafety = false;

		if (this.scrimmage + playYds < 1) {
			playYds = 1 - this.scrimmage;
			wouldHaveBeenSafety = true;
		}

		const called = penalties.filter(pen => {
			if (!pen.playTypes.includes(playType)) {
				return false;
			}

			return Math.random() < pen.probPerPlay;
		});

		if (called.length === 0) {
			return;
		}

		this.isClockRunning = false;
		const offensive = called.filter(pen => pen.side === "offense");
		const defensive = called.filter(pen => pen.side === "defense");

		if (offensive.length > 0 && defensive.length > 0) {
			return {
				type: "offsetting",
				doLog: () => {
					this.playByPlay.logEvent("offsettingPenalties", {
						clock: this.clock,
					});
				},
			};
		}

		const side = offensive.length > 0 ? "offense" : "defense";

		if (playType === "fieldGoal") {
			if (side === "offense" && !made) {
				// Offensive penalty and missed field goal - decline
				return;
			}

			if (side === "defense" && made) {
				// Defensive penalty and made field goal - decline
				return;
			}
		}

		if (wouldHaveBeenTD && side === "defense") {
			return;
		}

		if (wouldHaveBeenSafety && side === "offense") {
			return;
		}

		const penInfos = called.map(pen => {
			let spotYds: number | undefined;
			let totYds = 0;

			if (
				pen.spotFoul ||
				((playType === "kickoffReturn" || playType === "puntReturn") &&
					pen.side === "offense")
			) {
				if (pen.side === "offense" && playYds > 0) {
					// Offensive spot foul - only when past the line of scrimmage
					spotYds = random.randInt(1, playYds);

					// Don't let it be in the endzone, otherwise shit gets weird with safeties
					if (spotYds + this.scrimmage < 1) {
						spotYds = 1 - this.scrimmage;
					}
				} else if (pen.side === "defense") {
					// Defensive spot foul - could be in secondary too
					spotYds = random.randInt(0, playYds);
				}

				if (spotYds !== undefined) {
					// On kickoff returns, penalties are very unlikely to occur extremely deep
					if (playType === "kickoffReturn" && spotYds + this.scrimmage <= 10) {
						spotYds += random.randInt(10, playYds);
					}

					if (spotYds + this.scrimmage > 99) {
						spotYds = 99 - this.scrimmage;
					}

					totYds += spotYds;
				}
			}

			if (
				(playType === "kickoffReturn" || playType === "puntReturn") &&
				pen.side === "defense"
			) {
				// Add to end of return
				totYds = playYds + pen.yds;
			} else {
				totYds += pen.side === "defense" ? pen.yds : -pen.yds;
			}

			return {
				automaticFirstDown: !!pen.automaticFirstDown,
				name: pen.name,
				penYds: pen.yds,
				posOdds: pen.posOdds !== undefined ? pen.posOdds : undefined,
				spotYds,
				totYds,
			};
		});

		// Pick penalty that gives the most yards
		penInfos.sort((a, b) => {
			return side === "defense" ? b.totYds - a.totYds : a.totYds - b.totYds;
		});
		const penInfo = penInfos[0]; // Adjust penalty yards when near endzones

		let adjustment = 0;

		if (side === "defense" && this.scrimmage + penInfo.totYds > 99) {
			// 1 yard line
			adjustment = this.scrimmage + penInfo.totYds - 99;
		} else if (side === "offense") {
			// Half distance to goal?
			const spotOfFoul =
				penInfo.spotYds === undefined
					? this.scrimmage
					: this.scrimmage + penInfo.spotYds;

			if (spotOfFoul >= 1) {
				const halfYds = Math.round(spotOfFoul / 2);

				if (penInfo.penYds > halfYds) {
					adjustment = penInfo.penYds - halfYds;
				}
			}
		}

		penInfo.totYds -= adjustment;
		penInfo.penYds -= adjustment;

		// recordedPenYds also includes spotYds for defensive pass interference
		const recordedPenYds =
			side === "defense" && penInfo.name === "Pass interference"
				? penInfo.totYds
				: penInfo.penYds;
		const t = side === "offense" ? this.o : this.d;
		let p: PlayerGameSim | undefined;
		const posOdds = penInfo.posOdds;

		if (posOdds !== undefined) {
			const positionsOnField = helpers.keys(this.playersOnField[t]);
			const positionsForPenalty = helpers.keys(posOdds);
			const positions = positionsOnField.filter(pos =>
				positionsForPenalty.includes(pos),
			);

			if (positions.length > 0) {
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				const pos = random.choice(positions, pos2 => posOdds[pos2]);

				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				const players = this.playersOnField[t][pos];

				if (players !== undefined && players.length > 0) {
					p = random.choice(players);
				}
			}

			if (!p) {
				p = this.pickPlayer(t);
			}

			// Ideally, when notBallCarrier is set, we should ensure that p is not the ball carrier.
		}

		this.advanceYds(penInfo.totYds, {
			automaticFirstDown: penInfo.automaticFirstDown,
			repeatDown: true,
		});

		return {
			type: "penalty",
			name: penInfo.name,
			side,
			spotYds: penInfo.spotYds,
			yds: penInfo.totYds,
			doLog: () => {
				this.recordStat(t, p, "pen");
				this.recordStat(t, p, "penYds", recordedPenYds);
				this.playByPlay.logEvent("penalty", {
					clock: this.clock,
					t,
					names: p ? [p.name] : [],
					automaticFirstDown: penInfo.automaticFirstDown,
					penaltyName: penInfo.name,
					yds: recordedPenYds,
				});
			},
		};
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
				// @ts-ignore
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
				// Update minutes (overall, court, and bench)
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				for (const p of this.playersOnField[t][pos]) {
					onField.add(p);
				}
			}

			for (const p of onField) {
				// Modulate injuryRate by age - assume default is 25 yo, and increase/decrease by 3%
				const injuryRate = g.get("injuryRate") * 1.03 ** (p.age - 25);

				if (Math.random() < injuryRate) {
					// 50% as many injuries for QB
					if (p.pos === "QB" && Math.random() < 0.5) {
						continue;
					}

					p.injured = true;
					this.playByPlay.logEvent("injury", {
						clock: this.clock,
						t,
						names: [p.name],
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
	) {
		const qtr = this.team[t].stat.ptsQtrs.length - 1;

		// Special case for two point conversions
		if (this.twoPointConversionTeam !== undefined) {
			if (s.endsWith("TD") && s !== "pssTD") {
				this.team[t].stat.pts += 2;
				this.team[t].stat.ptsQtrs[qtr] += 2;
				this.playByPlay.logStat(qtr, t, undefined, "pts", 2);

				if (this.overtimeState === "secondPossession") {
					const t2 = t === 0 ? 1 : 0;

					if (this.team[t].stat.pts > this.team[t2].stat.pts) {
						this.overtimeState = "over";
					}
				}

				this.twoPointConversionTeam = undefined;
			}

			return;
		}

		if (p !== undefined) {
			if (s === "gs") {
				// In case player starts on offense and defense, only record once
				p.stat[s] = 1;
			} else if (s.endsWith("Lng")) {
				if (amt > p.stat[s]) {
					p.stat[s] = amt;
				}
			} else {
				p.stat[s] += amt;
			}
		}

		if (
			s !== "gs" &&
			s !== "courtTime" &&
			s !== "benchTime" &&
			s !== "energy"
		) {
			if (s.endsWith("Lng")) {
				if (amt > this.team[t].stat[s]) {
					this.team[t].stat[s] = amt;
				}
			} else {
				this.team[t].stat[s] += amt;
			}

			let pts;

			if (s.endsWith("TD") && s !== "pssTD") {
				pts = 6;

				if (
					this.overtimeState === "initialKickoff" ||
					this.overtimeState === "firstPossession"
				) {
					this.overtimeState = "over";
				}
			} else if (s === "xp") {
				pts = 1;
			} else if (s.match(/fg\d+/)) {
				pts = 3;
			} else if (s === "defSft") {
				pts = 2;

				if (
					this.overtimeState === "initialKickoff" ||
					this.overtimeState === "firstPossession"
				) {
					this.overtimeState = "over";
				}
			}

			if (pts !== undefined) {
				this.team[t].stat.pts += pts;
				this.team[t].stat.ptsQtrs[qtr] += pts;
				this.playByPlay.logStat(qtr, t, undefined, "pts", pts);

				if (this.overtimeState === "secondPossession") {
					const t2 = t === 0 ? 1 : 0;

					if (this.team[t].stat.pts > this.team[t2].stat.pts) {
						this.overtimeState = "over";
					}
				}
			}

			if (p !== undefined && s !== "min") {
				this.playByPlay.logStat(qtr, t, p.id, s, amt);
			}
		}
	}
}

export default GameSim;
