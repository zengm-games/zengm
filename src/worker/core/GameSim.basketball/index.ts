import { defaultGameAttributes, g, helpers, random } from "../../util";
import { PHASE, STARTING_NUM_TIMEOUTS } from "../../../common";
import jumpBallWinnerStartsThisPeriodWithPossession from "./jumpBallWinnerStartsThisPeriodWithPossession";
import getInjuryRate from "./getInjuryRate";
import type { GameAttributesLeague, PlayerInjury } from "../../../common/types";
import GameSimBase from "../GameSimBase";
import { maxBy, range } from "../../../common/utils";
import PlayByPlayLogger from "./PlayByPlayLogger";
import getWinner from "../../../common/getWinner";

const SHOT_CLOCK = 24;
// const NUM_TIMEOUTS_MAX_FINAL_PERIOD = 4;
// const NUM_TIMEOUTS_MAX_FINAL_PERIOD_LAST_3_MIN = 2;
const NUM_TIMEOUTS_OVERTIME = 2;

const TIMEOUTS_STOP_CLOCK = 2; // [minutes]

const TIP_IN_ONLY_LIMIT = 0.2; // [seconds] - only tip-ins from an inbound with less than this much time

type ShotType =
	| "atRim"
	| "ft"
	| "lowPost"
	| "midRange"
	| "threePointer"
	| "tipIn"
	| "putBack";
type Stat =
	| "ast"
	| "ba"
	| "benchTime"
	| "blk"
	| "courtTime"
	| "drb"
	| "energy"
	| "fg"
	| "fgAtRim"
	| "fgLowPost"
	| "fgMidRange"
	| "fga"
	| "fgaAtRim"
	| "fgaLowPost"
	| "fgaMidRange"
	| "ft"
	| "fta"
	| "gs"
	| "min"
	| "orb"
	| "pf"
	| "pts"
	| "stl"
	| "tov"
	| "tp"
	| "tpa"
	| "sAtt"
	| "sPts";
type PlayerNumOnCourt = number;
type TeamNum = 0 | 1;
type CompositeRating =
	| "blocking"
	| "fouling"
	| "passing"
	| "rebounding"
	| "stealing"
	| "turnovers"
	| "usage"
	| "jumpBall";
type PlayerGameSim = {
	id: number;
	name: string;
	age: number;
	pos: string;
	valueNoPot: number;
	stat: any;
	compositeRating: any;
	skills: string[];
	injured: boolean;
	newInjury: boolean;
	injury: PlayerInjury & {
		playingThrough: boolean;
	};
	ptModifier: number;
};
type TeamGameSim = {
	id: number;
	pace: number; // mean number of possessions the team likes to have in a game
	stat: any;
	compositeRating: any;
	player: PlayerGameSim[];
	synergy: {
		def: number;
		off: number;
		reb: number;
	};
};

type PossessionOutcome =
	| "tov"
	| "stl"
	| "endOfPeriod"
	| "nonShootingFoul"
	| "drb"
	| "orb"
	| "fg"
	| "ft"
	| "timeout"
	| "outOfBoundsDefense"
	| "outOfBoundsOffense";

type ClockFactor = ReturnType<GameSim["getClockFactor"]>;

const teamNums: [TeamNum, TeamNum] = [0, 1];

/**
 * Pick a player to do something.
 *
 * @param {Array.<number>} ratios output of this.ratingArray.
 * @param {number} exempt An integer representing a player that can't be picked (i.e. you can't assist your own shot, which is the only current use of exempt). The value of exempt ranges from 0 to 4, corresponding to the index of the player in this.playersOnCourt. This is *NOT* the same value as the player ID *or* the index of the this.team[t].player list. Yes, that's confusing.
 */
const pickPlayer = (
	ratios: number[],
	exempt?: PlayerNumOnCourt,
): PlayerNumOnCourt => {
	if (exempt !== undefined) {
		ratios[exempt] = 0;
	}

	let sum = 0;
	for (const ratio of ratios) {
		sum += ratio;
	}

	// Special case for all 0 rated players - randomly pick one
	if (sum === 0) {
		const candidates = range(ratios.length).filter(i => i !== exempt);
		return random.choice(candidates);
	}

	const rand = Math.random() * sum;

	let runningSum = 0;

	for (let i = 0; i < ratios.length; i++) {
		runningSum += ratios[i];
		if (rand < runningSum) {
			return i;
		}
	}

	return 0;
};

// Return the indexes of the elements in ovrs, sorted from smallest to largest.
// So [50, 70, 10, 20, 60] => [2, 3, 0, 4, 1]
// The set is to handle ties.
// The descending sort and reverse is so ties are handled with the later entry in ovrs getting the lower index, like:
// [0, 0, 0, 0, 0] => [4, 3, 2, 1, 0]
const getSortedIndexes = (ovrs: number[]) => {
	const ovrsSortedDesc = [...ovrs].sort((a, b) => b - a);
	const usedIndexes = new Set();
	const sortedIndexes = ovrsSortedDesc
		.map(ovr => {
			let index = ovrs.indexOf(ovr);
			while (usedIndexes.has(index)) {
				index += 1;
			}
			usedIndexes.add(index);
			return index;
		})
		.reverse();

	return sortedIndexes;
};

// Use if denominator of prob might be 0
const boundProb = (prob: number) => helpers.bound(prob, 0.001, 0.999);

// Keep time formatting in sync with processLiveGameEvents.basketball.tsx
// Currently just used for end of game, so assume under 1 minute left.
const formatClock = (t: number) => {
	const centiSecondsRounded = Math.ceil(t * 10);
	const remainingSeconds = Math.floor(centiSecondsRounded / 10);
	const remainingCentiSeconds = centiSecondsRounded % 10;
	return `${remainingSeconds}.${remainingCentiSeconds}`;
};

class GameSim extends GameSimBase {
	team: [TeamGameSim, TeamGameSim];

	playersOnCourt: [number[], number[]];

	subsEveryN: number;

	t: number;

	numPeriods: number;

	foulsThisQuarter: [number, number];

	foulsLastTwoMinutes: [number, number];

	paceFactor: number;

	synergyFactor: number;

	lastScoringPlay: {
		team: number;
		player: number;
		type: ShotType;
		time: number;
	}[];

	clutchPlays: {
		text: string;
		showNotification: boolean;
		pids: [number];
		tids: [number];
	}[];

	o: TeamNum;

	d: TeamNum;

	playByPlay: PlayByPlayLogger;

	elam: boolean;

	elamActive: boolean;

	elamDone: boolean;

	elamTarget: number;

	fatigueFactor: number;

	numPlayersOnCourt: number;

	gender: GameAttributesLeague["gender"];

	timeouts: [number, number] = [STARTING_NUM_TIMEOUTS!, STARTING_NUM_TIMEOUTS!];

	isClockRunning = true;

	// Individual possession state
	prevPossessionOutcome: PossessionOutcome | undefined;
	possessionLength = 0;
	lastOrbPlayer: PlayerNumOnCourt = 0;

	/**
	 * Initialize the two teams that are playing this game.
	 *
	 * When an instance of this class is created, information about the two teams is passed to GameSim. Then GameSim.run will actually simulate a game and return the results (i.e. stats) of the simulation. Also see core.game where the inputs to this function are generated.
	 */
	constructor({
		gid,
		day,
		teams,
		doPlayByPlay = false,
		homeCourtFactor = 1,
		allStarGame = false,
		baseInjuryRate,
		disableHomeCourtAdvantage = false,
	}: {
		gid: number;
		day?: number;
		teams: [TeamGameSim, TeamGameSim];
		doPlayByPlay?: boolean;
		homeCourtFactor?: number;
		allStarGame?: boolean;
		baseInjuryRate: number;
		disableHomeCourtAdvantage?: boolean;
	}) {
		super({
			gid,
			day,
			allStarGame,
			baseInjuryRate,
		});

		this.playByPlay = new PlayByPlayLogger(doPlayByPlay);

		this.team = teams; // If a team plays twice in a day, this needs to be a deep copy

		// Starting lineups, which will be reset by updatePlayersOnCourt. This must be done because of injured players in the top 5.
		this.numPlayersOnCourt = g.get("numPlayersOnCourt");
		this.playersOnCourt = [
			range(this.numPlayersOnCourt),
			range(this.numPlayersOnCourt),
		];

		this.updatePlayersOnCourt({
			recordStarters: true,
		});
		this.updateSynergy();
		this.subsEveryN = 6; // How many possessions to wait before doing substitutions

		this.t = g.get("quarterLength") * 60; // Game clock, in seconds
		this.numPeriods = g.get("numPeriods");
		this.gender = g.get("gender");

		this.paceFactor = g.get("pace") / 100;
		this.paceFactor +=
			0.025 * helpers.bound((this.paceFactor - 1) / 0.2, -1, 1);

		this.foulsThisQuarter = [0, 0];
		this.foulsLastTwoMinutes = [0, 0];

		// Parameters
		this.synergyFactor = 0.1; // How important is synergy?

		this.lastScoringPlay = [];
		this.clutchPlays = [];
		this.elam = this.allStarGame ? g.get("elamASG") : g.get("elam");
		this.elamActive = false;
		this.elamDone = false;
		this.elamTarget = 0;

		this.fatigueFactor = 0.055;

		if (g.get("phase") === PHASE.PLAYOFFS) {
			this.fatigueFactor /= 1.85;
			this.synergyFactor *= 2.5;
		}

		if (!disableHomeCourtAdvantage) {
			this.homeCourtAdvantage(homeCourtFactor);
		}

		this.o = 0;
		this.d = 1;
	}

	/**
	 * Home court advantage.
	 *
	 * Scales composite ratings, giving home players bonuses and away players penalties.
	 *
	 */
	homeCourtAdvantage(homeCourtFactor: number) {
		const homeCourtModifier =
			homeCourtFactor *
			helpers.bound(1 + g.get("homeCourtAdvantage") / 100, 0.01, Infinity);

		for (const t of teamNums) {
			let factor;

			if (t === 0) {
				factor = homeCourtModifier; // Bonus for home team
			} else {
				factor = 1.0 / homeCourtModifier; // Penalty for away team
			}

			for (let p = 0; p < this.team[t].player.length; p++) {
				for (const r of Object.keys(this.team[t].player[p].compositeRating)) {
					if (r !== "endurance") {
						if (r === "turnovers" || r === "fouling") {
							// These are negative ratings, so the bonus or penalty should be inversed
							this.team[t].player[p].compositeRating[r] /= factor;
						} else {
							// Apply bonus or penalty
							this.team[t].player[p].compositeRating[r] *= factor;
						}
					}
				}
			}
		}
	}

	/**
	 * Simulates the game and returns the results.
	 *
	 * Also see core.game where the outputs of this function are used.
	 *
	 * @return {Array.<Object>} Game result object, an array of two objects similar to the inputs to GameSim, but with both the team and player "stat" objects filled in and the extraneous data (pace, valueNoPot, compositeRating) removed. In other words...
	 *     {
	 *         "gid": 0,
	 *         "overtimes": 0,
	 *         "team": [
	 *             {
	 *                 "id": 0,
	 *                 "stat": {},
	 *                 "player": [
	 *                     {
	 *                         "id": 0,
	 *                         "stat": {},
	 *                         "skills": [],
	 *                         "injured": false
	 *                     },
	 *                     ...
	 *                 ]
	 *             },
	 *         ...
	 *         ]
	 *     }
	 */
	run() {
		// Simulate the game up to the end of regulation
		this.simRegulation();

		// Play overtime periods if necessary
		let numOvertimes = 0;
		while (
			this.team[0].stat.pts === this.team[1].stat.pts &&
			numOvertimes < this.maxOvertimes
		) {
			this.checkGameTyingShot();
			this.simOvertime();
			numOvertimes += 1;
		}

		this.checkGameWinner();

		this.doShootout();

		this.playByPlay.logEvent({
			type: "gameOver",
		});

		// Delete stuff that isn't needed before returning
		for (const t of teamNums) {
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

		const out = {
			gid: this.id,
			day: this.day,
			overtimes: this.overtimes,
			team: this.team,
			clutchPlays: this.clutchPlays,
			playByPlay: this.playByPlay.getPlayByPlay(this.team),
			numPlayersOnCourt: this.numPlayersOnCourt,
			// scoringSummary: this.playByPlay.scoringSummary,
		};

		return out;
	}

	doShootoutShot(t: TeamNum, p: PlayerGameSim) {
		// 20% to 80%
		const probMake = p.compositeRating.shootingThreePointer * 0.6 + 0.2;

		const made = Math.random() < probMake;

		this.recordStat(t, undefined, "sAtt");
		if (made) {
			this.recordStat(t, undefined, "sPts");
		}

		this.playByPlay.logEvent({
			type: "shootoutShot",
			t: t,
			pid: p.id,
			made,
		});
	}

	doShootout() {
		if (
			this.shootoutRounds <= 0 ||
			this.team[0].stat.pts !== this.team[1].stat.pts
		) {
			return;
		}

		this.shootout = true;
		this.t = 1; // So fast-forward to end of period stops before the shootout
		this.team[0].stat.sPts = 0;
		this.team[0].stat.sAtt = 0;
		this.team[1].stat.sPts = 0;
		this.team[1].stat.sAtt = 0;

		this.playByPlay.logEvent({
			type: "shootoutStart",
			rounds: this.shootoutRounds,

			// So fast-forward to end of period stops before the shootout
			clock: this.t,
		});

		const shooters = teamNums.map(t => {
			// Find best shooter - slight bias towards high usage players
			return maxBy(
				this.team[t].player,
				p =>
					p.compositeRating.shootingThreePointer +
					0.2 * p.compositeRating.usage -
					(p.injured ? 1000 : 0),
			)!;
		}) as [PlayerGameSim, PlayerGameSim];

		const reversedTeamNums = [1, 0] as const;

		for (const t of reversedTeamNums) {
			const shooter = shooters[t];

			this.playByPlay.logEvent({
				type: "shootoutTeam",
				t: t,
				pid: shooter.id,
			});

			for (let i = 0; i < this.shootoutRounds; i++) {
				if (
					this.shouldEndShootoutEarly(t, i, [
						this.team[0].stat.sPts,
						this.team[1].stat.sPts,
					])
				) {
					break;
				}

				this.doShootoutShot(t, shooter);
			}
		}

		if (this.team[0].stat.sPts === this.team[1].stat.sPts) {
			this.playByPlay.logEvent({
				type: "shootoutTie",
			});

			while (this.team[0].stat.sPts === this.team[1].stat.sPts) {
				for (const t of reversedTeamNums) {
					this.doShootoutShot(t, shooters[t]);
				}
			}
		}

		// Log winner
		const winner = this.team[0].stat.sPts > this.team[1].stat.sPts ? 0 : 1;
		const loser = winner === 0 ? 1 : 0;
		this.clutchPlays.push({
			text: `<a href="${helpers.leagueUrl(["player", shooters[winner].id])}">${
				shooters[winner].name
			}</a> defeated <a href="${helpers.leagueUrl(["player", shooters[loser].id])}">${
				shooters[loser].name
			}</a> in a shootout`,
			showNotification: this.team[winner].id === g.get("userTid"),
			pids: [shooters[winner].id],
			tids: [this.team[winner].id],
		});
	}

	jumpBall() {
		const jumpers = teamNums.map(t => {
			const ratios = this.ratingArray("jumpBall", t);
			const maxRatio = Math.max(...ratios);
			let ind = ratios.findIndex(ratio => ratio === maxRatio);
			if (ind === undefined) {
				ind = 0;
			}
			return this.playersOnCourt[t][ind];
		});
		const prob =
			0.5 *
			(this.team[0].player[jumpers[0]].compositeRating.jumpBall /
				this.team[1].player[jumpers[1]].compositeRating.jumpBall) **
				3;

		// Team assignments are the opposite of what you'd expect, cause in simPossession it swaps possession at top
		this.o = Math.random() < prob ? 1 : 0;
		this.d = this.o === 0 ? 1 : 0;
		this.playByPlay.logEvent({
			type: "jumpBall",
			t: this.d,
			pid: this.team[this.d].player[jumpers[this.d]].id,
			clock: this.t,
		});
		return this.d;
	}

	checkElamEnding() {
		if (
			this.elam &&
			!this.elamActive &&
			((g.get("elamOvertime") &&
				this.team[0].stat.ptsQtrs.length > this.numPeriods) ||
				(!g.get("elamOvertime") &&
					this.team[0].stat.ptsQtrs.length >= this.numPeriods &&
					this.t <= g.get("elamMinutes") * 60))
		) {
			const maxPts = Math.max(
				this.team[this.d].stat.pts,
				this.team[this.o].stat.pts,
			);
			this.elamTarget = maxPts + g.get("elamPoints");
			this.elamActive = true;
			this.t = Infinity; // This disables any late clock effects
			this.playByPlay.logEvent({
				type: "elamActive",
				target: this.elamTarget,
			});
		}
	}

	logTimeouts() {
		this.playByPlay.logEvent({
			type: "timeouts",
			timeouts: [...this.timeouts],
		});
	}

	// Set the number of timeouts for each team to maxTimeouts, unless it's already lower than that in which case do nothing
	/*setMaxTimeouts(maxTimeouts: number) {
		this.timeouts = this.timeouts.map(timeouts => {
			return Math.min(timeouts, maxTimeouts);
		}) as [number, number];
		this.logTimeouts();
	}*/

	simRegulation() {
		let period = 1;
		const wonJump = this.jumpBall();
		// let doneSettingTimeoutsLastThreeMinutes = false;

		while (!this.elamDone) {
			if (period !== 1) {
				this.doSubstitutionsIfDeadBall({
					type: "newPeriod",
				});
			}

			const finalPeriod = period === this.numPeriods;
			/*if (finalPeriod) {
				this.setMaxTimeouts(NUM_TIMEOUTS_MAX_FINAL_PERIOD);
			}*/

			// Team assignments are the opposite of what you'd expect, cause in simPossession it swaps possession at top
			if (
				jumpBallWinnerStartsThisPeriodWithPossession(period, this.numPeriods)
			) {
				this.o = wonJump === 0 ? 1 : 0;
			} else {
				this.o = wonJump === 0 ? 0 : 1;
			}
			this.d = this.o === 0 ? 1 : 0;

			this.checkElamEnding(); // Before loop, in case it's at 0
			while (this.t > 0 && !this.elamDone) {
				/*if (
					finalPeriod &&
					!doneSettingTimeoutsLastThreeMinutes &&
					this.t <= 3 * 60
				) {
					this.setMaxTimeouts(NUM_TIMEOUTS_MAX_FINAL_PERIOD_LAST_3_MIN);
					doneSettingTimeoutsLastThreeMinutes = true;
				}*/

				this.simPossession();
				this.checkElamEnding();
			}

			if (finalPeriod) {
				break;
			}

			period += 1;

			this.team[0].stat.ptsQtrs.push(0);
			this.team[1].stat.ptsQtrs.push(0);
			this.foulsThisQuarter = [0, 0];
			this.foulsLastTwoMinutes = [0, 0];
			this.lastScoringPlay = [];
			this.t = g.get("quarterLength") * 60;
			this.playByPlay.logEvent({
				type: "period",
				period: this.team[0].stat.ptsQtrs.length,
				clock: this.t,
			});
		}
	}

	simOvertime() {
		// 5 minutes by default, but scales
		this.t = Math.ceil(
			(g.get("quarterLength") * 60 * 5) / defaultGameAttributes.quarterLength,
		);
		if (this.t === 0) {
			this.t = 5 * 60;
		}

		this.timeouts = [NUM_TIMEOUTS_OVERTIME, NUM_TIMEOUTS_OVERTIME];
		this.logTimeouts();

		this.lastScoringPlay = [];
		this.overtimes += 1;
		this.team[0].stat.ptsQtrs.push(0);
		this.team[1].stat.ptsQtrs.push(0);
		this.foulsThisQuarter = [0, 0];
		this.foulsLastTwoMinutes = [0, 0];
		this.lastScoringPlay = [];
		this.playByPlay.logEvent({
			type: "overtime",
			period: this.team[0].stat.ptsQtrs.length,
			clock: this.t,
		});

		// Check for elamOvertime
		this.checkElamEnding();

		this.doSubstitutionsIfDeadBall({
			type: "newPeriod",
		});

		this.jumpBall();

		while (this.t > 0 && !this.elamDone) {
			this.simPossession();
		}
	}

	getClockFactor() {
		if (this.elamActive) {
			return;
		}

		if (this.shouldIntentionalFoul()) {
			return "intentionalFoul";
		}

		const period = this.team[this.o].stat.ptsQtrs.length;
		const pointDifferential =
			this.team[this.o].stat.pts - this.team[this.d].stat.pts;

		// Run out the clock if winning
		if (period >= this.numPeriods && this.t <= 24 && pointDifferential > 0) {
			return "runOutClock" as const;
		}

		if (this.t <= 26 && (period < this.numPeriods || pointDifferential >= 0)) {
			return "holdForLastShot" as const;
		}

		if (
			period >= this.numPeriods &&
			((this.t <= 3 * 60 && pointDifferential <= -10) ||
				(this.t <= 2 * 60 && pointDifferential <= -5) ||
				(this.t <= 1 * 60 && pointDifferential < 0))
		) {
			return "catchUp";
		}
		if (
			period >= this.numPeriods &&
			((this.t <= 3 * 60 && pointDifferential > 10) ||
				(this.t <= 2 * 60 && pointDifferential > 5) ||
				(this.t <= 1 * 60 && pointDifferential > 0))
		) {
			return "maintainLead";
		}

		if (this.t >= 32 && this.t <= 52) {
			return "twoForOne";
		}
	}

	// Call this before running clock for possession
	shouldIntentionalFoul() {
		const diff = this.team[this.o].stat.pts - this.team[this.d].stat.pts;
		const offenseWinningByABit = diff > 0 && diff <= 6;
		const intentionalFoul =
			offenseWinningByABit &&
			this.team[0].stat.ptsQtrs.length >= this.numPeriods &&
			this.t < 27 &&
			this.t > 0.3 &&
			this.getNumFoulsUntilBonus() <= 10;

		return intentionalFoul;
	}

	// When a shot is made and the clock is still running, some time runs off the clock before the next possession starts. No need to worry about going into negative clock values, since the clock stops after made baskets with under 2 minutes left
	dtInbound() {
		let dt = 0;

		if (
			(this.prevPossessionOutcome === "fg" ||
				this.prevPossessionOutcome === "ft") &&
			this.isClockRunning
		) {
			// Time to gather ball after shot was made, and then to inbound it too
			dt += random.uniform(1, 5);
		}

		return dt;
	}

	doSubstitutionsIfDeadBall(
		info:
			| {
					type: "afterPossession";
					injuries: boolean;
			  }
			| {
					type: "newPeriod";
			  },
	) {
		const outcome = this.prevPossessionOutcome;
		const deadBall =
			info.type === "newPeriod" ||
			(info.type === "afterPossession" && info.injuries) ||
			outcome === "timeout" ||
			outcome === "outOfBoundsDefense" ||
			outcome === "outOfBoundsOffense" ||
			outcome === "nonShootingFoul" ||
			outcome === "ft";
		if (deadBall) {
			const substitutions = this.updatePlayersOnCourt();

			if (substitutions) {
				this.updateSynergy();
			}
		}
	}

	simPossession() {
		// Possession change
		this.o = this.o === 1 ? 0 : 1;
		this.d = this.o === 1 ? 0 : 1;
		this.updateTeamCompositeRatings();

		const dtInbound = this.dtInbound();
		this.t -= dtInbound;
		this.possessionLength = 0;
		this.isClockRunning = true; // Set after computing dtIinbound!

		const clockFactor = this.getClockFactor();
		const outcome = this.getPossessionOutcome(clockFactor);

		// Swap o and d so that o will get another possession when they are swapped again at the beginning of the loop.
		if (
			outcome === "orb" ||
			outcome === "nonShootingFoul" ||
			outcome === "timeout" ||
			outcome === "outOfBoundsDefense"
		) {
			this.o = this.o === 1 ? 0 : 1;
			this.d = this.o === 1 ? 0 : 1;
		}

		this.updatePlayingTime(dtInbound + this.possessionLength);
		const injuries = this.injuries();

		this.prevPossessionOutcome = outcome;

		// With 0 on the clock, either the game is over (no subs) or the subs should happen at start of next period
		if (this.t > 0 && !this.elamDone) {
			this.doSubstitutionsIfDeadBall({
				type: "afterPossession",
				injuries,
			});
		}
	}

	isLateGame() {
		const quarter = this.team[0].stat.ptsQtrs.length;
		let lateGame;
		if (this.elamActive) {
			const ptsToTarget =
				this.elamTarget -
				Math.max(this.team[this.d].stat.pts, this.team[this.o].stat.pts);
			lateGame = ptsToTarget <= 15;
		} else {
			lateGame = quarter >= this.numPeriods && this.t < 6 * 60;
		}

		return lateGame;
	}

	/**
	 * Convert energy into fatigue, which can be multiplied by a rating to get a fatigue-adjusted value.
	 *
	 * @param {number} energy A player's energy level, from 0 to 1 (0 = lots of energy, 1 = none).
	 * @return {number} Fatigue, from 0 to 1 (0 = lots of fatigue, 1 = none).
	 */
	fatigue(energy: number, skip?: boolean): number {
		energy += 0.016;

		if (energy > 1) {
			energy = 1;
		}
		if (skip) {
			return energy;
		}

		// Late in games, or in OT, fatigue matters less
		if (this.isLateGame()) {
			const factor = this.elamActive ? 2 : 6 - this.t / 60;
			return (energy + factor) / (1 + factor);
		}

		return energy;
	}

	getFoulTroubleLimit() {
		const foulsNeededToFoulOut = g.get("foulsNeededToFoulOut");

		// No foul trouble in overtime or late in 4th quarter
		const quarter = this.team[0].stat.ptsQtrs.length;
		if (
			this.overtimes > 0 ||
			this.elamActive ||
			(quarter === this.numPeriods && this.t < 8 * 60)
		) {
			return foulsNeededToFoulOut;
		}

		const quarterLength = g.get("quarterLength");

		const gameCompletionFraction =
			(quarter - this.t / (quarterLength * 60)) / this.numPeriods;

		// For default settings, the limit by quarter is 2/3/5/5. (Last quarter is 5 because of that Math.min)
		let foulLimit = Math.ceil(gameCompletionFraction * foulsNeededToFoulOut);
		if (foulLimit < 2) {
			// Don't worry about 1 foul
			foulLimit = 2;
		} else if (foulLimit >= foulsNeededToFoulOut) {
			// Worry about actually fouling out, otherwise this does nothing
			foulLimit = foulsNeededToFoulOut - 1;
		}

		return foulLimit;
	}

	// 1 -> no foul trouble
	// less than 1 -> decreases
	getFoulTroubleFactor(p: PlayerGameSim, foulLimit: number) {
		if (p.stat.pf === foulLimit) {
			// More likely to sub off at limit
			return 0.75;
		} else if (p.stat.pf > foulLimit) {
			// Very likely to sub off beyond limit
			return 0.1;
		}

		return 1;
	}

	/**
	 * Perform appropriate substitutions.
	 *
	 * Can this be sped up?
	 *
	 * @return {boolean} true if a substitution occurred, false otherwise.
	 */
	updatePlayersOnCourt({
		recordStarters = false,
		shooter = undefined,
	}: {
		recordStarters?: boolean;
		shooter?: PlayerNumOnCourt;
	} = {}) {
		let substitutions = false;
		let blowout = false;
		const lateGame = this.isLateGame();

		const foulsNeededToFoulOut = g.get("foulsNeededToFoulOut");

		if (this.o !== undefined && this.d !== undefined) {
			const diff = Math.abs(
				this.team[this.d].stat.pts - this.team[this.o].stat.pts,
			);
			const quarter = this.team[this.o].stat.ptsQtrs.length;
			if (this.elamActive) {
				const ptsToTarget =
					this.elamTarget -
					Math.max(this.team[this.d].stat.pts, this.team[this.o].stat.pts);
				blowout = diff >= 20 && ptsToTarget < diff;
			} else {
				blowout =
					quarter === this.numPeriods &&
					((diff >= 30 && this.t < 12 * 60) ||
						(diff >= 25 && this.t < 9 * 60) ||
						(diff >= 20 && this.t < 7 * 60) ||
						(diff >= 15 && this.t < 3 * 60) ||
						(diff >= 10 && this.t < 1 * 60));
			}
		}

		const foulLimit = this.getFoulTroubleLimit();

		for (const t of teamNums) {
			const getOvrs = (includeFouledOut: boolean) => {
				// Overall values scaled by fatigue, etc
				const ovrs: number[] = [];

				for (let p = 0; p < this.team[t].player.length; p++) {
					// Injured or fouled out players can't play
					if (
						this.team[t].player[p].injured ||
						(!includeFouledOut &&
							foulsNeededToFoulOut > 0 &&
							this.team[t].player[p].stat.pf >= foulsNeededToFoulOut)
					) {
						ovrs[p] = -Infinity;
					} else {
						ovrs[p] =
							this.team[t].player[p].valueNoPot *
							this.fatigue(this.team[t].player[p].stat.energy) *
							(!lateGame ? random.uniform(0.9, 1.1) : 1);

						if (!this.allStarGame) {
							ovrs[p] *= this.team[t].player[p].ptModifier;
						}

						// Also scale based on margin late in games, so stars play less in blowouts (this doesn't really work that well, but better than nothing)
						if (blowout) {
							ovrs[p] *= (p + 1) / 10;
						} else {
							// If it's not a blowout, worry about foul trouble
							const foulTroubleFactor = this.getFoulTroubleFactor(
								this.team[t].player[p],
								foulLimit,
							);
							ovrs[p] *= foulTroubleFactor;
						}
					}
				}

				return ovrs;
			};

			const numEligiblePlayers = (ovrs: number[]) => {
				let count = 0;
				for (const ovr of ovrs) {
					if (ovr > -Infinity) {
						count += 1;
					}
				}

				return count;
			};

			let ovrs = getOvrs(false);

			// What if too many players fouled out? Play them. Ideally would force non fouled out players to play first, but whatever. Without this, it would only play bottom of the roster guys (tied at -Infinity)
			if (numEligiblePlayers(ovrs) < this.numPlayersOnCourt) {
				ovrs = getOvrs(true);
			}

			const ovrsOnCourt = this.playersOnCourt[t].map(p => ovrs[p]);

			// Sub off the lowest ovr guy first
			for (const pp of getSortedIndexes(ovrsOnCourt)) {
				const p = this.playersOnCourt[t][pp];
				const onCourtIsIneligible = ovrs[p] === -Infinity;
				this.playersOnCourt[t][pp] = p; // Don't sub out guy shooting FTs!

				if (t === this.o && pp === shooter) {
					continue;
				}

				// Loop through bench players (in order of current roster position) to see if any should be subbed in)
				for (let b = 0; b < this.team[t].player.length; b++) {
					if (this.playersOnCourt[t].includes(b)) {
						continue;
					}

					const benchIsValidAndBetter =
						this.team[t].player[p].stat.courtTime > 2 &&
						this.team[t].player[b].stat.benchTime > 2 &&
						ovrs[b] > ovrs[p];
					const benchIsEligible = ovrs[b] !== -Infinity;

					if (
						benchIsValidAndBetter ||
						(onCourtIsIneligible && benchIsEligible)
					) {
						// Check if position of substitute makes for a valid lineup
						const pos: string[] = [];

						for (let j = 0; j < this.playersOnCourt[t].length; j++) {
							if (j !== pp) {
								pos.push(this.team[t].player[this.playersOnCourt[t][j]].pos);
							}
						}

						pos.push(this.team[t].player[b].pos);

						// Requre 2 Gs (or 1 PG) and 2 Fs (or 1 C)
						let numG = 0;
						let numPG = 0;
						let numF = 0;
						let numC = 0;

						for (let j = 0; j < pos.length; j++) {
							if (pos[j].includes("G")) {
								numG += 1;
							}

							if (pos[j] === "PG") {
								numPG += 1;
							}

							if (pos[j].includes("F")) {
								numF += 1;
							}

							if (pos[j] === "C") {
								numC += 1;
							}
						}

						const cutoff =
							this.numPlayersOnCourt >= 5
								? 2
								: this.numPlayersOnCourt >= 3
									? 1
									: 0;
						if (
							(numG < cutoff && numPG === 0) ||
							(numF < cutoff && numC === 0)
						) {
							if (
								this.fatigue(this.team[t].player[p].stat.energy) > 0.728 &&
								!onCourtIsIneligible
							) {
								// Exception for ridiculously tired players, so really unbalanced teams won't play starters whole game
								continue;
							}
						}

						substitutions = true;

						// Substitute player
						this.playersOnCourt[t][pp] = b;
						this.team[t].player[b].stat.courtTime = random.uniform(-2, 2);
						this.team[t].player[b].stat.benchTime = random.uniform(-2, 2);
						this.team[t].player[p].stat.courtTime = random.uniform(-2, 2);
						this.team[t].player[p].stat.benchTime = random.uniform(-2, 2);

						/*// Keep track of deviations from the normal starting lineup for the play-by-play
						if (this.playByPlay !== undefined) {
							this.playByPlay.push({
								type: "sub",
								t,
								on: this.team[t].player[b].id,
								off: this.team[t].player[p].id,
							});
						}*/

						// It's only a "substitution" if it's not the starting lineup
						if (!recordStarters) {
							this.playByPlay.logEvent({
								type: "sub",
								t,
								pid: this.team[t].player[b].id,
								pidOff: this.team[t].player[p].id,
								clock: this.t,
							});
						}

						break;
					}
				}
			}
		}

		// Record starters if that hasn't been done yet. This should run the first time this function is called, and never again.
		if (recordStarters) {
			for (const t of teamNums) {
				for (let p = 0; p < this.team[t].player.length; p++) {
					if (this.playersOnCourt[t].includes(p)) {
						this.recordStat(t, p, "gs");
					}
				}
			}
		}

		return substitutions;
	}

	/**
	 * Update synergy.
	 *
	 * This should be called after this.updatePlayersOnCourt as it only produces different output when the players on the court change.
	 */
	updateSynergy() {
		for (const t of teamNums) {
			// Count all the *fractional* skills of the active players on a team (including duplicates)
			const skillsCount = {
				"3": 0,
				A: 0,
				B: 0,
				Di: 0,
				Dp: 0,
				Po: 0,
				Ps: 0,
				R: 0,
			};

			for (let i = 0; i < this.numPlayersOnCourt; i++) {
				const p = this.playersOnCourt[t][i];

				// 1 / (1 + e^-(15 * (x - 0.61))) from 0 to 1
				// 0.61 is not always used - keep in sync with skills.js!

				skillsCount["3"] += helpers.sigmoid(
					this.team[t].player[p].compositeRating.shootingThreePointer,
					15,
					0.59,
				);
				skillsCount.A += helpers.sigmoid(
					this.team[t].player[p].compositeRating.athleticism,
					15,
					0.63,
				);
				skillsCount.B += helpers.sigmoid(
					this.team[t].player[p].compositeRating.dribbling,
					15,
					0.68,
				);
				skillsCount.Di += helpers.sigmoid(
					this.team[t].player[p].compositeRating.defenseInterior,
					15,
					0.57,
				);
				skillsCount.Dp += helpers.sigmoid(
					this.team[t].player[p].compositeRating.defensePerimeter,
					15,
					0.61,
				);
				skillsCount.Po += helpers.sigmoid(
					this.team[t].player[p].compositeRating.shootingLowPost,
					15,
					0.61,
				);
				skillsCount.Ps += helpers.sigmoid(
					this.team[t].player[p].compositeRating.passing,
					15,
					0.63,
				);
				skillsCount.R += helpers.sigmoid(
					this.team[t].player[p].compositeRating.rebounding,
					15,
					0.61,
				);
			}

			// Base offensive synergy
			this.team[t].synergy.off = 0;
			this.team[t].synergy.off += 5 * helpers.sigmoid(skillsCount["3"], 3, 2); // 5 / (1 + e^-(3 * (x - 2))) from 0 to 5

			this.team[t].synergy.off +=
				3 * helpers.sigmoid(skillsCount.B, 15, 0.75) +
				helpers.sigmoid(skillsCount.B, 5, 1.75); // 3 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) from 0 to 5

			this.team[t].synergy.off +=
				3 * helpers.sigmoid(skillsCount.Ps, 15, 0.75) +
				helpers.sigmoid(skillsCount.Ps, 5, 1.75) +
				helpers.sigmoid(skillsCount.Ps, 5, 2.75); // 3 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) + 1 / (1 + e^-(5 * (x - 2.75))) from 0 to 5

			this.team[t].synergy.off += helpers.sigmoid(skillsCount.Po, 15, 0.75); // 1 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.off +=
				helpers.sigmoid(skillsCount.A, 15, 1.75) +
				helpers.sigmoid(skillsCount.A, 5, 2.75); // 1 / (1 + e^-(15 * (x - 1.75))) + 1 / (1 + e^-(5 * (x - 2.75))) from 0 to 5

			this.team[t].synergy.off /= 17; // Punish teams for not having multiple perimeter skills

			const perimFactor =
				helpers.bound(
					Math.sqrt(1 + skillsCount.B + skillsCount.Ps + skillsCount["3"]) - 1,
					0,
					2,
				) / 2; // Between 0 and 1, representing the perimeter skills

			this.team[t].synergy.off *= 0.5 + 0.5 * perimFactor; // Defensive synergy

			this.team[t].synergy.def = 0;
			this.team[t].synergy.def += helpers.sigmoid(skillsCount.Dp, 15, 0.75); // 1 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.def += 2 * helpers.sigmoid(skillsCount.Di, 15, 0.75); // 2 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.def +=
				helpers.sigmoid(skillsCount.A, 5, 2) +
				helpers.sigmoid(skillsCount.A, 5, 3.25); // 1 / (1 + e^-(5 * (x - 2))) + 1 / (1 + e^-(5 * (x - 3.25))) from 0 to 5

			this.team[t].synergy.def /= 6; // Rebounding synergy

			this.team[t].synergy.reb = 0;
			this.team[t].synergy.reb +=
				helpers.sigmoid(skillsCount.R, 15, 0.75) +
				helpers.sigmoid(skillsCount.R, 5, 1.75); // 1 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) from 0 to 5

			this.team[t].synergy.reb /= 4;
		}
	}

	/**
	 * Update team composite ratings.
	 *
	 * This should be called once every possession, after this.updatePlayersOnCourt and this.updateSynergy as they influence output, to update the team composite ratings based on the players currently on the court.
	 */
	updateTeamCompositeRatings() {
		// Only update ones that are actually used
		const toUpdate = [
			"dribbling",
			"passing",
			"rebounding",
			"defense",
			"defensePerimeter",
			"blocking",
		];

		const foulLimit = this.getFoulTroubleLimit();

		// Scale composite ratings
		for (let k = 0; k < teamNums.length; k++) {
			const t = teamNums[k];
			const oppT = teamNums[1 - k];
			const diff = this.team[t].stat.pts - this.team[oppT].stat.pts;

			const perfFactor = 1 - 0.2 * Math.tanh(diff / 60);

			for (let j = 0; j < toUpdate.length; j++) {
				const rating = toUpdate[j];
				this.team[t].compositeRating[rating] = 0;

				for (let i = 0; i < this.numPlayersOnCourt; i++) {
					const p = this.playersOnCourt[t][i];

					let foulLimitFactor = 1;
					if (
						rating === "defense" ||
						rating === "defensePerimeter" ||
						rating === "blocking"
					) {
						const pf = this.team[t].player[p].stat.pf;
						if (pf === foulLimit) {
							foulLimitFactor *= 0.9;
						} else if (pf > foulLimit) {
							foulLimitFactor *= 0.75;
						}
					}

					this.team[t].compositeRating[rating] +=
						this.team[t].player[p].compositeRating[rating] *
						this.fatigue(this.team[t].player[p].stat.energy) *
						perfFactor *
						foulLimitFactor;
				}

				this.team[t].compositeRating[rating] /= 5;
			}

			this.team[t].compositeRating.dribbling +=
				this.synergyFactor * this.team[t].synergy.off;
			this.team[t].compositeRating.passing +=
				this.synergyFactor * this.team[t].synergy.off;
			this.team[t].compositeRating.rebounding +=
				this.synergyFactor * this.team[t].synergy.reb;
			this.team[t].compositeRating.defense +=
				this.synergyFactor * this.team[t].synergy.def;
			this.team[t].compositeRating.defensePerimeter +=
				this.synergyFactor * this.team[t].synergy.def;
			this.team[t].compositeRating.blocking +=
				this.synergyFactor * this.team[t].synergy.def;
		}
	}

	/**
	 * Update playing time stats.
	 *
	 * This should be called once every possession, at the end, to record playing time and bench time for players.
	 */
	updatePlayingTime(possessionLength: number) {
		const min = possessionLength / 60;
		for (const t of teamNums) {
			// Update minutes (overall, court, and bench)
			for (let p = 0; p < this.team[t].player.length; p++) {
				if (this.playersOnCourt[t].includes(p)) {
					this.recordStat(t, p, "min", min);
					this.recordStat(t, p, "courtTime", min);

					// This used to be 0.04. Increase more to lower PT
					this.recordStat(
						t,
						p,
						"energy",
						-min *
							this.fatigueFactor *
							(1 - this.team[t].player[p].compositeRating.endurance),
					);

					if (this.team[t].player[p].stat.energy < 0) {
						this.team[t].player[p].stat.energy = 0;
					}
				} else {
					this.recordStat(t, p, "benchTime", min);
					this.recordStat(t, p, "energy", min * 0.094);

					if (this.team[t].player[p].stat.energy > 1) {
						this.team[t].player[p].stat.energy = 1;
					}
				}
			}
		}
	}

	/**
	 * See if any injuries occurred this possession, and handle the consequences.
	 *
	 * This doesn't actually compute the type of injury, it just determines if a player is injured bad enough to miss the rest of the game.
	 */
	injuries() {
		if ((g as any).disableInjuries) {
			return false;
		}

		let newInjury = false;
		let baseRate = this.baseInjuryRate;

		// Modulate by pace - since injuries are evaluated per possession, but really probably happen per minute played
		baseRate *= 100 / g.get("pace");

		for (const t of teamNums) {
			for (let p = 0; p < this.team[t].player.length; p++) {
				// Only players on the court can be injured
				if (this.playersOnCourt[t].includes(p)) {
					const injuryRate = getInjuryRate(
						baseRate,
						this.team[t].player[p].age,
						this.team[t].player[p].injury.playingThrough,
					);

					if (Math.random() < injuryRate) {
						this.team[t].player[p].injured = true;
						this.team[t].player[p].newInjury = true;
						newInjury = true;
						this.playByPlay.logEvent({
							type: "injury",
							t,
							pid: this.team[t].player[p].id,
							clock: this.t,
						});
					}
				}
			}
		}

		return newInjury;
	}

	getNumFoulsUntilBonus() {
		const foulsUntilBonus = g.get("foulsUntilBonus");

		// Different cutoff for OT/regulation
		const normal =
			foulsUntilBonus[this.overtimes >= 1 ? 1 : 0] -
			this.foulsThisQuarter[this.d];

		// Also check last 2 minutes limit, when appropriate;
		if (this.t <= 2 * 60) {
			return Math.min(
				normal,
				foulsUntilBonus[2] - this.foulsLastTwoMinutes[this.d],
			);
		}

		// Not in last 2 minutes
		return normal;
	}

	advanceClockSeconds(seconds: number) {
		if (this.t === 0) {
			throw new Error("advanceClockSeconds called with 0 already on the clock");
		}

		// Adjust for pace up until the last minute, so we don't make end of game stuff too weird
		const secondsAdjusted = this.t > 60 ? seconds / this.paceFactor : seconds;

		if (secondsAdjusted > this.t) {
			this.possessionLength += this.t;
			this.t = 0;
		} else {
			this.possessionLength += secondsAdjusted;
			this.t -= secondsAdjusted;
		}
	}

	timeoutAdvancesBall() {
		return (
			this.team[this.o].stat.ptsQtrs.length >= this.numPeriods &&
			this.t <= TIMEOUTS_STOP_CLOCK * 60
		);
	}

	doOutOfBounds(probOffenseRetainsBall: number) {
		this.isClockRunning = false;
		const offenseRetainsBall = Math.random() < probOffenseRetainsBall;
		this.playByPlay.logEvent({
			type: "outOfBounds",
			on: offenseRetainsBall ? "defense" : "offense",
			t: offenseRetainsBall ? this.o : this.d,
			clock: this.t,
		});
		return offenseRetainsBall ? "outOfBoundsDefense" : "outOfBoundsOffense";
	}

	getPossessionOutcome(clockFactor: ClockFactor): PossessionOutcome {
		// If winning at end of game, just run out the clock
		if (clockFactor === "runOutClock") {
			this.advanceClockSeconds(Infinity);
			this.playByPlay.logEvent({
				type: "endOfPeriod",
				t: this.o,
				clock: this.t,
				reason: "runOutClock",
			});
			return "endOfPeriod";
		}

		const tipInFromOutOfBounds =
			this.t <= TIP_IN_ONLY_LIMIT && this.sideOutOfBounds();
		const lateGamePutBack =
			this.prevPossessionOutcome === "orb" && this.t < 1.5;

		// With not much time on the clock at the end of a quarter, possession might end with the clock running out
		if (this.t <= 6 && !tipInFromOutOfBounds) {
			// When lateGamePutBack is true, more likely to get a shot up
			if (
				this.t <= 0.1 ||
				Math.random() > (this.t / 8) ** (1 / (lateGamePutBack ? 12 : 6))
			) {
				const period = this.team[this.o].stat.ptsQtrs.length;
				const pointDifferential =
					this.team[this.o].stat.pts - this.team[this.d].stat.pts;
				this.advanceClockSeconds(Infinity);
				this.playByPlay.logEvent({
					type: "endOfPeriod",
					t: this.o,
					clock: this.t,
					reason:
						clockFactor === "intentionalFoul"
							? "intentionalFoul"
							: period >= this.numPeriods && pointDifferential > 0
								? "runOutClock"
								: "noShot",
				});
				return "endOfPeriod";
			}
		}

		const timeoutAdvancesBall = this.timeoutAdvancesBall();
		const possessionStartsInFrontcourt =
			this.prevPossessionOutcome === "orb" ||
			this.prevPossessionOutcome === "nonShootingFoul" ||
			(this.prevPossessionOutcome === "timeout" && timeoutAdvancesBall);

		if (!possessionStartsInFrontcourt && timeoutAdvancesBall && this.t < 120) {
			const pointDifferential =
				this.team[this.o].stat.pts - this.team[this.d].stat.pts;
			if (pointDifferential < 0 && this.timeouts[this.o] > 0) {
				// If comeback is very unlikely, no point in taking a timeout
				let comebackAttempt = false;
				if (this.t > 60 && pointDifferential >= -21) {
					comebackAttempt = true;
				} else if (this.t > 30 && pointDifferential >= -18) {
					comebackAttempt = true;
				} else if (this.t > 20 && pointDifferential >= -15) {
					comebackAttempt = true;
				} else if (this.t > 10 && pointDifferential >= -12) {
					comebackAttempt = true;
				} else if (this.t > 5 && pointDifferential >= -9) {
					comebackAttempt = true;
				} else if (this.t > 2 && pointDifferential >= -6) {
					comebackAttempt = true;
				} else if (pointDifferential >= -3) {
					comebackAttempt = true;
				}

				if (comebackAttempt) {
					let takeTimeout = false;
					if (this.t < 5) {
						// If time is really low, definitely take a timeout to advance ball
						takeTimeout = true;
					} else if (this.t < 25 && this.isClockRunning) {
						// If time is somewhat low, definitely take a timeout to advance ball
						takeTimeout = true;
					} else if (this.t < 60 && this.isClockRunning) {
						// If time is a little low, sometimes take a timeout to advance ball
						if ((this.t - 25) / (60 - 25) < Math.random()) {
							takeTimeout = true;
						}
					}

					if (takeTimeout) {
						this.isClockRunning = false;
						this.timeouts[this.o] -= 1;
						this.logTimeouts();
						this.playByPlay.logEvent({
							type: "timeout",
							clock: this.t,
							t: this.o,
							numLeft: this.timeouts[this.o],
							advancesBall: this.timeoutAdvancesBall(),
						});
						return "timeout";
					}
				}
			}
		}

		// Simulate backcourt events, only if necessary
		if (!possessionStartsInFrontcourt) {
			// Turnover in backcourt? Actually for possessions starting in backcourt, currently this simulates
			if (this.t > 0.2 && Math.random() < this.probTov()) {
				let dt;
				if (this.t < 8 || clockFactor === "intentionalFoul") {
					dt = random.uniform(0.1, Math.min(this.t, 5));
				} else {
					dt = random.uniform(1, 8);
				}
				this.advanceClockSeconds(dt);
				return this.doTov();
			}

			// Offense loses ball out of bounds, but retains possession
			if (Math.random() < 0.01) {
				return this.doOutOfBounds(1);
			}
		}

		const ratios = this.ratingArray("usage", this.o, 1.25);
		const shooter = pickPlayer(ratios);

		// Non-shooting foul?
		if (
			Math.random() < 0.08 * g.get("foulRateFactor") ||
			clockFactor === "intentionalFoul"
		) {
			let dt;
			if (clockFactor === "intentionalFoul") {
				if (this.t < 8) {
					if (this.t <= 0.2 || (this.t < 1 && Math.random() > this.t)) {
						// Time ran out while trying to foul
						this.advanceClockSeconds(Infinity);
						this.playByPlay.logEvent({
							type: "endOfPeriod",
							t: this.o,
							clock: this.t,
							reason: "intentionalFoul",
						});
						return "endOfPeriod";
					}
					dt = random.uniform(0.1, Math.min(this.t - 0.2, 4));
				} else {
					dt = random.uniform(1, 5);
				}
			} else {
				if (this.t < 2) {
					dt = random.uniform(0, this.t);
				} else {
					dt = random.uniform(
						1,
						Math.min(this.t, SHOT_CLOCK - this.possessionLength),
					);
				}
			}
			this.advanceClockSeconds(dt);
			this.isClockRunning = false;

			// In the bonus? Checks offset by 1, because the foul counter won't increment until doPf is called below
			const numFoulsUntilBonus = this.getNumFoulsUntilBonus();
			const inBonus = numFoulsUntilBonus <= 1;

			if (this.t <= 0) {
				throw new Error("Clock at 0 for non-shooting foul");
			}

			if (inBonus) {
				this.doPf({ t: this.d, type: "pfBonus", shooter });
			} else {
				this.doPf({ t: this.d, type: "pfNonShooting" });
			}

			if (inBonus) {
				return this.doFt(shooter, 2);
			}

			return "nonShootingFoul";
		}

		// Time to advance ball to frontcourt
		if (!possessionStartsInFrontcourt) {
			const upperLimitMin =
				clockFactor === "catchUp" ? 1 : clockFactor === "maintainLead" ? 4 : 2;
			const min = Math.max(Math.min(this.t - 0.3, upperLimitMin), 0);
			const upperLimitMax =
				clockFactor === "catchUp" ? 4 : clockFactor === "maintainLead" ? 8 : 6;
			const max = Math.max(Math.min(this.t - 0.3, upperLimitMax), 0);
			const dt = random.uniform(min, max);
			this.advanceClockSeconds(dt);
		}

		// Shot!
		return this.doShot(
			shooter,
			clockFactor,
			possessionStartsInFrontcourt,
			tipInFromOutOfBounds,
			lateGamePutBack,
		);
	}

	/**
	 * Probability of the current possession ending in a turnover.
	 *
	 * @return {number} Probability from 0 to 1.
	 */
	probTov() {
		return boundProb(
			(g.get("turnoverFactor") *
				(0.14 * this.team[this.d].compositeRating.defense)) /
				(0.5 *
					(this.team[this.o].compositeRating.dribbling +
						this.team[this.o].compositeRating.passing)),
		);
	}

	/**
	 * Turnover.
	 *
	 * @return {string} Either "tov" or "stl" depending on whether the turnover was caused by a steal or not.
	 */
	doTov(pOverride?: number) {
		let p;
		if (pOverride) {
			p = pOverride;
		} else {
			const ratios = this.ratingArray("turnovers", this.o, 2);
			p = this.playersOnCourt[this.o][pickPlayer(ratios)];
		}
		this.recordStat(this.o, p, "tov");

		if (this.probStl() > Math.random()) {
			return this.doStl(p);
		}

		// Ball could go out of bounds on the turnover
		const outOfBounds = Math.random() < 0.3;
		if (outOfBounds) {
			this.isClockRunning = false;
		}

		this.playByPlay.logEvent({
			type: "tov",
			t: this.o,
			pid: this.team[this.o].player[p].id,
			outOfBounds,
			clock: this.t,
		});
		return outOfBounds ? "outOfBoundsOffense" : ("tov" as const);
	}

	/**
	 * Probability that a turnover occurring in this possession is a steal.
	 *
	 * @return {number} Probability from 0 to 1.
	 */
	probStl() {
		return boundProb(
			g.get("stealFactor") *
				((0.45 * this.team[this.d].compositeRating.defensePerimeter) /
					(0.5 *
						(this.team[this.o].compositeRating.dribbling +
							this.team[this.o].compositeRating.passing))),
		);
	}

	/**
	 * Steal.
	 *
	 * @return {string} Currently always returns "stl".
	 */
	doStl(pStoleFrom: number) {
		// Ball could go out of bounds on the steal
		const outOfBounds = Math.random() < 0.1;
		if (outOfBounds) {
			this.isClockRunning = false;
		}

		const ratios = this.ratingArray("stealing", this.d, 4);
		const p = this.playersOnCourt[this.d][pickPlayer(ratios)];
		this.recordStat(this.d, p, "stl");
		this.playByPlay.logEvent({
			type: "stl",
			t: this.d,
			pid: this.team[this.d].player[p].id,
			pidTov: this.team[this.o].player[pStoleFrom].id,
			outOfBounds,
			clock: this.t,
		});
		return outOfBounds ? "outOfBoundsOffense" : ("stl" as const);
	}

	sideOutOfBounds() {
		return (
			this.prevPossessionOutcome === "nonShootingFoul" ||
			(this.prevPossessionOutcome === "timeout" &&
				this.timeoutAdvancesBall()) ||
			this.prevPossessionOutcome === "outOfBoundsDefense" ||
			this.prevPossessionOutcome === "outOfBoundsOffense"
		);
	}

	doShot(
		shooter: PlayerNumOnCourt,
		clockFactor: ClockFactor,
		possessionStartsInFrontcourt: boolean,
		tipInFromOutOfBounds: boolean,
		lateGamePutBack: boolean,
	) {
		const putBack = lateGamePutBack; // Eventually use this in more situations

		// If it's a putback, override shooter selection with whoever got the last offensive rebound
		if (putBack) {
			shooter = this.lastOrbPlayer;
		}

		const p = this.playersOnCourt[this.o][shooter];
		const currentFatigue = this.fatigue(
			this.team[this.o].player[p].stat.energy,
		);

		// Is this an "assisted" attempt (i.e. an assist will be recorded if it's made)
		let passer: PlayerNumOnCourt | undefined;
		if (
			(tipInFromOutOfBounds ||
				(this.t > 1 && this.probAst() > Math.random())) &&
			!putBack &&
			this.numPlayersOnCourt > 1
		) {
			const ratios = this.ratingArray("passing", this.o, 10);
			passer = pickPlayer(ratios, shooter);
		}

		// Ball is already in frontcourt. How long until the shot goes up?
		let lowerLimit = Math.min(this.t / 2, 2);
		let upperLimit = Math.min(SHOT_CLOCK - this.possessionLength, this.t - 0.1);
		if (upperLimit < 0) {
			lowerLimit = 0;
			upperLimit = 0;
		}

		// Time from the ball being in the frontcourt to a shot
		let dt;
		if (tipInFromOutOfBounds) {
			dt = 0;
		} else if (putBack) {
			dt = random.uniform(Math.min(this.t, 0.1), Math.min(this.t, 1));
		} else if (this.t <= 0.3) {
			dt = random.uniform(0, upperLimit);
		} else if (this.t < 1) {
			// Less than 1 second left
			dt = random.uniform(0.2, upperLimit);
		} else if (lowerLimit > upperLimit) {
			// Less than 2 seconds left
			dt = random.uniform(0.5, upperLimit);
		} else if (upperLimit - lowerLimit < 4) {
			// Due to being near the end of the quarter, upperLimit and lowerLimit are close
			dt = random.uniform(lowerLimit, upperLimit);
		} else {
			const mean =
				clockFactor === "catchUp"
					? 5
					: clockFactor === "maintainLead"
						? 12
						: 6.25;

			dt = random.truncGauss(mean, 5, lowerLimit, upperLimit);
		}
		this.advanceClockSeconds(dt);

		// Turnovers for possessions that start in the frontcourt only (other turnovers are already handled above for the entire possession, although I guess it'd be better to do it here)
		if (possessionStartsInFrontcourt) {
			if (Math.random() < this.probTov()) {
				let pTurnover;
				if (tipInFromOutOfBounds) {
					pTurnover = passer;
				} else if (putBack) {
					pTurnover = shooter;
				}
				return this.doTov(pTurnover);
			}

			// Offense loses ball out of bounds, but retains possession
			if (Math.random() < 0.01) {
				return this.doOutOfBounds(1);
			}
		}

		let shootingThreePointerScaled =
			this.team[this.o].player[p].compositeRating.shootingThreePointer;

		// Too many players shooting 3s at the high end - scale 0.55-1.0 to 0.55-0.85
		if (shootingThreePointerScaled > 0.55) {
			shootingThreePointerScaled =
				0.55 + (shootingThreePointerScaled - 0.55) * (0.3 / 0.45);
		}

		// Too many players shooting 3s at the low end - scale 0.35-0.45 to 0.1-0.45, and 0-0.35 to 0-0.1
		let shootingThreePointerScaled2 = shootingThreePointerScaled;
		if (shootingThreePointerScaled2 < 0.35) {
			shootingThreePointerScaled2 =
				0 + shootingThreePointerScaled2 * (0.1 / 0.35);
		} else if (shootingThreePointerScaled2 < 0.45) {
			shootingThreePointerScaled2 =
				0.1 + (shootingThreePointerScaled2 - 0.35) * (0.35 / 0.1);
		}

		// In some situations (4th quarter late game situations depending on score, and last second heaves in other quarters) players shoot more 3s
		const diff = this.team[this.d].stat.pts - this.team[this.o].stat.pts;
		const quarter = this.team[this.o].stat.ptsQtrs.length;
		const forceThreePointer =
			(diff >= 3 &&
				diff <= 10 &&
				this.t <= 10 &&
				quarter >= this.numPeriods &&
				Math.random() > this.t / 60) ||
			(quarter < this.numPeriods &&
				this.t < 2 &&
				this.possessionLength <= 3 &&
				!this.sideOutOfBounds());

		const rushed = this.t < 2 && this.possessionLength < 6;

		if (this.t <= 0) {
			throw new Error("Clock at 0 when a shot is taken");
		}

		// Pick the type of shot and store the success rate (with no defense) in probMake and the probability of an and one in probAndOne
		let probAndOne;
		let probMake;
		let probMissAndFoul;
		let type: ShotType;

		if (tipInFromOutOfBounds) {
			type = "tipIn";
			probMissAndFoul = 0.02;
			probMake =
				0.05 + this.team[this.o].player[p].compositeRating.shootingAtRim * 0.1;
			probAndOne = 0.01;

			this.playByPlay.logEvent({
				type: "fgaTipIn",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				pidPass: this.team[this.o].player[passer!].id,
				clock: this.t,
			});
		} else if (putBack) {
			type = "putBack";
			probMissAndFoul = 0.37;
			probMake =
				this.team[this.o].player[p].compositeRating.shootingAtRim * 0.41 + 0.54;
			probAndOne = 0.25;

			if (lateGamePutBack) {
				probMissAndFoul *= 0.75;
				probMake *= 0.75;
				probAndOne *= 0.75;
			}

			this.playByPlay.logEvent({
				type: "fgaPutBack",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (
			forceThreePointer ||
			Math.random() <
				0.67 * shootingThreePointerScaled2 * g.get("threePointTendencyFactor")
		) {
			// Three pointer
			type = "threePointer";
			probMissAndFoul = 0.02;
			probMake = shootingThreePointerScaled * 0.3 + 0.36;
			probAndOne = 0.01;

			// Better shooting in the ASG, why not?
			if (this.allStarGame) {
				probMake += 0.02;
			}
			probMake *= g.get("threePointAccuracyFactor");

			this.playByPlay.logEvent({
				type: g.get("threePointers") ? "fgaTp" : "fgaTpFake",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
				desperation: rushed && forceThreePointer,
			});
		} else {
			const r1 =
				0.8 *
				Math.random() *
				this.team[this.o].player[p].compositeRating.shootingMidRange;
			const r2 =
				Math.random() *
				(this.team[this.o].player[p].compositeRating.shootingAtRim +
					this.synergyFactor *
						(this.team[this.o].synergy.off - this.team[this.d].synergy.def)); // Synergy makes easy shots either more likely or less likely

			const r3 =
				Math.random() *
				(this.team[this.o].player[p].compositeRating.shootingLowPost +
					this.synergyFactor *
						(this.team[this.o].synergy.off - this.team[this.d].synergy.def)); // Synergy makes easy shots either more likely or less likely

			if (r1 > r2 && r1 > r3) {
				// Two point jumper
				type = "midRange";
				probMissAndFoul = 0.07;
				probMake =
					this.team[this.o].player[p].compositeRating.shootingMidRange * 0.32 +
					0.42;
				probAndOne = 0.05;
				this.playByPlay.logEvent({
					type: "fgaMidRange",
					t: this.o,
					pid: this.team[this.o].player[p].id,
					clock: this.t,
				});
			} else if (r2 > r3) {
				// Dunk, fast break or half court
				type = "atRim";
				probMissAndFoul = 0.37;
				probMake =
					this.team[this.o].player[p].compositeRating.shootingAtRim * 0.41 +
					0.54;
				probAndOne = 0.25;
				this.playByPlay.logEvent({
					type: "fgaAtRim",
					t: this.o,
					pid: this.team[this.o].player[p].id,
					clock: this.t,
				});
			} else {
				// Post up
				type = "lowPost";
				probMissAndFoul = 0.33;
				probMake =
					this.team[this.o].player[p].compositeRating.shootingLowPost * 0.32 +
					0.34;
				probAndOne = 0.15;
				this.playByPlay.logEvent({
					type: "fgaLowPost",
					t: this.o,
					pid: this.team[this.o].player[p].id,
					clock: this.t,
				});
			}

			// Better shooting in the ASG, why not?
			if (this.allStarGame) {
				probMake += 0.1;
			}

			probMake *= g.get("twoPointAccuracyFactor");
		}

		if (this.probBlk() > Math.random()) {
			return this.doBlk(shooter, type); // orb or drb
		}

		let foulFactor =
			0.65 *
			(this.team[this.o].player[p].compositeRating.drawingFouls / 0.5) ** 2 *
			g.get("foulRateFactor");

		if (this.allStarGame) {
			foulFactor *= 0.4;
		}

		probMissAndFoul *= foulFactor;
		probAndOne *= foulFactor;
		probMake =
			(probMake -
				0.25 * this.team[this.d].compositeRating.defense +
				this.synergyFactor *
					(this.team[this.o].synergy.off - this.team[this.d].synergy.def)) *
			currentFatigue;

		if (!tipInFromOutOfBounds) {
			// Adjust probMake for end of quarter situations, where shot quality will be lower without much time
			if (rushed) {
				probMake *= Math.sqrt(this.possessionLength / 8);
			}

			// Assisted shots are easier
			if (passer !== undefined) {
				probMake += 0.025;
			}
		}

		const advanceClock = () => {
			if (!this.isClockRunning) {
				// Time between shot and foul being called, rarely
				if (Math.random() < 0.1) {
					this.advanceClockSeconds(random.uniform(0, 0.2));
				}
				return;
			}

			// Time between the shot being released and the shot being decided (either make or miss, not including time to rebound)
			this.advanceClockSeconds(
				random.uniform(
					...((type === "atRim" || type === "tipIn" || type === "putBack"
						? [0.2, 0.5]
						: type === "lowPost"
							? [0.7, 1.1]
							: type === "midRange"
								? [0.9, 1.3]
								: [1.2, 1.9]) as [number, number]),
				),
			);
		};

		// Make
		if (probMake > Math.random()) {
			const andOne = probAndOne > Math.random();
			if (andOne) {
				this.isClockRunning = false;
			}
			advanceClock();
			return this.doFg(shooter, passer, type, andOne);
		}

		// Miss, but fouled
		if (probMissAndFoul > Math.random()) {
			this.isClockRunning = false;
			advanceClock();
			const threePointer = type === "threePointer" && g.get("threePointers");

			this.doPf({ t: this.d, type: threePointer ? "pfTP" : "pfFG", shooter });

			if (threePointer) {
				return this.doFt(shooter, 3);
			}

			return this.doFt(shooter, 2);
		}

		// Miss
		advanceClock();
		this.recordStat(this.o, p, "fga");

		if (type === "tipIn") {
			this.recordStat(this.o, p, "fgaAtRim");
			this.playByPlay.logEvent({
				type: "missTipIn",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (type === "putBack") {
			this.recordStat(this.o, p, "fgaAtRim");
			this.playByPlay.logEvent({
				type: "missPutBack",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (type === "atRim") {
			this.recordStat(this.o, p, "fgaAtRim");
			this.playByPlay.logEvent({
				type: "missAtRim",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (type === "lowPost") {
			this.recordStat(this.o, p, "fgaLowPost");
			this.playByPlay.logEvent({
				type: "missLowPost",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (type === "midRange") {
			this.recordStat(this.o, p, "fgaMidRange");
			this.playByPlay.logEvent({
				type: "missMidRange",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		} else if (type === "threePointer") {
			this.recordStat(this.o, p, "tpa");
			this.playByPlay.logEvent({
				type: "missTp",
				t: this.o,
				pid: this.team[this.o].player[p].id,
				clock: this.t,
			});
		}

		return this.doReb();
	}

	/**
	 * Probability that a shot taken this possession is blocked.
	 *
	 * @return {number} Probability from 0 to 1.
	 */
	probBlk() {
		return (
			g.get("blockFactor") *
			0.2 *
			this.team[this.d].compositeRating.blocking ** 2
		);
	}

	/**
	 * Blocked shot.
	 *
	 * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
	 * @return {string} Output of this.doReb.
	 */
	doBlk(shooter: PlayerNumOnCourt, type: ShotType) {
		const p = this.playersOnCourt[this.o][shooter];
		this.recordStat(this.o, p, "ba");
		this.recordStat(this.o, p, "fga");

		if (type === "atRim" || type === "tipIn" || type === "putBack") {
			this.recordStat(this.o, p, "fgaAtRim");
		} else if (type === "lowPost") {
			this.recordStat(this.o, p, "fgaLowPost");
		} else if (type === "midRange") {
			this.recordStat(this.o, p, "fgaMidRange");
		} else if (type === "threePointer") {
			this.recordStat(this.o, p, "tpa");
		}

		const ratios = this.ratingArray("blocking", this.d, 10);
		const p2 = this.playersOnCourt[this.d][pickPlayer(ratios)];
		this.recordStat(this.d, p2, "blk");

		if (type === "tipIn") {
			this.playByPlay.logEvent({
				type: "blkTipIn",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		} else if (type === "putBack") {
			this.playByPlay.logEvent({
				type: "blkPutBack",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		} else if (type === "atRim") {
			this.playByPlay.logEvent({
				type: "blkAtRim",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		} else if (type === "lowPost") {
			this.playByPlay.logEvent({
				type: "blkLowPost",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		} else if (type === "midRange") {
			this.playByPlay.logEvent({
				type: "blkMidRange",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		} else if (type === "threePointer") {
			this.playByPlay.logEvent({
				type: "blkTp",
				t: this.d,
				pid: this.team[this.d].player[p2].id,
				clock: this.t,
			});
		}

		return this.doReb();
	}

	/**
	 * Field goal.
	 *
	 * Simulate a successful made field goal.
	 *
	 * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
	 * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the passing player, who will get an assist. -1 if no assist.
	 * @param {number} type 2 for a two pointer, 3 for a three pointer.
	 * @return {string} fg, orb, or drb (latter two are for and ones)
	 */
	doFg(
		shooter: PlayerNumOnCourt,
		passer: PlayerNumOnCourt | undefined,
		type: ShotType,
		andOne: boolean = false,
	) {
		const p = this.playersOnCourt[this.o][shooter];
		const pid = this.team[this.o].player[p].id;
		this.recordStat(this.o, p, "fga");
		this.recordStat(this.o, p, "fg");
		this.recordStat(this.o, p, "pts", 2); // 2 points for 2's

		let fouler;
		let pidFoul;
		if (andOne) {
			fouler = pickPlayer(this.ratingArray("fouling", this.d));
			const p2 = this.playersOnCourt[this.d][fouler];
			pidFoul = this.team[this.d].player[p2].id;
		}

		let pAst;
		let pidAst;
		if (passer !== undefined) {
			pAst = this.playersOnCourt[this.o][passer];
			pidAst = this.team[this.o].player[pAst].id;
		}

		if (type === "tipIn") {
			this.recordStat(this.o, p, "fgaAtRim");
			this.recordStat(this.o, p, "fgAtRim");
			this.playByPlay.logEvent({
				type: andOne ? "fgTipInAndOne" : "fgTipIn",
				t: this.o,
				pid,
				pidAst,
				clock: this.t,
			});
		} else if (type === "putBack") {
			this.recordStat(this.o, p, "fgaAtRim");
			this.recordStat(this.o, p, "fgAtRim");
			this.playByPlay.logEvent({
				type: andOne ? "fgPutBackAndOne" : "fgPutBack",
				t: this.o,
				pid,
				clock: this.t,
			});
		} else if (type === "atRim") {
			// Randomly pick a name to be dunked on
			let pidDefense;
			if (pidFoul !== undefined) {
				pidDefense = pidFoul;
			} else {
				const ratios = this.ratingArray("blocking", this.d, 5);
				const p = this.playersOnCourt[this.d][pickPlayer(ratios)];
				pidDefense = this.team[this.d].player[p].id;
			}

			this.recordStat(this.o, p, "fgaAtRim");
			this.recordStat(this.o, p, "fgAtRim");
			this.playByPlay.logEvent({
				type: andOne ? "fgAtRimAndOne" : "fgAtRim",
				t: this.o,
				pid,
				pidDefense,
				pidAst,
				clock: this.t,
			});
		} else if (type === "lowPost") {
			this.recordStat(this.o, p, "fgaLowPost");
			this.recordStat(this.o, p, "fgLowPost");
			this.playByPlay.logEvent({
				type: andOne ? "fgLowPostAndOne" : "fgLowPost",
				t: this.o,
				pid,
				pidAst,
				clock: this.t,
			});
		} else if (type === "midRange") {
			this.recordStat(this.o, p, "fgaMidRange");
			this.recordStat(this.o, p, "fgMidRange");
			this.playByPlay.logEvent({
				type: andOne ? "fgMidRangeAndOne" : "fgMidRange",
				t: this.o,
				pid,
				pidAst,
				clock: this.t,
			});
		} else if (type === "threePointer") {
			if (g.get("threePointers")) {
				this.recordStat(this.o, p, "pts"); // Extra point for 3's
			}

			this.recordStat(this.o, p, "tpa");
			this.recordStat(this.o, p, "tp");
			this.playByPlay.logEvent({
				type: andOne ? "tpAndOne" : "tp",
				t: this.o,
				pid,
				pidAst,
				clock: this.t,
			});
		}

		this.recordLastScore(this.o, p, type);

		if (pAst !== undefined) {
			this.recordStat(this.o, pAst, "ast");
		}

		if (andOne && !this.elamDone) {
			this.doPf({ t: this.d, type: "pfAndOne", shooter, fouler });
			return this.doFt(shooter, 1); // fg, orb, or drb
		}

		// In the last 2 minutes of a period, stop clock after made FG
		if (this.t <= 2 * 60) {
			this.isClockRunning = false;
		}

		return "fg";
	}

	/**
	 * Probability that a shot taken this possession is assisted.
	 *
	 * @return {number} Probability from 0 to 1.
	 */
	probAst() {
		return (
			((0.6 * (2 + this.team[this.o].compositeRating.passing)) /
				(2 + this.team[this.d].compositeRating.defense)) *
			g.get("assistFactor")
		);
	}

	// This runs before an overtime period is played, so all these shots lead to another overtime period, not the end of the game
	checkGameTyingShot() {
		if (this.lastScoringPlay.length === 0 || this.elamActive) {
			return;
		}

		// can assume that the last scoring play tied the game
		const i = this.lastScoringPlay.length - 1;
		const play = this.lastScoringPlay[i];
		let shotType = "a basket";

		switch (play.type) {
			case "atRim":
			case "tipIn":
			case "putBack":
			case "lowPost":
			case "midRange":
				break;

			case "threePointer":
				shotType = "a three-pointer";
				break;

			case "ft":
				shotType = "a free throw";

				if (i > 0) {
					const prevPlay = this.lastScoringPlay[i - 1];

					if (prevPlay.team === play.team) {
						switch (prevPlay.type) {
							case "atRim":
							case "tipIn":
							case "putBack":
							case "lowPost":
							case "midRange":
								shotType = "a three-point play";
								break;

							case "threePointer":
								shotType = "a four-point play";
								break;

							case "ft":
								if (
									i > 1 &&
									this.lastScoringPlay[i - 2].team === play.team &&
									this.lastScoringPlay[i - 2].type === "ft"
								) {
									shotType = "three free throws";
								} else {
									shotType = "two free throws";
								}

								break;

							default:
						}
					}
				}

				break;

			default:
		}

		const team = this.team[play.team];
		const player = this.team[play.team].player[play.player];
		let eventText = `<a href="${helpers.leagueUrl(["player", player.id])}">${
			player.name
		}</a> made ${shotType}`;

		if (play.time > 0) {
			eventText += ` with ${formatClock(play.time)} seconds remaining`;
		} else {
			eventText +=
				play.type === "ft" ? " with no time on the clock" : " at the buzzer";
		}

		eventText += ` to force ${helpers.overtimeCounter(
			this.team[0].stat.ptsQtrs.length - this.numPeriods + 1,
		)} overtime`;
		this.clutchPlays.push({
			text: eventText,
			showNotification: team.id === g.get("userTid"),
			pids: [player.id],
			tids: [team.id],
		});
	}

	// This runs after the game ends (except shootout) so it could be a game-tying shot if the game will end in a tie or shootout
	checkGameWinner() {
		if (this.lastScoringPlay.length === 0) {
			return;
		}

		const winner = getWinner([this.team[0].stat, this.team[1].stat])!;
		const loser = winner === 0 ? 1 : 0;
		const finalMargin =
			winner === -1
				? 0
				: this.team[winner].stat.pts - this.team[loser].stat.pts;
		let margin = finalMargin;

		// work backwards from last scoring plays, check if any resulted in a tie-break or lead change
		let pts = 0;
		let shotType = "basket";
		for (let i = this.lastScoringPlay.length - 1; i >= 0; i--) {
			const play = this.lastScoringPlay[i];

			switch (play.type) {
				case "atRim":
				case "tipIn":
				case "putBack":
				case "lowPost":
				case "midRange":
					pts = 2;
					break;

				case "threePointer":
					shotType = "three-pointer";
					pts = 3;
					break;

				case "ft":
					// Special handling for free throws
					shotType = "free throw";

					if (i > 0) {
						const prevPlay = this.lastScoringPlay[i - 1];

						if (prevPlay.team === play.team) {
							switch (prevPlay.type) {
								// cases where the basket ties the game, and the and-one wins it
								case "atRim":
								case "tipIn":
								case "putBack":
								case "lowPost":
								case "midRange":
									shotType = "three-point play";
									break;

								case "threePointer":
									shotType = "four-point play";
									break;

								default:
							}
						}
					}

					pts = 1;
					break;

				default:
			}

			margin -= winner === -1 || play.team === winner ? pts : -pts;

			if (margin <= 0) {
				const team = this.team[play.team];
				const player = this.team[play.team].player[play.player];

				const winningOrTying = winner === -1 ? "game-tying" : "game-winning";

				let eventText = `<a href="${helpers.leagueUrl([
					"player",
					player.id,
				])}">${player.name}</a> made a ${winningOrTying} ${shotType}`;

				if (!this.elamActive) {
					if (play.time > 0) {
						eventText += ` with ${formatClock(play.time)} seconds remaining`;
					} else {
						eventText +=
							play.type === "ft"
								? " with no time on the clock"
								: " at the buzzer";
					}
				}

				if (winner === -1 && this.shootoutRounds > 0) {
					eventText += " to force a shootout";
				}

				this.clutchPlays.push({
					text: eventText,
					showNotification: team.id === g.get("userTid"),
					pids: [player.id],
					tids: [team.id],
				});
				return;
			}
		}
	}

	recordLastScore(teamnum: TeamNum, playernum: number, type: ShotType) {
		// only record plays in the fourth quarter or overtime...
		if (this.team[0].stat.ptsQtrs.length < this.numPeriods) {
			return;
		}

		// ...in the last 24 seconds...
		if (this.t > 24) {
			return;
		}

		// ...when the lead is 3 or less
		if (Math.abs(this.team[0].stat.pts - this.team[1].stat.pts) > 4) {
			return;
		}

		const currPlay = {
			team: teamnum,
			player: playernum,
			type,
			time: this.t,
		};

		if (this.lastScoringPlay.length === 0) {
			this.lastScoringPlay.push(currPlay);
		} else {
			const lastPlay = this.lastScoringPlay[0];

			if (lastPlay.time !== currPlay.time) {
				this.lastScoringPlay = [];
			}

			this.lastScoringPlay.push(currPlay);
		}
	}

	doFt(shooter: PlayerNumOnCourt, amount: number) {
		const p = this.playersOnCourt[this.o][shooter]; // 95% max, a 75 FT rating gets you 90%, and a 25 FT rating gets you 60%

		const ftp = helpers.bound(
			g.get("ftAccuracyFactor") *
				this.team[this.o].player[p].compositeRating.shootingFT *
				0.6 +
				0.45,
			0,
			0.95,
		);

		let outcome: PossessionOutcome | undefined;

		for (let i = 0; i < amount; i++) {
			this.recordStat(this.o, p, "fta");

			if (Math.random() < ftp) {
				// Between 60% and 90%
				this.recordStat(this.o, p, "ft");
				this.recordStat(this.o, p, "pts");
				this.playByPlay.logEvent({
					type: "ft",
					t: this.o,
					pid: this.team[this.o].player[p].id,
					clock: this.t,
				});
				outcome = "ft";
				this.recordLastScore(this.o, p, "ft");

				if (this.elamDone) {
					break;
				}
			} else {
				this.playByPlay.logEvent({
					type: "missFt",
					t: this.o,
					pid: this.team[this.o].player[p].id,
					clock: this.t,
				});
				outcome = undefined;
			}
		}

		if (outcome === "ft") {
			this.isClockRunning = false;
		} else {
			this.isClockRunning = true;
			outcome = this.doReb();
		}

		return outcome;
	}

	/**
	 * Personal foul.
	 *
	 * @param {number} t Team (0 or 1, this.o or this.d).
	 */
	doPf(
		info:
			| {
					t: TeamNum;
					type: "pfNonShooting";
					shooter?: undefined;
					fouler?: PlayerNumOnCourt;
			  }
			| {
					t: TeamNum;
					type: "pfBonus" | "pfFG" | "pfTP" | "pfAndOne";
					shooter: PlayerNumOnCourt;
					fouler?: PlayerNumOnCourt;
			  },
	) {
		const t = info.t;
		const fouler = info.fouler ?? pickPlayer(this.ratingArray("fouling", t));
		const p = this.playersOnCourt[t][fouler];
		this.recordStat(t, p, "pf");

		if (info.type === "pfNonShooting" || info.type === "pfAndOne") {
			this.playByPlay.logEvent({
				type: info.type,
				t,
				pid: this.team[t].player[p].id,
				clock: this.t,
			});
		} else {
			this.playByPlay.logEvent({
				type: info.type,
				t,
				pid: this.team[t].player[p].id,
				pidShooting:
					this.team[this.o].player[
						this.playersOnCourt[this.o][(info as any).shooter]
					].id,
				clock: this.t,
			});
		}

		// Foul out
		const foulsNeededToFoulOut = g.get("foulsNeededToFoulOut");
		if (
			foulsNeededToFoulOut > 0 &&
			this.team[t].player[p].stat.pf >= foulsNeededToFoulOut
		) {
			this.playByPlay.logEvent({
				type: "foulOut",
				t,
				pid: this.team[t].player[p].id,
				clock: this.t,
			});

			// Force substitutions now
			this.updatePlayersOnCourt({
				shooter: info.shooter,
			});
			this.updateSynergy();
		}

		this.foulsThisQuarter[t] += 1;

		if (this.t <= 2 * 60) {
			this.foulsLastTwoMinutes[t] += 1;
		}
	}

	doReb() {
		let p;
		let ratios;

		if (this.t === 0) {
			return "endOfPeriod";
		}

		this.advanceClockSeconds(random.uniform(0.1, 0.7));

		if (this.t === 0) {
			return "endOfPeriod";
		}

		if (Math.random() < 0.15) {
			return this.doOutOfBounds(0.1);
		}

		if (
			(0.75 * (2 + this.team[this.d].compositeRating.rebounding)) /
				(g.get("orbFactor") *
					(2 + this.team[this.o].compositeRating.rebounding)) >
			Math.random()
		) {
			ratios = this.ratingArray("rebounding", this.d, 3);
			p = this.playersOnCourt[this.d][pickPlayer(ratios)];
			this.recordStat(this.d, p, "drb");
			this.playByPlay.logEvent({
				type: "drb",
				t: this.d,
				pid: this.team[this.d].player[p].id,
				clock: this.t,
			});
			return "drb" as const;
		}

		ratios = this.ratingArray("rebounding", this.o, 5);
		this.lastOrbPlayer = pickPlayer(ratios);
		p = this.playersOnCourt[this.o][this.lastOrbPlayer];
		this.recordStat(this.o, p, "orb");
		this.playByPlay.logEvent({
			type: "orb",
			t: this.o,
			pid: this.team[this.o].player[p].id,
			clock: this.t,
		});
		return "orb" as const;
	}

	/**
	 * Generate an array of composite ratings.
	 *
	 * @param {string} rating Key of this.team[t].player[p].compositeRating to use.
	 * @param {number} t Team (0 or 1, this.or or this.d).
	 * @param {number=} power Power that the composite rating is raised to after the components are linearly combined by  the weights and scaled from 0 to 1. This can be used to introduce nonlinearities, like making a certain stat more uniform (power < 1) or more unevenly distributed (power > 1) or making a composite rating an inverse (power = -1). Default value is 1.
	 * @return {Array.<number>} Array of composite ratings of the players on the court for the given rating and team.
	 */
	ratingArray(rating: CompositeRating, t: TeamNum, power: number = 1) {
		const array = Array(this.numPlayersOnCourt).fill(0);
		let total = 0;

		const foulLimit = rating === "fouling" ? this.getFoulTroubleLimit() : 0;

		// Scale composite ratings
		for (let i = 0; i < this.numPlayersOnCourt; i++) {
			const p = this.playersOnCourt[t][i];

			let compositeRating = this.team[t].player[p].compositeRating[rating];

			if (rating === "fouling") {
				const pf = this.team[t].player[p].stat.pf;
				if (pf === foulLimit - 1) {
					compositeRating *= 0.8;
				} else if (pf === foulLimit) {
					compositeRating *= 0.5;
				} else if (pf > foulLimit) {
					compositeRating *= 0.25;
				}
			}

			array[i] =
				(compositeRating * this.fatigue(this.team[t].player[p].stat.energy)) **
				power;

			total += array[i];
		}

		// Set floor (5% of total)
		const floor = 0.05 * total;

		for (let i = 0; i < this.numPlayersOnCourt; i++) {
			if (array[i] < floor) {
				array[i] = floor;
			}
		}

		return array;
	}

	/**
	 * Increments a stat (s) for a player (p) on a team (t) by amount (default is 1).
	 *
	 * @param {number} t Team (0 or 1, this.or or this.d).
	 * @param {number} p Integer index of this.team[t].player for the player of interest.
	 * @param {string} s Key for the property of this.team[t].player[p].stat to increment.
	 * @param {number} amt Amount to increment (default is 1).
	 */
	recordStat(t: TeamNum, p: number | undefined, s: Stat, amt: number = 1) {
		if (p !== undefined) {
			this.team[t].player[p].stat[s] += amt;
		}

		if (s !== "courtTime" && s !== "benchTime" && s !== "energy") {
			if (s !== "gs") {
				this.team[t].stat[s] += amt; // Record quarter-by-quarter scoring too

				if (s === "pts") {
					this.team[t].stat.ptsQtrs[this.team[t].stat.ptsQtrs.length - 1] +=
						amt;

					for (let i = 0; i < 2; i++) {
						for (let j = 0; j < this.numPlayersOnCourt; j++) {
							const k = this.playersOnCourt[i][j];
							this.team[i].player[k].stat.pm += i === t ? amt : -amt;
						}
					}

					if (
						this.elamActive &&
						(this.team[this.d].stat.pts >= this.elamTarget ||
							this.team[this.o].stat.pts >= this.elamTarget)
					) {
						this.elamDone = true;
					}
				}
			}

			if (this.playByPlay !== undefined) {
				this.playByPlay.logStat(
					t,
					p === undefined ? undefined : this.team[t].player[p].id,
					s,
					amt,
				);
			}
		}
	}
}

export default GameSim;
