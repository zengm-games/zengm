import { PHASE } from "../../../common";
import { defaultGameAttributes, g, helpers, random } from "../../util";
import {
	POSITIONS,
	POS_NUMBERS,
	POS_NUMBERS_INVERSE,
} from "../../../common/constants.baseball";
import PlayByPlayLogger from "./PlayByPlayLogger";
import type { Position } from "../../../common/types.hockey";
import type {
	CompositeRating,
	PlayerGameSim,
	Runner,
	TeamGameSim,
	TeamNum,
} from "./types";
import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import getInjuryRate from "../GameSim.basketball/getInjuryRate";
import Team from "./Team";

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

	team: [Team<boolean>, Team<boolean>];

	numInnings: number;

	inning: number;

	overtime: boolean;

	overtimes: number;

	bases!: [
		PlayerGameSim | undefined,
		PlayerGameSim | undefined,
		PlayerGameSim | undefined,
	];

	outs!: number;

	balls!: number;

	strikes!: number;

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	constructor({
		gid,
		day,
		teams,
		doPlayByPlay = false,
		homeCourtFactor = 1,
	}: {
		gid: number;
		day?: number;
		teams: [TeamGameSim, TeamGameSim];
		doPlayByPlay?: boolean;
		homeCourtFactor?: number;
	}) {
		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);
		this.id = gid;
		this.day = day;

		const dhSetting = g.get("dh");
		const cidHome = teams[0].cid;
		const dh =
			dhSetting === "all" ||
			(Array.isArray(dhSetting) && dhSetting.includes(cidHome));

		// If a team plays twice in a day, this needs to be a deep copy
		this.team = [new Team(teams[0], dh), new Team(teams[1], dh)];

		this.homeCourtAdvantage(homeCourtFactor);

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
				this.recordStat(i, p.p, "gp");
				this.recordStat(i, p.p, "gs");
			}

			const startingPitcher = t.playersInGameByPos.P.p;
			this.recordStat(i, startingPitcher, "gpPit");
			this.recordStat(i, startingPitcher, "gsPit");
		}
	}

	getHitTo(
		info: {
			direction: "farLeft" | "left" | "middle" | "right" | "farRight";
		} & (
			| {
					type: "fly";
					distance: "infield" | "shallow" | "normal" | "deep";
			  }
			| {
					type: "ground" | "line";
					speed: "soft" | "normal" | "hard";
			  }
		),
	): keyof typeof POS_NUMBERS_INVERSE {
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

	doBattedBall(p: PlayerGameSim) {
		const foul = Math.random() < 0.25;

		const type = random.choice(["ground", "line", "fly"] as const);
		const direction = foul
			? random.choice(["farLeftFoul", "farRightFoul", "outOfPlay"] as const)
			: random.choice([
					"farLeft",
					"left",
					"middle",
					"right",
					"farRight",
			  ] as const);
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
			} else {
				distance = random.choice([
					"infield",
					"shallow",
					"normal",
					"deep",
				] as const);
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

	advanceRunners({
		battedBallInfo,
		error,
		fieldersChoiceOrDoublePlayIndex,
		hit,
		hitTo,
		numBases,
		p,
		result,
	}: {
		battedBallInfo: ReturnType<GameSim["doBattedBall"]>;
		error: boolean;
		fieldersChoiceOrDoublePlayIndex: undefined | 0 | 1 | 2;
		hit: boolean;
		hitTo: ReturnType<GameSim["getHitTo"]>;
		numBases: 1 | 2 | 3 | 4;
		p: PlayerGameSim;
		result: "hit" | "flyOut" | "throwOut" | "fieldersChoice" | "doublePlay";
	}) {
		const runners = this.getRunners();

		// Handle runners
		// Start from 3rd base first, because a blocked base can't be advanced to
		const blockedBases = new Set<0 | 1 | 2>();
		for (let i = 2 as 0 | 1 | 2; i >= 0; i--) {
			const runner = runners[i];
			if (!runner) {
				continue;
			}

			if (hit || error) {
				// Handle runners advancing on a hit/error

				const mustAdvanceWithHitter =
					i === 0 ||
					(i === 1 && runners[0]) ||
					(i === 2 && runners[0] && runners[1]);

				if (i === 2) {
					// Third base
					if (numBases >= 2) {
						// Double or more is a score
						runner.to = 4;
					} else {
						// Single, score on anything except some infield hits
						if (
							!mustAdvanceWithHitter &&
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
							if (Math.random() < 0.5 && !mustAdvanceWithHitter) {
								runner.to = 2;
							} else {
								runner.to = 3;
							}
						} else {
							// Outfield single, go to 3rd or 4th
							if (Math.random() < 0.2) {
								runner.to = 3;
							} else {
								runner.to = 4;
							}
						}
					}
				} else {
					// First base

					// Advance by numBases is mandatory, to stay ahead of hitter
					runner.to = Math.min(4, runner.from + numBases);

					// Fast runner might get one more base
					if (
						runner.to < 4 &&
						Math.random() < 0.1 &&
						!blockedBases.has(runner.to as any)
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
					continue;
				}

				if (blockedBases.has(i)) {
					continue;
				}

				let advance = false;

				if (i === 2) {
					// Third base

					if (battedBallInfo.type === "fly") {
						// Tag up
						if (battedBallInfo.distance === "shallow" && Math.random() < 0.25) {
							advance = true;
						} else if (
							battedBallInfo.distance === "normal" &&
							Math.random() < 0.75
						) {
							advance = true;
						} else if (battedBallInfo.distance === "deep") {
							advance = true;
						}
					} else if (battedBallInfo.type === "line") {
						// Tag up
						if (hitTo >= 7 && Math.random() < 0.5) {
							advance = true;
						}
					} else {
						// Maybe score on ground ball
						if (Math.random() < 0.5) {
							advance = true;
						}
					}
				} else if (i === 1) {
					// Second base

					let tendency = 0;
					if (hitTo == 7) {
						tendency = 0.5;
					} else if (hitTo === 8) {
						tendency = 1;
					} else if (hitTo === 9) {
						tendency = 1.5;
					}

					if (battedBallInfo.type === "fly") {
						if (
							battedBallInfo.distance === "normal" &&
							Math.random() < 0.25 * tendency
						) {
							advance = true;
						} else if (
							battedBallInfo.distance === "deep" &&
							Math.random() < 0.5 * tendency
						) {
							advance = true;
						}
					} else if (battedBallInfo.type === "line") {
						if (Math.random() < 0.25 * tendency) {
							advance = true;
						}
					} else {
						if (hitTo == 3) {
							tendency = 1.5;
						} else if (hitTo === 4) {
							tendency = 1;
						} else if (hitTo === 5) {
							tendency = 0.5;
						} else if (hitTo === 6) {
							tendency = 0.5;
						}

						// Maybe advance on ground ball
						if (Math.random() < 0.4 * tendency) {
							advance = true;
						}
					}
				} else {
					// First base

					// Tag up on very deep fly ball
					if (
						battedBallInfo.type === "fly" &&
						battedBallInfo.distance === "deep" &&
						Math.random() < 0.05
					) {
						advance = true;
					}
				}
				if (advance) {
					runner.to += 1;
				}
			}

			if (runner.to === 4) {
				const pRBI = error ? undefined : p;

				this.doScore(this.bases[i]!, pRBI);
			}

			if (!runner.out && runner.to < 4) {
				blockedBases.add((runner.to - 1) as any);
			}
		}

		this.bases = [undefined, undefined, undefined];
		for (const runner of runners) {
			if (runner && runner.to < 4) {
				this.bases[(runner.to - 1) as any] =
					this.team[this.o].playersInGame[runner.pid].p;
			}
		}

		return runners;
	}

	doBalk() {
		const runners = this.getRunners();

		if (this.bases[2]) {
			this.doScore(this.bases[2]);
			runners[2]!.to += 1;
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

		const p = this.team[this.d].getPitcher().p;

		this.recordStat(this.o, p, "bk");
		this.playByPlay.logEvent({
			type: "balk",
			t: this.d,
			pid: p.id,
			runners: this.finalizeRunners(runners),
			...this.getSportState(),
		});
	}

	simPitch() {
		let doneBatter;

		if (this.bases.some(p => p) && Math.random() < 0.01) {
			this.doBalk();
			return doneBatter;
		}

		const outcome = random.choice(["ball", "strike", "contact"]);

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
		} else if (outcome === "strike") {
			this.strikes += 1;
			if (this.strikes >= 3) {
				this.doStrikeout();
				doneBatter = true;
			} else {
				this.playByPlay.logEvent({
					type: "strike",
					swinging: Math.random() < 0.5,
					balls: this.balls,
					strikes: this.strikes,
				});
			}
		} else {
			const p = this.team[this.o].getBatter().p;

			const battedBallInfo = this.doBattedBall(p);

			// Result of the hit
			if (
				battedBallInfo.type === "outOfPlay" ||
				battedBallInfo.direction === "farLeftFoul" ||
				battedBallInfo.direction === "farRightFoul"
			) {
				this.doFoul();
			} else {
				// Figure out what defender fields the ball
				const hitTo = this.getHitTo(battedBallInfo as any);

				const hit = Math.random() < 0.3;
				const errorIfNotHit = Math.random() < 0.05;

				let result:
					| "hit"
					| "flyOut"
					| "throwOut"
					| "fieldersChoice"
					| "doublePlay";
				let pidError: number | undefined;
				const posDefense: (keyof typeof POS_NUMBERS_INVERSE)[] = [hitTo];
				let numBasesWeights: [number, number, number, number];
				let fieldersChoiceOrDoublePlayIndex: undefined | 0 | 1 | 2; // Index of bases/runners for the runner who is out due to a fielder's choie or double play
				if (errorIfNotHit || hit) {
					result = "hit";
					if (battedBallInfo.type === "fly") {
						if (battedBallInfo.distance === "infield") {
							numBasesWeights = [1, 0, 0, 0];
						} else if (battedBallInfo.distance === "shallow") {
							numBasesWeights = [1, 0.1, 0.01, 0];
						} else if (battedBallInfo.distance === "normal") {
							numBasesWeights = [0.2, 1, 0.1, 0.1];
						} else {
							numBasesWeights = [0, 0.1, 0.1, 1];
						}
					} else if (battedBallInfo.type === "line") {
						if (battedBallInfo.speed === "soft") {
							numBasesWeights = [1, 0.1, 0, 0];
						} else if (battedBallInfo.speed === "normal") {
							numBasesWeights = [0.2, 1, 0.01, 0];
						} else {
							numBasesWeights = [0.1, 1, 0.1, 0.01];
						}
					} else {
						if (battedBallInfo.speed === "soft") {
							numBasesWeights = [1, 0.01, 0, 0];
						} else if (battedBallInfo.speed === "normal") {
							numBasesWeights = [1, 0.02, 0, 0];
						} else {
							numBasesWeights = [1, 0.03, 0, 0];
						}
					}
				} else {
					numBasesWeights = [1, 0, 0, 0];

					if (battedBallInfo.type === "fly" || battedBallInfo.type === "line") {
						result = "flyOut";
					} else {
						if (this.bases[0]) {
							const r = Math.random();
							let probDoublePlay;

							// Probability of double play depends on who it's hit to
							if (hitTo === 6) {
								probDoublePlay = 0.7;
							} else if (hitTo === 4) {
								probDoublePlay = 0.5;
							} else if (hitTo === 5) {
								probDoublePlay = 0.3;
							} else {
								probDoublePlay = 0.2;
							}

							// ...and other runners
							if (this.bases[1] && this.bases[2]) {
								probDoublePlay /= 3;
							} else if (this.bases[1]) {
								probDoublePlay /= 2;
							}

							if (r < probDoublePlay) {
								result = "doublePlay";
							} else if (r < probDoublePlay + (1 - probDoublePlay) / 2) {
								result = "fieldersChoice";
							} else {
								result = "throwOut";
							}

							fieldersChoiceOrDoublePlayIndex = 0;
						} else {
							result = "throwOut";
						}
					}

					if (errorIfNotHit) {
						const errorPosition = random.choice(posDefense);
						const pos = POS_NUMBERS_INVERSE[errorPosition];
						pidError = this.team[this.d].playersInGameByPos[pos].p.id;
					}
				}

				const numBases = random.choice([1, 2, 3, 4] as const, numBasesWeights);

				if (hit) {
					const pitcher = this.team[this.d].getPitcher().p;

					this.recordStat(this.o, p, "ab");
					this.recordStat(this.o, p, "h");
					this.recordStat(this.d, pitcher, "hPit");
					if (numBases > 1) {
						const hitType =
							numBases === 2 ? "2b" : numBases === 3 ? "3b" : "hr";
						this.recordStat(this.o, p, hitType);

						this.recordStat(this.d, pitcher, `${hitType}Pit`);
					}
				}

				const runners = this.advanceRunners({
					battedBallInfo,
					error: pidError !== undefined,
					fieldersChoiceOrDoublePlayIndex,
					hit,
					hitTo,
					numBases,
					p,
					result,
				});

				if (numBases === 4) {
					this.doScore(p, pidError === undefined ? p : undefined);
				}

				if (pidError !== undefined) {
					this.playByPlay.logEvent({
						type: "hitResult",
						result: "error",
						t: this.o,
						pid: p.id,
						pidError,
						posDefense,
						runners: this.finalizeRunners(runners),
						numBases,
						outAtNextBase: false,
						...this.getSportState(),
					});

					if (numBases < 4) {
						this.bases[numBases - 1] = p;
					}
				} else {
					if (result === "flyOut" || result === "throwOut") {
						this.logOut();
					} else if (result === "doublePlay") {
						this.logOut();
					} else {
						if (result === "fieldersChoice") {
							this.logOut();
						}

						if (numBases < 4) {
							this.bases[numBases - 1] = p;
						}
					}

					this.playByPlay.logEvent({
						type: "hitResult",
						result,
						t: this.o,
						pid: p.id,
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

	doScore(run: PlayerGameSim, rbi?: PlayerGameSim) {
		const pitcher = this.team[this.d].getPitcher().p;
		this.recordStat(this.d, pitcher, "rPit");
		this.recordStat(this.d, pitcher, "er");

		this.recordStat(this.o, run, "r");
		if (rbi) {
			this.recordStat(this.o, rbi, "rbi");
		}
	}

	getRunners() {
		return this.bases.map((p, i) => {
			if (p) {
				return {
					pid: p.id,
					from: i + 1,
					to: i + 1,
					out: false,
				};
			}
		});
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

	doWalk(type: "intentional" | "normal") {
		const t = this.team[this.o];
		const p = t.getBatter().p;
		const runners = this.getRunners();

		if (this.bases[0]) {
			if (this.bases[1]) {
				if (this.bases[2]) {
					this.doScore(this.bases[2], p);
					runners[2]!.to += 1;
				}

				this.bases[2] = this.bases[1];
				runners[1]!.to += 1;
			}

			this.bases[1] = this.bases[0];
			runners[0]!.to += 1;
		}

		this.bases[0] = p;

		const pitcher = this.team[this.d].getPitcher().p;

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
		}
	}

	logOut() {
		this.outs += 1;
		const pitcher = this.team[this.d].getPitcher().p;
		this.recordStat(this.d, pitcher, "ip");
	}

	getSportState() {
		return {
			outs: this.outs,
			bases: this.bases.map(p => p?.id) as [
				number | undefined,
				number | undefined,
				number | undefined,
			],
		};
	}

	doStrikeout() {
		const t = this.team[this.o];
		const batter = t.getBatter().p;
		const pitcher = this.team[this.d].getPitcher().p;

		this.recordStat(this.o, batter, "ab");
		this.recordStat(this.o, batter, "so");
		this.recordStat(this.d, pitcher, "soPit");
		this.logOut();
		this.playByPlay.logEvent({
			type: "strikeOut",
			swinging: Math.random() < 0.5,
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

		// Delete stuff that isn't needed before returning
		for (let t = 0; t < 2; t++) {
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
				delete this.team[t].t.player[p].numConsecutiveGamesG;
			}

			this.team[t] = this.team[t].t as any;
		}

		const out = {
			gid: this.id,
			day: this.day,
			overtimes: this.overtimes,
			team: this.team,
			clutchPlays: [],
			playByPlay: this.playByPlay.getPlayByPlay(this.team),
			scoringSummary: this.playByPlay.scoringSummary,
		};
		return out;
	}

	/**
	 * Two scenarios for intentional walk:
	 *
	 * 1. Runner on 2nd, we want the option of a double play, and the next hitter is worse than the current one.
	 * 2. Scary hitter up, we'd just like to avoid him.
	 */
	shouldIntentionalWalk() {
		return Math.random() < 0.01;
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
		this.recordStat(this.o, p, "pa");

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
	}

	simGame() {
		this.playByPlay.logEvent({
			type: "sideStart",
			inning: this.inning,
			t: this.o,
		});

		while (true) {
			this.simPlateAppearance();

			if (
				this.o === 0 &&
				this.inning >= this.numInnings &&
				this.team[0].t.stat.pts > this.team[1].t.stat.pts
			) {
				// Game over, home team is at bat and up after 9+ innings
				break;
			}

			if (this.outs >= 3) {
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
				this.playByPlay.logEvent({
					type: "sideStart",
					inning: this.inning,
					t: this.o,
				});
			}
		}
	}

	// Pass undefined as p for some team-only stats
	recordStat(
		t: TeamNum,
		p: PlayerGameSim | undefined,
		s: string,
		amt: number = 1,
	) {
		const qtr = this.team[t].t.stat.ptsQtrs.length - 1;

		if (p !== undefined) {
			if (s === "ip") {
				// Handle fractional innings
				const prevIP = p.stat.ip;

				// Careful about floating point error
				const remainderDigit = Math.round(10 * prevIP) % 10;
				if (remainderDigit < 2) {
					amt = 0.1;
				} else {
					// Go from 0.2 to 1
					amt = 0.8;
				}
			}

			p.stat[s] += amt;
		}

		// Filter out stats that don't get saved to box score
		if (
			s !== "gs" &&
			s !== "courtTime" &&
			s !== "benchTime" &&
			s !== "energy"
		) {
			// Filter out stats that are only for player, not team
			if (
				s !== "ppMin" &&
				s !== "shMin" &&
				s !== "gpSkater" &&
				s !== "gpGoalie" &&
				s !== "ga"
			) {
				if (s === "r") {
					this.team[t].t.stat.pts += amt;
					this.team[t].t.stat.ptsQtrs[qtr] += amt;
					this.playByPlay.logStat(t, undefined, "pts", amt);
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
