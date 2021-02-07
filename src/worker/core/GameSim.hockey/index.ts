import { PHASE } from "../../../common";
import { g, helpers, random } from "../../util";
import {
	NUM_LINES,
	NUM_PLAYERS_PER_LINE,
	POSITIONS,
} from "../../../common/constants.hockey";
import PlayByPlayLogger from "./PlayByPlayLogger";
// import getCompositeFactor from "./getCompositeFactor";
import getPlayers from "./getPlayers";
// import penalties from "./penalties";
import type { Position } from "../../../common/types.hockey";
import type {
	CompositeRating,
	PlayerGameSim,
	PlayersOnIce,
	TeamGameSim,
	TeamNum,
} from "./types";
import orderBy from "lodash/orderBy";
import flatten from "lodash/flatten";
import range from "lodash/range";
import getCompositeFactor from "./getCompositeFactor";

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

type TeamLines = {
	F: PlayerGameSim[][];
	D: PlayerGameSim[][];
	G: PlayerGameSim[][];
};

type TeamCurrentLine = {
	F: 0;
	D: 0;
	G: 0;
};

class GameSim {
	id: number;

	team: [TeamGameSim, TeamGameSim];

	playersOnIce: [PlayersOnIce, PlayersOnIce];

	subsEveryN: number;

	overtime: boolean;

	overtimes: number;

	clock: number;

	numPeriods: number;

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	twoPointConversionTeam: number | undefined;

	minutesSinceLineChange: [
		{
			F: number;
			D: number;
		},
		{
			F: number;
			D: number;
		},
	];

	// @ts-ignore
	lines: [TeamLines, TeamLines];

	currentLine: [TeamCurrentLine, TeamCurrentLine];

	constructor(
		gid: number,
		teams: [TeamGameSim, TeamGameSim],
		doPlayByPlay: boolean,
		homeCourtFactor: number = 1,
	) {
		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);
		this.id = gid;
		this.team = teams; // If a team plays twice in a day, this needs to be a deep copy

		this.playersOnIce = [
			{
				C: [],
				W: [],
				D: [],
				G: [],
			},
			{
				C: [],
				W: [],
				D: [],
				G: [],
			},
		];

		this.setLines();

		this.currentLine = [
			{
				F: 0,
				D: 0,
				G: 0,
			},
			{
				F: 0,
				D: 0,
				G: 0,
			},
		];

		// Record "gs" stat for starters
		this.o = 0;
		this.d = 1;
		this.updatePlayersOnIce("starters");
		this.subsEveryN = 6; // How many possessions to wait before doing substitutions

		this.overtime = false;
		this.overtimes = 0;
		this.clock = g.get("quarterLength"); // Game clock, in minutes
		this.numPeriods = g.get("numPeriods");

		this.homeCourtAdvantage(homeCourtFactor);

		this.minutesSinceLineChange = [
			{
				F: 0,
				D: 0,
			},
			{
				F: 0,
				D: 0,
			},
		];
	}

	// Call this at beginning of game or after injuries
	setLines() {
		this.lines = [
			{
				F: [],
				D: [],
			},
			{
				F: [],
				D: [],
			},
		] as any;

		for (const t of [0, 1] as const) {
			// First, make sure players listed in the main lines for G/D/F are reserved and not used as injury replacements
			const inDepthChart = new Set();
			for (const pos of ["G", "D", "F"] as const) {
				const numInDepthChart = NUM_LINES[pos] * NUM_PLAYERS_PER_LINE[pos];
				for (let i = 0; i < numInDepthChart; i++) {
					inDepthChart.add(this.team[t].depth[pos][i].id);
				}
			}

			const usedPlayerIDs = new Set();

			// Then, assign players to lines, moving up lower players to replace injured ones
			for (const pos of ["G", "D"] as const) {
				const players = this.team[t].depth[pos];

				const numInDepthChart = NUM_LINES[pos] * NUM_PLAYERS_PER_LINE[pos];

				const lines: PlayerGameSim[][] = [[]];
				let ind = 0;
				for (let i = 0; i < players.length; i++) {
					const p = players[i];
					if (p.injured || usedPlayerIDs.has(p.id)) {
						continue;
					}

					if (i < numInDepthChart || !inDepthChart.has(p.id)) {
						if (lines[ind].length === NUM_PLAYERS_PER_LINE[pos]) {
							lines.push([]);
							ind += 1;
						}
						if (lines[ind].length < NUM_PLAYERS_PER_LINE[pos]) {
							lines[ind].push(p);
							usedPlayerIDs.add(p.id);
						}

						if (
							lines.length === NUM_LINES[pos] &&
							lines[ind].length === NUM_PLAYERS_PER_LINE[pos]
						) {
							break;
						}
					}
				}

				this.lines[t][pos] = lines;
			}

			// Special case for forwards (no need to check inDepthChart anymore, since other positions are already done)
			{
				const pos = "F";
				const players = this.team[t].depth[pos];

				const numInDepthChart = NUM_LINES[pos] * NUM_PLAYERS_PER_LINE[pos];

				const centers = [];
				const wings = [];

				for (let i = 0; i < players.length; i++) {
					const p = players[i];
					if (p.injured || usedPlayerIDs.has(p.id)) {
						continue;
					}

					// For the 4 defined lines, first of the 3 players is the center
					if (i >= numInDepthChart) {
						centers.push(p);
						wings.push(p);
					} else if (i % NUM_PLAYERS_PER_LINE[pos] === 0) {
						centers.push(p);
					} else {
						wings.push(p);
					}
				}

				const lines: PlayerGameSim[][] = range(4).map(() => []);
				for (const line of lines) {
					let center = centers.shift();
					while (center === undefined || usedPlayerIDs.has(center.id)) {
						center = centers.shift();
						if (center === undefined && wings.length > 0) {
							center = wings.shift();
						}
					}

					let wing1 = wings.shift();
					while (
						wing1 === undefined ||
						usedPlayerIDs.has(wing1.id) ||
						wing1 === center
					) {
						wing1 = wings.shift();
						if (wing1 === undefined && centers.length > 0) {
							wing1 = centers.shift();
						}
					}

					let wing2 = wings.shift();
					while (
						wing2 === undefined ||
						usedPlayerIDs.has(wing2.id) ||
						wing2 === center ||
						wing2 === wing1
					) {
						wing2 = wings.shift();
						if (wing2 === undefined && centers.length > 0) {
							wing2 = centers.shift();
						}
					}

					if (center && wing1 && wing2) {
						line.push(center, wing1, wing2);
						usedPlayerIDs.add(center.id);
						usedPlayerIDs.add(wing1.id);
						usedPlayerIDs.add(wing2.id);
					}
				}

				this.lines[t][pos] = lines;
			}
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

		this.playByPlay.logEvent({
			type: "gameOver",
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
		let quarter = 1;

		while (true) {
			this.updatePlayersOnIce("newPeriod");
			this.faceoff();

			while (this.clock > 0) {
				this.simPossession();
				this.advanceClock();
				this.updatePlayersOnIce();
			}

			quarter += 1;

			if (quarter > this.numPeriods) {
				break;
			}

			this.team[0].stat.ptsQtrs.push(0);
			this.team[1].stat.ptsQtrs.push(0);
			this.clock = g.get("quarterLength");
			this.minutesSinceLineChange[0].F = 0;
			this.minutesSinceLineChange[0].D = 0;
			this.minutesSinceLineChange[1].F = 0;
			this.minutesSinceLineChange[1].D = 0;
			this.playByPlay.logEvent({
				type: "quarter",
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
		this.team[0].stat.ptsQtrs.push(0);
		this.team[1].stat.ptsQtrs.push(0);
		this.playByPlay.logEvent({
			type: "overtime",
			clock: this.clock,
			quarter: this.team[0].stat.ptsQtrs.length,
		});

		this.updatePlayersOnIce("newPeriod");
		this.faceoff();

		// @ts-ignore
		while (this.clock > 0) {
			this.simPossession();
			this.advanceClock();
			this.updatePlayersOnIce();
		}
	}

	possessionChange() {
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
	}

	getNumHits() {
		return Math.round(
			this.team[this.o].compositeRating.hitting +
				this.team[this.d].compositeRating.hitting +
				Math.random() -
				0.5,
		);
	}

	doHit() {
		const t = random.choice(
			[0, 1] as TeamNum[],
			t => this.team[t].compositeRating.hitting,
		);
		const t2 = t === 0 ? 1 : 0;
		const hitter = this.pickPlayer(t, "enforcer", ["C", "W", "D"]);
		const target = this.pickPlayer(t2, undefined, ["C", "W", "D"]);

		this.recordStat(t2, target, "energy", -0.1);

		this.playByPlay.logEvent({
			type: "hit",
			clock: this.clock,
			t,
			names: [hitter.name, target.name],
		});
		this.recordStat(t, hitter, "hit", 1);
	}

	isGiveaway() {
		return (
			Math.random() <
			(0.1 * this.team[this.o].compositeRating.puckControl) /
				this.team[this.d].compositeRating.takeaway
		);
	}

	isTakeaway() {
		return (
			Math.random() <
			(0.1 * this.team[this.d].compositeRating.takeaway) /
				this.team[this.o].compositeRating.puckControl
		);
	}

	isNothing() {
		return Math.random() < 0.1;
	}

	doGiveaway() {
		const p = this.pickPlayer(this.o, undefined, ["C", "W", "D"]);

		this.playByPlay.logEvent({
			type: "gv",
			clock: this.clock,
			t: this.o,
			names: [p.name],
		});
		this.recordStat(this.o, p, "gv", 1);
	}

	doTakeaway() {
		const p = this.pickPlayer(this.d, "grinder", ["C", "W", "D"]);

		this.playByPlay.logEvent({
			type: "tk",
			clock: this.clock,
			t: this.d,
			names: [p.name],
		});

		this.recordStat(this.d, p, "tk", 1);
	}

	advanceClock() {
		// 0 to 30 seconds
		let dt = Math.random() * 0.5;
		if (this.clock - dt < 0) {
			dt = this.clock;
		}

		this.updatePlayingTime(dt);

		this.clock -= dt;
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

	doShot() {
		const shooter = this.pickPlayer(this.o, "scoring", ["C", "W", "D"]);

		const type: "slapshot" | "wristshot" | "shot" = random.choice([
			"slapshot",
			"wristshot",
			"shot",
		]);

		this.playByPlay.logEvent({
			type: type,
			clock: this.clock,
			t: this.o,
			names: [shooter.name],
		});
		this.recordStat(this.o, shooter, "tsa");

		const r = Math.random();

		if (r < 0.2 * this.team[this.d].compositeRating.blocking) {
			const blocker = this.pickPlayer(this.d, "blocking", ["C", "W", "D"]);
			this.playByPlay.logEvent({
				type: "block",
				clock: this.clock,
				t: this.d,
				names: [blocker.name],
			});
			this.recordStat(this.d, blocker, "blk", 1);
			return "block";
		}

		if (r < 1 - Math.sqrt(shooter.compositeRating.scoring)) {
			this.playByPlay.logEvent({
				type: "miss",
				clock: this.clock,
				t: this.o,
				names: [shooter.name],
			});
			return "miss";
		}

		this.recordStat(this.o, shooter, "s");

		const goalie = this.playersOnIce[this.d].G[0];

		if (goalie) {
			if (r < goalie.compositeRating.goalkeeping ** 0.25) {
				const saveType = Math.random() < 0.1 ? "save-freeze" : "save";

				this.playByPlay.logEvent({
					type: saveType,
					clock: this.clock,
					t: this.d,
					names: [goalie.name],
				});
				this.recordStat(this.d, goalie, "sv");

				return saveType;
			}
		}

		let assister1: PlayerGameSim | undefined;
		let assister2: PlayerGameSim | undefined;
		const r2 = Math.random();
		if (r2 < 0.9) {
			assister1 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 1, [
				shooter,
			]);
			this.recordStat(this.o, assister1, "evA");
		}
		if (r2 < 0.8) {
			assister2 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 1, [
				shooter,
				assister1 as PlayerGameSim,
			]);
			this.recordStat(this.o, assister2, "evA");
		}

		let assisterNames: [] | [string] | [string, string];
		if (assister1 && assister2) {
			assisterNames = [assister1.name, assister2.name];
		} else if (assister1) {
			assisterNames = [assister1.name];
		} else {
			assisterNames = [];
		}

		this.playByPlay.logEvent({
			type: "goal",
			clock: this.clock,
			t: this.o,
			names: [shooter.name, ...assisterNames],
			shotType: type,
			goalType: "EV",
		});
		this.recordStat(this.o, shooter, "evG");
		if (goalie) {
			this.recordStat(this.d, goalie, "ga");
		}

		return "goal";
	}

	faceoff() {
		this.updatePlayersOnIce();

		const p0 = this.getTopPlayerOnIce(0, "faceoffs", ["C", "W", "D"]);
		const p1 = this.getTopPlayerOnIce(1, "faceoffs", ["C", "W", "D"]);

		if (Math.random() < 0.5) {
			this.o = 0;
			this.d = 1;
			this.recordStat(0, p0, "fow");
			this.recordStat(1, p1, "fol");
		} else {
			this.o = 1;
			this.d = 0;
			this.recordStat(1, p1, "fow");
			this.recordStat(0, p0, "fol");
		}

		this.playByPlay.logEvent({
			type: "faceoff",
			clock: this.clock,
			t: this.o,
			names: [p0.name, p1.name],
		});

		this.advanceClock();
	}

	simPossession() {
		const numHits = this.getNumHits();
		for (let i = 0; i < numHits; i++) {
			this.doHit();

			if (this.advanceClock()) {
				return;
			}
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

		if (this.advanceClock()) {
			return;
		}

		const outcome = this.doShot();

		if (outcome === "block" || outcome === "miss") {
			if (Math.random() < 0.5) {
				this.possessionChange();
			}

			return;
		}

		if (outcome === "save") {
			if (Math.random() < 0.5) {
				this.possessionChange();
			} else {
				console.log("opportunity for another shot?");
			}

			return;
		}

		if (outcome === "save-freeze") {
			this.faceoff();
			return;
		}

		if (outcome === "goal") {
			this.faceoff();
			return;
		}
	}

	updateTeamCompositeRatings() {
		for (const t of [0, 1] as const) {
			this.team[t].compositeRating.hitting = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.enforcer) / 2,
			});

			this.team[t].compositeRating.puckControl = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					C: 1,
					W: 0.5,
					D: 0.25,
				},
				valFunc: p => p.compositeRating.playmaker,
			});

			this.team[t].compositeRating.takeaway = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.grinder) / 2,
			});

			this.team[t].compositeRating.blocking = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.blocking) / 2,
			});

			this.team[t].compositeRating.scoring = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					C: 1,
					W: 0.5,
					D: 0.25,
				},
				valFunc: p => p.compositeRating.scoring,
			});
		}
	}

	doLineChange(t: TeamNum, pos: "F" | "D") {
		this.minutesSinceLineChange[t][pos] = 0;
		this.currentLine[t][pos] += 1;

		// Sometimes skip the 4th line of forwards
		if (pos === "F" && this.currentLine[t][pos] >= 3 && Math.random() < 0.5) {
			this.currentLine[t][pos] = 0;
		}

		let newLine = this.lines[t][pos][this.currentLine[t][pos]];
		if (!newLine || newLine.length < NUM_PLAYERS_PER_LINE[pos]) {
			this.currentLine[t][pos] = 0;
			newLine = this.lines[t][pos][this.currentLine[t][pos]];
		}
		if (!newLine || newLine.length < NUM_PLAYERS_PER_LINE[pos]) {
			throw new Error("Not enough players");
		}

		if (pos === "F") {
			this.playersOnIce[t].C = newLine.slice(0, 1);
			this.playersOnIce[t].W = newLine.slice(1, 3);
		} else {
			this.playersOnIce[t].D = newLine;
		}
	}

	updatePlayersOnIce(playType?: "starters" | "newPeriod") {
		let substitutions = false;

		for (const t of [0, 1] as const) {
			if (playType === "starters" || playType === "newPeriod") {
				this.playersOnIce[t].C = this.lines[t].F[0].slice(0, 1);
				this.playersOnIce[t].W = this.lines[t].F[0].slice(1, 3);
				this.playersOnIce[t].D = this.lines[t].D[0];
				this.playersOnIce[t].G = this.lines[t].G[0];
			} else {
				// Line change based on playing time
				let lineChangeEvent:
					| "offensiveLineChange"
					| "fullLineChange"
					| "defensiveLineChange"
					| undefined;

				if (this.clock >= 1) {
					if (this.minutesSinceLineChange[t].F >= 0.7 && Math.random() < 0.75) {
						lineChangeEvent = "offensiveLineChange";
						this.doLineChange(t, "F");
						substitutions = true;
					}
					if (this.minutesSinceLineChange[t].D >= 0.9 && Math.random() < 0.75) {
						if (lineChangeEvent) {
							lineChangeEvent = "fullLineChange";
						} else {
							lineChangeEvent = "defensiveLineChange";
						}
						this.doLineChange(t, "D");
						substitutions = true;
					}
				}

				if (lineChangeEvent) {
					this.playByPlay.logEvent({
						type: lineChangeEvent,
						clock: this.clock,
						t,
					});
				}
			}

			if (playType === "starters") {
				const currentlyOnIce = flatten(Object.values(this.playersOnIce[t]));
				for (const p of currentlyOnIce) {
					this.recordStat(t, p, "gs");
				}
			}
		}

		if (substitutions) {
			for (const t of [0, 1] as const) {
				this.playByPlay.logEvent({
					type: "playersOnIce",
					t,
					pids: flatten(Object.values(this.playersOnIce[t])).map(p => p.id),
				});
			}
			this.updateTeamCompositeRatings();
		}
	}

	updatePlayingTime(possessionTime: number) {
		const onField = new Set();

		for (const t of teamNums) {
			// Get rid of this after making sure playersOnIce is always set, even for special teams
			if (this.playersOnIce[t] === undefined) {
				continue;
			}

			for (const pos of helpers.keys(this.playersOnIce[t])) {
				// Update minutes (overall, court, and bench)
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				for (const p of this.playersOnIce[t][pos]) {
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
			// Get rid of this after making sure playersOnIce is always set, even for special teams
			if (this.playersOnIce[t] === undefined) {
				continue;
			}

			const onField = new Set<any>();

			for (const pos of helpers.keys(this.playersOnIce[t])) {
				// Update minutes (overall, court, and bench)
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				for (const p of this.playersOnIce[t][pos]) {
					onField.add(p);
				}
			}

			for (const p of onField) {
				// Modulate injuryRate by age - assume default is 25 yo, and increase/decrease by 3%
				const injuryRate =
					g.get("injuryRate") * 1.03 ** (Math.min(p.age, 50) - 25);

				if (Math.random() < injuryRate) {
					// 50% as many injuries for QB
					if (p.pos === "QB" && Math.random() < 0.5) {
						continue;
					}

					p.injured = true;
					this.playByPlay.logEvent({
						type: "injury",
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
		ignorePlayers?: PlayerGameSim[],
	) {
		let players = getPlayers(this.playersOnIce[t], positions);
		if (ignorePlayers) {
			players = players.filter(p => !ignorePlayers.includes(p));
		}

		const weightFunc =
			rating !== undefined
				? (p: PlayerGameSim) =>
						(p.compositeRating[rating] * fatigue(p.stat.energy)) ** power
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

		if (
			s !== "gs" &&
			s !== "courtTime" &&
			s !== "benchTime" &&
			s !== "energy"
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

				for (const t2 of [0, 1] as const) {
					const currentlyOnIce = flatten(Object.values(this.playersOnIce[t2]));
					for (const p2 of currentlyOnIce) {
						const pm = t2 === t ? 1 : -1;
						p2.stat.pm += pm;
						this.playByPlay.logStat(t2, p2.id, "pm", pm);
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
