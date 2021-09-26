import type GameSim from ".";
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
	  };

type PlayType = PlayEvent["type"];

class State {
	initial: Pick<
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
	current: typeof this["initial"];

	constructor(gameSim: GameSim) {
		this.initial = {
			down: gameSim.down,
			toGo: gameSim.toGo,
			scrimmage: gameSim.scrimmage,
			o: gameSim.o,
			d: gameSim.d,
			isClockRunning: gameSim.isClockRunning,
			awaitingKickoff: gameSim.awaitingKickoff,
			awaitingAfterSafety: gameSim.awaitingAfterSafety,
			awaitingAfterTouchdown: gameSim.awaitingAfterTouchdown,
		};

		this.current = {
			...this.initial,
		};
	}

	possessionChange() {
		this.current.scrimmage = 100 - this.current.scrimmage;
		this.current.o = this.current.o === 1 ? 0 : 1;
		this.current.d = this.current.o === 1 ? 0 : 1;
		this.newFirstDown();
		this.current.isClockRunning = false;
	}

	newFirstDown() {
		this.current.down = 1;
		this.current.toGo = Math.min(10, 100 - this.current.scrimmage);
	}
}

class Play {
	g: GameSim;
	events: PlayEvent[];
	state: State;

	constructor(gameSim: GameSim) {
		this.g = gameSim;
		this.events = [];
		this.state = new State(gameSim);
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

	addEvent(event: PlayEvent) {
		const statChanges = this.getStatChanges(event);
		for (const statChange of statChanges) {
			this.g.recordStat(...statChange);
		}

		if (event.type === "k") {
			this.state.current.down = 1;
			this.state.current.toGo = 10;
			this.state.current.scrimmage = 100 - event.kickTo;
		} else if (event.type === "touchbackKick") {
			this.state.current.down = 1;
			this.state.current.toGo = 10;
			this.state.current.scrimmage = 25;
			this.state.current.awaitingKickoff = undefined;
			this.state.current.awaitingAfterSafety = false;
		} else if (event.type === "kr") {
			this.state.possessionChange();
			this.state.current.scrimmage += event.yds;
			this.state.current.awaitingKickoff = undefined;
			this.state.current.awaitingAfterSafety = false;
		} else if (event.type === "rus") {
			this.state.current.down += 1;
			this.state.current.scrimmage += event.yds;
			this.state.current.toGo -= event.yds;
			this.state.current.isClockRunning = Math.random() < 0.85;
		} else if (event.type === "kneel") {
			this.state.current.down += 1;
			this.state.current.scrimmage += event.yds;
			this.state.current.toGo -= event.yds;

			// Set this to false, because we handle it all in dt
			this.state.current.isClockRunning = false;
		} else if (event.type === "sk") {
			this.state.current.down += 1;
			this.state.current.scrimmage += event.yds;
			this.state.current.toGo -= event.yds;
			this.state.current.isClockRunning = Math.random() < 0.98;
		} else if (event.type === "pssCmp") {
			this.state.current.down += 1;
			this.state.current.scrimmage += event.yds;
			this.state.current.toGo -= event.yds;
			this.state.current.isClockRunning = Math.random() < 0.75;
		} else if (event.type === "pssInc") {
			this.state.current.down += 1;
			this.state.current.isClockRunning = false;
		} else if (event.type === "int") {
			this.state.possessionChange();
			this.state.current.scrimmage += event.ydsPass;
			this.state.current.scrimmage -= event.ydsReturn;
		} else if (event.type === "fg" || event.type === "xp") {
			if (!event.made && event.type !== "xp") {
				this.state.current.down += 1;
				this.state.current.scrimmage -= 7;
			}

			if (event.type === "xp" || event.made) {
				this.state.current.awaitingKickoff = this.state.initial.o;
			}

			this.state.current.awaitingAfterTouchdown = false;
			this.state.current.isClockRunning = false;
		}

		if (event.type.endsWith("TD")) {
			this.state.current.awaitingAfterTouchdown = true;
			this.state.current.isClockRunning = false;
		}

		if (this.state.current.toGo <= 0) {
			this.state.newFirstDown();
		}

		this.events.push(event);

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

		if (
			this.state.current.scrimmage >= 100 &&
			TOUCHDOWN_IS_POSSIBLE.includes(event.type)
		) {
			td = this.state.current.o;
		}

		const TOUCHBACK_IS_POSSIBLE: PlayType[] = ["kr", "pr", "int", "fmb"];

		if (
			this.state.current.scrimmage <= 0 &&
			TOUCHBACK_IS_POSSIBLE.includes(event.type)
		) {
			touchback = this.state.current.o;
		}

		const SAFETY_IS_POSSIBLE: PlayType[] = ["rus", "pss", "sk"];

		if (
			this.state.current.scrimmage <= 0 &&
			SAFETY_IS_POSSIBLE.includes(event.type)
		) {
			safety = this.state.current.d;
		}

		const turnoverOnDowns =
			safety === undefined &&
			td === undefined &&
			touchback === undefined &&
			this.state.current.down > 4;
		if (turnoverOnDowns) {
			this.state.possessionChange();
		}

		return {
			safety,
			td,
			touchback,
			turnoverOnDowns,
		};
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
