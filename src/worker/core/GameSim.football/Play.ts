import type GameSim from ".";
import getBestPenaltyResult from "./getBestPenaltyResult";
import type { PlayerGameSim, TeamNum } from "./types";

type PlayEvent =
	| {
			type: "k";
			kickTo: number;
	  }
	| {
			type: "onsideKick";
			kickTo: number;
	  }
	| {
			type: "touchbackKick";
	  }
	| {
			type: "kr";
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "onsideKickRecovery";
			success: boolean;
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "krTD";
			p: PlayerGameSim;
	  }
	| {
			type: "p";
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "touchbackPunt";
			p: PlayerGameSim;
	  }
	| {
			type: "pr";
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "prTD";
			p: PlayerGameSim;
	  }
	| {
			type: "rus";
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "rusTD";
			p: PlayerGameSim;
	  }
	| {
			type: "kneel";
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "sk";
			qb: PlayerGameSim;
			p: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "dropback";
	  }
	| {
			type: "pss";
			qb: PlayerGameSim;
			target: PlayerGameSim;
	  }
	| {
			type: "pssCmp";
			qb: PlayerGameSim;
			target: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "pssInc";
			defender: PlayerGameSim | undefined;
	  }
	| {
			type: "pssTD";
			qb: PlayerGameSim;
			target: PlayerGameSim;
	  }
	| {
			type: "int";
			qb: PlayerGameSim;
			defender: PlayerGameSim;
			ydsReturn: number;
	  }
	| {
			type: "intTD";
			p: PlayerGameSim;
	  }
	| {
			type: "touchbackInt";
	  }
	| {
			type: "xp";
			p: PlayerGameSim;
			distance: number;
			made: boolean;
	  }
	| {
			type: "fg";
			p: PlayerGameSim;
			distance: number;
			made: boolean;
			late: boolean;
	  }
	| {
			type: "penalty";
			p: PlayerGameSim | undefined;
			automaticFirstDown: boolean;
			name: string;
			penYds: number;
			spotYds: number | undefined; // undefined if not spot/tackOn foul
			tackOn: boolean;
			t: TeamNum;
	  }
	| {
			type: "fmb";
			pFumbled: PlayerGameSim;
			pForced: PlayerGameSim;
			yds: number;
	  }
	| {
			type: "fmbRec";
			pFumbled: PlayerGameSim;
			pRecovered: PlayerGameSim;
			lost: boolean;
			yds: number;
	  }
	| {
			type: "fmbTD";
			p: PlayerGameSim;
	  }
	| {
			type: "twoPointConversion";
			t: TeamNum;
	  }
	| {
			type: "twoPointConversionDone";
			t: TeamNum;
	  }
	| {
			type: "defSft";
			p: PlayerGameSim;
	  }
	| {
			type: "possessionChange";
			yds: number;
			kickoff?: boolean;
	  }
	| {
			type: "tck";
			tacklers: Set<PlayerGameSim>;
			loss: boolean;
	  };

type PlayType = PlayEvent["type"];

type PlayEventPenalty = Extract<PlayEvent, { type: "penalty" }>;

type PlayEventNonPenalty = Exclude<PlayEvent, PlayEventPenalty>;

type PlayState = Pick<
	GameSim,
	| "down"
	| "toGo"
	| "scrimmage"
	| "o"
	| "d"
	| "isClockRunning"
	| "awaitingKickoff"
	| "awaitingAfterSafety"
	| "awaitingAfterTouchdown"
	| "overtimeState"
>;

type StatChange = Parameters<GameSim["recordStat"]>;

export class State {
	down: PlayState["down"];
	toGo: PlayState["toGo"];
	scrimmage: PlayState["scrimmage"];
	o: PlayState["o"];
	d: PlayState["d"];
	isClockRunning: PlayState["isClockRunning"];
	awaitingKickoff: PlayState["awaitingKickoff"];
	awaitingAfterSafety: PlayState["awaitingAfterSafety"];
	awaitingAfterTouchdown: PlayState["awaitingAfterTouchdown"];
	overtimeState: PlayState["overtimeState"];

	downIncremented: boolean;
	firstDownLine: number;
	madeLateFG: TeamNum | undefined;
	missedXP: TeamNum | undefined;
	numPossessionChanges: number;
	pts: [number, number];
	twoPointConversionTeam: TeamNum | undefined;
	turnoverOnDowns: boolean;

	constructor(
		gameSim: PlayState,
		{
			downIncremented,
			firstDownLine,
			madeLateFG,
			missedXP,
			numPossessionChanges,
			pts,
			twoPointConversionTeam,
			turnoverOnDowns,
		}: {
			downIncremented: boolean;
			firstDownLine: number | undefined;
			madeLateFG: TeamNum | undefined;
			missedXP: TeamNum | undefined;
			numPossessionChanges: number;
			pts: [number, number];
			twoPointConversionTeam: TeamNum | undefined;
			turnoverOnDowns: boolean;
		},
	) {
		this.down = gameSim.down;
		this.toGo = gameSim.toGo;
		this.scrimmage = gameSim.scrimmage;
		this.o = gameSim.o;
		this.d = gameSim.d;
		this.isClockRunning = gameSim.isClockRunning;
		this.awaitingKickoff = gameSim.awaitingKickoff;
		this.awaitingAfterSafety = gameSim.awaitingAfterSafety;
		this.awaitingAfterTouchdown = gameSim.awaitingAfterTouchdown;
		this.overtimeState = gameSim.overtimeState;

		this.downIncremented = downIncremented;
		this.firstDownLine = firstDownLine ?? this.scrimmage + this.toGo;
		this.madeLateFG = madeLateFG;
		this.missedXP = missedXP;
		this.numPossessionChanges = numPossessionChanges;
		this.pts = pts;
		this.twoPointConversionTeam = twoPointConversionTeam;
		this.turnoverOnDowns = turnoverOnDowns;
	}

	clone() {
		return new State(this, {
			downIncremented: this.downIncremented,
			firstDownLine: this.firstDownLine,
			madeLateFG: this.madeLateFG,
			missedXP: this.missedXP,
			numPossessionChanges: this.numPossessionChanges,
			pts: [...this.pts],
			twoPointConversionTeam: this.twoPointConversionTeam,
			turnoverOnDowns: this.turnoverOnDowns,
		});
	}

	incrementDown() {
		if (!this.downIncremented) {
			this.down += 1;
			this.downIncremented = true;
		}
	}

	newFirstDown() {
		this.down = 1;
		this.toGo = Math.min(10, 100 - this.scrimmage);
		this.firstDownLine = this.scrimmage + this.toGo;
	}

	possessionChange() {
		if (this.overtimeState === "firstPossession") {
			this.overtimeState = "secondPossession";
		} else if (this.overtimeState === "secondPossession") {
			this.overtimeState = "bothTeamsPossessed";
		}

		this.scrimmage = 100 - this.scrimmage;
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
		this.newFirstDown();
		this.isClockRunning = false;

		this.numPossessionChanges += 1;
	}
}

const getPts = (event: PlayEvent, twoPointConversion: boolean) => {
	let pts;
	if (event.type.endsWith("TD")) {
		pts = twoPointConversion ? 2 : 6;
	} else if (event.type === "xp" && event.made) {
		pts = 1;
	} else if (event.type === "fg" && event.made) {
		pts = 3;
	} else if (event.type === "defSft") {
		pts = 2;
	}

	return pts;
};

type WrappedPenaltyEvent = {
	event: PlayEventPenalty;
	statChanges: StatChange[];
	penaltyInfo: {
		halfDistanceToGoal: boolean;
		penYdsSigned: number;
		placeOnOne: boolean;
	};
};

export type WrappedPlayEvent =
	| {
			event: PlayEventNonPenalty;
			statChanges: StatChange[];
	  }
	| WrappedPenaltyEvent;

class Play {
	g: GameSim;
	events: WrappedPlayEvent[];
	state: {
		initial: State;
		current: State;
	};
	penaltyRollbacks: {
		type: "tackOn" | "spotOfEnforcement" | "cleanHandsChangeOfPossession";
		indexEvent: number;
	}[];
	cleanHandsChangeOfPossessionIndexes: number[];
	spotOfEnforcementIndexes: number[];

	constructor(gameSim: GameSim) {
		this.g = gameSim;
		this.events = [];

		const initialState = new State(gameSim, {
			downIncremented: false,
			firstDownLine: undefined,
			numPossessionChanges: 0,
			madeLateFG: undefined,
			missedXP: undefined,
			pts: [gameSim.team[0].stat.pts, gameSim.team[1].stat.pts],
			twoPointConversionTeam: undefined,
			turnoverOnDowns: false,
		});
		this.state = {
			initial: initialState,
			current: initialState.clone(),
		};
		this.penaltyRollbacks = [];
		this.cleanHandsChangeOfPossessionIndexes = [];
		this.spotOfEnforcementIndexes = [];
	}

	// If there is going to be a possession change related to this yds quantity, do possession change before calling boundedYds
	boundedYds(yds: number) {
		const scrimmage = this.state.current.scrimmage;
		const ydsTD = 100 - scrimmage;
		const ydsSafety = -scrimmage;

		if (yds > ydsTD) {
			return ydsTD;
		}

		if (yds < ydsSafety) {
			return ydsSafety;
		}

		return yds;
	}

	// state is state immedaitely before this event happens. But since possession changes happen only in discrete events, state.o is always the team with the ball, even for things like "int" and "kr"
	getStatChanges(event: PlayEvent, state: State) {
		const statChanges: StatChange[] = [];

		// No tracking stats during 2 point conversion attempt
		if (!state.awaitingAfterTouchdown || event.type === "xp") {
			if (event.type === "penalty") {
				const actualPenYds =
					event.name === "Pass interference" && event.penYds === 0
						? event.spotYds
						: event.penYds;

				statChanges.push([event.t, event.p, "pen"]);
				statChanges.push([event.t, event.p, "penYds", actualPenYds]);
			}
			if (event.type === "kr") {
				statChanges.push([state.o, event.p, "kr"]);
				statChanges.push([state.o, event.p, "krYds", event.yds]);
				statChanges.push([state.o, event.p, "krLng", event.yds]);
			} else if (event.type === "onsideKickRecovery") {
				if (!event.success) {
					statChanges.push([state.o, event.p, "kr"]);
					statChanges.push([state.o, event.p, "krYds", event.yds]);
					statChanges.push([state.o, event.p, "krLng", event.yds]);
				}
			} else if (event.type === "krTD") {
				statChanges.push([state.o, event.p, "krTD"]);
			} else if (event.type === "p") {
				statChanges.push([state.o, event.p, "pnt"]);
				statChanges.push([state.o, event.p, "pntYds", event.yds]);
				statChanges.push([state.o, event.p, "pntLng", event.yds]);
				const kickTo = state.scrimmage + event.yds;
				if (kickTo > 80 && kickTo < 100) {
					statChanges.push([state.o, event.p, "pntIn20"]);
				}
			} else if (event.type === "touchbackPunt") {
				statChanges.push([state.d, event.p, "pntTB"]);
			} else if (event.type === "pr") {
				statChanges.push([state.o, event.p, "pr"]);
				statChanges.push([state.o, event.p, "prYds", event.yds]);
				statChanges.push([state.o, event.p, "prLng", event.yds]);
			} else if (event.type === "prTD") {
				statChanges.push([state.o, event.p, "prTD"]);
			} else if (event.type === "rus") {
				statChanges.push([state.o, event.p, "rus"]);
				statChanges.push([state.o, event.p, "rusYds", event.yds]);
				statChanges.push([state.o, event.p, "rusLng", event.yds]);
			} else if (event.type === "rusTD") {
				statChanges.push([state.o, event.p, "rusTD"]);
			} else if (event.type === "kneel") {
				statChanges.push([state.o, event.p, "rus"]);
				statChanges.push([state.o, event.p, "rusYds", event.yds]);
				statChanges.push([state.o, event.p, "rusLng", event.yds]);
			} else if (event.type === "sk") {
				statChanges.push([state.o, event.qb, "pssSk"]);
				statChanges.push([state.o, event.qb, "pssSkYds", Math.abs(event.yds)]);
				statChanges.push([state.d, event.p, "defSk"]);
			} else if (event.type === "pss") {
				statChanges.push([state.o, event.qb, "pss"]);
				statChanges.push([state.o, event.target, "tgt"]);
			} else if (event.type === "pssCmp") {
				statChanges.push([state.o, event.qb, "pssCmp"]);
				statChanges.push([state.o, event.qb, "pssYds", event.yds]);
				statChanges.push([state.o, event.qb, "pssLng", event.yds]);
				statChanges.push([state.o, event.target, "rec"]);
				statChanges.push([state.o, event.target, "recYds", event.yds]);
				statChanges.push([state.o, event.target, "recLng", event.yds]);
			} else if (event.type === "pssInc") {
				if (event.defender) {
					statChanges.push([state.d, event.defender, "defPssDef"]);
				}
			} else if (event.type === "pssTD") {
				statChanges.push([state.o, event.qb, "pssTD"]);
				statChanges.push([state.o, event.target, "recTD"]);
			} else if (event.type === "int") {
				statChanges.push([state.d, event.qb, "pssInt"]);
				statChanges.push([state.o, event.defender, "defPssDef"]);
				statChanges.push([state.o, event.defender, "defInt"]);

				const touchback = state.scrimmage + event.ydsReturn <= 0;

				if (!touchback) {
					statChanges.push([
						state.o,
						event.defender,
						"defIntYds",
						event.ydsReturn,
					]);
					statChanges.push([
						state.o,
						event.defender,
						"defIntLng",
						event.ydsReturn,
					]);
				}
			} else if (event.type === "intTD") {
				statChanges.push([state.o, event.p, "defIntTD"]);
			} else if (event.type === "fg" || event.type === "xp") {
				let statAtt;
				let statMade;
				if (event.type === "xp") {
					statAtt = "xpa";
					statMade = "xp";
				} else if (event.distance < 20) {
					statAtt = "fga0";
					statMade = "fg0";
				} else if (event.distance < 30) {
					statAtt = "fga20";
					statMade = "fg20";
				} else if (event.distance < 40) {
					statAtt = "fga30";
					statMade = "fg30";
				} else if (event.distance < 50) {
					statAtt = "fga40";
					statMade = "fg40";
				} else {
					statAtt = "fga50";
					statMade = "fg50";
				}

				statChanges.push([state.o, event.p, statAtt]);
				if (event.made) {
					statChanges.push([state.o, event.p, statMade]);

					if (event.type !== "xp") {
						statChanges.push([state.o, event.p, "fgLng", event.distance]);
					}
				}
			} else if (event.type === "fmb") {
				statChanges.push([state.o, event.pFumbled, "fmb"]);
				statChanges.push([state.d, event.pForced, "defFmbFrc"]);
			} else if (event.type === "fmbRec") {
				statChanges.push([state.o, event.pRecovered, "defFmbRec"]);

				if (event.lost) {
					statChanges.push([state.d, event.pFumbled, "fmbLost"]);
				}

				statChanges.push([state.o, event.pRecovered, "defFmbYds", event.yds]);
				statChanges.push([state.o, event.pRecovered, "defFmbLng", event.yds]);
			} else if (event.type === "fmbTD") {
				statChanges.push([state.o, event.p, "defFmbTD"]);
			} else if (event.type === "defSft") {
				statChanges.push([state.d, event.p, "defSft"]);
			} else if (event.type === "tck") {
				for (const tackler of event.tacklers) {
					statChanges.push([
						state.d,
						tackler,
						event.tacklers.size === 1 ? "defTckSolo" : "defTckAst",
					]);

					if (event.loss) {
						statChanges.push([state.d, tackler, "defTckLoss"]);
					}
				}
			}
		}

		// Scoring
		const pts = getPts(event, state.twoPointConversionTeam !== undefined);
		if (pts !== undefined) {
			const scoringTeam = event.type === "defSft" ? state.d : state.o;
			statChanges.push([scoringTeam, undefined, "pts", pts]);
		}

		return statChanges;
	}

	getPenaltyInfo(state: State, event: PlayEventPenalty) {
		const side = state.o === event.t ? "off" : "def";

		const penYdsSigned = side === "off" ? -event.penYds : event.penYds;

		const halfDistanceToGoal =
			side === "off" && state.scrimmage / 2 < event.penYds;

		const placeOnOne = side === "def" && state.scrimmage + penYdsSigned > 99;

		return {
			halfDistanceToGoal,
			penYdsSigned,
			placeOnOne,
		};
	}

	updateState(state: State, event: PlayEvent) {
		const afterKickoff = () => {
			if (state.overtimeState === "initialKickoff") {
				state.overtimeState = "firstPossession";
			}
		};

		if (event.type === "penalty") {
			if (event.spotYds !== undefined && !event.tackOn) {
				// Spot foul, apply penalty from here
				state.scrimmage += event.spotYds;
			}

			const { halfDistanceToGoal, penYdsSigned, placeOnOne } =
				this.getPenaltyInfo(state, event);

			// Adjust penalty yards when near endzones
			if (placeOnOne) {
				state.scrimmage = 99;
			} else if (halfDistanceToGoal) {
				state.scrimmage = Math.round(state.scrimmage / 2);
			} else {
				state.scrimmage += penYdsSigned;
			}

			if (event.automaticFirstDown || state.numPossessionChanges > 0) {
				state.newFirstDown();
			}

			state.isClockRunning = false;
		} else if (event.type === "possessionChange") {
			state.scrimmage += event.yds;
			state.possessionChange();

			if (event.kickoff) {
				state.awaitingKickoff = undefined;
				state.awaitingAfterSafety = false;

				afterKickoff();
			}
		} else if (event.type === "k" || event.type === "onsideKick") {
			state.scrimmage = 100 - event.kickTo;
		} else if (event.type === "touchbackKick") {
			state.scrimmage = 25;
		} else if (event.type === "kr") {
			state.scrimmage += event.yds;
		} else if (event.type === "onsideKickRecovery") {
			state.scrimmage += event.yds;
			state.awaitingKickoff = undefined;
			state.awaitingAfterSafety = false;
			state.newFirstDown();
		} else if (event.type === "p") {
			state.scrimmage += event.yds;
		} else if (event.type === "touchbackPunt") {
			state.scrimmage = 20;
		} else if (event.type === "touchbackInt") {
			state.scrimmage = 20;
		} else if (event.type === "pr") {
			state.scrimmage += event.yds;
		} else if (event.type === "rus") {
			state.incrementDown();
			state.scrimmage += event.yds;
			state.isClockRunning = Math.random() < 0.85;
		} else if (event.type === "kneel") {
			state.incrementDown();
			state.scrimmage += event.yds;

			// Set this to false, because we handle running the clock in dt in GameSim
			state.isClockRunning = false;
		} else if (event.type === "sk") {
			state.scrimmage += event.yds;
			state.isClockRunning = Math.random() < 0.98;
		} else if (event.type === "dropback") {
			state.incrementDown();
		} else if (event.type === "pssCmp") {
			state.scrimmage += event.yds;
			state.isClockRunning = Math.random() < 0.75;
		} else if (event.type === "pssInc") {
			state.isClockRunning = false;
		} else if (event.type === "int") {
			state.scrimmage += event.ydsReturn;
		} else if (event.type === "fg" || event.type === "xp") {
			if (event.type === "xp" || event.made) {
				state.awaitingKickoff = this.state.initial.o;
			}

			if (event.type === "xp" && !event.made) {
				state.missedXP = state.o;
			}

			if (event.type === "fg" && event.made && event.late) {
				state.madeLateFG = state.o;
			}

			state.awaitingAfterTouchdown = false;
			state.isClockRunning = false;
		} else if (event.type === "twoPointConversion") {
			state.twoPointConversionTeam = event.t;
			state.down = 1;
			state.scrimmage = 98;
		} else if (event.type === "twoPointConversionDone") {
			// Reset off/def teams in case there was a turnover during the conversion attempt
			state.o = event.t;
			state.d = state.o === 0 ? 1 : 0;

			state.twoPointConversionTeam = undefined;
			state.awaitingKickoff = event.t;
			state.awaitingAfterTouchdown = false;
			state.isClockRunning = false;
		} else if (event.type === "defSft") {
			state.awaitingKickoff = state.o;
			state.awaitingAfterSafety = true;
			state.isClockRunning = false;
		} else if (event.type === "fmb") {
			state.scrimmage += event.yds;
		} else if (event.type === "fmbRec") {
			state.scrimmage += event.yds;

			if (event.lost) {
				state.isClockRunning = false;
			} else {
				// Stops if fumbled out of bounds
				state.isClockRunning = Math.random() > 0.05;
			}
		}

		if (event.type.endsWith("TD")) {
			state.awaitingAfterTouchdown = true;
			state.isClockRunning = false;

			// This is to prevent weird bugs related to it thinking there is a turnover on downs after a TD is scored, see https://github.com/zengm-games/zengm/issues/397
			state.down = 1;
		}

		// Doesn't really make sense to evaluate these things (TD, safety, touchback) because the play might not be over, could just be a player in their own endzone but maybe they don't want to take a knee for a touchback. So the _IS_POSSIBLE variables filter out when different events can actually happen, to get rid of false positives
		let td = false;
		let safety = false;
		let touchback = false;

		const TOUCHDOWN_IS_POSSIBLE: PlayType[] = [
			"kr",
			"onsideKickRecovery",
			"pr",
			"rus",
			"pssCmp",
			"int",
			"fmbRec",
		];

		if (state.scrimmage >= 100 && TOUCHDOWN_IS_POSSIBLE.includes(event.type)) {
			td = true;
		}

		const touchbackIsPossible = () => {
			if (state.scrimmage <= 0) {
				if (event.type === "int") {
					return true;
				} else if (event.type === "fmbRec" && event.lost) {
					// Touchback only if it's a lost fumble
					return true;
				}
			} else if (state.scrimmage >= 100) {
				if (event.type === "p") {
					return true;
				}
			}

			return false;
		};
		touchback = touchbackIsPossible();

		if (state.scrimmage <= 0) {
			const SAFETY_IS_POSSIBLE: PlayType[] = ["rus", "pssCmp", "sk"];

			const safetyIsPossible = () => {
				if (SAFETY_IS_POSSIBLE.includes(event.type)) {
					return true;
				} else if (event.type === "fmbRec" && !event.lost) {
					// Safety only if it's not a lost fumble
					return true;
				}

				return false;
			};

			safety = safetyIsPossible();
		}

		if (event.type === "fmbRec") {
			if (state.scrimmage <= 0) {
				if (event.lost) {
					state.scrimmage = 20;
					touchback = true;
				} else {
					safety = true;
				}

				state.isClockRunning = false;
			}
		}

		if (event.type.endsWith("TD")) {
			if (
				state.overtimeState === "initialKickoff" ||
				state.overtimeState === "firstPossession"
			) {
				state.overtimeState = "over";
			}
		} else if (event.type === "defSft") {
			if (
				state.overtimeState === "initialKickoff" ||
				state.overtimeState === "firstPossession"
			) {
				state.overtimeState = "over";
			}
		}

		const pts = getPts(event, state.twoPointConversionTeam !== undefined);
		if (pts !== undefined) {
			const t = event.type === "defSft" ? state.d : state.o;
			state.pts[t] += pts;

			if (state.overtimeState === "secondPossession") {
				const t2 = t === 0 ? 1 : 0;

				if (state.pts[t] > state.pts[t2]) {
					state.overtimeState = "over";
				}
			}

			if (pts === 2) {
				if (state.overtimeState === "secondPossession") {
					const t2 = t === 0 ? 1 : 0;

					if (state.pts[t] > state.pts[t2]) {
						state.overtimeState = "over";
					}
				}
			}
		}

		return {
			safety,
			td,
			touchback,
		};
	}

	checkDownAtEndOfPlay(state: State) {
		// In endzone at end of play
		if (
			state.scrimmage >= 100 ||
			state.scrimmage <= 0 ||
			state.numPossessionChanges > 0
		) {
			return;
		}

		// No first down or turnover on downs if extra point or two point conversion - see issue #396
		if (state.awaitingAfterTouchdown) {
			return;
		}

		// already given new first down, so this should not apply!
		state.toGo = state.firstDownLine - state.scrimmage;

		if (state.toGo <= 0) {
			state.newFirstDown();
		}

		state.turnoverOnDowns = state.down > 4;
		if (state.turnoverOnDowns) {
			state.possessionChange();
		}
	}

	addEvent(event: PlayEvent) {
		const statChanges = this.getStatChanges(event, this.state.current);

		if (event.type === "penalty") {
			if (event.tackOn) {
				// Tack on penalty - added to end of play (except incomplete pass)
				this.penaltyRollbacks.push({
					type: "tackOn",
					indexEvent: this.events.length,
				});
			} else if (event.spotYds !== undefined) {
				// Spot foul? Assess at the last spot of enfocement
				this.penaltyRollbacks.push({
					// state: this.afterLastSpotOfEnforcement.state.clone(),
					// indexEvent: this.afterLastSpotOfEnforcement.indexEvent,
					type: "spotOfEnforcement",
					indexEvent: this.events.length,
				});
			} else {
				// Either assess from initial scrimmage, or the last change of possession if the penalty is after that
				this.penaltyRollbacks.push({
					// state: this.afterLastCleanHandsChangeOfPossession.state.clone(),
					// indexEvent: this.afterLastCleanHandsChangeOfPossession.indexEvent,
					type: "cleanHandsChangeOfPossession",
					indexEvent: this.events.length,
				});
			}

			const penaltyInfo = this.getPenaltyInfo(this.state.current, event);

			// Purposely don't record stat changes!

			this.events.push({
				event,
				statChanges,
				penaltyInfo,
			});

			return {
				safety: false,
				td: false,
				touchback: false,
			};
		}

		for (const statChange of statChanges) {
			this.g.recordStat(...statChange);
		}
		this.events.push({
			event,
			statChanges,
		});

		const offenseBefore = this.state.current.o;

		const info = this.updateState(this.state.current, event);

		const offenseAfter = this.state.current.o;

		if (offenseAfter !== offenseBefore) {
			// "Clean hands" means that a change of possession occurred while the team gaining possession had no prior penalties on this play
			const cleanHands = this.events.every(
				event =>
					event.event.type !== "penalty" || event.event.t !== offenseAfter,
			);

			if (cleanHands) {
				this.cleanHandsChangeOfPossessionIndexes.push(this.events.length - 1);
			}
		}

		// Basically, anything that affects scrimmage
		const UPDATE_SPOT_OF_ENFORCEMENT: PlayType[] = [
			"possessionChange",
			"k",
			"onsideKick",
			"touchbackKick",
			"kr",
			"onsideKickRecovery",
			"p",
			"touchbackPunt",
			"touchbackInt",
			"pr",
			"rus",
			"kneel",
			"sk",
			"pssCmp",
			"int",
			"fg",
			"xp",
			"fmb",
			"fmbRec",
		];
		if (UPDATE_SPOT_OF_ENFORCEMENT.includes(event.type)) {
			this.spotOfEnforcementIndexes.push(this.events.length - 1);
		}

		return info;
	}

	get numPenalties() {
		return this.penaltyRollbacks.length;
	}

	adjudicatePenalties() {
		const penalties = this.events.filter(
			event => event.event.type === "penalty",
		) as WrappedPenaltyEvent[];

		if (penalties.length === 0) {
			return;
		}

		const possessionChangeIndexes: number[] = [];
		for (let i = 0; i < this.events.length; i++) {
			const event = this.events[i];
			if (event.event.type === "possessionChange") {
				possessionChangeIndexes.push(i);
			}
		}

		// Each entry in options is a set of decisions on all the penalties. So the inner arrays have the same length as penalties.length
		let options: ("decline" | "accept" | "offset")[][] | undefined;
		let choosingTeam: TeamNum | undefined;
		let offsetStatus: "offset" | "overrule" | undefined;
		if (penalties.length === 1) {
			options = [["decline"], ["accept"]];
			choosingTeam = penalties[0].event.t === 0 ? 1 : 0;
		} else if (penalties.length === 2) {
			if (penalties[0].event.t === penalties[1].event.t) {
				// Same team - other team gets to pick which they want to accept, if any
				// console.log("2 penalties - same team", penalties, this.events);
				options = [
					["decline", "decline"],
					["decline", "accept"],
					["accept", "decline"],
				];
				choosingTeam = penalties[0].event.t === 0 ? 1 : 0;
			} else {
				// Different team - maybe offsetting? Many edge cases http://static.nfl.com/static/content/public/image/rulebook/pdfs/17_Rule14_Penalty_Enforcement.pdf section 3

				const penalties5 = penalties.filter(
					penalty => penalty.event.penYds === 5,
				);
				const penalties15 = penalties.filter(
					penalty =>
						penalty.event.penYds === 15 ||
						penalty.event.name === "Pass interference",
				);

				if (penalties5.length === 1 && penalties15.length === 1) {
					choosingTeam = penalties15[0].event.t === 0 ? 1 : 0;

					// 5 yd vs 15 yd penalty - only assess the 15 yd penalty
					if (penalties15[0] === penalties[0]) {
						options = [["accept", "decline"]];
					} else {
						options = [["decline", "accept"]];
					}

					offsetStatus = "overrule";
				} else {
					// Is this okay? Since there can be a decision to make, I guess, maybe?
					choosingTeam = 0;

					const numPossessionChanges = penalties.map(
						(penalty, i) =>
							possessionChangeIndexes.filter(
								index => index <= this.penaltyRollbacks[i].indexEvent,
							).length,
					);
					if (
						numPossessionChanges[0] === numPossessionChanges[1] &&
						numPossessionChanges[0] > 0
					) {
						// Both penalties after change of possession - roll back to spot of the change of possession
						options = [["offset", "offset"]];

						offsetStatus = "offset";
					} else if (
						numPossessionChanges[0] > 0 ||
						numPossessionChanges[1] > 0
					) {
						// Clean hands change of possession - apply only the penalty from the team that gained possession
						if (numPossessionChanges[0] > numPossessionChanges[1]) {
							options = [["accept", "decline"]];
						} else {
							options = [["decline", "accept"]];
						}

						offsetStatus = "overrule";
					} else {
						// Penalties offset - replay down
						options = [["offset", "offset"]];

						offsetStatus = "offset";
					}
				}
			}
		} else {
			throw new Error("Not supported");
		}

		if (options !== undefined && choosingTeam !== undefined) {
			const results = options
				.map(decisions => {
					const indexAccept = decisions.indexOf("accept");
					const indexOffset = decisions.indexOf("offset");
					const penalty = penalties[indexAccept];

					// console.log("decisions", decisions);

					// Currently "offset" is every entry in the array or no entry
					const offsetting = decisions[0] === "offset";

					const subResults: {
						// indexEvent is the index of the event to roll back to, if penalty is accepted. undefined means don't add any events onto state, other than the penalty. -1 means roll back everything except the penalty
						indexEvent: number | undefined;
						state: State;
						tackOn: boolean;
					}[] = [];
					if (indexAccept < 0 && indexOffset < 0) {
						subResults.push({
							indexEvent: undefined,
							state: this.state.current,
							tackOn: false,
						});
					} else {
						const penaltyRollback =
							this.penaltyRollbacks[indexAccept] ??
							this.penaltyRollbacks[indexOffset];
						// console.log("penaltyRollback", JSON.parse(JSON.stringify(penaltyRollback)));
						// console.log("penalty.event", penalty.event);
						// indexEvent = penaltyRollback.indexEvent;

						// Figure out what state to replay
						if (
							penaltyRollback.type === "cleanHandsChangeOfPossession" ||
							offsetting
						) {
							const validIndexes = this.spotOfEnforcementIndexes.filter(
								index => index < penaltyRollback.indexEvent,
							);
							const indexEvent =
								validIndexes.length === 0 ? -1 : Math.max(...validIndexes);

							subResults.push({
								indexEvent,
								state: this.state.initial.clone(),
								tackOn: false,
							});
						} else if (penaltyRollback.type === "spotOfEnforcement") {
							const validIndexes = this.spotOfEnforcementIndexes.filter(
								index => index < penaltyRollback.indexEvent,
							);
							const indexEvent =
								validIndexes.length === 0 ? -1 : Math.max(...validIndexes);

							subResults.push({
								indexEvent,
								state: this.state.initial.clone(),
								tackOn: false,
							});
						} else if (penaltyRollback.type === "tackOn") {
							subResults.push({
								indexEvent: -1,
								state: this.state.initial.clone(),
								tackOn: false,
							});

							const indexEvent = this.spotOfEnforcementIndexes.at(-1);
							if (indexEvent > 0) {
								subResults.push({
									indexEvent,
									state: this.state.initial.clone(),
									tackOn: true,
								});
							}
						}

						for (const { indexEvent, state } of subResults) {
							if (indexEvent !== undefined && indexEvent >= 0) {
								for (let i = 0; i <= indexEvent; i++) {
									const event = this.events[i].event;

									// Only one penalty can be applied, this one! And that is done below.
									if (event.type !== "penalty") {
										this.updateState(state, this.events[i].event);
									}
								}
							}

							// No state changes for offsetting penalties
							if (offsetStatus === "offset") {
								state.isClockRunning = false;
							} else {
								this.updateState(state, penalty.event);
							}

							this.checkDownAtEndOfPlay(state);
						}
					}

					let statChanges: NonNullable<typeof penalty>["statChanges"] = [];
					if (offsetStatus !== "offset") {
						// No stat changes for offsetting penalties
						statChanges = penalty?.statChanges;
					}

					return subResults.map(subResult => ({
						indexAccept,
						decisions,
						statChanges,
						...subResult,
					}));
				})
				.flat();

			const result = getBestPenaltyResult(
				results,
				this.state.initial,
				choosingTeam,
			);

			if (result.decisions.length > 1) {
				this.g.playByPlay.logEvent("penaltyCount", {
					clock: this.g.clock,
					count: result.decisions.length,
					offsetStatus,
				});
			}

			// Announce declind penalties first, then accepted penalties
			for (const type of ["decline", "accept"] as const) {
				for (let i = 0; i < penalties.length; i++) {
					const decision = result.decisions[i];
					if (decision !== type) {
						continue;
					}
					const penalty = penalties[i];

					// Special case for pass interference, so it doesn't say "0 yards from the spot of the foul"
					let yds = penalty.event.penYds;
					let spotFoul = penalty.event.spotYds !== undefined;
					if (yds === 0 && spotFoul) {
						yds = penalty.event.spotYds as number;
						spotFoul = false;
					}

					this.g.playByPlay.logEvent("penalty", {
						clock: this.g.clock,
						decision,
						offsetStatus,
						t: penalty.event.t,
						names: penalty.event.p ? [penalty.event.p.name] : [],
						automaticFirstDown: penalty.event.automaticFirstDown,
						penaltyName: penalty.event.name,
						yds,
						spotFoul,
						halfDistanceToGoal: penalty.penaltyInfo.halfDistanceToGoal,
						placeOnOne: penalty.penaltyInfo.placeOnOne,
						tackOn: result.tackOn,
					});
				}
			}

			// Actually apply result of accepted penalty - ASSUMES JUST ONE IS ACCEPTED
			this.state.current = result.state;

			if (result.indexAccept >= 0) {
				let numPenaltiesSeen = 0;

				const statChanges = [
					// Apply statChanges from accepted penalty
					...result.statChanges,

					// Apply negative statChanges from anything after accepted penalty
					...this.events
						.filter((event, i) => {
							// Don't remove the accepted penalty, since we only just added it here! It is not like other events which are added previously
							if (event.event.type === "penalty") {
								if (result.indexAccept === numPenaltiesSeen) {
									numPenaltiesSeen += 1;
									return false;
								}
								numPenaltiesSeen += 1;
							}

							return result.indexEvent === undefined || i > result.indexEvent;
						})
						.map(event => event.statChanges)
						.map(statChanges => {
							return statChanges.map(statChange => {
								const newStatChange = [...statChange] as StatChange;

								if (newStatChange[3] === undefined) {
									newStatChange[3] = 1;
								}

								newStatChange[4] = true;

								return newStatChange;
							});
						})
						.flat(),
				];

				for (const statChange of statChanges) {
					this.g.recordStat(...statChange);
				}
			}
		}
	}

	commit() {
		this.checkDownAtEndOfPlay(this.state.current);
		this.adjudicatePenalties();

		if (this.state.current.turnoverOnDowns) {
			this.g.playByPlay.logEvent("turnoverOnDowns", {
				clock: this.g.clock,
			});
		}

		const {
			down,
			toGo,
			scrimmage,
			o,
			d,
			isClockRunning,
			awaitingKickoff,
			awaitingAfterSafety,
			awaitingAfterTouchdown,
			overtimeState,
		} = this.state.current;

		this.g.down = down;
		this.g.toGo = toGo;
		this.g.scrimmage = scrimmage;
		this.g.o = o;
		this.g.d = d;
		this.g.isClockRunning = isClockRunning;
		this.g.awaitingKickoff = awaitingKickoff;
		this.g.awaitingAfterSafety = awaitingAfterSafety;
		this.g.awaitingAfterTouchdown = awaitingAfterTouchdown;
		this.g.overtimeState = overtimeState;
	}
}

export default Play;
