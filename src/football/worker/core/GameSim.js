// @flow

import { g, helpers, random } from "../../../deion/worker/util";
import type { Position } from "../../common/types";

type PlayType =
    | "kickoff"
    | "kickoffReturn"
    | "punt"
    | "puntReturn"
    | "passIncomplete"
    | "passComplete"
    | "run"
    | "fumbleRecoverOffense"
    | "fumbleRecoverDefense"
    | "interception"
    | "safety"
    | "sack"
    | "penalty"
    | "twoMinuteWarning"
    | "overtime"
    | "quarter"
    | "touchdown";
type ShotType = "atRim" | "ft" | "lowPost" | "midRange" | "threePointer";
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
    | "tpa";
type PlayerNumOnCourt = 0 | 1 | 2 | 3 | 4;
type TeamNum = 0 | 1;
type CompositeRating =
    | "blocking"
    | "fouling"
    | "passing"
    | "rebounding"
    | "stealing"
    | "turnovers"
    | "usage";

type PlayerGameSim = {
    id: number,
    name: string,
    pos: string,
    valueNoPot: number,
    stat: Object,
    compositeRating: Object,
    skills: string[],
    injured: boolean,
    ptModifier: number,
};
type TeamGameSim = {
    id: number,
    pace: number, // mean number of possessions the team likes to have in a game
    stat: Object,
    compositeRating: Object,
    player: PlayerGameSim[],
    compositeRating: Object,
    depth: {
        [key: Position]: number[],
    },
};

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

    lastScoringPlay: {
        team: number,
        player: number,
        type: ShotType,
        time: number,
    }[];

    clutchPlays: (
        | {
              type: "playerFeat",
              text: string,
              showNotification: boolean,
              pids: [number],
              tids: [number],
          }
        | {
              type: "playerFeat",
              tempText: string,
              showNotification: boolean,
              pids: [number],
              tids: [number],
          }
    )[];

    o: TeamNum;

    d: TeamNum;

    playByPlay: Object[];

    /**
     * Initialize the two teams that are playing this game.
     *
     * When an instance of this class is created, information about the two teams is passed to GameSim. Then GameSim.run will actually simulate a game and return the results (i.e. stats) of the simulation. Also see core.game where the inputs to this function are generated.
     */
    constructor(
        gid: number,
        team1: TeamGameSim,
        team2: TeamGameSim,
        doPlayByPlay: boolean,
    ) {
        if (doPlayByPlay) {
            this.playByPlay = [];
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

        this.overtimes = 0; // Number of overtime periods that have taken place

        this.t = g.quarterLength; // Game clock, in minutes

        this.awaitingKickoff = true;

        this.homeCourtAdvantage();

        this.lastScoringPlay = [];
        this.clutchPlays = [];
    }

    /**
     * Home court advantage.
     *
     * Scales composite ratings, giving home players bonuses and away players penalties.
     *
     */
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

        console.log(this.team);
        // Play overtime periods if necessary
        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            this.checkGameTyingShot();
            this.simOvertime();
        }

        this.checkGameWinner();

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
            clutchPlays: this.clutchPlays,
            playByPlay: undefined,
        };

        if (this.playByPlay !== undefined) {
            out.playByPlay = this.playByPlay;
            this.playByPlay.unshift({
                type: "init",
                boxScore: this.team,
            });
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
                if (this.awaitingKickoff) {
                    this.kickoff();
                } else {
                    this.simPlay();
                }
            }
            quarter += 1;

            if (quarter === 5) {
                break;
            }
            this.team[0].stat.ptsQtrs.push(0);
            this.team[1].stat.ptsQtrs.push(0);
            this.t = g.quarterLength;
            this.lastScoringPlay = [];
            this.recordPlay("quarter");
        }
    }

    simOvertime() {
        this.t = Math.ceil(0.4 * g.quarterLength); // 5 minutes by default, but scales
        this.lastScoringPlay = [];
        this.overtimes += 1;
        this.team[0].stat.ptsQtrs.push(0);
        this.team[1].stat.ptsQtrs.push(0);
        this.recordPlay("overtime");
        this.o = Math.random() < 0.5 ? 0 : 1;
        this.d = this.o === 0 ? 1 : 0;
        while (this.t > 0) {
            this.simPossession();
        }
    }

    kickoff() {
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

        this.recordPlay("kickoff", {
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

            this.recordPlay("kickoffReutrn", {
                t: this.d,
                names: [kickReturner.name],
                td,
                yds: returnLength,
            });
        }

        // Possession change
        this.o = this.o === 1 ? 0 : 1;
        this.d = this.o === 1 ? 0 : 1;
        this.updateTeamCompositeRatings();

        // Clock
        this.t -= dt;
        let playTime = dt;
        if (this.t < 0) {
            playTime += this.t;
            this.t = 0;
        }
        this.updatePlayingTime(playTime);
    }

    simPlay() {
        // Clock
        this.t -= this.dt;
        let playTime = this.dt;
        if (this.t < 0) {
            playTime += this.t;
            this.t = 0;
        }

        if (this.down === Infinity) {
            this.fourthDown();
        } else {
            this.runPlay();
        }

        this.updatePlayingTime(playTime);

        this.injuries();
    }

    /**
     * Update team composite ratings.
     *
     * This should be called once every possession, after this.updatePlayersOnCourt as they influence output, to update the team composite ratings based on the players currently on the court.
     */
    updateTeamCompositeRatings() {
        /*// Only update ones that are actually used
        const toUpdate = [
            "dribbling",
            "passing",
            "rebounding",
            "defense",
            "defensePerimeter",
            "blocking",
        ];

        for (let t = 0; t < 2; t++) {
            for (let j = 0; j < toUpdate.length; j++) {
                const rating = toUpdate[j];
                this.team[t].compositeRating[rating] = 0;

                for (let i = 0; i < 5; i++) {
                    const p = this.playersOnCourt[t][i];
                    this.team[t].compositeRating[rating] +=
                        this.team[t].player[p].compositeRating[rating] *
                        fatigue(this.team[t].player[p].stat.energy);
                }

                this.team[t].compositeRating[rating] =
                    this.team[t].compositeRating[rating] / 5;
            }
        }*/
    }

    /**
     * Update playing time stats.
     *
     * This should be called once every possession, at the end, to record playing time and bench time for players.
     */
    updatePlayingTime(possessionTime: number) {
        /*for (let t = 0; t < 2; t++) {
            // Update minutes (overall, court, and bench)
            for (let p = 0; p < this.team[t].player.length; p++) {
                if (this.playersOnCourt[t].includes(p)) {
                    this.recordStat(t, p, "min", possessionTime);
                    this.recordStat(t, p, "courtTime", possessionTime);
                    // This used to be 0.04. Increase more to lower PT
                    this.recordStat(
                        t,
                        p,
                        "energy",
                        -possessionTime *
                            0.06 *
                            (1 -
                                this.team[t].player[p].compositeRating
                                    .endurance),
                    );
                    if (this.team[t].player[p].stat.energy < 0) {
                        this.team[t].player[p].stat.energy = 0;
                    }
                } else {
                    this.recordStat(t, p, "benchTime", possessionTime);
                    this.recordStat(t, p, "energy", possessionTime * 0.1);
                    if (this.team[t].player[p].stat.energy > 1) {
                        this.team[t].player[p].stat.energy = 1;
                    }
                }
            }
        }*/
    }

    /**
     * See if any injuries occurred this possession, and handle the consequences.
     *
     * This doesn't actually compute the type of injury, it just determines if a player is injured bad enough to miss the rest of the game.
     */
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
                        this.recordPlay("injury", t, [
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
     * Simulate a single possession.
     *
     * @return {string} Outcome of the possession, such as "tov", "drb", "orb", "fg", etc.
     */
    runPlay() {
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

        this.doRun();
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

    doRun() {
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

        this.recordPlay("run", {
            t: this.o,
            names: [p.name],
            td,
            yds,
        });
    }

    checkGameTyingShot() {
        if (this.lastScoringPlay.length === 0) {
            return;
        }

        // can assume that the last scoring play tied the game
        const i = this.lastScoringPlay.length - 1;
        const play = this.lastScoringPlay[i];

        let shotType = "a basket";
        switch (play.type) {
            case "atRim":
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
                                    this.lastScoringPlay[i - 2].team ===
                                        play.team &&
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

        let eventText = `<a href="${helpers.leagueUrl([
            "player",
            player.id,
        ])}">${player.name}</a> made ${shotType}`;
        if (play.time > 0) {
            eventText += ` with ${play.time} seconds remaining`;
        } else {
            eventText +=
                play.type === "ft"
                    ? " with no time on the clock"
                    : " at the buzzer";
        }
        eventText += ` to force ${helpers.overtimeCounter(
            this.team[0].stat.ptsQtrs.length - 3,
        )} overtime`;

        this.clutchPlays.push({
            type: "playerFeat",
            tempText: eventText,
            showNotification: team.id === g.userTid,
            pids: [player.id],
            tids: [team.id],
        });
    }

    checkGameWinner() {
        if (this.lastScoringPlay.length === 0) {
            return;
        }

        const winner = this.team[0].stat.pts > this.team[1].stat.pts ? 0 : 1;
        const loser = winner === 0 ? 1 : 0;
        let margin = this.team[winner].stat.pts - this.team[loser].stat.pts;

        // work backwards from last scoring plays, check if any resulted in a tie-break or lead change
        let pts = 0;
        let shotType = "basket";
        for (let i = this.lastScoringPlay.length - 1; i >= 0; i--) {
            const play = this.lastScoringPlay[i];
            switch (play.type) {
                case "atRim":
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
                                case "lowPost":
                                case "midRange":
                                    shotType = "three-point play";
                                    break;
                                case "threePointer":
                                    shotType = "four-point play";
                                    break;
                                // case where more than one free throw is needed to take the lead
                                case "ft":
                                    shotType += "s";
                                    break;
                                default:
                            }
                        }
                    }
                    pts = 1;
                    break;
                default:
            }

            margin -= play.team === winner ? pts : -pts;
            if (margin <= 0) {
                const team = this.team[play.team];
                const player = this.team[play.team].player[play.player];

                let eventText = `<a href="${helpers.leagueUrl([
                    "player",
                    player.id,
                ])}">${player.name}</a> made the game-winning ${shotType}`;
                if (play.time > 0) {
                    eventText += ` with ${play.time} seconds remaining`;
                } else {
                    eventText +=
                        play.type === "ft"
                            ? " with no time on the clock"
                            : " at the buzzer";
                }
                eventText += ` in ${
                    this.team[winner].stat.pts.toString().charAt(0) === "8"
                        ? "an"
                        : "a"
                } <a href="${helpers.leagueUrl([
                    "game_log",
                    g.teamAbbrevsCache[team.id],
                    g.season,
                    this.id,
                ])}">${this.team[winner].stat.pts}-${
                    this.team[loser].stat.pts
                }</a> win over the ${g.teamNamesCache[this.team[loser].id]}.`;

                this.clutchPlays.push({
                    type: "playerFeat",
                    text: eventText,
                    showNotification: team.id === g.userTid,
                    pids: [player.id],
                    tids: [team.id],
                });
                return;
            }
        }
    }

    recordLastScore(
        teamnum: TeamNum,
        playernum: number,
        type: ShotType,
        time: number,
    ) {
        // only record plays in the fourth quarter or overtime...
        if (this.team[0].stat.ptsQtrs.length < 4) {
            return;
        }
        // ...in the last 2 minutes...
        if (time > 120) {
            return;
        }
        // ...when the lead is 8 or less
        if (Math.abs(this.team[0].stat.pts - this.team[1].stat.pts) > 8) {
            return;
        }

        console.log("Should log clutch score");
        /*const currPlay = {
            team: teamnum,
            player: playernum,
            type,
            time: Math.floor(time * 600) / 10, // up to 0.1 of a second
        };

        if (this.lastScoringPlay.length === 0) {
            this.lastScoringPlay.push(currPlay);
        } else {
            const lastPlay = this.lastScoringPlay[0];
            if (lastPlay.time !== currPlay.time) {
                this.lastScoringPlay = [];
            }
            this.lastScoringPlay.push(currPlay);
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

    /**
     * Increments a stat (s) for a player (p) on a team (t) by amount (default is 1).
     *
     * @param {number} t Team (0 or 1, this.o or this.d).
     * @param {number} p Player object.
     * @param {string} s Key for the property of this.team[t].player[p].stat to increment.
     * @param {number} amt Amount to increment (default is 1).
     */
    recordStat(t: TeamNum, p: PlayerGameSim, s: Stat, amt?: number = 1) {
        p.stat[s] += amt;
        if (
            s !== "gs" &&
            s !== "courtTime" &&
            s !== "benchTime" &&
            s !== "energy"
        ) {
            this.team[t].stat[s] += amt;

            if (s.endsWith("TD") && s !== "pssTD") {
                this.team[t].stat.pts += 6;

                // Record quarter-by-quarter scoring too
                this.team[t].stat.ptsQtrs[
                    this.team[t].stat.ptsQtrs.length - 1
                ] += amt;
            }
            /*if (this.playByPlay !== undefined) {
                this.playByPlay.push({
                    type: "stat",
                    qtr: this.team[t].stat.ptsQtrs.length - 1,
                    t,
                    p,
                    s,
                    amt,
                });
            }*/
        }
    }

    recordPlay(
        type: PlayType,
        {
            names,
            t,
            td,
            yds,
        }: {
            names?: string[],
            t?: TeamNum,
            td?: boolean,
            yds?: number,
        } = {},
    ) {
        let texts;
        if (this.playByPlay !== undefined) {
            if (type === "injury") {
                texts = [`${names[0]} was injured!`];
            } else if (type === "quarter") {
                texts = [
                    `Start of ${helpers.ordinal(
                        this.team[0].stat.ptsQtrs.length,
                    )} quarter`,
                ];
            } else if (type === "run") {
                texts = [
                    `${names[0]} rushed for ${yds} yds${
                        td ? " and a touchdown!" : ""
                    }`,
                ];
            } else if (type === "overtime") {
                texts = ["Start of overtime"];
            }

            if (texts) {
                const text = texts[0];

                let sec = Math.floor((this.t % 1) * 60);
                if (sec < 10) {
                    sec = `0${sec}`;
                }
                this.playByPlay.push({
                    type: "text",
                    text,
                    t,
                    time: `${Math.floor(this.t)}:${sec}`,
                });
            } else {
                throw new Error(`No text for ${type}`);
            }
        }
    }
}

export default GameSim;
