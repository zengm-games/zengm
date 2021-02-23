import { PHASE } from "../../../common";
import { defaultGameAttributes, g, helpers, random } from "../../util";
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
import { penalties, penaltyTypes } from "../GameSim.hockey/penalties";
import PenaltyBox from "./PenaltyBox";

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
	F: number;
	D: number;
	G: number;
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

	penaltyBox: PenaltyBox;

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
		this.updatePlayersOnIce({ type: "starters" });
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

		this.penaltyBox = new PenaltyBox(({ t, p, minutesAgo, ppo }) => {
			this.playByPlay.logEvent({
				type: "penaltyOver",
				clock: this.clock + minutesAgo,
				t,
				names: [p.name],
				penaltyPID: p.id,
			});

			if (ppo > 0) {
				const t2 = t === 0 ? 1 : 0;
				this.recordStat(t2, undefined, "ppo", 1);
			}

			this.updatePlayersOnIce({ type: "penaltyOver", p, t });
		});
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

		for (const t of teamNums) {
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
			this.updatePlayersOnIce({ type: "newPeriod" });
			this.faceoff();

			while (this.clock > 0) {
				this.simPossession();
				this.advanceClock();
				this.updatePlayersOnIce({ type: "normal" });
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
		this.clock = g.get("quarterLength");

		if (this.clock <= 0) {
			this.clock = defaultGameAttributes.quarterLength;
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

		this.updatePlayersOnIce({ type: "newPeriod" });
		this.faceoff();

		// @ts-ignore
		while (this.clock > 0) {
			this.simPossession();

			if (this.team[0].stat.pts !== this.team[1].stat.pts) {
				// Sudden death overtime
				break;
			}

			this.advanceClock();
			this.updatePlayersOnIce({ type: "normal" });
		}
	}

	possessionChange() {
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
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
		const { powerPlayTeam } = this.penaltyBox.getPowerPlayTeam();

		let baseOdds = 0.1;
		if (powerPlayTeam === this.o) {
			baseOdds /= 2;
		} else if (powerPlayTeam === this.d) {
			baseOdds *= 2;
		}
		return (
			Math.random() <
			(baseOdds * this.team[this.o].compositeRating.puckControl) /
				this.team[this.d].compositeRating.takeaway
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

	advanceClock(special?: "rebound") {
		// 1 to 15 seconds, or less if it's a rebound
		const maxLength = special === "rebound" ? 0.05 : 0.32;

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

		this.playByPlay.logEvent({
			type: type,
			clock: this.clock,
			t: this.o,
			names: [shooter.name],
		});
		this.recordStat(this.o, shooter, "tsa");

		const {
			powerPlayTeam,
			strengthDifference,
		} = this.penaltyBox.getPowerPlayTeam();
		let strengthType: "ev" | "sh" | "pp" = "ev";
		if (powerPlayTeam === this.d) {
			strengthType = "sh";
		} else if (powerPlayTeam === this.o) {
			strengthType = "pp";
		}

		// Power play adjusts odds of a miss
		let r = Math.random();
		if (strengthType === "pp") {
			r += strengthDifference === 1 ? 0.1 : 0.2;
		} else if (strengthType === "sh") {
			r -= strengthDifference === 1 ? 0.025 : 0.5;
		}

		if (r < 0.15 + 0.25 * this.team[this.d].compositeRating.blocking) {
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

		let deflector;
		if ((type === "slapshot" || type === "wristshot") && Math.random() < 0.05) {
			deflector = this.pickPlayer(this.o, "playmaker", ["C", "W"]);
			if (deflector) {
				this.playByPlay.logEvent({
					type: "deflection",
					clock: this.clock,
					t: this.o,
					names: [deflector.name],
				});
			}
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

		const actualShooter = deflector ?? shooter;

		this.recordStat(this.o, actualShooter, "s");

		const goalie = this.playersOnIce[this.d].G[0];

		if (goalie) {
			// Save percentage does not depend on defenders https://www.tsn.ca/defencemen-and-their-impact-on-team-save-percentage-1.567469
			if (r < 0.89 + goalie.compositeRating.goalkeeping * 0.07) {
				const saveType = Math.random() < 0.5 ? "save-freeze" : "save";

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
		if (deflector) {
			assister1 = shooter;
		} else if (r2 < 0.99) {
			assister1 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 20, [
				actualShooter,
			]);
			this.recordStat(this.o, assister1, `${strengthType}A`);
		}

		if (r2 < 0.8) {
			assister2 = this.pickPlayer(this.o, "playmaker", ["C", "W", "D"], 20, [
				actualShooter,
				assister1 as PlayerGameSim,
			]);
			this.recordStat(this.o, assister2, `${strengthType}A`);
		}

		let assisterNames: [] | [string] | [string, string];
		let assisterPIDs: [] | [number] | [number, number];
		if (assister1 && assister2) {
			assisterNames = [assister1.name, assister2.name];
			assisterPIDs = [assister1.id, assister2.id];
		} else if (assister1) {
			assisterNames = [assister1.name];
			assisterPIDs = [assister1.id];
		} else {
			assisterNames = [];
			assisterPIDs = [];
		}

		this.playByPlay.logEvent({
			type: "goal",
			clock: this.clock,
			t: this.o,
			names: [actualShooter.name, ...assisterNames],
			pids: [actualShooter.id, ...assisterPIDs],
			shotType: deflector ? "deflection" : type,
			goalType: strengthType,
		});
		this.recordStat(this.o, actualShooter, `${strengthType}G`);
		if (goalie) {
			this.recordStat(this.d, goalie, "ga");
		}

		this.penaltyBox.goal(this.o);

		return "goal";
	}

	faceoff() {
		this.updatePlayersOnIce({ type: "normal" });

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

		this.playByPlay.logEvent({
			type: "penalty",
			clock: this.clock,
			t,
			names: [p.name],
			penaltyType: penalty.type,
			penaltyName: penalty.name,
			penaltyPID: p.id,
		});
		this.recordStat(t, p, "pim", penaltyType.minutes);

		// Actually remove player from ice
		this.updatePlayersOnIce({ type: "penalty" });

		return true;
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
			} else if (r < 0.6) {
				this.simPossession("rebound");
			}

			return;
		}

		if (outcome === "save") {
			const r = Math.random();
			if (r < 0.5) {
				this.possessionChange();
			} else if (r < 0.7) {
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

			this.faceoff();
			return;
		}
	}

	updateTeamCompositeRatings() {
		for (const t of teamNums) {
			this.team[t].compositeRating.hitting = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => (p.ovrs.D / 100 + p.compositeRating.enforcer) / 2,
			});

			this.team[t].compositeRating.penalties = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => p.compositeRating.penalties / 2,
			});

			this.team[t].compositeRating.penalties = getCompositeFactor({
				playersOnIce: this.playersOnIce[t],
				positions: {
					D: 1,
					W: 0.5,
					C: 0.25,
				},
				valFunc: p => p.compositeRating.enforcer / 2,
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

	doLineChange(
		t: TeamNum,
		pos: "F" | "D",
		playersRemainingOn: PlayerGameSim[],
	) {
		this.minutesSinceLineChange[t][pos] = 0;
		this.currentLine[t][pos] += 1;

		// Sometimes skip the 4th line of forwards
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
		if (!newLine || newLine.length < NUM_PLAYERS_PER_LINE[pos]) {
			throw new Error("Not enough players");
		}

		newLine = [...newLine];
		for (let i = 0; i < newLine.length; i++) {
			const p = newLine[i];
			if (this.penaltyBox.has(t, p) || playersRemainingOn.includes(p)) {
				let nextLine = this.lines[t][pos][this.currentLine[t][pos] + 1];
				if (!nextLine) {
					nextLine = this.lines[t][pos][0];
				}
				if (nextLine.length < NUM_PLAYERS_PER_LINE[pos]) {
					throw new Error("Not enough players");
				}

				newLine[i] = random.choice(nextLine);
			}
		}

		if (pos === "F") {
			const penaltyBoxCount = this.penaltyBox.count(t);
			if (penaltyBoxCount === 0) {
				// Normal
				this.playersOnIce[t].C = newLine.slice(0, 1);
				this.playersOnIce[t].W = newLine.slice(1, 3);
			} else if (penaltyBoxCount === 1) {
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
				if (options.t === t) {
					if (this.playersOnIce[t].C.length < 1) {
						this.playersOnIce[t].C.push(options.p);
					} else if (this.playersOnIce[t].W.length < 2) {
						this.playersOnIce[t].W.push(options.p);
					} else {
						this.playersOnIce[t].D.push(options.p);
					}
					substitutions = true;
				}
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
				const currentlyOnIce = flatten(Object.values(this.playersOnIce[t]));
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
					pids: flatten(Object.values(this.playersOnIce[t])).map(p => p.id),
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

					for (const t2 of teamNums) {
						const currentlyOnIce = flatten(
							Object.values(this.playersOnIce[t2]),
						);
						for (const p2 of currentlyOnIce) {
							const pm = t2 === t ? 1 : -1;
							p2.stat.pm += pm;
							this.playByPlay.logStat(t2, p2.id, "pm", pm);
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
