// @flow

import { g, helpers, random } from "../../../../deion/worker/util";
import PlayByPlayLogger from "./PlayByPlayLogger";
import formations from "./formations";
import type {
    ShotType,
    Stat,
    PlayerNumOnCourt,
    TeamNum,
    CompositeRating,
    PlayerGameSim,
    TeamGameSim,
} from "./types";

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

    subsEveryN: number;

    overtime: boolean;

    t: number;

    o: TeamNum;

    d: TeamNum;

    playByPlay: PlayByPlayLogger | void;

    awaitingAfterTouchdown: boolean;

    awaitingKickoff: boolean;

    twoPointState: "attempting" | "success" | void;

    constructor(
        gid: number,
        team1: TeamGameSim,
        team2: TeamGameSim,
        doPlayByPlay: boolean,
    ) {
        this.playByPlay = new PlayByPlayLogger(doPlayByPlay);

        this.id = gid;
        this.team = [team1, team2]; // If a team plays twice in a day, this needs to be a deep copy

        this.playersOnField = [];

        // Record "gs" stat for starters
        this.o = 0;
        this.d = 1;
        this.updatePlayersOnField("starters");
        this.o = 1;
        this.d = 0;
        this.updatePlayersOnField("starters");

        this.subsEveryN = 6; // How many possessions to wait before doing substitutions

        this.overtime = false;

        this.t = g.quarterLength; // Game clock, in minutes

        this.awaitingAfterTouchdown = false;
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
            playByPlay: this.playByPlay.getPlayByPlay(this.team),
        };

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

        if (this.awaitingAfterTouchdown) {
            return Math.random() < 0.95 ? "extraPoint" : "twoPointConversion";
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
        } else if (playType === "twoPointConversion") {
            dt = this.doTwoPointConversion();
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

        dt /= 60;

        // Time between plays
        dt += random.randInt(5, 40) / 60;

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

    boundedYds(yds: number) {
        const ydsTD = 100 - this.scrimmage;
        const ydsSafety = -this.scrimmage;

        if (yds > ydsTD) {
            return ydsTD;
        }

        if (yds < ydsSafety) {
            return ydsSafety;
        }

        return yds;
    }

    advanceYds(yds: number, { sack }: { sack: boolean } = {}) {
        // Touchdown?
        const ydsTD = 100 - this.scrimmage;
        if (yds >= ydsTD) {
            this.awaitingAfterTouchdown = true;
            return {
                safetyOrTouchback: false,
                td: true,
            };
        }

        this.scrimmage += yds;

        // For non-sacks, record tackler(s)
        if (!sack && Math.random() < 0.9) {
            let playersDefense = [];
            for (const playersAtPos of Object.values(
                this.playersOnField[this.d],
            )) {
                playersDefense = playersDefense.concat(playersAtPos);
            }
            const tacklers =
                Math.random() < 0.3
                    ? new Set([
                          random.choice(playersDefense),
                          random.choice(playersDefense),
                      ])
                    : new Set([random.choice(playersDefense)]);

            for (const tackler of tacklers) {
                this.recordStat(
                    this.d,
                    tackler,
                    tacklers.size === 1 ? "defTckSolo" : "defTckAst",
                );
                if (yds < 0) {
                    this.recordStat(this.d, tackler, "defTckLoss");
                }
            }
        }

        // Safety or touchback?
        if (this.scrimmage <= 0) {
            return {
                safetyOrTouchback: true,
                td: false,
            };
        }

        // First down?
        if (yds >= this.toGo) {
            this.down = 1;
            const maxToGo = 100 - this.scrimmage;
            this.toGo = maxToGo < 10 ? maxToGo : 10;

            return {
                safetyOrTouchback: false,
                td: false,
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
                safetyOrTouchback: false,
                td: false,
            };
        }

        this.down += 1;
        this.toGo -= yds;

        return {
            safetyOrTouchback: false,
            td: false,
        };
    }

    updatePlayersOnField(playType: string) {
        let formation;
        if (playType === "starters") {
            formation = formations.normal[0];
        } else if (playType === "run" || playType === "pass") {
            formation = random.choice(formations.normal);
        } else if (playType === "extraPoint" || playType === "fieldGoal") {
            formation = random.choice(formations.fieldGoal);
        } else if (playType === "punt") {
            formation = random.choice(formations.punt);
        } else if (playType === "kickoff") {
            formation = random.choice(formations.kickoff);
        } else {
            throw new Error(`Unknown playType "${playType}"`);
        }

        const sides = ["off", "def"];
        for (let i = 0; i < 2; i++) {
            const t = i === 0 ? this.o : this.d;
            const side = sides[i];

            // Don't let one player be used at two positions!
            const pidsUsed = new Set();

            this.playersOnField[t] = {};
            for (const pos of Object.keys(formation[side])) {
                const numPlayers = formation[side][pos];
                this.playersOnField[t][pos] = this.team[t].depth[pos]
                    .filter(pid => !pidsUsed.has(pid))
                    .slice(0, numPlayers)
                    .map(pid => {
                        pidsUsed.add(pid);
                        return this.team[t].player.find(p => p.id === pid);
                    });

                if (playType === "starters") {
                    for (const p of this.playersOnField[t][pos]) {
                        this.recordStat(t, p, "gs");
                    }
                }
            }
        }
    }

    possessionChange() {
        this.o = this.o === 1 ? 0 : 1;
        this.d = this.o === 1 ? 0 : 1;

        this.down = 1;
        this.toGo = 10;
    }

    doKickoff() {
        this.updatePlayersOnField("kickoff");

        const kicker = this.playersOnField[this.o].K[0];
        const kickReturner = this.playersOnField[this.d].KR[0];

        const touchback = Math.random() > 0.5;
        const kickTo = random.randInt(-9, 10);

        let dt = 0;

        this.playByPlay.logEvent("kickoff", {
            t: this.o,
            names: [kicker.name],
            touchback,
            yds: kickTo,
        });

        this.possessionChange();

        if (touchback) {
            this.scrimmage = 25;
            this.down = 1;
            this.toGo = 10;
        } else {
            dt = 5;
            const maxReturnLength = 100 - kickTo;
            const returnLength = helpers.bound(
                random.randInt(10, 109),
                0,
                maxReturnLength,
            );
            this.scrimmage = kickTo;
            const { td } = this.advanceYds(returnLength);

            this.recordStat(this.o, kickReturner, "kr");
            this.recordStat(this.o, kickReturner, "krYds", returnLength);
            this.recordStat(this.o, kickReturner, "krLng", returnLength);

            if (td) {
                this.awaitingAfterTouchdown = true;
                this.recordStat(this.o, kickReturner, "krTD");
            } else {
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

        this.awaitingKickoff = false;

        return dt;
    }

    doPunt() {
        this.updatePlayersOnField("punt");

        const punter = this.playersOnField[this.o].P[0];
        const puntReturner = this.playersOnField[this.d].PR[0];

        const distance = random.randInt(35, 70);
        const kickTo = 100 - this.scrimmage - distance;
        const touchback = kickTo < 0;

        this.recordStat(this.o, punter, "pnt");
        this.recordStat(this.o, punter, "pntYds", distance);
        this.recordStat(this.o, punter, "pntLng", distance);
        this.playByPlay.logEvent("punt", {
            t: this.o,
            names: [punter.name],
            touchback,
            yds: distance,
        });

        this.possessionChange();

        if (touchback) {
            this.recordStat(this.o, punter, "pntTB");
            this.scrimmage = 25;
            this.down = 1;
            this.toGo = 10;
        } else {
            if (kickTo < 20) {
                this.recordStat(this.o, punter, "pntIn20");
            }

            const maxReturnLength = 100 - kickTo;
            const returnLength = helpers.bound(
                random.randInt(0, 109),
                0,
                maxReturnLength,
            );
            this.scrimmage = kickTo;
            const { td } = this.advanceYds(returnLength);

            this.recordStat(this.o, puntReturner, "pr");
            this.recordStat(this.o, puntReturner, "prYds", returnLength);
            this.recordStat(this.o, puntReturner, "prLng", returnLength);

            if (td) {
                this.awaitingAfterTouchdown = true;
                this.recordStat(this.o, puntReturner, "prTD");
            } else {
                this.down = 1;
                this.toGo = 10;
            }

            this.playByPlay.logEvent("puntReturn", {
                t: this.d,
                names: [puntReturner.name],
                td,
                yds: returnLength,
            });
        }

        this.possessionChange();
        this.awaitingKickoff = false;

        return 5;
    }

    doFieldGoal(extraPoint) {
        console.log("doFieldGoal");
        this.updatePlayersOnField("fieldGoal");

        const kicker = this.playersOnField[this.o].K[0];

        const distance = 100 - this.scrimmage + 17;

        const made = Math.random() < 0.8;

        this.playByPlay.logEvent(extraPoint ? "extraPoint" : "fieldGoal", {
            t: this.o,
            made,
            names: [kicker.name],
            yds: distance,
        });

        let statAtt;
        let statMade;
        if (extraPoint) {
            statAtt = "xpa";
            statMade = "xp";
        } else if (distance < 20) {
            statAtt = "fga0";
            statMade = "fg0";
        } else if (distance < 30) {
            statAtt = "fga20";
            statMade = "fg20";
        } else if (distance < 40) {
            statAtt = "fga30";
            statMade = "fg30";
        } else if (distance < 50) {
            statAtt = "fga40";
            statMade = "fg40";
        } else {
            statAtt = "fga50";
            statMade = "fg50";
        }

        this.recordStat(this.o, kicker, statAtt);
        if (made) {
            this.recordStat(this.o, kicker, statMade);
            if (!extraPoint) {
                this.recordStat(this.o, kicker, "fgLng", distance);
            }
            this.awaitingKickoff = true;
        } else {
            this.possessionChange();
            this.scrimmage = 100 - this.scrimmage - 7;
        }

        this.awaitingAfterTouchdown = false;

        return extraPoint ? 0 : 5;
    }

    doTwoPointConversion() {
        this.twoPointState = "attempting";

        // Is this needed?
        /*this.playByPlay.logEvent("twoPointAttempt", {
            t: this.o,
        });*/

        this.down = 1;
        this.scrimmage = 98;

        if (Math.random() > 0.5) {
            this.doPass();
        } else {
            this.doRun();
        }

        // Is this needed?
        /*this.playByPlay.logEvent("twoPointResult", {
            t: this.o,
            success: this.twoPointState === "success",
        });*/

        this.awaitingAfterTouchdown = false;
        this.twoPointState = undefined;

        this.awaitingAfterTouchdown = false;
        this.awaitingKickoff = true;

        return 0;
    }

    doFumble(pFumbled: PlayerGameSim, priorYdsRaw: number) {
        this.recordStat(this.o, pFumbled, "fmb");

        this.scrimmage = helpers.bound(this.scrimmage + priorYdsRaw, -9, 100);

        const lost = Math.random() > 0.5;

        let playersDefense = [];
        for (const playersAtPos of Object.values(this.playersOnField[this.d])) {
            playersDefense = playersDefense.concat(playersAtPos);
        }
        const pForced = random.choice(playersDefense);
        this.recordStat(this.d, pForced, "defFmbFrc");

        this.playByPlay.logEvent("fumble", {
            t: this.o,
            names: [pFumbled.name, pForced.name],
        });

        const recoveringTeam = lost ? this.d : this.o;

        let players = [];
        for (const playersAtPos of Object.values(
            this.playersOnField[recoveringTeam],
        )) {
            players = players.concat(playersAtPos);
        }

        const pRecovered = random.choice(players);
        this.recordStat(recoveringTeam, pRecovered, "defFmbRec");

        if (lost) {
            this.recordStat(this.o, pFumbled, "fmbLost");
            this.possessionChange();
            this.scrimmage = 100 - this.scrimmage;
        }

        const ydsRaw = random.randInt(0, 109);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback, td } = this.advanceYds(yds);

        this.playByPlay.logEvent("fumbleRecovery", {
            lost,
            t: this.o,
            names: [pRecovered.name],
            safety: safetyOrTouchback && !lost,
            td,
            yds,
        });

        if (safetyOrTouchback) {
            if (lost) {
                this.scrimmage = 20;
            } else {
                return this.doSafety();
            }
        } else {
            this.recordStat(recoveringTeam, pRecovered, "defFmbYds", yds);
            this.recordStat(recoveringTeam, pRecovered, "defFmbLng", yds);
            if (td) {
                this.recordStat(recoveringTeam, pRecovered, "defFmbTD");
            }
        }
    }

    doInterception(passYdsRaw: number) {
        this.possessionChange();
        this.scrimmage = helpers.bound(
            100 - this.scrimmage - passYdsRaw,
            -9,
            100,
        );

        const p = random.choice([
            ...this.playersOnField[this.o].DL,
            ...this.playersOnField[this.o].LB,
            ...this.playersOnField[this.o].CB,
            ...this.playersOnField[this.o].S,
        ]);

        const ydsRaw = random.randInt(0, 109);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback, td } = this.advanceYds(yds);

        this.recordStat(this.o, p, "defInt");

        if (safetyOrTouchback) {
            this.scrimmage = 20;
        } else {
            this.recordStat(this.o, p, "defIntYds", yds);
            this.recordStat(this.o, p, "defIntLng", yds);
            if (td) {
                this.recordStat(this.o, p, "defIntTD");
            }
        }

        this.playByPlay.logEvent("interception", {
            t: this.o,
            names: [p.name],
            td,
            yds,
        });
    }

    doSafety() {
        let playersDefense = [];
        for (const playersAtPos of Object.values(this.playersOnField[this.d])) {
            playersDefense = playersDefense.concat(playersAtPos);
        }
        const p = random.choice(playersDefense);
        this.recordStat(this.d, p, "defSft");

        this.possessionChange();
        this.awaitingKickoff = true;
    }

    doSack(qb: PlayerGameSim) {
        const p = random.choice([
            ...this.playersOnField[this.d].DL,
            ...this.playersOnField[this.d].LB,
            ...this.playersOnField[this.d].CB,
            ...this.playersOnField[this.d].S,
        ]);

        const ydsRaw = random.randInt(-1, -15);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback } = this.advanceYds(yds, {
            sack: true,
        });

        this.playByPlay.logEvent("sack", {
            t: this.o,
            names: [qb.name, p.name],
            safety: safetyOrTouchback,
            yds,
        });

        this.recordStat(this.o, qb, "pssSk");
        this.recordStat(this.o, qb, "pssSkYds", yds);
        this.recordStat(this.o, p, "defSk");

        if (safetyOrTouchback) {
            return this.doSafety();
        }
    }

    doPass() {
        this.updatePlayersOnField("pass");

        const qb = this.playersOnField[this.o].QB[0];

        this.playByPlay.logEvent("dropback", {
            t: this.o,
            names: [qb.name],
        });

        const fumble = Math.random() < 0.01;
        if (fumble) {
            const yds = random.randInt(-1, -10);
            this.doFumble(qb, yds);
            return 5;
        }

        const sack = Math.random() < 0.02;
        if (sack) {
            this.doSack(qb);
            return 5;
        }

        const target = random.choice([
            ...this.playersOnField[this.o].WR,
            ...this.playersOnField[this.o].TE,
            ...this.playersOnField[this.o].RB,
        ]);

        const defender = random.choice([
            ...this.playersOnField[this.d].CB,
            ...this.playersOnField[this.d].S,
            ...this.playersOnField[this.d].LB,
        ]);

        const interception = Math.random() < 0.05;
        const complete = Math.random() < 0.6;
        const ydsRaw = random.randInt(0, 30);
        const yds = this.boundedYds(ydsRaw);

        this.recordStat(this.o, qb, "pss");
        this.recordStat(this.o, target, "tgt");
        this.recordStat(this.d, defender, "defPssDef");

        if (interception) {
            this.doInterception(yds);
            this.recordStat(this.o, qb, "pssInt");
        } else if (complete) {
            const fumble2 = Math.random() < 0.01;
            if (fumble2) {
                this.doFumble(qb, yds);
                return 5;
            }

            const { safetyOrTouchback, td } = this.advanceYds(yds);
            this.recordStat(this.o, qb, "pssCmp");
            this.recordStat(this.o, qb, "pssYds", yds);
            this.recordStat(this.o, qb, "pssLng", yds);
            this.recordStat(this.o, target, "rec");
            this.recordStat(this.o, target, "recYds", yds);
            this.recordStat(this.o, target, "recLng", yds);

            if (td) {
                this.recordStat(this.o, qb, "pssTD");
                this.recordStat(this.o, target, "recTD");
            }

            this.playByPlay.logEvent("passComplete", {
                t: this.o,
                names: [qb.name, target.name],
                safety: safetyOrTouchback,
                td,
                yds,
            });

            if (safetyOrTouchback) {
                return this.doSafety();
            }
        } else {
            this.playByPlay.logEvent("passIncomplete", {
                t: this.o,
                names: [qb.name, target.name],
                yds,
            });
        }

        return 5;
    }

    doRun() {
        this.updatePlayersOnField("run");

        const p =
            this.playersOnField[this.o].RB.length > 0
                ? this.playersOnField[this.o].RB[0]
                : this.playersOnField[this.o].QB[0];
        this.recordStat(this.o, p, "rus");
        const qb = this.playersOnField[this.o].QB[0];

        this.playByPlay.logEvent("handoff", {
            t: this.o,
            names: [qb.name, p.name],
        });

        const ydsRaw = random.randInt(-5, 10);
        const yds = this.boundedYds(ydsRaw);
        this.recordStat(this.o, p, "rusYds", yds);
        this.recordStat(this.o, p, "rusLng", yds);

        const fumble = Math.random() < 0.01;
        if (fumble) {
            this.doFumble(p, yds);
            return 5;
        }

        const { safetyOrTouchback, td } = this.advanceYds(yds);
        if (td) {
            this.recordStat(this.o, p, "rusTD");
        }

        this.playByPlay.logEvent("run", {
            t: this.o,
            names: [p.name],
            safety: safetyOrTouchback,
            td,
            yds,
        });

        if (safetyOrTouchback) {
            return this.doSafety();
        }

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
        const qtr = this.team[t].stat.ptsQtrs.length - 1;

        // Special case for two point conversions
        if (this.twoPointState === "attempting") {
            let pts;
            if (s.endsWith("TD") && s !== "pssTD") {
                pts = 2;
            }

            if (pts) {
                this.team[t].stat.pts += pts;
                this.team[t].stat.ptsQtrs[qtr] += pts;

                this.twoPointState = "success";
            }
        }

        if (s === "gs") {
            // In case player starts on offense and defense, only record once
            p.stat[s] = 1;
        } else if (s.endsWith("Lng")) {
            if (amt > p.stat[s]) {
                p.stat[s] = amt;
            }
        } else {
            p.stat[s] += amt;
        }

        if (
            s !== "gs" &&
            s !== "courtTime" &&
            s !== "benchTime" &&
            s !== "energy"
        ) {
            if (s.endsWith("Lng")) {
                if (amt > this.team[t].stat[s]) {
                    this.team[t].stat[s] = amt;
                }
            } else {
                this.team[t].stat[s] += amt;
            }

            let pts;
            if (s.endsWith("TD") && s !== "pssTD") {
                pts = 6;
            } else if (s === "xp") {
                pts = 1;
            } else if (s.startsWith("fg") && !s.startsWith("fga")) {
                pts = 3;
            } else if (s === "defSft") {
                pts = 2;
            }

            if (pts) {
                this.team[t].stat.pts += pts;
                this.team[t].stat.ptsQtrs[qtr] += pts;
            }

            this.playByPlay.logStat(qtr, t, p.id, s, amt);
        }
    }
}

export default GameSim;
