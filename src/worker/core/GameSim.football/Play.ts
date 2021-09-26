import type GameSim from ".";
import type { Position } from "../../../common/types.football";
import type { PlayerGameSim, TeamNum } from "./types";

type PlayEvent =
	| {
			type: "k";
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
			type: "krTD";
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
			yds: number;
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
			ydsPass: number;
			ydsReturn: number;
	  }
	| {
			type: "intTD";
			p: PlayerGameSim;
	  }
	| {
			type: "xp" | "fg";
			p: PlayerGameSim;
			distance: number;
			made: boolean;
	  }
	| {
			type: "penalty";
			p: PlayerGameSim | undefined;
			automaticFirstDown: boolean;
			name: string;
			recordedPenYds: number;
			penYds: number;
			posOdds: Partial<Record<Position, number>> | undefined;
			spotYds: number | undefined;
			t: TeamNum;
	  };

type PlayType = PlayEvent["type"];

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
>;

class State {
	down: PlayState["down"];
	toGo: PlayState["toGo"];
	scrimmage: PlayState["scrimmage"];
	o: PlayState["o"];
	d: PlayState["d"];
	isClockRunning: PlayState["isClockRunning"];
	awaitingKickoff: PlayState["awaitingKickoff"];
	awaitingAfterSafety: PlayState["awaitingAfterSafety"];
	awaitingAfterTouchdown: PlayState["awaitingAfterTouchdown"];

	constructor(gameSim: PlayState) {
		this.down = gameSim.down;
		this.toGo = gameSim.toGo;
		this.scrimmage = gameSim.scrimmage;
		this.o = gameSim.o;
		this.d = gameSim.d;
		this.isClockRunning = gameSim.isClockRunning;
		this.awaitingKickoff = gameSim.awaitingKickoff;
		this.awaitingAfterSafety = gameSim.awaitingAfterSafety;
		this.awaitingAfterTouchdown = gameSim.awaitingAfterTouchdown;
	}

	clone() {
		return new State(this);
	}

	possessionChange() {
		this.scrimmage = 100 - this.scrimmage;
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
		this.newFirstDown();
		this.isClockRunning = false;
	}

	newFirstDown() {
		this.down = 1;
		this.toGo = Math.min(10, 100 - this.scrimmage);
	}
}

class Play {
	g: GameSim;
	events: PlayEvent[];
	state: {
		initial: State;
		current: State;
		penalties: State[];
	};

	constructor(gameSim: GameSim) {
		this.g = gameSim;
		this.events = [];

		const initialState = new State(gameSim);
		this.state = {
			initial: initialState,
			current: initialState.clone(),
			penalties: [],
		};
	}

	boundedYds(yds: number, swap?: boolean) {
		const scrimmage = swap
			? 100 - this.state.current.scrimmage
			: this.state.current.scrimmage;
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

	getStatChanges(event: PlayEvent) {
		const statChanges: Parameters<GameSim["recordStat"]>[] = [];

		if (event.type === "kr") {
			statChanges.push([this.state.initial.d, event.p, "kr", 1]);
			statChanges.push([this.state.initial.d, event.p, "krYds", event.yds]);
			statChanges.push([this.state.initial.d, event.p, "krLng", event.yds]);
		} else if (event.type === "krTD") {
			statChanges.push([this.state.initial.d, event.p, "krTD", 1]);
		} else if (event.type === "rus") {
			statChanges.push([this.state.initial.o, event.p, "rus", 1]);
			statChanges.push([this.state.initial.o, event.p, "rusYds", event.yds]);
			statChanges.push([this.state.initial.o, event.p, "rusLng", event.yds]);
		} else if (event.type === "rusTD") {
			statChanges.push([this.state.initial.o, event.p, "rusTD", 1]);
		} else if (event.type === "kneel") {
			statChanges.push([this.state.initial.o, event.p, "rus", 1]);
			statChanges.push([this.state.initial.o, event.p, "rusYds", event.yds]);
			statChanges.push([this.state.initial.o, event.p, "rusLng", event.yds]);
		} else if (event.type === "sk") {
			statChanges.push([this.state.initial.o, event.qb, "pssSk"]);
			statChanges.push([
				this.state.initial.o,
				event.qb,
				"pssSkYds",
				Math.abs(event.yds),
			]);
			statChanges.push([this.state.initial.d, event.p, "defSk", 1]);
		} else if (event.type === "pss") {
			statChanges.push([this.state.initial.o, event.qb, "pss", 1]);
			statChanges.push([this.state.initial.o, event.target, "tgt", 1]);
		} else if (event.type === "pssCmp") {
			statChanges.push([this.state.initial.o, event.qb, "pssCmp", 1]);
			statChanges.push([this.state.initial.o, event.qb, "pssYds", event.yds]);
			statChanges.push([this.state.initial.o, event.qb, "pssLng", event.yds]);
			statChanges.push([this.state.initial.o, event.target, "rec", 1]);
			statChanges.push([
				this.state.initial.o,
				event.target,
				"recYds",
				event.yds,
			]);
			statChanges.push([
				this.state.initial.o,
				event.target,
				"recLng",
				event.yds,
			]);
		} else if (event.type === "pssInc") {
			if (event.defender) {
				statChanges.push([
					this.state.initial.d,
					event.defender,
					"defPssDef",
					1,
				]);
			}
		} else if (event.type === "pssTD") {
			statChanges.push([this.state.initial.o, event.qb, "pssTD", 1]);
			statChanges.push([this.state.initial.o, event.target, "recTD", 1]);
		} else if (event.type === "int") {
			statChanges.push([this.state.initial.o, event.qb, "pssInt", 1]);
			statChanges.push([this.state.initial.d, event.defender, "defPssDef", 1]);
			statChanges.push([this.state.initial.d, event.defender, "defInt", 1]);
			statChanges.push([
				this.state.initial.d,
				event.defender,
				"defIntYds",
				event.ydsReturn,
			]);
			statChanges.push([
				this.state.initial.d,
				event.defender,
				"defIntLng",
				event.ydsReturn,
			]);
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

			statChanges.push([this.state.initial.o, event.p, statAtt, 1]);
			if (event.made) {
				statChanges.push([this.state.initial.o, event.p, statMade, 1]);

				if (event.type !== "xp") {
					statChanges.push([
						this.state.initial.o,
						event.p,
						"fgLng",
						event.distance,
					]);
				}
			}
		}

		return statChanges;
	}

	updateState(state: State, event: PlayEvent) {
		if (event.type === "k") {
			state.down = 1;
			state.toGo = 10;
			state.scrimmage = 100 - event.kickTo;
		} else if (event.type === "touchbackKick") {
			state.down = 1;
			state.toGo = 10;
			state.scrimmage = 25;
			state.awaitingKickoff = undefined;
			state.awaitingAfterSafety = false;
		} else if (event.type === "kr") {
			state.possessionChange();
			state.scrimmage += event.yds;
			state.awaitingKickoff = undefined;
			state.awaitingAfterSafety = false;
		} else if (event.type === "rus") {
			state.down += 1;
			state.scrimmage += event.yds;
			state.toGo -= event.yds;
			state.isClockRunning = Math.random() < 0.85;
		} else if (event.type === "kneel") {
			state.down += 1;
			state.scrimmage += event.yds;
			state.toGo -= event.yds;

			// Set this to false, because we handle it all in dt
			state.isClockRunning = false;
		} else if (event.type === "sk") {
			state.down += 1;
			state.scrimmage += event.yds;
			state.toGo -= event.yds;
			state.isClockRunning = Math.random() < 0.98;
		} else if (event.type === "pssCmp") {
			state.down += 1;
			state.scrimmage += event.yds;
			state.toGo -= event.yds;
			state.isClockRunning = Math.random() < 0.75;
		} else if (event.type === "pssInc") {
			state.down += 1;
			state.isClockRunning = false;
		} else if (event.type === "int") {
			state.possessionChange();
			state.scrimmage += event.ydsPass;
			state.scrimmage -= event.ydsReturn;
		} else if (event.type === "fg" || event.type === "xp") {
			if (!event.made && event.type !== "xp") {
				state.down += 1;
				state.scrimmage -= 7;
			}

			if (event.type === "xp" || event.made) {
				state.awaitingKickoff = this.state.initial.o;
			}

			state.awaitingAfterTouchdown = false;
			state.isClockRunning = false;
		}

		if (event.type.endsWith("TD")) {
			state.awaitingAfterTouchdown = true;
			state.isClockRunning = false;
		}

		if (state.toGo <= 0) {
			state.newFirstDown();
		}

		let td: TeamNum | undefined;
		let safety: TeamNum | undefined;
		let touchback: TeamNum | undefined;

		const TOUCHDOWN_IS_POSSIBLE: PlayType[] = [
			"kr",
			"pr",
			"rus",
			"pssCmp",
			"int",
			"fmb",
		];

		if (state.scrimmage >= 100 && TOUCHDOWN_IS_POSSIBLE.includes(event.type)) {
			td = state.o;
		}

		const TOUCHBACK_IS_POSSIBLE: PlayType[] = ["kr", "pr", "int", "fmb"];

		if (state.scrimmage <= 0 && TOUCHBACK_IS_POSSIBLE.includes(event.type)) {
			touchback = state.o;
		}

		const SAFETY_IS_POSSIBLE: PlayType[] = ["rus", "pss", "sk"];

		if (state.scrimmage <= 0 && SAFETY_IS_POSSIBLE.includes(event.type)) {
			safety = state.d;
		}

		const turnoverOnDowns =
			safety === undefined &&
			td === undefined &&
			touchback === undefined &&
			state.down > 4;
		if (turnoverOnDowns) {
			state.possessionChange();
		}

		return {
			safety,
			td,
			touchback,
			turnoverOnDowns,
		};
	}

	addEvent(event: PlayEvent) {
		this.events.push(event);

		if (event.type === "penalty") {
			this.state.penalties.push(this.state.current.clone());
		}

		const statChanges = this.getStatChanges(event);
		for (const statChange of statChanges) {
			this.g.recordStat(...statChange);
		}

		return this.updateState(this.state.current, event);
	}

	adjudicatePenalties() {}

	commit() {
		// Should actually figure out penalties and roll back shit when necessary

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
	}
}

export default Play;
