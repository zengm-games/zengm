// @flow

import { g, helpers, random } from "../../../../deion/worker/util";
import PlayByPlayLogger from "./PlayByPlayLogger";
import type {
    ShotType,
    Stat,
    PlayerNumOnCourt,
    TeamNum,
    CompositeRating,
    PlayerGameSim,
    TeamGameSim,
} from "./types";

const formations = [
    {
        off: {
            QB: 1,
            RB: 1,
            WR: 3,
            TE: 1,
            C: 1,
            OL: 4,
        },
        def: {
            DL: 4,
            LB: 2,
            CB: 3,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 2,
            WR: 2,
            TE: 1,
            C: 1,
            OL: 4,
        },
        def: {
            DL: 3,
            LB: 4,
            CB: 2,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 2,
            WR: 1,
            TE: 2,
            C: 1,
            OL: 4,
        },
        def: {
            DL: 4,
            LB: 3,
            CB: 2,
            S: 2,
        },
    },
    {
        off: {
            QB: 1,
            RB: 0,
            WR: 5,
            TE: 0,
            C: 1,
            OL: 4,
        },
        def: {
            DL: 4,
            LB: 1,
            CB: 4,
            S: 2,
        },
    },
];

/**
 * Pick a player to do something.
 *
 * @param {Array.<number>} ratios output of this.ratingArray.
 * @param {number} exempt An integer representing a player that can't be picked (i.e. you can't assist your own shot, which is the only current use of exempt). The value of exempt ranges from 0 to 4, corresponding to the index of the player in this.playersOnCourt. This is *NOT* the same value as the player ID *or* the index of the this.team[t].player list. Yes, that's confusing.
 */
const pickPlayer = (
    ratios: [number, number, number, number, number],
    exempt?: PlayerNumOnCourt,
): PlayerNumOnCourt => {
    if (exempt !== undefined) {
        ratios[exempt] = 0;
    }

    const rand =
        Math.random() *
        (ratios[0] + ratios[1] + ratios[2] + ratios[3] + ratios[4]);

    let pick;
    if (rand < ratios[0]) {
        pick = 0;
    } else if (rand < ratios[0] + ratios[1]) {
        pick = 1;
    } else if (rand < ratios[0] + ratios[1] + ratios[2]) {
        pick = 2;
    } else if (rand < ratios[0] + ratios[1] + ratios[2] + ratios[3]) {
        pick = 3;
    } else {
        pick = 4;
    }

    return pick;
};

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

    dt: number;

    playersOnField: [
        [
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
        ],
        [
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
            PlayerGameSim,
        ],
    ];

    startersRecorded: boolean;

    subsEveryN: number;

    overtime: boolean;

    t: number;

    o: TeamNum;

    d: TeamNum;

    playByPlay: PlayByPlayLogger | void;

    constructor(
        gid: number,
        team1: TeamGameSim,
        team2: TeamGameSim,
        doPlayByPlay: boolean,
    ) {
        if (doPlayByPlay) {
            this.playByPlay = new PlayByPlayLogger();
        }

        this.id = gid;
        this.team = [team1, team2]; // If a team plays twice in a day, this needs to be a deep copy
        const numPossessions = Math.round(
            ((this.team[0].pace + this.team[1].pace) / 2) *
                random.uniform(0.9, 1.1),
        );
        this.dt = 48 / (2 * numPossessions); // Time elapsed per possession

        this.playersOnField = [];
        this.startersRecorded = false; // Used to track whether the *real* starters (after injury) have been recorded or not.

        this.subsEveryN = 6; // How many possessions to wait before doing substitutions

        this.overtime = false;

        this.t = g.quarterLength; // Game clock, in minutes

        this.awaitingKickoff = true;

        this.homeCourtAdvantage();
    }

    homeCourtAdvantage() {
        for (let t = 0; t < 2; t++) {
            let factor;
            if (t === 0) {
                factor = 1.01; // Bonus for home team
            } else {
                factor = 0.99; // Penalty for away team
            }

            for (let p = 0; p < this.team[t].player.length; p++) {
                for (const r of Object.keys(
                    this.team[t].player[p].compositeRating,
                )) {
                    this.team[t].player[p].compositeRating[r] *= factor;
                }
            }
        }
    }

    run() {
        // Simulate the game up to the end of regulation
        this.simRegulation();

        console.log(this.team);
        /*// Play overtime periods if necessary
        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            this.checkGameTyingShot();
            this.simOvertime();
        }

        this.checkGameWinner();*/

        // Delete stuff that isn't needed before returning
        for (let t = 0; t < 2; t++) {
            delete this.team[t].compositeRating;
            delete this.team[t].pace;
            for (let p = 0; p < this.team[t].player.length; p++) {
                delete this.team[t].player[p].valueNoPot;
                delete this.team[t].player[p].compositeRating;
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
            playByPlay: undefined,
        };

        if (this.playByPlay !== undefined) {
            out.playByPlay = this.playByPlay.getAll(this.team);
        }

        return out;
    }

    simRegulation() {
        this.o = 0;
        this.d = 1;
        let quarter = 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            while (this.t > 0) {
                this.simPlay();
            }
            quarter += 1;

            if (quarter === 5) {
                break;
            }
            this.team[0].stat.ptsQtrs.push(0);
            this.team[1].stat.ptsQtrs.push(0);
            this.t = g.quarterLength;
            this.playByPlay.logEvent("quarter");
        }
    }

    simOvertime() {
        this.t = Math.ceil(0.4 * g.quarterLength); // 5 minutes by default, but scales
        this.overtimes += 1;
        this.team[0].stat.ptsQtrs.push(0);
        this.team[1].stat.ptsQtrs.push(0);
        this.playByPlay.logEvent("overtime");
        this.o = Math.random() < 0.5 ? 0 : 1;
        this.d = this.o === 0 ? 1 : 0;
        while (this.t > 0) {
            this.simPossession();
        }
    }

    getPlayType() {
        if (this.awaitingKickoff) {
            return "kickoff";
        }

        if (this.awaitingExtraPoint) {
            return "extraPoint";
        }

        if (this.down === 4) {
            if (this.scrimmage >= 60) {
                return "fieldGoal";
            }

            return "punt";
        }

        if (Math.random() > 0.5) {
            return "pass";
        }

        return "run";
    }

    simPlay() {
        const playType = this.getPlayType();

        let dt;
        if (playType === "kickoff") {
            dt = this.doKickoff();
        } else if (playType === "extraPoint") {
            dt = this.doFieldGoal(true);
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

        // Clock
        this.t -= dt;
        let playTime = dt;
        if (this.t < 0) {
            playTime += this.t;
            this.t = 0;
        }
        this.updatePlayingTime(playTime);

        this.injuries();
    }

    advanceYds(yds: number) {
        // Touchdown?
        const ydsTD = 100 - this.scrimmage;
        if (yds >= ydsTD) {
            this.awaitingKickoff = true;
            return {
                safety: false,
                td: true,
                yds: ydsTD,
            };
        }

        this.scrimmage += yds;

        // First down?
        if (yds >= this.toGo) {
            this.down = 1;
            const maxToGo = 100 - this.scrimmage;
            this.toGo = maxToGo < 10 ? maxToGo : 10;

            return {
                safety: false,
                td: false,
                yds,
            };
        }

        // Turnover on downs?
        if (this.down === 4) {
            this.o = this.o === 0 ? 1 : 0;
            this.d = this.d === 0 ? 1 : 0;
            this.scrimmage = 100 - this.scrimmage;
            this.down = 1;
            const maxToGo = 100 - this.scrimmage;
            this.toGo = maxToGo < 10 ? maxToGo : 10;

            return {
                safety: false,
                td: false,
                yds,
            };
        }

        this.down += 1;
        this.toGo -= yds;

        return {
            safety: false,
            td: false,
            yds,
        };
    }

    updatePlayersOnField(playType: string) {
        if (playType === "run" || playType === "pass") {
            const formation = random.choice(formations);
            const sides = ["off", "def"];
            for (let i = 0; i < 2; i++) {
                const t = i === 0 ? this.o : this.d;
                const side = sides[i];

                this.playersOnField[t] = {};
                for (const pos of Object.keys(formation[side])) {
                    const numPlayers = formation[side][pos];
                    this.playersOnField[t][pos] = this.team[t].depth[pos]
                        .slice(0, numPlayers)
                        .map(pid => {
                            return this.team[t].player.find(p => p.id === pid);
                        });
                }
            }
        } /*else if (playType === "extraPoint" || playType === "fieldGoal") {

        } else if (playType === "punt") {

        } else if (playType === "kickoff") {

        } */ else {
            throw new Error(`Unknown playType "${playType}"`);
        }
    }

    doKickoff() {
        this.awaitingKickoff = false;

        const kicker = this.team[this.o].player.find(
            p => p.id === this.team[this.o].depth.K[0],
        );
        const kickReturner = this.team[this.d].player.find(
            p => p.id === this.team[this.d].depth.KR[0],
        );

        const touchback = Math.random() > 0.5;
        const kickTo = random.uniform(-9, 10);

        let dt = 0;

        this.playByPlay.logEvent("kickoff", {
            t: this.o,
            names: [kicker.name],
            touchback,
            yds: kickTo,
        });
        if (touchback) {
            this.scrimmage = 25;
            this.down = 1;
            this.toGo = 10;
        } else {
            dt = 5;
            const returnLength = random.uniform(10, 109);
            const returnTo = kickTo + returnLength;
            const td = returnTo >= 100;

            if (td) {
                this.awaitingKickoff = true;
            } else {
                this.scrimmage = returnTo;
                this.down = 1;
                this.toGo = 10;
            }

            this.playByPlay.logEvent("kickoffReutrn", {
                t: this.d,
                names: [kickReturner.name],
                td,
                yds: returnLength,
            });
        }

        // Possession change
        this.o = this.o === 1 ? 0 : 1;
        this.d = this.o === 1 ? 0 : 1;

        return dt;
    }

    doRun() {
        this.updatePlayersOnField("run");

        const p =
            this.playersOnField[this.o].RB.length > 0
                ? this.playersOnField[this.o].RB[0]
                : this.playersOnField[this.o].QB[0];
        this.recordStat(this.o, p, "rus");
        const ydsRaw = random.randInt(-5, 10);
        const { td, yds } = this.advanceYds(ydsRaw);

        this.recordStat(this.o, p, "rusYds", yds);
        if (td) {
            this.recordStat(this.o, p, "rusTD");
        }

        this.playByPlay.logEvent("run", {
            t: this.o,
            names: [p.name],
            td,
            yds,
        });

        return 5;
    }

    updatePlayingTime(possessionTime: number) {
        const onField = new Set();
        for (let t = 0; t < 2; t++) {
            // Get rid of this after making sure playersOnField is always set, even for special teams
            if (this.playersOnField[t] === undefined) {
                continue;
            }

            for (const pos of Object.keys(this.playersOnField[t])) {
                // Update minutes (overall, court, and bench)
                for (const p of this.playersOnField[t][pos]) {
                    onField.add(p.id);

                    this.recordStat(t, p, "min", possessionTime);
                    this.recordStat(t, p, "courtTime", possessionTime);
                    // This used to be 0.04. Increase more to lower PT
                    this.recordStat(
                        t,
                        p,
                        "energy",
                        -possessionTime *
                            0.06 *
                            (1 - p.compositeRating.endurance),
                    );
                    if (p.stat.energy < 0) {
                        p.stat.energy = 0;
                    }
                }
            }

            for (const p of this.team[t].player) {
                if (!onField.has(p.id)) {
                    this.recordStat(t, p, "benchTime", possessionTime);
                    this.recordStat(t, p, "energy", possessionTime * 0.1);
                    if (p.stat.energy > 1) {
                        p.stat.energy = 1;
                    }
                }
            }
        }
    }

    injuries() {
        if (g.disableInjuries) {
            return;
        }

        /*let newInjury = false;

        for (let t = 0; t < 2; t++) {
            for (let p = 0; p < this.team[t].player.length; p++) {
                // Only players on the court can be injured
                if (this.playersOnCourt[t].includes(p)) {
                    if (Math.random() < g.injuryRate) {
                        this.team[t].player[p].injured = true;
                        newInjury = true;
                        this.playByPlay.logEvent("injury", t, [
                            this.team[t].player[p].name,
                        ]);
                    }
                }
            }
        }

        // Sub out injured player
        if (newInjury) {
            this.updatePlayersOnCourt();
        }*/
    }

    /**
     * Generate an array of composite ratings.
     *
     * @param {string} rating Key of this.team[t].player[p].compositeRating to use.
     * @param {number} t Team (0 or 1, this.or or this.d).
     * @param {number=} power Power that the composite rating is raised to after the components are linearly combined by  the weights and scaled from 0 to 1. This can be used to introduce nonlinearities, like making a certain stat more uniform (power < 1) or more unevenly distributed (power > 1) or making a composite rating an inverse (power = -1). Default value is 1.
     * @return {Array.<number>} Array of composite ratings of the players on the court for the given rating and team.
     */
    ratingArray(rating: CompositeRating, t: TeamNum, power?: number = 1) {
        const array = [0, 0, 0, 0, 0];
        let total = 0;

        // Scale composite ratings
        for (let i = 0; i < 5; i++) {
            const p = this.playersOnCourt[t][i];
            array[i] =
                (this.team[t].player[p].compositeRating[rating] *
                    fatigue(this.team[t].player[p].stat.energy)) **
                power;
            total += array[i];
        }

        // Set floor (5% of total)
        const floor = 0.05 * total;
        for (let i = 0; i < 5; i++) {
            if (array[i] < floor) {
                array[i] = floor;
            }
        }

        return array;
    }

    recordStat(t: TeamNum, p: PlayerGameSim, s: Stat, amt?: number = 1) {
        p.stat[s] += amt;
        if (
            s !== "gs" &&
            s !== "courtTime" &&
            s !== "benchTime" &&
            s !== "energy"
        ) {
            this.team[t].stat[s] += amt;

            const qtr = this.team[t].stat.ptsQtrs.length - 1;

            if (s.endsWith("TD") && s !== "pssTD") {
                this.team[t].stat.pts += 6;

                // Record quarter-by-quarter scoring too
                this.team[t].stat.ptsQtrs[qtr] += 6;
            }
            if (this.playByPlay !== undefined) {
                this.playByPlay.logStat(qtr, t, p.id, s, amt);
            }
        }
    }
}

export default GameSim;
