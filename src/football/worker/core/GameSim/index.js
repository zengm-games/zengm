// @flow

import { PHASE } from "../../../../deion/common";
import { g, helpers, random } from "../../../../deion/worker/util";
import { POSITIONS } from "../../../common";
import PlayByPlayLogger from "./PlayByPlayLogger";
import formations from "./formations";
import penalties from "./penalties";
import type { Position } from "../../../common/types";
import type {
    TeamNum,
    CompositeRating,
    PlayerGameSim,
    PlayersOnField,
    TeamGameSim,
} from "./types";

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

    playersOnField: PlayersOnField;

    subsEveryN: number;

    overtime: boolean;

    overtimes: number;

    /**
     * "initialKickoff" -> (right after kickoff) "firstPossession" -> (after next call to possessionChange) -> "secondPossession" -> (after next call to possessionChange) -> "bothTeamPossessed" -> (based on conditions below) "over"
     * - "initialKickoff", "firstPossession": when touchdown or safety is scored, set state to "over"
     * - "secondPossession": when any points are scored, if scoring team is winning, set state to "over"
     * - "bothTeamsPossessed": after each play, if (!this.awaitingAfterTouchdown or point differential is more than 2) then end game if score is not equal, set state to "over"
     */
    overtimeState:
        | void
        | "initialKickoff"
        | "firstPossession"
        | "secondPossession"
        | "bothTeamsPossessed"
        | "over";

    clock: number;

    isClockRunning: boolean;

    o: TeamNum;

    d: TeamNum;

    playByPlay: PlayByPlayLogger;

    awaitingAfterTouchdown: boolean;

    awaitingKickoff: boolean;

    twoPointConversionTeam: number | void;

    scrimmage: number;

    down: number;

    toGo: number;

    constructor(
        gid: number,
        team1: TeamGameSim,
        team2: TeamGameSim,
        doPlayByPlay: boolean,
    ) {
        this.playByPlay = new PlayByPlayLogger(doPlayByPlay);

        this.id = gid;
        this.team = [team1, team2]; // If a team plays twice in a day, this needs to be a deep copy

        this.playersOnField = [{}, {}];

        // Record "gs" stat for starters
        this.o = 0;
        this.d = 1;
        this.updatePlayersOnField("starters");
        this.o = 1;
        this.d = 0;
        this.updatePlayersOnField("starters");

        this.subsEveryN = 6; // How many possessions to wait before doing substitutions

        this.overtime = false;
        this.overtimes = 0;

        this.clock = g.quarterLength; // Game clock, in minutes
        this.isClockRunning = false;

        this.awaitingAfterTouchdown = false;
        this.awaitingKickoff = true;

        this.down = 1;
        this.toGo = 10;
        this.scrimmage = 20;

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

        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            // this.checkGameTyingShot();
            this.simOvertime();

            // Only one overtime period in regular season, but as many as needed in the playoffs
            if (g.phase !== PHASE.PLAYOFFS) {
                break;
            }
        }

        // this.checkGameWinner();

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
            scoringSummary: this.playByPlay.scoringSummary,
        };

        return out;
    }

    simRegulation() {
        this.o = 0;
        this.d = 1;
        let quarter = 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            while (this.clock > 0) {
                this.simPlay();
            }
            quarter += 1;

            if (quarter === 3) {
                this.awaitingKickoff = true;
            } else if (quarter === 5) {
                break;
            }
            this.team[0].stat.ptsQtrs.push(0);
            this.team[1].stat.ptsQtrs.push(0);
            this.clock = g.quarterLength;
            this.playByPlay.logEvent("quarter", {
                clock: this.clock,
                quarter: this.team[0].stat.ptsQtrs.length,
            });
        }
    }

    simOvertime() {
        this.clock = Math.ceil((g.quarterLength * 2) / 3); // 10 minutes by default, but scales
        this.overtime = true;
        this.overtimes += 1;
        this.overtimeState = "initialKickoff";
        this.team[0].stat.ptsQtrs.push(0);
        this.team[1].stat.ptsQtrs.push(0);
        this.playByPlay.logEvent("overtime", {
            clock: this.clock,
        });

        this.o = Math.random() < 0.5 ? 0 : 1;
        this.d = this.o === 0 ? 1 : 0;
        this.awaitingKickoff = true;
        while (this.clock > 0 && this.overtimeState !== "over") {
            this.simPlay();
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
        if (this.isClockRunning) {
            dt += random.randInt(15, 40) / 60;
        }

        // Clock
        this.clock -= dt;
        if (this.clock < 0) {
            dt += this.clock;
            this.clock = 0;
        }
        this.updatePlayingTime(dt);

        this.injuries();

        if (
            this.overtimeState === "bothTeamsPossessed" &&
            (!this.awaitingAfterTouchdown ||
                Math.abs(this.team[0].stat.pts - this.team[1].stat.pts) > 2)
        ) {
            this.overtimeState = "over";
        }
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

    advanceYds(
        yds: number,
        {
            automaticFirstDown,
            repeatDown,
            sack,
        }: {
            automaticFirstDown: boolean,
            repeatDown: boolean,
            sack: boolean,
        } = {},
    ) {
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
                          this.pickPlayer(this.d, "tackling"),
                          this.pickPlayer(this.d, "tackling"),
                      ])
                    : new Set([this.pickPlayer(this.d, "tackling")]);

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
        if (yds >= this.toGo || automaticFirstDown) {
            this.down = 1;
            const maxToGo = 100 - this.scrimmage;
            this.toGo = maxToGo < 10 ? maxToGo : 10;

            return {
                safetyOrTouchback: false,
                td: false,
            };
        }

        // Turnover on downs?
        if (!repeatDown) {
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
        }
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
                // $FlowFixMe
                const numPlayers = formation[side][pos];
                this.playersOnField[t][pos] = this.team[t].depth[pos]
                    .filter(id => !pidsUsed.has(id))
                    .slice(0, numPlayers);

                for (const p of this.playersOnField[t][pos]) {
                    pidsUsed.add(p.id);
                }

                if (playType === "starters") {
                    for (const p of this.playersOnField[t][pos]) {
                        this.recordStat(t, p, "gs");
                    }
                }
            }
        }
    }

    possessionChange() {
        if (this.overtimeState === "firstPossession") {
            this.overtimeState = "secondPossession";
        } else if (this.overtimeState === "secondPossession") {
            this.overtimeState = "bothTeamsPossessed";
        }

        this.o = this.o === 1 ? 0 : 1;
        this.d = this.o === 1 ? 0 : 1;

        this.down = 1;
        this.toGo = 10;
    }

    doKickoff() {
        this.updatePlayersOnField("kickoff");

        const kicker = this.playersOnField[this.o].K[0];
        let dt = 0;

        const onside = Math.random() < 0.1;

        if (onside) {
            this.playByPlay.logEvent("onsideKick", {
                clock: this.clock,
                t: this.o,
                names: [kicker.name],
            });

            dt = random.randInt(2, 5);

            const kickTo = random.randInt(40, 55);
            this.scrimmage = kickTo;

            const success = Math.random() < 0.1;

            if (success) {
                const recoverer = this.pickPlayer(this.o);

                this.playByPlay.logEvent("onsideKickRecovery", {
                    clock: this.clock,
                    t: this.o,
                    names: [recoverer.name],
                    success: true,
                    td: false,
                });

                this.down = 1;
                this.toGo = 10;
            } else {
                this.possessionChange();

                const kickReturner = this.pickPlayer(this.o);

                const rawLength =
                    Math.random() < 0.01 ? 100 : random.randInt(0, 5);
                const returnLength = this.boundedYds(rawLength);
                const { td } = this.advanceYds(returnLength);
                dt += Math.abs(returnLength) / 8;

                this.recordStat(this.o, kickReturner, "kr");
                this.recordStat(this.o, kickReturner, "krYds", returnLength);
                this.recordStat(this.o, kickReturner, "krLng", returnLength);

                this.playByPlay.logEvent("onsideKickRecovery", {
                    clock: this.clock,
                    t: this.o,
                    names: [kickReturner.name],
                    success: false,
                    td,
                });

                if (td) {
                    this.awaitingAfterTouchdown = true;
                    this.recordStat(this.o, kickReturner, "krTD");
                } else {
                    this.down = 1;
                    this.toGo = 10;
                }
            }
        } else {
            const kickReturner = this.playersOnField[this.d].KR[0];

            const touchback = Math.random() > 0.5;
            const kickTo = random.randInt(-9, 10);

            this.playByPlay.logEvent("kickoff", {
                clock: this.clock,
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
                this.scrimmage = kickTo;
                let returnLength = this.boundedYds(random.randInt(10, 109));
                dt = Math.abs(returnLength) / 8;
                let td = false;

                const penInfo = this.checkPenalties(
                    "kickoffReturn",
                    kickReturner,
                    returnLength,
                );
                if (penInfo && penInfo.type !== "offsetting") {
                    if (penInfo.spotYds !== undefined) {
                        returnLength = penInfo.spotYds;
                    }
                } else {
                    const info = this.advanceYds(returnLength);
                    td = info.td;
                }

                this.playByPlay.logEvent("kickoffReturn", {
                    clock: this.clock,
                    t: this.o,
                    names: [kickReturner.name],
                    td,
                    yds: returnLength,
                });

                this.recordStat(this.o, kickReturner, "kr");
                this.recordStat(this.o, kickReturner, "krYds", returnLength);
                this.recordStat(this.o, kickReturner, "krLng", returnLength);

                if (penInfo && penInfo.type !== "offsetting") {
                    console.log(penInfo);
                    penInfo.doLog();
                }

                if (td) {
                    this.awaitingAfterTouchdown = true;
                    this.recordStat(this.o, kickReturner, "krTD");
                } else {
                    this.down = 1;
                    this.toGo = 10;
                }
            }
        }

        this.awaitingKickoff = false;
        this.isClockRunning = false;

        if (this.overtimeState === "initialKickoff") {
            this.overtimeState = "firstPossession";
        }

        this.recordStat(this.o, undefined, "drives");
        this.recordStat(this.o, undefined, "totStartYds", this.scrimmage);

        return dt;
    }

    doPunt() {
        this.updatePlayersOnField("punt");

        const punter = this.playersOnField[this.o].P[0];
        const puntReturner = this.playersOnField[this.d].PR[0];

        const distance = random.randInt(35, 70);
        const kickTo = 100 - this.scrimmage - distance;
        const touchback = kickTo < 0;
        let dt = random.randInt(5, 9);

        this.recordStat(this.o, punter, "pnt");
        this.recordStat(this.o, punter, "pntYds", distance);
        this.recordStat(this.o, punter, "pntLng", distance);
        this.playByPlay.logEvent("punt", {
            clock: this.clock,
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
            dt += Math.abs(returnLength) / 8;

            this.recordStat(this.o, puntReturner, "pr");
            this.recordStat(this.o, puntReturner, "prYds", returnLength);
            this.recordStat(this.o, puntReturner, "prLng", returnLength);

            this.playByPlay.logEvent("puntReturn", {
                clock: this.clock,
                t: this.o,
                names: [puntReturner.name],
                td,
                yds: returnLength,
            });

            if (td) {
                this.awaitingAfterTouchdown = true;
                this.recordStat(this.o, puntReturner, "prTD");
            } else {
                this.down = 1;
                this.toGo = 10;
            }
        }

        this.recordStat(this.o, undefined, "drives");
        this.recordStat(this.o, undefined, "totStartYds", this.scrimmage);

        this.isClockRunning = false;

        return dt;
    }

    doFieldGoal(extraPoint?: boolean = false) {
        this.updatePlayersOnField("fieldGoal");

        const kicker = this.playersOnField[this.o].K[0];

        const distance = extraPoint ? 33 : 100 - this.scrimmage + 17;

        const made = Math.random() < 0.8;

        this.playByPlay.logEvent(extraPoint ? "extraPoint" : "fieldGoal", {
            clock: this.clock,
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
            this.scrimmage = helpers.bound(
                100 - this.scrimmage - 7,
                20,
                Infinity,
            );
        }

        this.awaitingAfterTouchdown = false;
        this.isClockRunning = false;

        return extraPoint ? 0 : random.randInt(4, 6);
    }

    doTwoPointConversion() {
        this.twoPointConversionTeam = this.o;

        this.down = 1;
        this.scrimmage = 98;

        if (Math.random() > 0.5) {
            this.doPass();
        } else {
            this.doRun();
        }

        this.twoPointConversionTeam = undefined;
        this.awaitingAfterTouchdown = false;
        this.awaitingKickoff = true;
        this.isClockRunning = false;

        return 0;
    }

    doFumble(pFumbled: PlayerGameSim, priorYdsRaw: number) {
        this.recordStat(this.o, pFumbled, "fmb");

        this.scrimmage = helpers.bound(this.scrimmage + priorYdsRaw, -9, 100);

        const lost = Math.random() > 0.5;

        const pForced = this.pickPlayer(this.d, "tackling");
        this.recordStat(this.d, pForced, "defFmbFrc");

        this.playByPlay.logEvent("fumble", {
            clock: this.clock,
            t: this.o,
            names: [pFumbled.name, pForced.name],
        });

        const recoveringTeam = lost ? this.d : this.o;

        const pRecovered = this.pickPlayer(recoveringTeam);
        this.recordStat(recoveringTeam, pRecovered, "defFmbRec");

        if (lost) {
            this.recordStat(this.o, pFumbled, "fmbLost");
            this.possessionChange();
            this.scrimmage = 100 - this.scrimmage;
            this.isClockRunning = false;
        } else {
            // Stops if fumbled out of bounds
            this.isClockRunning = Math.random() > 0.05;
        }

        const ydsRaw = random.randInt(0, 109);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback, td } = this.advanceYds(yds);
        let dt = Math.abs(yds) / 6;

        this.playByPlay.logEvent("fumbleRecovery", {
            clock: this.clock,
            lost,
            t: this.o,
            names: [pRecovered.name],
            safety: safetyOrTouchback && !lost,
            td,
            touchback: safetyOrTouchback && lost,
            twoPointConversionTeam: this.twoPointConversionTeam,
            yds,
        });

        if (safetyOrTouchback) {
            if (lost) {
                this.scrimmage = 20;
            } else {
                this.doSafety();
            }
            this.isClockRunning = false;
        } else {
            this.recordStat(recoveringTeam, pRecovered, "defFmbYds", yds);
            this.recordStat(recoveringTeam, pRecovered, "defFmbLng", yds);
            if (td) {
                this.recordStat(recoveringTeam, pRecovered, "defFmbTD");
            } else if (Math.random() < 0.01) {
                dt += this.doFumble(pRecovered, 0);
            }
        }

        return dt;
    }

    doInterception(passYdsRaw: number) {
        this.possessionChange();
        this.scrimmage = helpers.bound(
            100 - this.scrimmage - passYdsRaw,
            -9,
            100,
        );

        const p = this.pickPlayer(this.d, "passCoverage");

        const ydsRaw = random.randInt(0, 109);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback, td } = this.advanceYds(yds);
        let dt = Math.abs(yds) / 8;

        this.recordStat(this.o, p, "defInt");

        this.playByPlay.logEvent("interception", {
            clock: this.clock,
            t: this.o,
            names: [p.name],
            td,
            twoPointConversionTeam: this.twoPointConversionTeam,
            yds,
        });

        if (safetyOrTouchback) {
            this.scrimmage = 20;
        } else {
            this.recordStat(this.o, p, "defIntYds", yds);
            this.recordStat(this.o, p, "defIntLng", yds);
            if (td) {
                this.recordStat(this.o, p, "defIntTD");
            } else if (Math.random() < 0.01) {
                dt += this.doFumble(p, 0);
            }
        }

        this.isClockRunning = false;

        return dt;
    }

    doSafety() {
        const p = this.pickPlayer(
            this.d,
            Math.random() < 0.5 ? "passRushing" : "runStopping",
        );
        this.recordStat(this.d, p, "defSft");

        this.possessionChange();
        this.awaitingKickoff = true;
        this.isClockRunning = false;
    }

    doSack(qb: PlayerGameSim) {
        const p = this.pickPlayer(this.d, "passRushing");

        const ydsRaw = random.randInt(-1, -15);
        const yds = this.boundedYds(ydsRaw);
        const { safetyOrTouchback } = this.advanceYds(yds, {
            sack: true,
        });

        this.playByPlay.logEvent("sack", {
            clock: this.clock,
            t: this.o,
            names: [qb.name, p.name],
            safety: safetyOrTouchback,
            yds,
        });

        this.recordStat(this.o, qb, "pssSk");
        this.recordStat(this.o, qb, "pssSkYds", Math.abs(yds));
        this.recordStat(this.o, p, "defSk");

        if (safetyOrTouchback) {
            this.doSafety();
        }

        this.isClockRunning = Math.random() < 0.02;

        return random.randInt(3, 8);
    }

    doPass() {
        this.updatePlayersOnField("pass");

        const qb = this.playersOnField[this.o].QB[0];

        this.playByPlay.logEvent("dropback", {
            clock: this.clock,
            t: this.o,
            names: [qb.name],
        });

        let dt = random.randInt(2, 6);

        const fumble = Math.random() < 0.01;
        if (fumble) {
            const yds = random.randInt(-1, -10);
            return dt + this.doFumble(qb, yds);
        }

        const sack = Math.random() < 0.02;
        if (sack) {
            return this.doSack(qb);
        }

        const target = this.pickPlayer(
            this.o,
            Math.random() < 0.2 ? "catching" : "gettingOpen",
            ["WR", "TE", "RB"],
        );
        const defender = this.pickPlayer(this.d, "passCoverage", [
            "CB",
            "S",
            "LB",
        ]);

        const interception = Math.random() < 0.05;
        const complete = Math.random() < 0.6;
        const ydsRaw = random.randInt(0, 30);
        const yds = this.boundedYds(ydsRaw);

        this.recordStat(this.o, qb, "pss");
        this.recordStat(this.o, target, "tgt");
        this.recordStat(this.d, defender, "defPssDef");

        if (interception) {
            dt += this.doInterception(yds);
            this.recordStat(this.o, qb, "pssInt");
        } else if (complete) {
            const fumble2 = Math.random() < 0.01;
            if (fumble2) {
                return dt + this.doFumble(qb, yds);
            }

            const { safetyOrTouchback, td } = this.advanceYds(yds);
            dt += Math.abs(yds) / 20;

            this.recordStat(this.o, qb, "pssCmp");
            this.recordStat(this.o, qb, "pssYds", yds);
            this.recordStat(this.o, qb, "pssLng", yds);
            this.recordStat(this.o, target, "rec");
            this.recordStat(this.o, target, "recYds", yds);
            this.recordStat(this.o, target, "recLng", yds);

            this.playByPlay.logEvent("passComplete", {
                clock: this.clock,
                t: this.o,
                names: [qb.name, target.name],
                safety: safetyOrTouchback,
                td,
                twoPointConversionTeam: this.twoPointConversionTeam,
                yds,
            });

            if (td) {
                this.recordStat(this.o, qb, "pssTD");
                this.recordStat(this.o, target, "recTD");
            }

            this.isClockRunning = Math.random() < 0.75;

            if (safetyOrTouchback) {
                this.doSafety();
            }
        } else {
            this.playByPlay.logEvent("passIncomplete", {
                clock: this.clock,
                t: this.o,
                names: [qb.name, target.name],
                twoPointConversionTeam: this.twoPointConversionTeam,
                yds,
            });

            this.isClockRunning = false;
        }

        return dt;
    }

    doRun() {
        this.updatePlayersOnField("run");

        // Usually do normal run, but sometimes do special stuff
        const positions = ["RB"];
        const rand = Math.random();
        if (rand < 0.1 || this.playersOnField[this.o].RB.length === 0) {
            positions.push("QB");
        } else if (rand < 0.2 || this.playersOnField[this.o].RB.length === 0) {
            positions.push("WR");
        }

        const p = this.pickPlayer(this.o, "rushing", positions);
        this.recordStat(this.o, p, "rus");
        const qb = this.playersOnField[this.o].QB[0];

        this.playByPlay.logEvent("handoff", {
            clock: this.clock,
            t: this.o,
            names: [qb.name, p.name],
        });

        const ydsRaw = random.randInt(-5, 10);
        const yds = this.boundedYds(ydsRaw);
        this.recordStat(this.o, p, "rusYds", yds);
        this.recordStat(this.o, p, "rusLng", yds);

        const dt = random.randInt(2, 4) + Math.abs(yds) / 10;

        const fumble = Math.random() < 0.01;
        if (fumble) {
            return dt + this.doFumble(p, yds);
        }

        const { safetyOrTouchback, td } = this.advanceYds(yds);

        this.playByPlay.logEvent("run", {
            clock: this.clock,
            t: this.o,
            names: [p.name],
            safety: safetyOrTouchback,
            twoPointConversionTeam: this.twoPointConversionTeam,
            td,
            yds,
        });

        if (td) {
            this.recordStat(this.o, p, "rusTD");
        }

        this.isClockRunning = Math.random() < 0.85;

        if (safetyOrTouchback) {
            this.doSafety();
        }

        return dt;
    }

    // Call this before actually advancing the ball, because different logic will apply if it's a spot foul or not
    checkPenalties(
        playType:
            | "beforeSnap"
            | "kickoffReturn"
            | "fieldGoal"
            | "punt"
            | "puntReturn"
            | "pass"
            | "run",
        ballCarrier?: PlayerGameSim,
        playYds?: number,
    ) {
        // Handle plays in endzone
        if (this.scrimmage + playYds > 99) {
            playYds = 99 - this.scrimmage;
        }

        const called = penalties.filter(pen => {
            if (!pen.playTypes.includes(playType)) {
                return false;
            }

            return Math.random() < pen.probPerPlay;
        });

        if (called.length === 0) {
            return;
        }

        const offensive = called.filter(pen => pen.side === "offense");
        const defensive = called.filter(pen => pen.side === "defense");

        if (offensive.length > 0 && defensive.length > 0) {
            return {
                type: "offsetting",
                doLog: () => {
                    this.playByPlay.logEvent("offsettingPenalties", {
                        clock: this.clock,
                    });
                },
            };
        }

        const side = offensive.length > 0 ? "offense" : "defense";

        const penInfos = called.map(pen => {
            let spotYds;
            let totYds = 0;
            if (pen.spotFoul) {
                if (playYds === undefined) {
                    throw new Error(
                        `playYds are required for spot foul "${pen.name}"`,
                    );
                }

                if (pen.side === "offense" && playYds > 0) {
                    // Offensive spot foul - only when past the line of scrimmage
                    spotYds = random.randInt(1, playYds);
                } else if (pen.side === "defense") {
                    // Defensive spot foul - could be in secondary too
                    spotYds = random.randInt(0, playYds);
                }

                if (spotYds !== undefined) {
                    totYds += spotYds;
                }
            }

            totYds += pen.side === "defense" ? pen.yds : -pen.yds;

            return {
                automaticFirstDown: !!pen.automaticFirstDown,
                name: pen.name,
                penYds: pen.yds,
                posOdds: pen.posOdds,
                spotYds,
                totYds,
            };
        });

        // Pick penalty that gives the most yards
        penInfos.sort((a, b) => {
            return side === "defense"
                ? b.totYds - a.totYds
                : a.totYds - b.totYds;
        });
        const penInfo = penInfos[0];

        // Adjust penalty yards when near endzones
        let adjustment = 0;
        if (side === "defense" && this.scrimmage + penInfo.totYds > 99) {
            // 1 yard line
            adjustment = this.scrimmage + penInfo.totYds - 99;
        } else if (side === "offense") {
            // Half distance to goal?
            const spotOfFoul =
                penInfo.spotYds === undefined
                    ? this.scrimmage
                    : this.scrimmage + penInfo.spotYds;
            if (spotOfFoul < 1) {
                throw new Error("This should already have been a safety");
            }
            const halfYds = Math.round(spotOfFoul / 2);
            if (penInfo.penYds > halfYds) {
                adjustment = penInfo.penYds - halfYds;
            }
        }
        penInfo.totYds -= adjustment;
        penInfo.penYds -= adjustment;

        // recordedPenYds also includes spotYds for defensive pass interference
        const recordedPenYds =
            side === "defense" && penInfo.name === "Pass interference"
                ? penInfo.totYds
                : penInfo.penYds;

        const t = side === "offense" ? this.o : this.d;

        let p;
        if (penInfo.posOdds !== undefined) {
            const positionsOnField = Object.keys(this.playersOnField[t]);
            const positionsForPenalty = Object.keys(penInfo.posOdds);
            const positions = positionsOnField.filter(pos =>
                positionsForPenalty.includes(pos),
            );
            if (positions.length > 0) {
                const pos = random.choice(
                    positions,
                    pos2 => penInfo.posOdds[pos2],
                );
                if (
                    this.playersOnField[t][pos] !== undefined &&
                    this.playersOnField[t][pos].length > 0
                ) {
                    p = random.choice(this.playersOnField[t][pos]);
                }
            }

            if (!p) {
                console.log(
                    "Using posOdds found nobody, so just pick randomly",
                );
                p = this.pickPlayer(t);
            }

            // Ideally, when notBallCarrier is set, we should ensure that p is not the ball carrier.
        }

        console.log(penInfos);

        this.advanceYds(penInfo.totYds, {
            automaticFirstDown: penInfo.automaticFirstDown,
            repeatDown: true,
        });
        if (this.automaticFirstDown) {
            this.down = 1;
            this.toGo = 1;
        }

        return {
            type: "penalty",
            yds: penInfo.totYds,
            doLog: () => {
                this.recordStat(t, p, "pen");
                this.recordStat(t, p, "penYds", recordedPenYds);
                this.playByPlay.logEvent("penalty", {
                    clock: this.clock,
                    t,
                    names: p ? [p.name] : [],
                    automaticFirstDown: penInfo.automaticFirstDown,
                    penaltyName: penInfo.name,
                    yds: recordedPenYds,
                });
            },
        };
    }

    updatePlayingTime(possessionTime: number) {
        this.recordStat(this.o, undefined, "timePos", possessionTime);
        const onField = new Set();
        for (let t = 0; t < 2; t++) {
            // Get rid of this after making sure playersOnField is always set, even for special teams
            if (this.playersOnField[t] === undefined) {
                continue;
            }

            for (const pos of Object.keys(this.playersOnField[t])) {
                // Update minutes (overall, court, and bench)
                for (const p of this.playersOnField[t][pos]) {
                    if (p === undefined) {
                        console.log(p);
                        console.log(this.playersOnField);
                        throw new Error(
                            "p is undefined, this should never happen!",
                        );
                    }
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

    pickPlayer(
        t: TeamNum,
        rating?: CompositeRating,
        positions?: Position[] = POSITIONS,
        power?: number = 1,
    ) {
        const players: PlayerGameSim[] = [];

        for (const pos of Object.keys(this.playersOnField[t])) {
            if (positions.includes(pos)) {
                players.push(...this.playersOnField[t][pos]);
            }
        }

        const weightFunc =
            rating !== undefined
                ? p =>
                      (p.compositeRating[rating] * fatigue(p.stat.energy)) **
                      power
                : undefined;

        return random.choice(players, weightFunc);
    }

    // Pass undefined as p for some team-only stats
    recordStat(t: TeamNum, p?: PlayerGameSim, s: string, amt?: number = 1) {
        const qtr = this.team[t].stat.ptsQtrs.length - 1;

        // Special case for two point conversions
        if (this.twoPointConversionTeam !== undefined) {
            if (s.endsWith("TD") && s !== "pssTD") {
                this.team[t].stat.pts += 2;
                this.team[t].stat.ptsQtrs[qtr] += 2;
                this.twoPointConversionTeam = undefined;
            }
            return;
        }

        if (p !== undefined) {
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
                if (
                    this.overtimeState === "initialKickoff" ||
                    this.overtimeState === "firstPossession"
                ) {
                    this.overtimeState = "over";
                }
            } else if (s === "xp") {
                pts = 1;
            } else if (s.match(/fg\d+/)) {
                pts = 3;
            } else if (s === "defSft") {
                pts = 2;
                if (
                    this.overtimeState === "initialKickoff" ||
                    this.overtimeState === "firstPossession"
                ) {
                    this.overtimeState = "over";
                }
            }

            if (pts) {
                this.team[t].stat.pts += pts;
                this.team[t].stat.ptsQtrs[qtr] += pts;

                if (this.overtimeState === "secondPossession") {
                    const t2 = t === 0 ? 1 : 0;
                    if (this.team[t].stat.pts > this.team[t2].stat.pts) {
                        this.overtimeState = "over";
                    }
                }
            }

            if (p !== undefined) {
                this.playByPlay.logStat(qtr, t, p.id, s, amt);
            }
        }
    }
}

export default GameSim;
