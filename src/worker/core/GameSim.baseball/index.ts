import { g, helpers, random } from "../../util";
import {
	NUM_OUTS_PER_INNING,
	POS_NUMBERS,
	POS_NUMBERS_INVERSE,
} from "../../../common/constants.baseball";
import PlayByPlayLogger from "./PlayByPlayLogger";
import type { PlayerGameSim, Runner, TeamGameSim, TeamNum } from "./types";
import getInjuryRate from "../GameSim.basketball/getInjuryRate";
import Team from "./Team";
import { fatigueFactor } from "./fatigueFactor";
import { infoDefense } from "../player/ovr.baseball";

const teamNums: [TeamNum, TeamNum] = [0, 1];

type OccupiedBase = {
	p: PlayerGameSim;

	// Used to determine which pitcher a run counts for
	responsiblePitcherPid: number;

	// Used to determine if it's an ER or not (along with outsIfNoErrors)
	reachedOnError: boolean;
};

// self.hrTypes = {};

class GameSim {
	id: number;

	day: number | undefined;

	team: [Team<boolean>, Team<boolean>];

	numInnings: number;

	inning: number;

	overtime: boolean;

	overtimes: number;

	bases!: [
		OccupiedBase | undefined,
		OccupiedBase | undefined,
		OccupiedBase | undefined,
	];

	outs!: number;

	balls!: number;

	strikes!: number;

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	// When the third out of an inning would have happened except for an error, any further runs are unearned to the team. Same applies to the pitcher if it's the same pitcher, but for a new reliever mid inning, they start with ERs unless another error happens to put it over the limit
	outsIfNoErrors!: number;
	outsIfNoErrorsByPitcherPid!: Record<number, number>;

	// As runs are scored, track eligibility for W/L
	winEligiblePid: number | undefined;
	lossEligiblePid: number | undefined;

	allStarGame: boolean;
	baseInjuryRate: number;

	constructor({
		gid,
		day,
		teams,
		doPlayByPlay = false,
		homeCourtFactor = 1,
		dh,
		allStarGame = false,
		baseInjuryRate,
		disableHomeCourtAdvantage = false,
	}: {
		gid: number;
		day?: number;
		teams: [TeamGameSim, TeamGameSim];
		doPlayByPlay?: boolean;
		homeCourtFactor?: number;
		dh: boolean;
		allStarGame: boolean;
		baseInjuryRate: number;
		disableHomeCourtAdvantage?: boolean;
	}) {
		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);
		this.id = gid;
		this.day = day;
		this.allStarGame = allStarGame;
		this.baseInjuryRate = baseInjuryRate;

		// If a team plays twice in a day, this needs to be a deep copy
		this.team = [
			new Team(teams[0], dh, this.allStarGame),
			new Team(teams[1], dh, this.allStarGame),
		];

		if (!disableHomeCourtAdvantage) {
			this.homeCourtAdvantage(homeCourtFactor);
		}

		// Away team starts on offense
		this.o = 1;
		this.d = 0;

		this.numInnings = g.get("numPeriods");

		this.inning = 1;
		this.overtime = false;
		this.overtimes = 0;

		this.resetNewInning();

		this.logStarters();
	}

	resetNewInning() {
		this.team[this.o].t.stat.ptsQtrs.push(0);

		this.outsIfNoErrors = 0;
		this.outsIfNoErrorsByPitcherPid = {};

		this.bases = [undefined, undefined, undefined];
		this.outs = 0;
		this.resetNewBatter();
	}

	resetNewBatter() {
		this.balls = 0;
		this.strikes = 0;
	}

	logStarters() {
		for (const i of teamNums) {
			const t = this.team[i];
			for (const p of t.playersInGameByBattingOrder) {
				if (p.pos === "P") {
					// Pitcher is handled below
					continue;
				}
				this.recordStat(i, p.p, "gs");
				this.recordStat(i, p.p, "gp");
				this.recordStat(i, p.p, "gsF", 1, "fielding");
				this.recordStat(i, p.p, "gpF", 1, "fielding");
			}

			const startingPitcher = t.playersInGameByPos.P.p;
			this.recordStat(i, startingPitcher, "gpPit");
			this.recordStat(i, startingPitcher, "gsPit");

			// Pitcher gets a normal game played too
			this.recordStat(i, startingPitcher, "gs");
			this.recordStat(i, startingPitcher, "gp");
			this.recordStat(i, startingPitcher, "gsF", 1, "fielding");
			this.recordStat(i, startingPitcher, "gpF", 1, "fielding");
		}
	}

	getHitTo(
		info: {
			direction: "farLeft" | "left" | "middle" | "right" | "farRight";
		} & (
			| {
					type: "fly";
					distance: "infield" | "shallow" | "normal" | "deep" | "noDoubter";
			  }
			| {
					type: "ground" | "line";
					speed: "soft" | "normal" | "hard";
			  }
		),
	): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
		const { type, direction } = info;
		if (type === "fly") {
			const { distance } = info;
			if (distance === "infield") {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS["3B"];
					case "farRight":
						return POS_NUMBERS["1B"];
					case "middle":
						return POS_NUMBERS.CF;
					case "left":
						return random.choice([POS_NUMBERS.LF, POS_NUMBERS.CF]);
					case "right":
						return random.choice([POS_NUMBERS.RF, POS_NUMBERS.CF]);
				}
			} else {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS.LF;
					case "farRight":
						return POS_NUMBERS.RF;
					case "middle":
						return POS_NUMBERS.CF;
					case "left":
						return random.choice([POS_NUMBERS.LF, POS_NUMBERS.CF]);
					case "right":
						return random.choice([POS_NUMBERS.RF, POS_NUMBERS.CF]);
				}
			}
		} else if (type === "line") {
			const { speed } = info;

			let probOutfield;
			if (speed === "soft") {
				probOutfield = 0.5;
			} else if (speed === "normal") {
				probOutfield = 0.8;
			} else {
				probOutfield = 0.9;
			}

			const outfield = Math.random() < probOutfield;

			if (outfield) {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS.LF;
					case "farRight":
						return POS_NUMBERS.RF;
					case "middle":
						return POS_NUMBERS.CF;
					case "left":
						return random.choice([POS_NUMBERS.LF, POS_NUMBERS.CF]);
					case "right":
						return random.choice([POS_NUMBERS.RF, POS_NUMBERS.CF]);
				}
			} else {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS["3B"];
					case "farRight":
						return POS_NUMBERS["1B"];
					case "middle":
						return random.choice([POS_NUMBERS["2B"], POS_NUMBERS.SS]);
					case "left":
						return random.choice([POS_NUMBERS["3B"], POS_NUMBERS.SS]);
					case "right":
						return random.choice([POS_NUMBERS["2B"], POS_NUMBERS["1B"]]);
				}
			}
		} else if (type === "ground") {
			const { speed } = info;

			let probOutfield;
			if (speed === "soft") {
				probOutfield = 0;
			} else if (speed === "normal") {
				probOutfield = 0.2;
			} else {
				probOutfield = 0.4;
			}

			const outfield = Math.random() < probOutfield;

			if (outfield) {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS.LF;
					case "farRight":
						return POS_NUMBERS.RF;
					case "middle":
						return POS_NUMBERS.CF;
					case "left":
						return random.choice([POS_NUMBERS.LF, POS_NUMBERS.CF]);
					case "right":
						return random.choice([POS_NUMBERS.RF, POS_NUMBERS.CF]);
				}
			} else {
				switch (direction) {
					case "farLeft":
						return POS_NUMBERS["3B"];
					case "farRight":
						return POS_NUMBERS["1B"];
					case "middle":
						return random.choice([POS_NUMBERS["2B"], POS_NUMBERS.SS]);
					case "left":
						return random.choice([POS_NUMBERS["3B"], POS_NUMBERS.SS]);
					case "right":
						return random.choice([POS_NUMBERS["2B"], POS_NUMBERS["1B"]]);
				}
			}
		}

		throw new Error("Should never happen");
	}

	doFoul() {
		if (this.strikes < 2) {
			this.strikes += 1;
		}

		this.playByPlay.logEvent({
			type: "foul",
			balls: this.balls,
			strikes: this.strikes,
		});
	}

	// pitchQuality is from 0 to 1
	doBattedBall(p: PlayerGameSim, pitchQuality: number) {
		const foul = Math.random() < Math.min(0.9, 0.25 * g.get("foulFactor"));

		const type = random.choice(["ground", "line", "fly"] as const, [
			0.5 * g.get("groundFactor"),
			0.5 * g.get("lineFactor"),
			p.compositeRating.powerHitter * g.get("flyFactor"),
		]);
		const direction = foul
			? random.choice(
					["farLeftFoul", "farRightFoul", "outOfPlay"] as const,
					[1.5, 0.5, 1],
			  )
			: random.choice(
					["farLeft", "left", "middle", "right", "farRight"] as const,
					[1.5, 2, 1.5, 1, 0.5],
			  );

		let speed;
		let distance;

		if (direction === "outOfPlay") {
			// If it's obviously out of play, just log it as a foul ball immmediately
			this.doFoul();

			return {
				type: "outOfPlay",
			} as const;
		} else {
			// Announce the type of hit before the result
			if (type === "ground") {
				speed = random.choice(["soft", "normal", "hard"] as const);
				this.playByPlay.logEvent({
					type,
					t: this.o,
					pid: p.id,
					direction,
					speed,
				});

				return {
					type,
					direction,
					speed,
				};
			} else if (type === "line") {
				speed = random.choice(["soft", "normal", "hard"] as const, [
					0.5,
					0.5,
					(g.get("powerFactor") *
						(0.5 * (p.compositeRating.powerHitter + 0.5))) /
						2 -
						(pitchQuality - 0.5) / 4,
				]);
				this.playByPlay.logEvent({
					type,
					t: this.o,
					pid: p.id,
					direction,
					speed,
				});

				return {
					type,
					direction,
					speed,
				};
			} else {
				distance = random.choice(
					["infield", "shallow", "normal", "deep", "noDoubter"] as const,
					[
						0.1,
						0.5,
						(0.9 * (p.compositeRating.powerHitter + 0.5)) / 2 -
							(pitchQuality - 0.5) / 8,
						(g.get("powerFactor") * p.compositeRating.powerHitter) / 5 -
							(pitchQuality - 0.5) / 8,
						(g.get("powerFactor") * p.compositeRating.powerHitter) / 12 -
							(pitchQuality - 0.5) / 8,
					],
				);
				this.playByPlay.logEvent({
					type,
					t: this.o,
					pid: p.id,
					direction,
					distance,
				});

				return {
					type,
					direction,
					distance,
				};
			}
		}
	}

	makeOccupiedBase(
		p: PlayerGameSim,
		reachedOnError?: boolean,
		responsiblePitcherPid?: number,
	) {
		if (responsiblePitcherPid === undefined) {
			const pitcher = this.team[this.d].playersInGameByPos.P.p;
			responsiblePitcherPid = pitcher.id;
		}

		return {
			p,
			reachedOnError: !!reachedOnError,
			responsiblePitcherPid,
		};
	}

	probSuccessTagUp({
		battedBallInfo,
		runner,
		startingBase,
		hitTo,
		fielder,
		isStealing,
	}: {
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>;
		runner: PlayerGameSim;
		startingBase: 1 | 2 | 3;
		hitTo: ReturnType<GameSim["getHitTo"]>;
		fielder: PlayerGameSim;
		isStealing: boolean;
	}) {
		const hitToPos = POS_NUMBERS_INVERSE[hitTo];
		const outfielders = ["LF", "CF", "RF"];
		if (!outfielders.includes(hitToPos)) {
			return 0;
		}

		if (isStealing && battedBallInfo.type === "line") {
			return 0;
		}

		// Min and max probabilities of success, for a given hit type. Then the actual probability will be picked based on the runner/fielder/startingBase
		let probs: [number, number];
		if (battedBallInfo.type === "fly") {
			if (battedBallInfo.distance === "noDoubter") {
				probs = [1, 1];
			} else if (battedBallInfo.distance === "deep") {
				probs = [0.9, 1];
			} else if (battedBallInfo.distance === "normal") {
				probs = [0.5, 1];
			} else if (battedBallInfo.distance === "shallow") {
				probs = [0, 0.5];
			} else if (battedBallInfo.distance === "infield") {
				probs = [0, 0];
			} else {
				throw new Error("Should never happen");
			}
		} else if (battedBallInfo.type === "line") {
			if (battedBallInfo.speed === "hard") {
				probs = [0, 1];
			} else if (battedBallInfo.speed === "normal") {
				probs = [0, 0.75];
			} else if (battedBallInfo.speed === "soft") {
				probs = [0, 0.5];
			} else {
				throw new Error("Should never happen");
			}
		} else {
			throw new Error("Should never happen");
		}

		// Amount within min/max probs to go - this ranges from 0 to 1
		let value =
			0.5 * (1 + runner.compositeRating.speed - fielder.compositeRating.arm);

		// Harder to tag up from 1st/2nd
		if (startingBase === 2) {
			// Tagging up to 3rd depends on which outfielder fields it
			if (hitToPos === "LF") {
				value *= 0.4;
			} else if (hitToPos === "CF") {
				value *= 0.6;
			} else {
				value *= 0.8;
			}
		} else if (startingBase === 1) {
			value *= 0.2;
		}

		// When stealing, need to go back to base before tagging up, which makes it harder to do
		if (isStealing) {
			value *= 0.5;
		}

		const diff = probs[1] - probs[0];

		const prob = probs[0] + value * diff;

		return prob;
	}

	probSuccessGroundOut({
		battedBallInfo,
		runner,
		startingBase,
		hitTo,
		fielder,
		isStealing,
		mustAdvanceWithHitter,
	}: {
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>;
		runner: PlayerGameSim;
		startingBase: 1 | 2 | 3;
		hitTo: ReturnType<GameSim["getHitTo"]>;
		fielder: PlayerGameSim;
		isStealing: boolean;
		mustAdvanceWithHitter: boolean;
	}) {
		if (mustAdvanceWithHitter) {
			return 1;
		}

		const hitToPos = POS_NUMBERS_INVERSE[hitTo];
		const outfielders = ["LF", "CF", "RF"];
		if (outfielders.includes(hitToPos)) {
			return 1;
		}

		if (isStealing && battedBallInfo.type === "line") {
			return 0;
		}

		// Min and max probabilities of success, for a given hit type. Then the actual probability will be picked based on the runner/fielder/startingBase
		let probs: [number, number];
		if (battedBallInfo.type === "ground") {
			if (battedBallInfo.speed === "hard") {
				probs = [0, 0.5];
			} else if (battedBallInfo.speed === "normal") {
				probs = [0.25, 0.75];
			} else if (battedBallInfo.speed === "soft") {
				probs = [0.5, 1];
			} else {
				throw new Error("Should never happen");
			}
		} else {
			throw new Error("Should never happen");
		}

		// Amount within min/max probs to go - this ranges from 0 to 1
		let value =
			0.5 * (1 + runner.compositeRating.speed - fielder.compositeRating.arm);

		if (startingBase === 3) {
			if (hitToPos === "P" || hitToPos === "C") {
				value *= 0.33;
			} else if (hitToPos === "1B" || hitToPos === "3B") {
				value *= 0.67;
			}
		} else if (startingBase === 2) {
			value *= 0.2;
			if (hitToPos === "SS" || hitToPos === "3B") {
				value *= 0.33;
			} else if (hitToPos === "P" || hitToPos === "C") {
				value *= 0.67;
			}
		}

		if (isStealing) {
			// This could put value over 1, but that's okay
			value *= 1.5;
		}

		const diff = probs[1] - probs[0];

		const prob = probs[0] + value * diff;

		return prob;
	}

	advanceRunners({
		battedBallInfo,
		error,
		fieldersChoiceOrDoublePlayIndex,
		hit,
		hitTo,
		numBases,
		p,
		result,
		stealing,
	}: {
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>;
		error: boolean;
		fieldersChoiceOrDoublePlayIndex: undefined | 0 | 1 | 2;
		hit: boolean;
		hitTo: ReturnType<GameSim["getHitTo"]>;
		numBases: 1 | 2 | 3 | 4;
		p: PlayerGameSim;
		result:
			| "hit"
			| "error"
			| "flyOut"
			| "throwOut"
			| "fieldersChoice"
			| "doublePlay";
		stealing: [boolean, boolean, boolean];
	}) {
		const runners = this.getRunners();

		// Batter is out, inning is already over
		if (this.outs >= NUM_OUTS_PER_INNING) {
			return runners;
		}

		// Inning ends before batter reaches first base
		const inningOverAndNobodyAdvances =
			this.outs === NUM_OUTS_PER_INNING - 1 &&
			(result === "doublePlay" || result === "fieldersChoice");

		// Handle runners
		// Start from 3rd base first, because a blocked base can't be advanced to
		const blockedBases = new Set<0 | 1 | 2>();
		let someRunnerIsAlreadyOut = false;
		for (let i = 2 as 0 | 1 | 2; i >= 0; i--) {
			const runner = runners[i];
			if (!runner || this.outs >= NUM_OUTS_PER_INNING) {
				continue;
			}

			const isStealing = stealing[i];

			const mustAdvanceWithHitter = this.isForceOut(i, runners);

			const pRunner = this.team[this.o].playersByPid[runner.pid];
			const hitToPos = POS_NUMBERS_INVERSE[hitTo];
			const fielder = this.team[this.d].playersInGameByPos[hitToPos].p;

			if (hit || error) {
				// Handle runners advancing on a hit/error

				if (i === 2) {
					// Third base
					if (numBases >= 2) {
						// Double or more is a score
						runner.to = 4;
					} else {
						// Single, score on anything except some infield hits
						if (
							!mustAdvanceWithHitter &&
							!isStealing &&
							battedBallInfo.type === "ground" &&
							hitTo <= 6 &&
							Math.random() < 0.5
						) {
							runner.to = 3;
						} else {
							runner.to = 4;
						}
					}
				} else if (i === 1) {
					// Second base

					if (numBases >= 2) {
						// Double or more is a score
						runner.to = 4;
					} else {
						if (blockedBases.has(2)) {
							// Can't advance cause runner on 3rd didn't advance
							runner.to = 2;
						} else if (hitTo <= 6) {
							// Infield single, maybe not advance
							if (
								Math.random() < 0.5 &&
								!mustAdvanceWithHitter &&
								!isStealing
							) {
								runner.to = 2;
							} else {
								runner.to = 3;
							}
						} else {
							// Outfield single, go to 3rd or 4th
							if (!isStealing && Math.random() < 0.2) {
								runner.to = 3;
							} else {
								runner.to = 4;
							}
						}
					}
				} else {
					// First base

					// Advance by numBases is mandatory, to stay ahead of hitter
					runner.to = Math.min(4, runner.from + numBases) as any;

					// Fast runner might get one more base
					if (
						runner.to < 4 &&
						// blockedBases index is 0/1/2, runner.to is one more, so this works
						!blockedBases.has(runner.to as any) &&
						((!isStealing && Math.random() < 0.1) ||
							(isStealing && Math.random() < 0.5))
					) {
						runner.to += 1;
					}
				}
			} else {
				// Handle runners advancing on an out, whether tagging up on a fly ball or advancing on a ground ball.
				if (
					(result === "doublePlay" || result === "fieldersChoice") &&
					fieldersChoiceOrDoublePlayIndex === i
				) {
					runner.to += 1;
					runner.out = true;
				} else if (!blockedBases.has((i + 1) as any)) {
					let probSuccessIfAdvances: number = 0;

					if (i === 2) {
						// Third base

						if (
							battedBallInfo.type === "fly" ||
							battedBallInfo.type === "line"
						) {
							// Tag up
							probSuccessIfAdvances = this.probSuccessTagUp({
								battedBallInfo,
								runner: pRunner,
								startingBase: 3,
								hitTo,
								fielder,
								isStealing,
							});
						} else {
							// Maybe score on ground ball
							probSuccessIfAdvances = this.probSuccessGroundOut({
								battedBallInfo,
								runner: pRunner,
								startingBase: 3,
								hitTo,
								fielder,
								isStealing,
								mustAdvanceWithHitter,
							});
						}
					} else if (i === 1) {
						// Second base

						if (
							battedBallInfo.type === "fly" ||
							battedBallInfo.type === "line"
						) {
							probSuccessIfAdvances = this.probSuccessTagUp({
								battedBallInfo,
								runner: pRunner,
								startingBase: 2,
								hitTo,
								fielder,
								isStealing,
							});
						} else {
							probSuccessIfAdvances = this.probSuccessGroundOut({
								battedBallInfo,
								runner: pRunner,
								startingBase: 3,
								hitTo,
								fielder,
								isStealing,
								mustAdvanceWithHitter,
							});
						}
					} else {
						// First base

						// Tag up on very deep fly ball
						if (
							battedBallInfo.type === "fly" ||
							battedBallInfo.type === "line"
						) {
							probSuccessIfAdvances = this.probSuccessTagUp({
								battedBallInfo,
								runner: pRunner,
								startingBase: 1,
								hitTo,
								fielder,
								isStealing,
							});
						} else if (battedBallInfo.type === "ground") {
							// Must advance on ground ball
							probSuccessIfAdvances = 1;
						}
					}

					const advance = probSuccessIfAdvances > Math.random();
					if (advance) {
						runner.to += 1;
						runner.out =
							!someRunnerIsAlreadyOut && probSuccessIfAdvances < Math.random();
						if (runner.out) {
							someRunnerIsAlreadyOut = true;
						} else {
							// Is this a sacrifice fly?
							if (
								runner.to === 4 &&
								(battedBallInfo.type === "fly" ||
									battedBallInfo.type === "line")
							) {
								this.recordStat(this.o, p, "sf");
							}
						}
					}
				}
			}

			if (runner.to === 4 && !runner.out && !inningOverAndNobodyAdvances) {
				const pRBI = error ? undefined : p;
				runner.scored = true;

				this.doScore(this.bases[i]!, pRBI);
			}

			if (runner.to < 4) {
				blockedBases.add((runner.to - 1) as any);
			}

			if (runner.out) {
				this.recordStat(this.d, fielder, "a", 1, "fielding");

				let putoutPos: "1B" | "2B" | "SS" | "3B" | "C";
				if (runner.to === 4) {
					putoutPos = "C";
				} else if (runner.to === 3) {
					putoutPos = "3B";
				} else if (runner.to === 2) {
					putoutPos = Math.random() < 0.5 ? "2B" : "SS";
				} else {
					putoutPos = "1B";
				}
				const fielder2 = this.team[this.d].playersInGameByPos[putoutPos].p;
				this.recordStat(this.d, fielder2, "po", 1, "fielding");

				this.logOut();
			}
		}

		const prevBasesByPid: Record<number, OccupiedBase> = {};
		for (const base of this.bases) {
			if (base) {
				prevBasesByPid[base.p.id] = base;
			}
		}
		this.bases = [undefined, undefined, undefined];
		for (const runner of runners) {
			if (runner && runner.to < 4 && !runner.out) {
				this.bases[(runner.to - 1) as any] = prevBasesByPid[runner.pid];
			}
		}

		return runners;
	}

	doBalkWildPitchPassedBall(type: "balk" | "passedBall" | "wildPitch") {
		const runners = this.getRunners();

		if (this.bases[2]) {
			this.doScore(this.bases[2]);
			runners[2]!.to += 1;
			runners[2]!.scored = true;
			this.bases[2] = undefined;
		}
		if (this.bases[1]) {
			runners[1]!.to += 1;
			this.bases[2] = this.bases[1];
			this.bases[1] = undefined;
		}
		if (this.bases[0]) {
			runners[0]!.to += 1;
			this.bases[1] = this.bases[0];
			this.bases[0] = undefined;
		}

		const pos = type === "passedBall" ? "C" : "P";

		const p = this.team[this.d].playersInGameByPos[pos].p;

		let stat;
		if (type === "balk") {
			stat = "bk";
		} else if (type === "passedBall") {
			stat = "pb";
		} else {
			stat = "wp";
		}

		this.recordStat(this.d, p, stat);
		this.playByPlay.logEvent({
			type,
			t: this.d,
			pid: p.id,
			runners: this.finalizeRunners(runners),
			...this.getSportState(),
		});
	}

	probStealThrowOut(p: PlayerGameSim, fromBaseIndex: 0 | 1) {
		const catcher = this.team[this.d].playersInGameByPos.C.p;

		// Stealing 2nd is easier than stealing 3rd
		const baseline = fromBaseIndex === 0 ? 0.4 : 0.55;

		const prob =
			baseline +
			0.25 *
				(catcher.compositeRating.arm + catcher.compositeRating.catcherDefense) -
			0.5 * p.compositeRating.speed;

		return prob * g.get("throwOutFactor");
	}

	processSteals(stealing: [boolean, boolean, boolean]) {
		// Stealing home currently is only implemented on a full count with 2 outs, and processSteals only happens after a strike or ball, so this should never happen
		if (!stealing[0] && !stealing[1]) {
			return;
		}

		const indexes: (0 | 1)[] = [];
		for (let i = stealing.length - 1; i >= 0; i--) {
			if (stealing[i]) {
				// If this is a walk and the runner gets the base automatically, then no steal attempt
				if (this.balls === 4 && this.isForceOut(i as any)) {
					continue;
				}

				indexes.push(i as 0 | 1);
			}
		}

		let throwAt = Math.random() < 0.1 ? undefined : random.choice(indexes);
		if (throwAt === 0 && this.bases[2]) {
			// Stealing 2nd with runners on 1st and 3rd, maybe don't throw
			if (Math.random() < 0.5) {
				throwAt = undefined;
			}
		}

		const catcher = this.team[this.d].playersInGameByPos.C.p;

		let thrownOut = false;
		if (throwAt !== undefined) {
			thrownOut =
				Math.random() < this.probStealThrowOut(this.bases[throwAt]!.p, throwAt);
		}

		// indexes is in descending order, so bases can safely be updated
		for (const i of indexes) {
			const occupiedBase = this.bases[i]!;
			const p = occupiedBase.p;
			this.bases[i] = undefined;

			const out = throwAt === i && thrownOut;
			const success = !out;

			if (out) {
				this.recordStat(this.o, p, "cs");
				this.recordStat(this.d, catcher, "csF");

				this.logOut();

				if (this.outs >= NUM_OUTS_PER_INNING) {
					// Same batter will be up next inning
					this.team[this.o].moveToPreviousBatter();
				}
			} else {
				this.bases[i + 1] = occupiedBase;
				this.recordStat(this.o, p, "sb");
				this.recordStat(this.d, catcher, "sbF");
			}

			this.playByPlay.logEvent({
				type: "stealEnd",
				pid: p!.id,
				to: (i + 2) as any,
				out: !success,
				throw: throwAt === i,
				outAtNextBase: false,
				...this.getSportState(),
			});
		}
	}

	probBalk() {
		return 0.0005 * g.get("balkFactor");
	}

	probWildPitch() {
		const pitcher = this.team[this.d].playersInGameByPos.P.p;
		const catcher = this.team[this.d].playersInGameByPos.C.p;
		return (
			0.005 *
			(1 -
				(0.75 * pitcher.compositeRating.controlPitcher +
					0.25 * catcher.compositeRating.catcherDefense)) *
			g.get("wildPitchFactor")
		);
	}

	probPassedBall() {
		const pitcher = this.team[this.d].playersInGameByPos.P.p;
		const catcher = this.team[this.d].playersInGameByPos.C.p;
		return (
			0.001 *
			(1 -
				(0.25 * pitcher.compositeRating.controlPitcher +
					0.75 * catcher.compositeRating.catcherDefense)) *
			g.get("passedBallFactor")
		);
	}

	probHitByPitch() {
		const p = this.team[this.d].playersInGameByPos.P.p;

		return (
			0.007 * (1 - p.compositeRating.controlPitcher) * g.get("hitByPitchFactor")
		);
	}

	probSteal(baseIndex: 0 | 1 | 2) {
		const runner = this.bases[baseIndex]?.p;
		if (!runner) {
			return 0;
		}

		// Late game when down, don't steal unless it advances the tying/winning run
		const runsDown =
			this.team[this.d].t.stat.pts - this.team[this.o].t.stat.pts;
		if (runsDown > 0) {
			const numRunnersAhead = this.bases.filter(
				(base, i) => !!base && i > baseIndex,
			).length;
			const isWinningRun = numRunnersAhead === runsDown;
			const isTyingRun = numRunnersAhead === runsDown - 1;
			if (!isWinningRun && !isTyingRun) {
				return 0;
			}
		}

		const catcher = this.team[this.d].playersInGameByPos.C.p;

		// Adjustment is to make low speed runners less likely to steal
		const adjustedSpeed =
			runner.compositeRating.speed *
			helpers.sigmoid(runner.compositeRating.speed, 15, 0.3);

		// Ranges from 0 to 1, adjusted below too
		let prob = adjustedSpeed - catcher.compositeRating.arm;

		if (baseIndex === 0) {
			// Stealing 2nd
			prob *= 0.25;
		} else if (baseIndex === 1) {
			// Stealing 3rd
			prob *= 0.1;
		} else {
			// Stealing home
			prob *= 0;
		}

		return prob * g.get("stealFactor");
	}

	getPitchOutcome(pitcher: PlayerGameSim, batter: PlayerGameSim) {
		const BALL_PROB_BY_COUNT: Record<number, Record<number, number>> = {
			0: {
				0: 0.58,
				1: 0.53,
				2: 0.48,
				3: 0.18,
			},
			1: {
				0: 0.63,
				1: 0.58,
				2: 0.53,
				3: 0.28,
			},
			2: {
				0: 0.78,
				1: 0.68,
				2: 0.58,
				3: 0.38,
			},
		};
		let ballProb = BALL_PROB_BY_COUNT[this.strikes][this.balls];

		if (this.strikes === 2 && this.balls === 0) {
			ballProb += 0.2 * pitcher.compositeRating.controlPitcher;
		} else if (this.strikes === 2 && this.balls === 1) {
			ballProb += 0.1 * pitcher.compositeRating.controlPitcher;
		} else if (this.balls === 3) {
			ballProb -= 0.2 * pitcher.compositeRating.controlPitcher;
		} else {
			ballProb -= 0.1 * pitcher.compositeRating.controlPitcher;
		}

		const strikeProb = (1 - ballProb) * Math.max(0.1, g.get("strikeFactor"));

		const ballOrStrike =
			Math.random() < strikeProb ? "strike" : ("ball" as const);

		let pitchQuality = helpers.bound(
			random.gauss(
				fatigueFactor(
					pitcher.pFatigue + pitcher.stat.pc,
					pitcher.compositeRating.workhorsePitcher,
				) * pitcher.compositeRating.pitcher,
				0.2,
			),
			0,
			1,
		);

		// Scale pitch quality to tune the effect of pitchers
		pitchQuality = 0.25 + 0.5 * pitchQuality;

		let outcome: "ball" | "strike" | "contact";
		let swinging = false;

		const eyeAdjusted = 0.25 + 0.5 * batter.compositeRating.eye;
		let contactAdjusted = 0.25 + 0.5 * batter.compositeRating.contactHitter;

		let swingProbAdjustment = 0;
		if (this.strikes === 2) {
			swingProbAdjustment += 0.2;
			contactAdjusted += 0.08;
		}

		if (ballOrStrike === "ball") {
			const swingProb = pitchQuality - eyeAdjusted + swingProbAdjustment;
			if (Math.random() < swingProb * g.get("swingFactor")) {
				swinging = true;
				const contactProb = 0.4 + contactAdjusted - pitchQuality;
				outcome =
					Math.random() < contactProb * g.get("contactFactor")
						? "contact"
						: "strike";
			} else {
				outcome = "ball";
			}
		} else {
			const swingProb = 0.75 - pitchQuality + eyeAdjusted + swingProbAdjustment;
			if (Math.random() < swingProb * g.get("swingFactor")) {
				swinging = true;
				const contactProb = 0.65 + contactAdjusted - pitchQuality;
				outcome =
					Math.random() < contactProb * g.get("contactFactor")
						? "contact"
						: "strike";
			} else {
				outcome = "strike";
			}
		}

		return {
			outcome,
			pitchQuality,
			swinging,
		};
	}

	probHit(
		batter: PlayerGameSim,
		pitcher: PlayerGameSim,
		hitTo: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>,
	) {
		if (
			battedBallInfo.type === "fly" &&
			battedBallInfo.distance === "noDoubter"
		) {
			return 1;
		}

		const hitToPos = POS_NUMBERS_INVERSE[hitTo];

		const fielder = this.team[this.d].playersInGameByPos[hitToPos].p;

		const defenseWeights = {
			infieldRange: 0,
			outfieldRange: 0,
			groundBallDefense: 0,
			flyBallDefense: 0,
			arm: 0,
		};
		const outfielders = ["LF", "CF", "RF"] as const;
		const infielders = ["1B", "2B", "3B", "SS"] as const;
		if (battedBallInfo.type === "ground") {
			if (outfielders.includes(hitToPos as any)) {
				return 1;
			}

			const posToTakeRatingsFrom = (
				infielders.includes(hitToPos as any) ? hitToPos : "2B"
			) as (typeof infielders)[number];

			defenseWeights.infieldRange =
				infoDefense[posToTakeRatingsFrom].infieldRange[0];
			defenseWeights.groundBallDefense =
				infoDefense[posToTakeRatingsFrom].groundBallDefense[0];
			defenseWeights.arm = infoDefense[posToTakeRatingsFrom].arm[0];
		} else {
			const posToTakeRatingsFrom = (
				outfielders.includes(hitToPos as any) ? hitToPos : "LF"
			) as (typeof outfielders)[number];

			defenseWeights.outfieldRange =
				infoDefense[posToTakeRatingsFrom].outfieldRange[0];
			defenseWeights.flyBallDefense =
				infoDefense[posToTakeRatingsFrom].flyBallDefense[0];

			if (battedBallInfo.type === "line") {
				defenseWeights.groundBallDefense = defenseWeights.flyBallDefense;
			}
		}

		let numerator = 0;
		let denominator = 0;
		for (const [key, value] of Object.entries(defenseWeights)) {
			numerator += value * fielder.compositeRating[key];
			denominator += value;
		}
		const fieldingFactor = 0.5 - numerator / denominator;

		return (
			(0.21 +
				0.075 * batter.compositeRating.contactHitter +
				0.125 * fieldingFactor) *
			g.get("hitFactor")
		);
	}

	getPErrorIfNotHit(
		type: "ground" | "line" | "fly",
		defenderIndex: ReturnType<GameSim["getHitTo"]>,
	) {
		const p =
			this.team[this.d].playersInGameByPos[POS_NUMBERS_INVERSE[defenderIndex]]
				.p;

		let prob;
		if (type === "ground") {
			prob = 0.03 + 0.03 * (1 - p.compositeRating.groundBallDefense);
		} else if (type === "fly") {
			prob = 0.015 + 0.015 * (1 - p.compositeRating.flyBallDefense);
		} else {
			prob =
				0.02 +
				0.02 *
					(1 -
						(p.compositeRating.groundBallDefense +
							p.compositeRating.flyBallDefense) /
							2);
		}

		if (prob > Math.random()) {
			return p;
		}

		if (type === "ground") {
			const firstBaseman = this.team[this.d].playersInGameByPos["1B"].p;

			const prob =
				0.005 +
				0.005 *
					(1 -
						(firstBaseman.compositeRating.firstBaseDefense +
							firstBaseman.compositeRating.groundBallDefense) /
							2);

			if (prob > Math.random()) {
				return firstBaseman;
			}
		}
	}

	getNumBases(
		batter: PlayerGameSim,
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>,
	) {
		// On some softer hits, speed is what determines likelihood of extra base hit, not power
		let extraBasesBySpeedOnly = false;

		let numBasesWeights: [number, number, number, number];
		if (battedBallInfo.type === "fly") {
			if (battedBallInfo.distance === "infield") {
				numBasesWeights = [1, 0, 0, 0];
				extraBasesBySpeedOnly = true;
			} else if (battedBallInfo.distance === "shallow") {
				numBasesWeights = [1, 0.1, 0.006, 0];
				extraBasesBySpeedOnly = true;
			} else if (battedBallInfo.distance === "normal") {
				numBasesWeights = [0.4, 0.4, 0.1, 0.03];
			} else if (battedBallInfo.distance === "deep") {
				numBasesWeights = [0, 0.1, 0.1, 0.5];
			} else {
				numBasesWeights = [0, 0, 0, 1];
			}
		} else if (battedBallInfo.type === "line") {
			if (battedBallInfo.speed === "soft") {
				numBasesWeights = [1, 0.1, 0, 0];
				extraBasesBySpeedOnly = true;
			} else if (battedBallInfo.speed === "normal") {
				numBasesWeights = [0.4, 0.6, 0.003, 0];
			} else {
				numBasesWeights = [0.2, 0.7, 0.12, 0.06];
			}
		} else {
			extraBasesBySpeedOnly = true;
			if (battedBallInfo.speed === "soft") {
				numBasesWeights = [1, 0.01, 0, 0];
			} else if (battedBallInfo.speed === "normal") {
				numBasesWeights = [1, 0.02, 0, 0];
			} else {
				numBasesWeights = [1, 0.03, 0, 0];
			}
		}

		const speedFactor = 1.5 * batter.compositeRating.speed;

		if (extraBasesBySpeedOnly) {
			numBasesWeights[1] *= speedFactor;
			numBasesWeights[2] *= speedFactor;
			numBasesWeights[3] *= speedFactor;
		} else {
			const powerFactor = 0.5 + batter.compositeRating.powerHitter;
			numBasesWeights[1] *= powerFactor;
			numBasesWeights[2] *= powerFactor;
			numBasesWeights[3] *= powerFactor;

			// Triples depend on speed too
			numBasesWeights[2] *= speedFactor;
		}

		const numBases = random.choice([1, 2, 3, 4] as const, numBasesWeights);

		/*if (numBases === 4) {
			const type = `${battedBallInfo.type}-${battedBallInfo.speed ?? battedBallInfo.distance}`;
			if (!self.hrTypes[type]) {
				self.hrTypes[type] = 0;
			}
			self.hrTypes[type] += 1;
		}*/

		return numBases;
	}

	getBattedBallOutcome(
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>,
		batter: PlayerGameSim,
		pitcher: PlayerGameSim,
	) {
		// Figure out what defender fields the ball
		const hitTo = this.getHitTo(battedBallInfo as any);

		let numBases = this.getNumBases(batter, battedBallInfo);
		let hit =
			numBases === 4 ||
			Math.random() < this.probHit(batter, pitcher, hitTo, battedBallInfo);

		let result:
			| "hit"
			| "error"
			| "flyOut"
			| "throwOut"
			| "fieldersChoice"
			| "doublePlay";
		const posDefense: (keyof typeof POS_NUMBERS_INVERSE)[] = [hitTo];
		let fieldersChoiceOrDoublePlayIndex: undefined | 0 | 1 | 2; // Index of bases/runners for the runner who is out due to a fielder's choie or double play

		const pErrorIfNotHit = hit
			? undefined
			: this.getPErrorIfNotHit(battedBallInfo.type as any, hitTo);

		if (hit || pErrorIfNotHit) {
			if (hit) {
				result = "hit";
				hit = true;
			} else {
				result = "error";
			}
		} else {
			numBases = 1;

			if (battedBallInfo.type === "fly" || battedBallInfo.type === "line") {
				result = "flyOut";
			} else {
				if (this.bases[0] || this.bases[1] || this.bases[2]) {
					// Probability of double play depends on who it's hit to
					const r = Math.random();
					let probDoublePlay = 0;
					if (this.bases[0] && this.outs < 2) {
						if (hitTo === 6 || hitTo === 4) {
							probDoublePlay = 0.75;
						} else if (hitTo === 5) {
							probDoublePlay = 0.5;
						} else {
							probDoublePlay = 0.2;
						}

						const fielder =
							this.team[this.d].playersInGameByPos[POS_NUMBERS_INVERSE[hitTo]]
								.p;
						const firstBaseman = this.team[this.d].playersInGameByPos["1B"].p;

						// Ideally this would include any intermediate fielder too, not just the primary fielder and first baseman
						const doublePlayDefenseFactor =
							(fielder.compositeRating.groundBallDefense +
								fielder.compositeRating.arm +
								firstBaseman.compositeRating.firstBaseDefense) /
								3 +
							0.5;

						probDoublePlay *= doublePlayDefenseFactor;
					}

					const r2 = Math.random();
					let probFieldersChoice = 0;
					if (this.bases[0]) {
						probFieldersChoice = 0.7;
					} else if (this.bases[1] || this.bases[2]) {
						probFieldersChoice = 0.1;
					}

					if (r < probDoublePlay) {
						result = "doublePlay";

						const putOutBaseIndexWeights = [0, 0, 0];
						let forceOutPossible = true;
						for (let i = 0; i < 3; i++) {
							if (this.bases[0]) {
								putOutBaseIndexWeights[i] = forceOutPossible ? 1 : 0.05;
							} else {
								forceOutPossible = false;
							}
						}
						fieldersChoiceOrDoublePlayIndex = random.choice(
							[0, 1, 2],
							putOutBaseIndexWeights,
						);
					} else if (r2 < probFieldersChoice) {
						result = "fieldersChoice";
					} else {
						result = "throwOut";
					}

					if (result === "doublePlay" || result === "fieldersChoice") {
						const putOutBaseIndexWeights = [0, 0, 0];
						let forceOutPossible = true;
						for (let i = 0; i < 3; i++) {
							if (this.bases[i]) {
								if (result === "fieldersChoice") {
									// Runners on 1st, 2nd, or 3rd could be out, but higher chance of it happening when a force out is possible
									putOutBaseIndexWeights[i] = forceOutPossible ? 1 : 0.05;
								} else {
									// Only force outs
									putOutBaseIndexWeights[i] = forceOutPossible ? 1 : 0;
								}
							} else {
								forceOutPossible = false;
							}
						}
						fieldersChoiceOrDoublePlayIndex = random.choice(
							[0, 1, 2],
							putOutBaseIndexWeights,
						);

						// Undefind means put out is done by the same person who fielded the ball
						let posPutOut: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined;
						if (fieldersChoiceOrDoublePlayIndex === 2) {
							// Out at home
							posPutOut = hitTo === 2 ? 1 : 2;
						} else if (fieldersChoiceOrDoublePlayIndex === 1) {
							// Out at 3rd
							posPutOut = hitTo === 5 ? undefined : 5;
						} else {
							// Out at 2nd
							if ((hitTo === 4 || hitTo === 6) && Math.random() < 0.2) {
								posPutOut = undefined;
							} else {
								const secondBasemanCovers = [1, 2, 5, 6, 7, 8];
								posPutOut = secondBasemanCovers.includes(hitTo) ? 4 : 6;
							}
						}

						if (posPutOut !== undefined) {
							posDefense.push(posPutOut);
						}

						if (result === "doublePlay") {
							// Double play always includes batter, currently
							posDefense.push(3);
						}
					}
				} else {
					result = "throwOut";
				}

				if (result === "throwOut") {
					// Undefind means put out is done by the same person who fielded the ball
					let posPutOut: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined;
					if (hitTo === 3) {
						if (Math.random() < 0.2) {
							posPutOut = 1;
						}
					} else {
						posPutOut = 3;
					}

					if (posPutOut !== undefined) {
						posDefense.push(posPutOut);
					}
				}
			}
		}

		// On fielder's choice, the batter is inherited by the pitcher responsible for the runner called out
		let responsiblePitcherPid: number | undefined;
		if (
			result === "fieldersChoice" &&
			fieldersChoiceOrDoublePlayIndex !== undefined
		) {
			responsiblePitcherPid =
				this.bases[fieldersChoiceOrDoublePlayIndex]!.responsiblePitcherPid;
		}

		return {
			hitTo,
			hit,
			result,
			posDefense,
			numBases,
			fieldersChoiceOrDoublePlayIndex,
			responsiblePitcherPid,
			pErrorIfNotHit,
		};
	}

	isForceOut(i: 0 | 1 | 2, basesOrRunners: [any, any, any] = this.bases) {
		return (
			i === 0 ||
			(i === 1 && !!basesOrRunners[0]) ||
			(i === 2 && !!basesOrRunners[0] && !!basesOrRunners[1])
		);
	}

	simPitch() {
		let doneBatter;

		if (this.bases.some(p => p) && Math.random() < this.probBalk()) {
			this.doBalkWildPitchPassedBall("balk");

			if (this.gameIsOverDuringInning()) {
				// End the game mid at bat
				doneBatter = true;
			}

			return doneBatter;
		}

		let wildPitchPassedBall: "wildPitch" | "passedBall" | undefined;
		if (Math.random() < this.probWildPitch()) {
			wildPitchPassedBall = "wildPitch";
		} else if (Math.random() < this.probPassedBall()) {
			wildPitchPassedBall = "passedBall";
		}

		if (wildPitchPassedBall) {
			this.doBalkWildPitchPassedBall(wildPitchPassedBall);

			this.balls += 1;
			if (this.balls >= 4) {
				this.doWalk("normal");
				doneBatter = true;
			} else {
				this.playByPlay.logEvent({
					type: "ball",
					balls: this.balls,
					strikes: this.strikes,
				});
			}

			return doneBatter;
		}

		if (Math.random() < this.probHitByPitch()) {
			this.doWalk("hitByPitch");
			doneBatter = true;
			return doneBatter;
		}

		const stealing = [false, false, false] as [boolean, boolean, boolean];
		const fullCountTwoOuts =
			this.outs === NUM_OUTS_PER_INNING - 1 &&
			this.balls === 3 &&
			this.strikes === 2;

		let numStealing = 0;
		let numStaying = 0;

		for (let i = 2 as 0 | 1 | 2; i >= 0; i--) {
			const p = this.bases[i];
			if (!p) {
				continue;
			}

			if (fullCountTwoOuts) {
				// Full count with 2 outs, might as well start running if it's a force out
				const isForceOut = this.isForceOut(i);
				stealing[i] = isForceOut;
			}

			if (!stealing[i]) {
				const nextBaseOccupied = !!this.bases[i + 1] && !stealing[i + 1];

				if (!nextBaseOccupied) {
					stealing[i] =
						i < 2 && !!this.bases[i] && Math.random() < this.probSteal(i);
				}
			}

			if (stealing[i]) {
				numStealing += 1;
			} else {
				numStaying += 1;
			}
		}

		if (numStealing > 1 && numStaying === 0) {
			this.playByPlay.logEvent({
				type: "stealStartAll",
			});
		} else {
			for (let i = 0; i < stealing.length; i++) {
				if (stealing[i]) {
					this.playByPlay.logEvent({
						type: "stealStart",
						pid: this.bases[i]!.p.id,
						to: (i + 2) as 2 | 3 | 4,
					});
				}
			}
		}

		const batter = this.team[this.o].getBatter().p;
		const pitcher = this.team[this.d].playersInGameByPos.P.p;

		this.recordStat(this.d, pitcher, "pc");

		const { outcome, pitchQuality, swinging } = this.getPitchOutcome(
			pitcher,
			batter,
		);

		if (outcome === "ball") {
			this.balls += 1;
			if (this.balls >= 4) {
				this.doWalk("normal");
				doneBatter = true;
			} else {
				this.playByPlay.logEvent({
					type: "ball",
					balls: this.balls,
					strikes: this.strikes,
				});
			}

			if (numStealing > 0) {
				this.processSteals(stealing);
				if (this.outs >= NUM_OUTS_PER_INNING) {
					doneBatter = true;
					return doneBatter;
				}
			}
		} else if (outcome === "strike") {
			this.strikes += 1;
			if (this.strikes >= 3) {
				this.doStrikeout(swinging);
				doneBatter = true;
				if (this.outs >= NUM_OUTS_PER_INNING) {
					return doneBatter;
				}
			} else {
				this.playByPlay.logEvent({
					type: "strike",
					swinging,
					balls: this.balls,
					strikes: this.strikes,
				});
			}

			if (numStealing > 0) {
				this.processSteals(stealing);
				if (this.outs >= NUM_OUTS_PER_INNING) {
					doneBatter = true;
					return doneBatter;
				}
			}
		} else {
			const battedBallInfo = this.doBattedBall(batter, pitchQuality);

			// Result of the hit
			if (
				battedBallInfo.type === "outOfPlay" ||
				battedBallInfo.direction === "farLeftFoul" ||
				battedBallInfo.direction === "farRightFoul"
			) {
				this.doFoul();
			} else {
				const {
					hitTo,
					hit,
					result,
					posDefense,
					numBases,
					fieldersChoiceOrDoublePlayIndex,
					responsiblePitcherPid,
					pErrorIfNotHit,
				} = this.getBattedBallOutcome(battedBallInfo, batter, pitcher);

				if (result === "flyOut") {
					const posCatch = POS_NUMBERS_INVERSE[hitTo];
					const p = this.team[this.d].playersInGameByPos[posCatch].p;
					this.recordStat(this.d, p, "po", 1, "fielding");
				} else if (result === "throwOut" || result === "fieldersChoice") {
					const p =
						this.team[this.d].playersInGameByPos[
							POS_NUMBERS_INVERSE[posDefense.at(-1)!]
						].p;
					this.recordStat(this.d, p, "po", 1, "fielding");
				} else if (result === "doublePlay") {
					const posFirstPutOut = POS_NUMBERS_INVERSE[posDefense.at(-2)!];
					const fielder =
						this.team[this.d].playersInGameByPos[posFirstPutOut].p;
					this.recordStat(this.d, fielder, "po", 1, "fielding");

					// Double play always includes batter, currently
					const firstBaseman = this.team[this.d].playersInGameByPos["1B"].p;
					this.recordStat(this.d, firstBaseman, "po", 1, "fielding");
				} else if (result === "hit") {
					this.recordStat(this.o, batter, "h");
					this.recordStat(this.d, pitcher, "hPit");
					if (numBases > 1) {
						const hitType =
							numBases === 2 ? "2b" : numBases === 3 ? "3b" : "hr";
						this.recordStat(this.o, batter, hitType);

						this.recordStat(this.d, pitcher, `${hitType}Pit`);
					}
				}

				if (
					["flyOut", "throwOut", "fieldersChoice", "doublePlay"].includes(
						result,
					)
				) {
					if (posDefense.length > 1) {
						const fielder =
							this.team[this.d].playersInGameByPos[
								POS_NUMBERS_INVERSE[posDefense.at(-2)!]
							].p;
						this.recordStat(this.d, fielder, "a", 1, "fielding");
					}

					if (posDefense.length > 2 && result === "doublePlay") {
						const fielder =
							this.team[this.d].playersInGameByPos[
								POS_NUMBERS_INVERSE[posDefense.at(-2)!]
							].p;
						this.recordStat(this.d, fielder, "a", 1, "fielding");
					}

					if (result === "doublePlay") {
						for (const posNumber of posDefense) {
							const fielder =
								this.team[this.d].playersInGameByPos[
									POS_NUMBERS_INVERSE[posNumber]
								].p;
							this.recordStat(this.d, fielder, "dp", 1, "fielding");
						}
					}
				}

				this.recordStat(this.o, batter, "pa");
				this.recordStat(this.d, pitcher, "bf");

				const getRunners = () => {
					return this.advanceRunners({
						battedBallInfo,
						error: result === "error",
						fieldersChoiceOrDoublePlayIndex,
						hit,
						hitTo,
						numBases,
						p: batter,
						result,
						stealing,
					});
				};

				if (numBases === 4) {
					this.doScore(
						{
							p: batter,
							reachedOnError: result === "error",
							responsiblePitcherPid: pitcher.id,
						},
						result !== "error" ? batter : undefined,
					);
				}

				if (result === "error") {
					const pError = pErrorIfNotHit!;
					this.recordStat(this.d, pError, "e", 1, "fielding");
					const pidError = pError.id;

					this.outsIfNoErrorsByPitcherPid[pitcher.id] += 1;
					this.outsIfNoErrors += 1;

					const runners = getRunners();

					if (numBases < 4) {
						this.bases[numBases - 1] = this.makeOccupiedBase(batter, true);
					}

					this.playByPlay.logEvent({
						type: "hitResult",
						result: "error",
						t: this.o,
						pid: batter.id,
						pidError,
						posDefense,
						runners: this.finalizeRunners(runners),
						numBases,
						outAtNextBase: false,
						...this.getSportState(),
					});
				} else {
					// Make sure we do runners stuff after hitter out is logged, but before hitter is put on base
					let runners;
					if (result === "flyOut" || result === "throwOut") {
						this.logOut();

						runners = getRunners();
					} else if (result === "doublePlay") {
						this.recordStat(this.o, batter, "gdp");
						this.logOut();

						runners = getRunners();
					} else {
						runners = getRunners();

						if (numBases < 4) {
							this.bases[numBases - 1] = this.makeOccupiedBase(
								batter,
								false,
								responsiblePitcherPid,
							);
						}
					}

					this.playByPlay.logEvent({
						type: "hitResult",
						result,
						t: this.o,
						pid: batter.id,
						posDefense,
						runners: this.finalizeRunners(runners),
						numBases,
						outAtNextBase: false,
						...this.getSportState(),
					});
				}

				doneBatter = true;
			}
		}

		return doneBatter;
	}

	doScore(runInfo: OccupiedBase, rbi?: PlayerGameSim) {
		const pitcher =
			this.team[this.d].playersByPid[runInfo.responsiblePitcherPid];

		const unearned =
			runInfo.reachedOnError ||
			(this.outsIfNoErrorsByPitcherPid[pitcher.id] ?? 0) >= NUM_OUTS_PER_INNING;

		this.recordStat(this.d, pitcher, "rPit");
		if (!unearned) {
			this.recordStat(this.d, pitcher, "er");
		}

		this.recordStat(this.o, runInfo.p, "r");
		if (rbi) {
			this.recordStat(this.o, rbi, "rbi");
		}

		if (this.team[0].t.stat.pts === this.team[1].t.stat.pts) {
			this.winEligiblePid = undefined;
			this.lossEligiblePid = undefined;
		} else if (
			this.team[this.o].t.stat.pts - 1 ===
			this.team[this.d].t.stat.pts
		) {
			// This run just broke the tie, now someone is winning
			this.winEligiblePid = this.team[this.o].playersInGameByPos.P.p.id;
			this.lossEligiblePid = pitcher.id;
		}
	}

	getRunners() {
		return this.bases.map((base, i) => {
			if (base) {
				return {
					pid: base.p.id,
					from: i + 1,
					to: i + 1,
					out: false,
				};
			}
		}) as [Runner, Runner, Runner];
	}

	finalizeRunners(
		runners: (
			| {
					pid: number;
					from: number;
					to: number;
					out: boolean;
			  }
			| undefined
		)[],
	) {
		const finalized: Runner[] = [];
		for (const runner of runners) {
			if (runner && runner.from !== 0) {
				finalized.push(runner as Runner);
			}
		}

		return finalized;
	}

	doWalk(type: "intentional" | "normal" | "hitByPitch") {
		const t = this.team[this.o];
		const p = t.getBatter().p;
		const runners = this.getRunners();

		if (this.bases[0]) {
			if (this.bases[1]) {
				if (this.bases[2]) {
					this.doScore(this.bases[2], p);
					runners[2]!.to += 1;
					runners[2]!.scored = true;
				}

				this.bases[2] = this.bases[1];
				runners[1]!.to += 1;
			}

			this.bases[1] = this.bases[0];
			runners[0]!.to += 1;
		}

		this.bases[0] = this.makeOccupiedBase(p);

		const pitcher = this.team[this.d].playersInGameByPos.P.p;

		this.recordStat(this.o, p, "pa");
		this.recordStat(this.d, pitcher, "bf");

		if (type === "intentional") {
			this.recordStat(this.o, p, "ibb");
			this.recordStat(this.d, pitcher, "ibbPit");
		}

		if (type === "intentional" || type === "normal") {
			this.recordStat(this.o, p, "bb");
			this.recordStat(this.d, pitcher, "bbPit");
			this.playByPlay.logEvent({
				type: "walk",
				intentional: type === "intentional",
				t: this.o,
				pid: p.id,
				runners: this.finalizeRunners(runners),
				...this.getSportState(),
			});
		} else {
			this.recordStat(this.o, p, "hbp");
			this.recordStat(this.d, pitcher, "hbpPit");
			this.playByPlay.logEvent({
				type: "hitByPitch",
				t: this.o,
				pid: p.id,
				runners: this.finalizeRunners(runners),
				...this.getSportState(),
			});
		}
	}

	logOut() {
		this.outs += 1;
		const pitcher = this.team[this.d].playersInGameByPos.P.p;
		this.recordStat(this.d, pitcher, "outs");
		for (const [pos, p] of Object.entries(
			this.team[this.d].playersInGameByPos,
		)) {
			if (pos !== "DH") {
				this.recordStat(this.d, p.p, "outsF", 1, "fielding");
			}
		}

		if (this.outsIfNoErrorsByPitcherPid[pitcher.id] === undefined) {
			this.outsIfNoErrorsByPitcherPid[pitcher.id] = 0;
		}
		this.outsIfNoErrorsByPitcherPid[pitcher.id] += 1;
		this.outsIfNoErrors += 1;
	}

	getSportState() {
		return {
			outs: this.outs,
			bases: this.bases.map(base => base?.p.id) as [
				number | undefined,
				number | undefined,
				number | undefined,
			],
		};
	}

	doStrikeout(swinging: boolean) {
		const t = this.team[this.o];
		const batter = t.getBatter().p;
		const pitcher = this.team[this.d].playersInGameByPos.P.p;
		const catcher = this.team[this.d].playersInGameByPos.C.p;

		this.recordStat(this.o, batter, "pa");
		this.recordStat(this.d, pitcher, "bf");
		this.recordStat(this.o, batter, "so");
		this.recordStat(this.d, pitcher, "soPit");
		this.recordStat(this.d, catcher, "po", 1, "fielding");
		this.recordStat(this.d, catcher, "poSo");
		this.logOut();
		this.playByPlay.logEvent({
			type: "strikeOut",
			swinging,
			...this.getSportState(),
		});
	}

	possessionChange() {
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
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

			for (let p = 0; p < this.team[t].t.player.length; p++) {
				for (const r of Object.keys(this.team[t].t.player[p].compositeRating)) {
					if (r !== "endurance") {
						this.team[t].t.player[p].compositeRating[r] *= factor;
					}
				}
			}
		}
	}

	run() {
		this.simGame();
		this.playByPlay.logEvent({
			type: "gameOver",
		});

		// Handle some stats here
		for (const t of teamNums) {
			const pitcher = this.team[t].playersInGameByPos.P.p;
			this.recordStat(t, pitcher, "gf");
			if (pitcher.stat.gsPit) {
				this.recordStat(t, pitcher, "cg");

				if (pitcher.stat.rPit === 0) {
					this.recordStat(t, pitcher, "sho");
				}
			}

			const t2 = t === 0 ? 1 : 0;
			for (const [pos, p] of Object.entries(this.team[t].playersInGameByPos)) {
				if (pos !== "DH") {
					const posIndex = (POS_NUMBERS as any)[pos] - 1;

					// Use ptsQtrs rather than this.numInnings and this.overtimes because it handles when the bottom half of the last inning is not played
					if (
						pos !== "DH" &&
						p.p.stat.outsF[posIndex] ===
							NUM_OUTS_PER_INNING * this.team[t2].t.stat.ptsQtrs.length
					) {
						this.recordStat(t, p.p, "cgF", 1, "fielding");
					}
				}
			}

			const teamWon = this.team[t].t.stat.pts > this.team[t2].t.stat.pts;
			const saveOutsNeeded = this.team[t].saveOutsNeeded;
			if (
				teamWon &&
				pitcher.id !== this.winEligiblePid &&
				saveOutsNeeded !== undefined &&
				pitcher.stat.outs >= saveOutsNeeded
			) {
				this.recordStat(t, pitcher, "sv");
			}

			const winLossInfos = [
				{
					stat: "w",
					pid: this.winEligiblePid,
				},
				{
					stat: "l",
					pid: this.lossEligiblePid,
				},
			];
			for (const info of winLossInfos) {
				if (info.pid !== undefined) {
					const p = this.team[t].playersByPid[info.pid];
					if (p) {
						this.recordStat(t, p, info.stat);
					}
				}
			}
		}

		// Delete stuff that isn't needed before returning
		for (const t of teamNums) {
			delete this.team[t].t.compositeRating;
			// @ts-expect-error
			delete this.team[t].t.pace;

			for (let p = 0; p < this.team[t].t.player.length; p++) {
				// @ts-expect-error
				delete this.team[t].t.player[p].age;
				// @ts-expect-error
				delete this.team[t].t.player[p].valueNoPot;
				delete this.team[t].t.player[p].compositeRating;
				// @ts-expect-error
				delete this.team[t].t.player[p].ptModifier;
				delete this.team[t].t.player[p].stat.benchTime;
				delete this.team[t].t.player[p].stat.courtTime;
				delete this.team[t].t.player[p].stat.energy;
				// @ts-expect-error
				delete this.team[t].t.player[p].pFatigue;
			}

			this.team[t] = this.team[t].t as any;
		}

		const out = {
			gid: this.id,
			day: this.day,
			overtimes: this.overtimes,
			team: this.team as unknown as [TeamGameSim, TeamGameSim],
			clutchPlays: [],
			playByPlay: this.playByPlay.getPlayByPlay(this.team),
			scoringSummary: this.playByPlay.scoringSummary,
		};
		return out;
	}

	shouldIntentionalWalk() {
		// At end of game, don't put tying/winning run on
		const diffPts = this.team[this.d].t.stat.pts - this.team[this.o].t.stat.pts;
		const runsWithHR = this.bases.filter(p => !p).length + 1;
		const tyingRunUp = diffPts === runsWithHR;
		const tyingRunOnDeck = diffPts === runsWithHR + 1;
		if (
			this.inning >= this.numInnings - 1 &&
			(tyingRunUp || tyingRunOnDeck) &&
			Math.random() < 0.75
		) {
			return;
		}

		// Runners on 2nd and 3rd, less than 2 outs
		if (
			this.outs < 2 &&
			!this.bases[0] &&
			this.bases[1] &&
			this.bases[2] &&
			Math.random() < 0.5
		) {
			return true;
		}

		const batter = this.team[this.o].getBatter().p;
		const onDeck = this.team[this.o].getOnDeck().p;
		const score = (p: PlayerGameSim) =>
			p.compositeRating.contactHitter + p.compositeRating.powerHitter;
		const batterScore = score(batter);
		const onDeckScore = score(onDeck);
		const diffScore = batterScore - onDeckScore; // Each score ranges from 0 to 2, so the most this could be is 2

		// Runner on just 2nd, less than 2 outs - maybe if the next hitter is worse
		if (this.outs < 2 && !this.bases[0] && this.bases[1] && !this.bases[2]) {
			const ibb = Math.random() < diffScore - 0.1;
			return ibb;
		}

		// If the current batter is just very scary
		const scary = diffScore > 1 && Math.random() < diffScore - 1;
		return scary;
	}

	simPlateAppearance() {
		const t = this.team[this.o];
		t.advanceToNextBatter();
		this.resetNewBatter();
		const p = t.getBatter().p;
		this.playByPlay.logEvent({
			type: "plateAppearance",
			t: this.o,
			pid: p.id,
		});

		if (this.shouldIntentionalWalk()) {
			this.doWalk("intentional");
			return;
		}

		while (true) {
			const doneBatter = this.simPitch();
			if (doneBatter) {
				break;
			}
		}

		this.checkInjuries();
	}

	getSaveOutsNeeded(teamNum: TeamNum) {
		const otherTeamNum = teamNum === 1 ? 0 : 1;
		const scoreDiff =
			this.team[teamNum].t.stat.pts - this.team[otherTeamNum].t.stat.pts;
		const runsUpToOnDeck = this.bases.filter(base => base).length + 2;
		let saveOutsNeeded = 9;
		if (scoreDiff > 0 && scoreDiff <= 3) {
			saveOutsNeeded = 3;
		}
		if (scoreDiff > 0 && scoreDiff <= runsUpToOnDeck) {
			saveOutsNeeded = 1;
		}

		return saveOutsNeeded;
	}

	substitution(
		teamNum: TeamNum,
		off: GameSim["team"][0]["playersInGame"][number],
		on: PlayerGameSim,
	) {
		const t = this.team[teamNum];

		t.substitution(off, on);

		if (off.pos === "P") {
			this.recordStat(teamNum, on, "gpPit");

			const saveOutsNeeded = this.getSaveOutsNeeded(teamNum);
			t.saveOutsNeeded = saveOutsNeeded;
			this.outsIfNoErrorsByPitcherPid[on.id] += this.outsIfNoErrors;
		}

		this.recordStat(teamNum, on, "gp");
		this.recordStat(teamNum, on, "gpF", 1, "fielding");
	}

	checkReliefPitcher(betweenInnings: boolean) {
		if (this.inning === 1 && betweenInnings) {
			return;
		}

		const saveOutsNeeded = this.getSaveOutsNeeded(this.d);

		const t = this.team[this.d];

		const saveSituation = this.inning === this.numInnings && saveOutsNeeded < 9;
		const candidate = t.getBestReliefPitcher(saveSituation);
		if (!candidate) {
			return;
		}

		const pitcher = t.playersInGameByPos.P.p;
		const pitcherFatigueFactor = fatigueFactor(
			pitcher.pFatigue + pitcher.stat.pc,
			pitcher.compositeRating.workhorsePitcher,
		);
		const value = pitcherFatigueFactor * pitcher.compositeRating.pitcher;

		const starterIsIn = pitcher.stat.gsPit > 0;

		let probSwitch = 0;

		if (betweenInnings) {
			// Weird thing to make relievers with low endurance get taken out earlier
			const factor = 1 + 3 * (1 - pitcher.compositeRating.workhorsePitcher);
			probSwitch = factor * (1 - pitcherFatigueFactor);

			if (candidate.value < value) {
				probSwitch *= 0.75;
			}

			if (this.inning === 9) {
				probSwitch *= 3;
			} else if (this.inning === 8) {
				probSwitch *= 2;
			} else if (pitcherFatigueFactor > 0.85 && this.inning <= 5) {
				probSwitch = 0;
			}

			if (!starterIsIn && this.inning > 6) {
				probSwitch += 0.3;

				if (this.inning > 7) {
					probSwitch += 0.4;
				}
			}

			if (starterIsIn && this.inning > this.numInnings) {
				probSwitch *= 3;
			}
		}

		if (this.inning > 3) {
			const runsPerOut =
				pitcher.seasonStats.outs > 0
					? pitcher.seasonStats.er / pitcher.seasonStats.outs
					: 4 / 27;
			const excessRuns = pitcher.stat.rPit - pitcher.stat.outs * runsPerOut;
			if (excessRuns > (starterIsIn ? 3 : 1)) {
				probSwitch += (starterIsIn ? 0.1 : 0.2) * excessRuns;
			}
		}

		if (this.allStarGame && pitcher.stat.outs >= 6) {
			probSwitch = 1;
		}

		let sub = false;
		if (probSwitch > 0.8 || (probSwitch > 0.2 && probSwitch > Math.random())) {
			sub = true;
		}

		// Extra hack for bullpen games
		if (
			starterIsIn &&
			betweenInnings &&
			pitcher.compositeRating.workhorsePitcher < 0.25
		) {
			const probSwitchBullpenGame =
				0.95 * (0.25 - pitcher.compositeRating.workhorsePitcher) * 4;
			if (Math.random() < probSwitchBullpenGame) {
				sub = true;
			}
		}

		if (sub) {
			this.substitution(this.d, t.playersInGame[pitcher.id], candidate.p);

			this.playByPlay.logEvent({
				type: "reliefPitcher",
				t: this.d,
				pidOn: candidate.p.id,
				pidOff: pitcher.id,
			});
		}
	}

	// This is called at end of plate appearance. Should check for batter and all fielders
	checkInjuries() {
		if ((g as any).disableInjuries || this.baseInjuryRate === 0) {
			return;
		}

		const fielders = Object.entries(
			this.team[this.d].playersInGameByPos,
		).filter(([pos]) => pos !== "DH");

		const injuryCandidates = [
			{
				t: this.o,
				p: this.team[this.o].getBatter(),
				weight: 5,
			},
			...fielders.map(([pos, p]) => ({
				t: this.d,
				p,
				weight: pos === "P" ? 5 : 1,
			})),
		];

		for (const info of injuryCandidates) {
			const p = info.p.p;

			const injuryRate =
				getInjuryRate(this.baseInjuryRate, p.age, p.injury.playingThrough) *
				info.weight;

			if (Math.random() < injuryRate) {
				p.injured = true;
				p.newInjury = true;

				let replacementPlayer: PlayerGameSim | undefined;
				if (info.p.pos === "P") {
					replacementPlayer = this.team[info.t].getBestReliefPitcher(false)?.p;
				} else {
					replacementPlayer = this.team[info.t].getInjuryReplacement(
						info.p.pos,
					);
				}

				this.playByPlay.logEvent({
					type: "injury",
					t: info.t,
					pid: p.id,
					replacementPid: replacementPlayer?.id,
				});

				if (!replacementPlayer) {
					return;
				}

				this.substitution(info.t, info.p, replacementPlayer);
			}
		}
	}

	gameIsOverDuringInning() {
		if (
			this.o === 0 &&
			this.inning >= this.numInnings &&
			this.team[0].t.stat.pts > this.team[1].t.stat.pts
		) {
			// Game over, home team is at bat and up after 9+ innings
			return true;
		}
	}

	simGame() {
		this.playByPlay.logEvent({
			type: "sideStart",
			inning: this.inning,
			t: this.o,
			pitcherPid: this.team[this.d].playersInGameByPos.P.p.id,
		});

		while (true) {
			this.simPlateAppearance();

			if (this.gameIsOverDuringInning()) {
				break;
			}

			if (this.outs >= NUM_OUTS_PER_INNING) {
				this.playByPlay.logEvent({
					type: "sideOver",
					inning: this.inning,
				});
				if (this.o === 1) {
					if (
						this.inning >= this.numInnings &&
						this.team[0].t.stat.pts > this.team[1].t.stat.pts
					) {
						// No need to play bottom of inning, home team is already up
						break;
					}
				} else {
					if (
						this.inning >= this.numInnings &&
						this.team[0].t.stat.pts !== this.team[1].t.stat.pts
					) {
						// Game over, all innings used up
						break;
					}
				}

				if (this.o === 0) {
					this.inning += 1;
					if (this.inning > this.numInnings) {
						this.overtime = true;
						this.overtimes += 1;
					}
				}

				this.possessionChange();
				this.resetNewInning();
				this.checkReliefPitcher(true);
				this.playByPlay.logEvent({
					type: "sideStart",
					inning: this.inning,
					t: this.o,
					pitcherPid: this.team[this.d].playersInGameByPos.P.p.id,
				});
			} else {
				this.checkReliefPitcher(false);
			}
		}
	}

	// Pass undefined as p for some team-only stats
	recordStat(
		t: TeamNum,
		p: PlayerGameSim | undefined,
		s: string,
		amt: number = 1,
		type?: "fielding",
	) {
		const qtr = this.team[t].t.stat.ptsQtrs.length - 1;

		if (p !== undefined) {
			if (type === "fielding") {
				const pos = this.team[t].playersInGame[p.id].pos;
				const posIndex = POS_NUMBERS[pos] - 1;

				if (p.stat[s][posIndex] === undefined) {
					p.stat[s][posIndex] = 0;
				}
				p.stat[s][posIndex] += amt;
			} else {
				p.stat[s] += amt;
			}
		}

		// Filter out stats that don't get saved to box score
		if (s !== "courtTime" && s !== "benchTime" && s !== "energy") {
			// Filter out stats that are only for player, not team
			if (s !== "gsF" && s !== "gpF" && s !== "poSo" && s !== "cgF") {
				if (s === "r") {
					this.team[t].t.stat.pts += amt;
					this.team[t].t.stat.ptsQtrs[qtr] += amt;
					this.playByPlay.logStat(t, undefined, "pts", amt);
				} else if (s === "er") {
					if (this.outsIfNoErrors >= NUM_OUTS_PER_INNING) {
						// It's an ER for this reliever, but not for the team
						this.team[t].t.stat.rPit += amt;
					} else {
						this.team[t].t.stat.er += amt;
					}
				} else if (type === "fielding") {
					const pos = this.team[t].playersInGame[p!.id].pos;
					const posIndex = POS_NUMBERS[pos] - 1;

					if (this.team[t].t.stat[s][posIndex] === undefined) {
						this.team[t].t.stat[s][posIndex] = 0;
					}
					this.team[t].t.stat[s][posIndex] += amt;
				} else {
					this.team[t].t.stat[s] += amt;
				}
			}

			if (p !== undefined) {
				this.playByPlay.logStat(t, p.id, s, amt);
			}
		}
	}
}

export default GameSim;
