import { PHASE } from "../../../common";
import { defaultGameAttributes, g, helpers, random } from "../../util";
import { POSITIONS } from "../../../common/constants.baseball";
import PlayByPlayLogger from "./PlayByPlayLogger";
import getPlayers from "./getPlayers";
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
import getCompositeFactor from "./getCompositeFactor";
import getInjuryRate from "../GameSim.basketball/getInjuryRate";
import Team from "./Team";

const teamNums: [TeamNum, TeamNum] = [0, 1];

const POS_NUMBERS = {
	P: 1,
	C: 2,
	"1B": 3,
	"2B": 4,
	"3B": 5,
	SS: 6,
	LF: 7,
	CF: 8,
	RF: 9,
} as const;

const POS_NUMBERS_INVERSE = {
	1: "P",
	2: "C",
	3: "1B",
	4: "2B",
	5: "3B",
	6: "SS",
	7: "LF",
	8: "CF",
	9: "RF",
} as const;

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
	}

	resetNewInning() {
		this.bases = [undefined, undefined, undefined];
		this.outs = 0;
		this.resetNewBatter();
	}

	resetNewBatter() {
		this.balls = 0;
		this.strikes = 0;
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

	simPitch() {
		let doneBatter;
		const outcome = random.choice(["ball", "strike", "contact"]);

		if (outcome === "ball") {
			this.balls += 1;
			if (this.balls >= 4) {
				this.doWalk();
				doneBatter = true;
			} else {
				this.playByPlay.logEvent({
					type: "ball",
					intentional: false,
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
				});
			}
		} else {
			const p = this.team[this.o].getBatter().p;

			const foul = Math.random() < 0.25;

			const type = random.choice(["ground", "line", "fly"] as const);
			const direction = foul
				? random.choice(["farLeft", "farRight", "outOfPlay"] as const)
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
				this.playByPlay.logEvent({
					type: "foul",
				});
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
				} else if (type === "line") {
					speed = random.choice(["soft", "normal", "hard"] as const);
					this.playByPlay.logEvent({
						type,
						t: this.o,
						pid: p.id,
						direction,
						speed,
					});
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
				}

				// Result of the hit
				if (foul) {
					this.playByPlay.logEvent({
						type: "foul",
					});
				} else {
					const hitTo = this.getHitTo({
						type,
						distance,
						direction,
						speed: speed,
					} as any);

					const runners = this.getRunners();

					const hit = Math.random() < 0.3;
					let result: "hit" | "flyOut" | "throwOut" | "fieldersChoice";
					let pidError: number | undefined;
					const posDefense: (keyof typeof POS_NUMBERS_INVERSE)[] = [hitTo];
					let numBasesWeights: [number, number, number, number];
					if (hit) {
						result = "hit";
						if (type === "fly") {
							if (distance === "infield") {
								numBasesWeights = [1, 0, 0, 0];
							} else if (distance === "shallow") {
								numBasesWeights = [1, 0.1, 0.01, 0];
							} else if (distance === "normal") {
								numBasesWeights = [0.2, 1, 0.1, 0.1];
							} else {
								numBasesWeights = [0, 0.1, 0.1, 1];
							}
						} else if (type === "line") {
							if (speed === "soft") {
								numBasesWeights = [1, 0.1, 0, 0];
							} else if (speed === "normal") {
								numBasesWeights = [0.2, 1, 0.01, 0];
							} else {
								numBasesWeights = [0.1, 1, 0.1, 0.01];
							}
						} else {
							if (speed === "soft") {
								numBasesWeights = [1, 0.01, 0, 0];
							} else if (speed === "normal") {
								numBasesWeights = [1, 0.02, 0, 0];
							} else {
								numBasesWeights = [1, 0.03, 0, 0];
							}
						}
					} else {
						numBasesWeights = [1, 0, 0, 0];

						if (type === "fly" || type === "line") {
							result = "flyOut";
						} else {
							result = "fieldersChoice";
							result = "throwOut";
						}

						if (Math.random() < 0.05) {
							const errorPosition = random.choice(posDefense);
							const pos = POS_NUMBERS_INVERSE[errorPosition];
							pidError = this.team[this.d].playersInGameByPos[pos].p.id;
						}
					}

					const numBases = random.choice(
						[1, 2, 3, 4] as const,
						numBasesWeights,
					);

					for (const runner of runners) {
						throw new Error("Not implemented");
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
						});
					} else {
						this.playByPlay.logEvent({
							type: "hitResult",
							result,
							t: this.o,
							pid: p.id,
							posDefense,
							runners: this.finalizeRunners(runners),
							numBases,
							outAtNextBase: false,
						});

						if (result === "flyOut" || result === "throwOut") {
							this.outs += 1;
						}
					}

					doneBatter = true;
				}
			}
		}

		return doneBatter;
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
			if (runner && runner.from !== runner.to) {
				finalized.push(runner as Runner);
			}
		}

		return finalized;
	}

	doWalk() {
		const runners = this.getRunners();

		if (this.bases[0]) {
			if (this.bases[1]) {
				if (this.bases[2]) {
					this.doScore(this.bases[2]);
					runners[2]!.to += 1;
				}

				this.bases[2] = this.bases[1];
				runners[1]!.to += 1;
			}

			this.bases[1] = this.bases[0];
			runners[0]!.to += 1;
		}

		const t = this.team[this.o];

		const batter = t.getBatter();
		this.bases[0] = batter.p;

		this.playByPlay.logEvent({
			type: "walk",
			t: this.o,
			pid: batter.p.id,
			runners: this.finalizeRunners(runners),
		});

		t.advanceToNextBatter();
		this.resetNewBatter();
	}

	doStrikeout() {
		this.playByPlay.logEvent({
			type: "strikeOut",
			swinging: Math.random() < 0.5,
		});

		this.outs += 1;

		const t = this.team[this.o];
		t.advanceToNextBatter();
		this.resetNewBatter();
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
		this.simGame();
		this.playByPlay.logEvent({
			type: "gameOver",
		});

		// Delete stuff that isn't needed before returning
		for (let t = 0; t < 2; t++) {
			delete this.team[t].t.compositeRating;
			// @ts-expect-error
			delete this.team[t].pace;

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

	simPlateAppearance() {
		const t = this.team[this.o];
		t.advanceToNextBatter();
		this.playByPlay.logEvent({
			type: "plateAppearance",
			t: this.o,
			pid: t.getBatter().p.id,
		});

		while (true) {
			const doneBatter = this.simPitch();
			if (doneBatter) {
				break;
			}
		}
	}

	simGame() {
		while (true) {
			this.simPlateAppearance();
			if (this.outs >= 3) {
				if (this.o === 1) {
					this.playByPlay.logEvent({
						type: "sideOver",
						inning: this.inning,
					});

					if (
						this.inning >= this.numInnings &&
						this.team[0].t.stat.pts > this.team[1].t.stat.pts
					) {
						// No need to play bottom of inning, home team is already up
						break;
					}
				} else {
					this.playByPlay.logEvent({
						type: "inningOver",
						inning: this.inning,
					});

					if (
						this.inning >= this.numInnings &&
						this.team[0].t.stat.pts !== this.team[1].t.stat.pts
					) {
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
			}
		}
	}

	isHit() {
		return (
			Math.random() <
			0.3 *
				(this.team[this.o].compositeRating.hitting +
					this.team[this.d].compositeRating.hitting)
		);
	}

	doHit() {
		const t = random.choice(
			teamNums,
			t => this.team[t].compositeRating.hitting,
		);
		const t2 = t === 0 ? 1 : 0;
		const hitter = this.pickPlayer(t, "enforcer", ["C", "W", "D"]);
		const target = this.pickPlayer(t2, undefined, ["C", "W", "D"]);

		this.recordStat(t2, target, "energy", -0.5);

		this.recordStat(t, hitter, "hit", 1);
		this.playByPlay.logEvent({
			type: "hit",
			clock: this.clock,
			t,
			names: [hitter.name, target.name],
		});

		this.injuries({
			type: "hit",
			hitter,
			target,
			t: t2,
		});
	}

	isGiveaway() {
		const { powerPlayTeam } = this.penaltyBox.getPowerPlayTeam();

		let baseOdds = 0.1;
		if (powerPlayTeam === this.o) {
			baseOdds /= 2;
		} else if (powerPlayTeam === this.d) {
			baseOdds *= 2;
		}
		return (
			Math.random() <
			(baseOdds * this.team[this.d].compositeRating.takeaway) /
				this.team[this.o].compositeRating.puckControl
		);
	}

	isTakeaway() {
		const { powerPlayTeam } = this.penaltyBox.getPowerPlayTeam();

		let baseOdds = 0.1;
		if (powerPlayTeam === this.o) {
			baseOdds /= 2;
		} else if (powerPlayTeam === this.d) {
			baseOdds *= 2;
		}
		return (
			Math.random() <
			(baseOdds * this.team[this.d].compositeRating.takeaway) /
				this.team[this.o].compositeRating.puckControl
		);
	}

	isNothing() {
		return Math.random() < 0.1;
	}

	doGiveaway() {
		const p = this.pickPlayer(this.o, undefined, ["C", "W", "D"]);

		this.recordStat(this.o, p, "gv", 1);
		this.playByPlay.logEvent({
			type: "gv",
			clock: this.clock,
			t: this.o,
			names: [p.name],
		});
		this.possessionChange();
	}

	doTakeaway() {
		const p = this.pickPlayer(this.d, "grinder", ["C", "W", "D"]);

		this.recordStat(this.d, p, "tk", 1);
		this.playByPlay.logEvent({
			type: "tk",
			clock: this.clock,
			t: this.d,
			names: [p.name],
		});
		this.possessionChange();
	}

	advanceClock(special?: "rebound") {
		// 1 to N seconds, or less if it's a rebound
		const maxLength = special === "rebound" ? 0.05 : 0.28;

		let dt = Math.random() * (maxLength - 0.017) + 0.017;
		if (this.clock - dt < 0) {
			dt = this.clock;
		}

		// If advancing dt will pass by someone being released from the penalty box, break it into multiple steps so updatePlayingTime can be correct about ppMin and shMin
		const dts = this.penaltyBox.splitUpAdvanceClock(dt);
		for (const partial of dts) {
			this.updatePlayingTime(partial);
			this.clock -= partial;
			this.penaltyBox.advanceClock(partial);
		}

		this.minutesSinceLineChange[0].F += dt;
		this.minutesSinceLineChange[0].D += dt;
		this.minutesSinceLineChange[1].F += dt;
		this.minutesSinceLineChange[1].D += dt;

		if (this.clock <= 0) {
			this.clock = 0;
			return true;
		}

		return false;
	}

	doShot(special?: "rebound") {
		const shooter = this.pickPlayer(this.o, "scoring", ["C", "W", "D"], 3);

		const type: "slapshot" | "wristshot" | "shot" | "reboundShot" =
			special === "rebound"
				? "reboundShot"
				: random.choice(["slapshot", "wristshot", "shot"], [0.25, 0.5, 0.25]);

		this.recordStat(this.o, shooter, "tsa");
		this.playByPlay.logEvent({
			type: type,
			clock: this.clock,
			t: this.o,
			names: [shooter.name],
		});

		const { powerPlayTeam, strengthDifference } =
			this.penaltyBox.getPowerPlayTeam();
		let strengthType: "ev" | "sh" | "pp" = "ev";
		let totalStrengthDifference = 0;
		if (powerPlayTeam === this.d) {
			strengthType = "sh";
			totalStrengthDifference -= strengthDifference;
		} else if (powerPlayTeam === this.o) {
			strengthType = "pp";
			totalStrengthDifference += strengthDifference;
		}

		if (this.pulledGoalie[this.o]) {
			totalStrengthDifference += 1;
		}
		if (this.pulledGoalie[this.d]) {
			totalStrengthDifference -= 1;
		}

		let r = Math.random();

		// Tone down pulled goalie situations
		const pulledGoalieFactor = this.pulledGoalie[this.d] ? 0.5 : 1;

		// Power play adjusts odds of a miss
		if (totalStrengthDifference > 1) {
			r += 0.2 * pulledGoalieFactor;
		} else if (totalStrengthDifference === 1) {
			r += 0.1 * pulledGoalieFactor;
		} else if (totalStrengthDifference === -1) {
			r -= 0.025 * pulledGoalieFactor;
		} else if (totalStrengthDifference < -1) {
			r -= 0.5 * pulledGoalieFactor;
		}

		if (r < 0.1 + 0.35 * this.team[this.d].compositeRating.blocking) {
			const blocker = this.pickPlayer(this.d, "blocking", ["C", "W", "D"]);
			this.recordStat(this.d, blocker, "blk", 1);
			this.playByPlay.logEvent({
				type: "block",
				clock: this.clock,
				t: this.d,
				names: [blocker.name],
			});

			if (type === "slapshot" || type === "wristshot") {
				this.injuries({
					type: "block",
					shooter,
					target: blocker,
					t: this.d,
				});
			}

			return "block";
		}

		let deflector;
		if ((type === "slapshot" || type === "wristshot") && Math.random() < 0.05) {
			deflector = this.pickPlayer(this.o, "playmaker", ["C", "W"], 1, [
				shooter,
			]);
			if (deflector) {
				this.playByPlay.logEvent({
					type: "deflection",
					clock: this.clock,
					t: this.o,
					names: [deflector.name],
				});
			}
		}

		// Can tune the exponent to adjust the cross-team variance of shooting percentage, and the constant to set the baseline shooting percentage
		if (
			r <
			0.75 - shooter.compositeRating.scoring * fatigue(shooter.stat.energy)
		) {
			this.playByPlay.logEvent({
				type: "miss",
				clock: this.clock,
				t: this.o,
				names: [shooter.name],
			});
			return "miss";
		}

		const actualShooter = deflector ?? shooter;

		this.recordStat(this.o, actualShooter, "s");

		let assister1: PlayerGameSim | undefined;
		let assister2: PlayerGameSim | undefined;

		// 25% chance of no assist on shorthanded goal
		if (strengthType !== "sh" || Math.random() > 0.25 || deflector) {
			const r2 = Math.random();
			if (deflector) {
				assister1 = shooter;
			} else if (r2 < 0.99) {
				// 20 power is to ensure top players get a lot
				assister1 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 20, [
					actualShooter,
				]);
			}
			if (r2 < 0.8) {
				// 0.5 power is to ensure that everybody (including defensemen) at least get some
				assister2 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 0.5, [
					actualShooter,
					assister1 as PlayerGameSim,
				]);
			}
		}

		const goalie = this.playersOnIce[this.d].G[0];
		if (goalie) {
			const shotQualityFactors = [
				actualShooter.compositeRating.scoring,
				this.team[this.o].synergy.reb / this.team[this.d].synergy.reb,
			];
			if (assister1) {
				shotQualityFactors.push(assister1.compositeRating.playmaker);
			}
			if (assister2) {
				shotQualityFactors.push(assister2.compositeRating.playmaker);
			}
			let shotQualityFactor = 0;
			for (const factor of shotQualityFactors) {
				shotQualityFactor += factor;
			}
			shotQualityFactor /= shotQualityFactors.length;

			// shotQualityFactor is generally between 0.3 and 0.9, so shotQualityProbComponent is -1 to 1
			const shotQualityProbComponent =
				(helpers.bound(shotQualityFactor, 0.3, 0.9) - 0.3) * (2 / 0.6) - 1;
			const shotQualityProbComponent2 = -0.025 * shotQualityProbComponent; // -0.025 to 0.025

			// Save percentage does not depend on defenders https://www.tsn.ca/defencemen-and-their-impact-on-team-save-percentage-1.567469
			if (
				r <
				0.9 +
					shotQualityProbComponent2 +
					goalie.compositeRating.goalkeeping * 0.07
			) {
				const saveType = Math.random() < 0.5 ? "save-freeze" : "save";

				this.recordStat(this.d, goalie, "sv");
				this.playByPlay.logEvent({
					type: saveType,
					clock: this.clock,
					t: this.d,
					names: [goalie.name],
				});

				return saveType;
			}
		} else {
			// Extra 50% chance of miss, for empty net
			if (Math.random() < 0.5) {
				this.playByPlay.logEvent({
					type: "miss",
					clock: this.clock,
					t: this.o,
					names: [shooter.name],
				});
				return "miss";
			}
		}

		let assisterNames: [] | [string] | [string, string];
		let assisterPIDs: [] | [number] | [number, number];
		if (assister1 && assister2) {
			assisterNames = [assister1.name, assister2.name];
			assisterPIDs = [assister1.id, assister2.id];
			this.recordStat(this.o, assister1, `${strengthType}A`);
			this.recordStat(this.o, assister2, `${strengthType}A`);
		} else if (assister1) {
			assisterNames = [assister1.name];
			assisterPIDs = [assister1.id];
			this.recordStat(this.o, assister1, `${strengthType}A`);
		} else {
			assisterNames = [];
			assisterPIDs = [];
		}

		this.recordStat(this.o, actualShooter, `${strengthType}G`);
		if (goalie) {
			this.recordStat(this.d, goalie, "ga");
		}
		this.playByPlay.logEvent({
			type: "goal",
			clock: this.clock,
			t: this.o,
			names: [actualShooter.name, ...assisterNames],
			pids: [actualShooter.id, ...assisterPIDs],
			shotType: deflector ? "deflection" : type,
			goalType: this.pulledGoalie[this.d] ? "en" : strengthType,
		});

		this.penaltyBox.goal(this.o);

		return "goal";
	}

	faceoff() {
		this.updatePlayersOnIce({ type: "normal" });

		const p0 = this.getTopPlayerOnIce(0, "faceoffs", ["C", "W", "D"]);
		const p1 = this.getTopPlayerOnIce(1, "faceoffs", ["C", "W", "D"]);

		const winner = random.choice(
			[p0, p1],
			p => p.compositeRating.faceoffs ** 0.5,
		);

		let names: [string, string];
		if (winner === p0) {
			this.o = 0;
			this.d = 1;
			this.recordStat(0, p0, "fow");
			this.recordStat(1, p1, "fol");
			names = [p0.name, p1.name];
		} else {
			this.o = 1;
			this.d = 0;
			this.recordStat(1, p1, "fow");
			this.recordStat(0, p0, "fol");
			names = [p1.name, p0.name];
		}

		this.playByPlay.logEvent({
			type: "faceoff",
			clock: this.clock,
			t: this.o,
			names,
		});

		this.advanceClock();
	}

	checkPenalty() {
		const r = Math.random();

		const penalty = penalties.find(
			penalty => r < penalty.cumsumProbPerPossession,
		);

		if (!penalty) {
			return false;
		}

		const t = random.choice(
			teamNums,
			t => this.team[t].compositeRating.penalties,
		);

		// Hack - don't want to deal with >2 penalties at the same time
		if (this.penaltyBox.count(t) >= 2) {
			return false;
		}

		const p = this.pickPlayer(t, "penalties", ["C", "W", "D"]);

		const penaltyType = penaltyTypes[penalty.type];

		this.penaltyBox.add(t, p, penalty);

		this.recordStat(t, p, "pim", penaltyType.minutes);
		this.playByPlay.logEvent({
			type: "penalty",
			clock: this.clock,
			t,
			names: [p.name],
			penaltyType: penalty.type,
			penaltyName: penalty.name,
			penaltyPID: p.id,
		});

		// Actually remove player from ice
		this.updatePlayersOnIce({ type: "penalty" });

		return true;
	}

	checkPullGoalie(t0: TeamNum) {
		const t1 = t0 === 0 ? 1 : 0;

		const shouldPullGoalie = () => {
			const period = this.team[0].stat.ptsQtrs.length;

			if (period !== this.numPeriods) {
				return false;
			}

			const scoreDifferential = this.team[t0].stat.pts - this.team[t1].stat.pts;

			if (scoreDifferential >= 0) {
				return false;
			}

			if (scoreDifferential === -1 && this.clock <= 2) {
				return true;
			}

			if (
				(scoreDifferential === -2 || scoreDifferential === -3) &&
				this.clock <= 3
			) {
				return true;
			}

			return false;
		};

		const shouldPull = shouldPullGoalie();

		if (!this.pulledGoalie[t0] && shouldPull) {
			this.updatePlayersOnIce({
				type: "pullGoalie",
				t: t0,
			});
		} else if (this.pulledGoalie[t0] && !shouldPull) {
			this.updatePlayersOnIce({
				type: "noPullGoalie",
				t: t0,
			});
		}
	}

	simPossession(special?: "rebound") {
		if (!special) {
			if (this.isHit()) {
				this.doHit();
				if (this.advanceClock()) {
					return;
				}
			}

			if (this.checkPenalty()) {
				this.faceoff();
				return;
			}

			if (this.advanceClock()) {
				return;
			}

			if (this.isGiveaway()) {
				this.doGiveaway();
				return;
			}

			if (this.isTakeaway()) {
				this.doTakeaway();
				return;
			}

			if (this.isNothing()) {
				return;
			}
		}

		if (this.advanceClock(special)) {
			return;
		}

		const outcome = this.doShot(special);

		if (outcome === "block" || outcome === "miss") {
			const r = Math.random();
			if (r < 0.5) {
				this.possessionChange();
			} else if (r < 0.6 && !this.pulledGoalie[this.d]) {
				this.simPossession("rebound");
			}

			return;
		}

		if (outcome === "save") {
			const r = Math.random();
			if (r < 0.5) {
				this.possessionChange();
			} else if (r < 0.7 && !this.pulledGoalie[this.d]) {
				this.simPossession("rebound");
			}

			return;
		}

		if (outcome === "save-freeze") {
			this.faceoff();
			return;
		}

		if (outcome === "goal") {
			if (this.overtime) {
				// Sudden death overtime
				return;
			}

			this.checkPullGoalie(this.o);
			this.checkPullGoalie(this.d);

			this.faceoff();
			return;
		}
	}

	updateTeamCompositeRatings() {
		for (const t of teamNums) {
			let synergy = 0;
			for (const pos of ["C", "W", "D"] as const) {
				for (const p of this.playersOnIce[t][pos]) {
					synergy += p.ovrs[pos];
				}
			}
			synergy /= 500; // 0 to 1 scale
			this.team[t].synergy.reb = synergy;
		}

		for (const t of teamNums) {
			const t2 = t === 0 ? 1 : 0;
			const synergyRatio = this.team[t].synergy.reb / this.team[t2].synergy.reb;

			this.team[t].compositeRating.hitting = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.enforcer) / 2,
			});

			this.team[t].compositeRating.penalties = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => p.compositeRating.penalties / 2,
			});

			this.team[t].compositeRating.penalties = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => p.compositeRating.enforcer / 2,
			});

			this.team[t].compositeRating.puckControl = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					C: 1,
					W: 0.5,
					D: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => p.compositeRating.playmaker,
			});

			this.team[t].compositeRating.takeaway = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.grinder) / 2,
			});

			this.team[t].compositeRating.blocking = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.blocking) / 2,
			});

			this.team[t].compositeRating.scoring = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					C: 1,
					W: 0.5,
					D: 0.25,
				},
				synergyFactor: this.synergyFactor,
				synergyRatio,
				valFunc: p => p.compositeRating.scoring,
			});
		}
	}

	getPlayerFromNextLine(
		t: TeamNum,
		pos: "F" | "D",
		playersRemainingOn: PlayerGameSim[],
	) {
		let nextLine =
			this.lines[t][pos][(this.currentLine[t][pos] + 1) % NUM_LINES[pos]];
		if (nextLine.length === 0 && this.currentLine[t][pos] !== 0) {
			// This could happen if a line is empty due to a ton of injuries
			nextLine = this.lines[t][pos][0];
		}

		if (nextLine.length === 0) {
			// This could happen if a player gets a penalty while being on the only healthy line remaining due to many injuries
			let emergencyPlayers = [];
			for (const existingLines of Object.values(this.lines[t])) {
				for (const existingLine of existingLines) {
					emergencyPlayers.push(...existingLine);
				}
			}
			emergencyPlayers = emergencyPlayers.filter(
				p => !playersRemainingOn.includes(p),
			);
			if (emergencyPlayers.length === 0) {
				throw new Error("Not enough players");
			}
			return random.choice(emergencyPlayers);
		}

		return random.choice(nextLine);
	}

	doLineChange(
		t: TeamNum,
		pos: "F" | "D",
		playersRemainingOn: PlayerGameSim[],
	) {
		this.minutesSinceLineChange[t][pos] = 0;
		this.currentLine[t][pos] += 1;

		// Sometimes skip the 3rd line of forwards
		if (pos === "F" && this.currentLine[t][pos] === 2 && Math.random() < 0.1) {
			this.currentLine[t][pos] = 0;
		}

		// Sometimes skip the 4th line of forwards
		if (pos === "F" && this.currentLine[t][pos] >= 3 && Math.random() < 0.5) {
			this.currentLine[t][pos] = 0;
		}

		let newLine = this.lines[t][pos][this.currentLine[t][pos]];
		if (!newLine || newLine.length < NUM_PLAYERS_PER_LINE[pos]) {
			this.currentLine[t][pos] = 0;
			newLine = this.lines[t][pos][this.currentLine[t][pos]];
		}

		newLine = [...newLine];
		for (let i = 0; i < newLine.length; i++) {
			const p = newLine[i];
			if (this.penaltyBox.has(t, p) || playersRemainingOn.includes(p)) {
				newLine[i] = this.getPlayerFromNextLine(t, pos, playersRemainingOn);
			}
		}

		if (pos === "F") {
			const penaltyBoxCount = this.penaltyBox.count(t);
			if (
				penaltyBoxCount === 0 ||
				(this.pulledGoalie[t] && penaltyBoxCount === 1)
			) {
				// Normal
				this.playersOnIce[t].C = newLine.slice(0, 1);
				this.playersOnIce[t].W = newLine.slice(1, 3);
			} else if (
				penaltyBoxCount === 1 ||
				(this.pulledGoalie[t] && penaltyBoxCount === 2)
			) {
				// Leave out a forward
				const r = Math.random();
				if (r < 0.33) {
					this.playersOnIce[t].C = newLine.slice(0, 1);
					this.playersOnIce[t].W = newLine.slice(1, 2);
				} else if (r < 0.67) {
					this.playersOnIce[t].C = newLine.slice(0, 1);
					this.playersOnIce[t].W = newLine.slice(2, 3);
				} else {
					this.playersOnIce[t].C = [];
					this.playersOnIce[t].W = newLine.slice(1, 3);
				}
			} else if (penaltyBoxCount === 2) {
				// Leave out two forwards
				const r = Math.random();
				if (r < 0.33) {
					this.playersOnIce[t].C = newLine.slice(0, 1);
					this.playersOnIce[t].W = [];
				} else if (r < 0.67) {
					this.playersOnIce[t].C = [];
					this.playersOnIce[t].W = newLine.slice(1, 2);
				} else {
					this.playersOnIce[t].C = [];
					this.playersOnIce[t].W = newLine.slice(2, 3);
				}
			} else {
				throw new Error("Not implemented");
			}

			if (penaltyBoxCount === 0 && this.pulledGoalie[t]) {
				// Add extra skater
				this.playersOnIce[t].C.push(
					this.getPlayerFromNextLine(t, pos, [
						...this.playersOnIce[t].C,
						...this.playersOnIce[t].W,
						...playersRemainingOn,
					]),
				);
			}
		} else {
			this.playersOnIce[t].D = newLine;
		}
	}

	updatePlayersOnIce(
		options:
			| {
					type: "starters" | "newPeriod" | "normal" | "penalty";
					p?: undefined;
			  }
			| {
					type: "penaltyOver";
					p: PlayerGameSim;
					t: TeamNum;
			  }
			| {
					type: "pullGoalie" | "noPullGoalie";
					t: TeamNum;
			  },
	) {
		let substitutions = false;

		for (const t of teamNums) {
			if (options.type === "starters" || options.type === "newPeriod") {
				this.playersOnIce[t].C = this.lines[t].F[0].slice(0, 1);
				this.playersOnIce[t].W = this.lines[t].F[0].slice(1, 3);
				this.playersOnIce[t].D = this.lines[t].D[0];
				this.playersOnIce[t].G = this.lines[t].G[0];
			} else if (options.type === "penaltyOver") {
				if (options.t !== t) {
					continue;
				}

				if (
					this.playersOnIce[t].C.length < 1 ||
					(this.pulledGoalie[t] && this.playersOnIce[t].C.length < 2)
				) {
					this.playersOnIce[t].C.push(options.p);
				} else if (this.playersOnIce[t].W.length < 2) {
					this.playersOnIce[t].W.push(options.p);
				} else {
					this.playersOnIce[t].D.push(options.p);
				}
				substitutions = true;
			} else if (options.type === "pullGoalie") {
				if (options.t !== t) {
					continue;
				}

				const currentlyOnIce = Object.values(this.playersOnIce[t]).flat();
				const sub = this.getPlayerFromNextLine(t, "F", currentlyOnIce);

				this.playersOnIce[t].G = [];
				this.playersOnIce[t].C.push(sub);

				this.playByPlay.logEvent({
					type: "pullGoalie",
					clock: this.clock,
					t,
					name: sub.name,
				});

				this.pulledGoalie[t] = true;
				substitutions = true;
			} else if (options.type === "noPullGoalie") {
				if (options.t !== t) {
					continue;
				}

				const currentlyOnIce = Object.values(this.playersOnIce[t]).flat();
				const goalie = this.lines[t].G.flat().find(
					p => !currentlyOnIce.includes(p),
				);

				const sub = this.playersOnIce[t].C[1];

				if (!goalie || !sub) {
					return;
				}

				this.playersOnIce[t].G = [goalie];
				this.playersOnIce[t].C = this.playersOnIce[t].C.slice(0, 1);

				this.playByPlay.logEvent({
					type: "noPullGoalie",
					clock: this.clock,
					t,
					name: goalie.name,
				});

				this.pulledGoalie[t] = false;
				substitutions = true;
			} else {
				// Line change based on playing time
				let lineChangeEvent:
					| "offensiveLineChange"
					| "fullLineChange"
					| "defensiveLineChange"
					| undefined;

				if (this.clock >= 1 || options.type === "penalty") {
					if (
						(this.minutesSinceLineChange[t].F >= 0.7 && Math.random() < 0.75) ||
						options.type === "penalty"
					) {
						lineChangeEvent = "offensiveLineChange";
					}
					if (
						(this.minutesSinceLineChange[t].D >= 0.9 && Math.random() < 0.75) ||
						options.type === "penalty"
					) {
						if (lineChangeEvent) {
							lineChangeEvent = "fullLineChange";
						} else {
							lineChangeEvent = "defensiveLineChange";
						}
					}
				}

				if (lineChangeEvent) {
					if (lineChangeEvent === "offensiveLineChange") {
						this.doLineChange(t, "F", [
							...this.playersOnIce[t].D,
							...this.playersOnIce[t].G,
						]);
					} else if (lineChangeEvent === "defensiveLineChange") {
						this.doLineChange(t, "D", [
							...this.playersOnIce[t].C,
							...this.playersOnIce[t].W,
							...this.playersOnIce[t].G,
						]);
					} else {
						this.doLineChange(t, "F", [...this.playersOnIce[t].G]);
						this.doLineChange(t, "D", [
							...this.playersOnIce[t].C,
							...this.playersOnIce[t].W,
							...this.playersOnIce[t].G,
						]);
					}
					substitutions = true;

					this.playByPlay.logEvent({
						type: lineChangeEvent,
						clock: this.clock,
						t,
					});
				}
			}

			if (options.type === "starters") {
				const currentlyOnIce = Object.values(this.playersOnIce[t]).flat();
				for (const p of currentlyOnIce) {
					this.recordStat(t, p, "gs");
				}
			}

			if (substitutions || options.type === "starters") {
				for (const pos of helpers.keys(this.playersOnIce[t])) {
					for (const p of this.playersOnIce[t][pos]) {
						const stat = pos === "G" ? "gpGoalie" : "gpSkater";
						if (p.stat[stat] === 0) {
							this.recordStat(t, p, stat);
						}
					}
				}

				this.playByPlay.logEvent({
					type: "playersOnIce",
					t,
					pids: Object.values(this.playersOnIce[t])
						.flat()
						.map(p => p.id),
				});
			}
		}

		if (substitutions || options.type === "starters") {
			this.updateTeamCompositeRatings();
		}
	}

	updatePlayingTime(possessionTime: number) {
		const onField = new Set();

		for (const t of teamNums) {
			const t2 = t === 0 ? 1 : 0;
			const penaltyBoxDiff =
				this.penaltyBox.count(t) - this.penaltyBox.count(t2);
			let strengthType: "ev" | "sh" | "pp" = "ev";
			if (penaltyBoxDiff > 0) {
				strengthType = "sh";
			} else if (penaltyBoxDiff < 0) {
				strengthType = "pp";
			}

			for (const pos of helpers.keys(this.playersOnIce[t])) {
				for (const p of this.playersOnIce[t][pos]) {
					onField.add(p.id);
					this.recordStat(t, p, "min", possessionTime);
					if (strengthType === "pp") {
						this.recordStat(t, p, "ppMin", possessionTime);
					} else if (strengthType === "sh") {
						this.recordStat(t, p, "shMin", possessionTime);
					}
					this.recordStat(t, p, "courtTime", possessionTime);

					// This used to be 0.04. Increase more to lower PT
					this.recordStat(t, p, "energy", -0.25 * possessionTime);

					if (p.stat.energy < 0) {
						p.stat.energy = 0;
					}
				}
			}

			for (const p of this.team[t].player) {
				if (!onField.has(p.id)) {
					this.recordStat(t, p, "benchTime", possessionTime);

					// Any player on the bench is full strength the next time he comes on
					p.stat.energy = 1;
				}
			}
		}
	}

	injuries(
		info?:
			| {
					type: "hit";
					hitter: PlayerGameSim;
					target: PlayerGameSim;
					t: TeamNum;
			  }
			| {
					type: "block";
					shooter: PlayerGameSim;
					target: PlayerGameSim;
					t: TeamNum;
			  },
	) {
		const baseInjuryRate = g.get("injuryRate");

		if ((g as any).disableInjuries || baseInjuryRate === 0) {
			return;
		}

		let injuryOccurred = false;

		if (info) {
			// Some chance of a hit/block resulting in injury
			if (info.type === "hit") {
				if (
					Math.random() <
					250 * info.hitter.compositeRating.enforcer * baseInjuryRate
				) {
					info.target.injured = true;
					info.target.newInjury = true;
					this.playByPlay.logEvent({
						type: "injury",
						clock: this.clock,
						t: info.t,
						names: [info.target.name],
						injuredPID: info.target.id,
					});
					injuryOccurred = true;
				}
			} else {
				if (
					Math.random() <
					250 * info.shooter.compositeRating.sniper * baseInjuryRate
				) {
					info.target.injured = true;
					info.target.newInjury = true;
					this.playByPlay.logEvent({
						type: "injury",
						clock: this.clock,
						t: info.t,
						names: [info.target.name],
						injuredPID: info.target.id,
					});
					injuryOccurred = true;
				}
			}
		} else {
			for (const t of teamNums) {
				for (const pos of helpers.keys(this.playersOnIce[t])) {
					for (const p of this.playersOnIce[t][pos]) {
						let injuryRate = getInjuryRate(
							baseInjuryRate,
							p.age,
							p.injury.playingThrough,
						);

						// 10% as many injuries for G
						if (pos === "G") {
							injuryRate *= 0.1;
						}

						if (Math.random() < injuryRate) {
							// 10% as many injuries for G
							if (pos === "G" && Math.random() < 0.1) {
								continue;
							}

							p.injured = true;
							p.newInjury = true;
							this.playByPlay.logEvent({
								type: "injury",
								clock: this.clock,
								t,
								names: [p.name],
								injuredPID: p.id,
							});
							injuryOccurred = true;
						}
					}
				}
			}
		}

		if (injuryOccurred) {
			this.setLines();
		}
	}

	pickPlayer(
		t: TeamNum,
		rating?: CompositeRating,
		positions: Position[] = POSITIONS,
		power: number = 1,
		ignorePlayers?: PlayerGameSim[],
	) {
		let players = getPlayers(this.playersOnIce[t], positions);
		if (ignorePlayers) {
			players = players.filter(p => !ignorePlayers.includes(p));
		}

		const weightFunc =
			rating !== undefined
				? (p: PlayerGameSim) => {
						// Less likely, but not impossible, for injured players to do stuff
						const injuryFactor = p.injured ? 0.5 : 1;

						return (
							(p.compositeRating[rating] *
								fatigue(p.stat.energy) *
								injuryFactor) **
							power
						);
				  }
				: undefined;
		return random.choice(players, weightFunc);
	}

	getTopPlayerOnIce(
		t: TeamNum,
		rating: CompositeRating,
		positions: Position[] = POSITIONS,
	) {
		const players = orderBy(
			getPlayers(this.playersOnIce[t], positions),
			p => p.compositeRating[rating] * fatigue(p.stat.energy),
			"desc",
		);

		return players[0];
	}

	// Pass undefined as p for some team-only stats
	recordStat(
		t: TeamNum,
		p: PlayerGameSim | undefined,
		s: string,
		amt: number = 1,
	) {
		const qtr = this.team[t].stat.ptsQtrs.length - 1;

		if (p !== undefined) {
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
				this.team[t].stat[s] += amt;

				let pts;

				const goals = ["evG", "ppG", "shG"];

				if (goals.includes(s)) {
					pts = 1;
				}

				if (pts !== undefined) {
					this.team[t].stat.pts += pts;
					this.team[t].stat.ptsQtrs[qtr] += pts;
					this.playByPlay.logStat(t, undefined, "pts", pts);

					// Power play goals don't count for +/-
					if (s !== "ppG") {
						for (const t2 of teamNums) {
							const currentlyOnIce = Object.values(
								this.playersOnIce[t2],
							).flat();
							for (const p2 of currentlyOnIce) {
								const pm = t2 === t ? 1 : -1;
								p2.stat.pm += pm;
								this.playByPlay.logStat(t2, p2.id, "pm", pm);
							}
						}
					}
				}
			}

			if (p !== undefined) {
				this.playByPlay.logStat(t, p.id, s, amt);
			}
		}
	}
}

export default GameSim;
