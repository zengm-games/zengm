/**
 * @name core.gameSim
 * @namespace Individual game simulation.
 */
define(["lib/underscore", "util/helpers", "util/random"], function (_, helpers, random) {
    "use strict";

    /**
     * Initialize the two teams that are playing this game.
     * 
     * When an instance of this class is created, information about the two teams is passed to GameSim. Then GameSim.run will actually simulate a game and return the results (i.e. stats) of the simulation. Also see core.game where the inputs to this function are generated.
     * 
     * @memberOf core.gameSim
     * @param {number} gid Integer game ID, which must be unique as it will serve as the primary key in the database when the game is saved.
     * @param {Object} team1 Information about the home team. Top-level properties are: id (team ID number), defense (a number representing the overall team defensive rating), pace (the mean number of possessions the team likes to have in a game), stat (an for storing team stats), and player (a list of objects, one for each player on the team, ordered by rosterOrder). Each player's object contains: id (player's unique ID number), valueNoPot (current player value, from core.player.value), stat (an object for storing player stats, similar to the one for team stats), and compositeRatings (an object containing various ratings used in the game simulation), and skills (a list of discrete skills a player has, as defined in core.player.skills, which influence game simulation). In other words...
     *     {
     *         "id": 0,
     *         "defense": 0,
     *         "pace": 0,
     *         "stat": {},
     *         "player": [
     *             {
     *                 "id": 0,
     *                 "valueNoPot": 0,
     *                 "stat": {},
     *                 "compositeRating": {},
     *                 "skills": [],
     *                 "injured": false,
     *                 "ptMultiplier": 1
     *             },
     *             ...
     *         ]
     *     }
     * @param {Object} team2 Same as team1, but for the away team.
     */
    function GameSim(gid, team1, team2, doPlayByPlay) {
        if (doPlayByPlay) {
            this.playByPlay = [];
        }

        this.id = gid;
        this.team = [team1, team2];  // If a team plays twice in a day, this needs to be a deep copy
        this.numPossessions = Math.round((this.team[0].pace + this.team[1].pace) / 2 * random.uniform(0.9, 1.1));
        this.dt = 48 / (2 * this.numPossessions); // Time elapsed per possession

        // Starting lineups, which will be reset by updatePlayersOnCourt. This must be done because of injured players in the top 5.
        this.playersOnCourt = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];
        this.startersRecorded = false;  // Used to track whether the *real* starters have been recorded or not.
        this.updatePlayersOnCourt();

        this.subsEveryN = 6;  // How many possessions to wait before doing substitutions

        this.overtimes = 0;  // Number of overtime periods that have taken place

        this.t = 12; // Game clock, in minutes

        // Parameters
        this.synergyFactor = 0.1;  // How important is synergy?

        this.homeCourtAdvantage();
    }

    /**
     * Home court advantage.
     *
     * Scales composite ratings, giving home players bonuses and away players penalties.
     *
     * @memberOf core.gameSim
     */
    GameSim.prototype.homeCourtAdvantage = function () {
        var factor, p, r, t;

        for (t = 0; t < 2; t++) {
            if (t === 0) {
                factor = 1.025;  // Bonus for home team
            } else {
                factor = 0.975;  // Penalty for away team
            }

            for (p = 0; p < this.team[t].player.length; p++) {
                for (r in this.team[t].player[p].compositeRating) {
                    if (this.team[t].player[p].compositeRating.hasOwnProperty(r)) {
                        this.team[t].player[p].compositeRating[r] *= factor;
                    }
                }
            }
        }
    };


    /**
     * Simulates the game and returns the results.
     *
     * Also see core.game where the outputs of this function are used.
     *  
     * @memberOf core.gameSim
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
    GameSim.prototype.run = function () {
        var out, p, t;

        // Simulate the game up to the end of regulation
        this.simPossessions();

        // Play overtime periods if necessary
        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            if (this.overtimes === 0) {
                this.numPossessions = Math.round(this.numPossessions * 5 / 48);  // 5 minutes of possessions
                this.dt = 5 / (2 * this.numPossessions);
            }
            this.t = 5;
            this.overtimes += 1;
            this.team[0].stat.ptsQtrs.push(0);
            this.team[1].stat.ptsQtrs.push(0);
            this.recordPlay("overtime");
            this.simPossessions();
        }

        // Delete stuff that isn't needed before returning
        for (t = 0; t < 2; t++) {
            delete this.team[t].compositeRating;
            delete this.team[t].pace;
            for (p = 0; p < this.team[t].player.length; p++) {
                delete this.team[t].player[p].valueNoPot;
                delete this.team[t].player[p].compositeRating;
                delete this.team[t].player[p].ptModifier;
            }
        }

        out = {
            gid: this.id,
            overtimes: this.overtimes,
            team: this.team
        };

        if (this.playByPlay !== undefined) {
            out.playByPlay = this.playByPlay;
            this.playByPlay.unshift({
                type: "init",
                boxScore: this.team
            });
        }

        return out;
    };

    /**
     * Simulate this.numPossessions possessions.
     *
     * To simulate regulation or overtime, just set this.numPossessions to the appropriate value and call this function.
     * 
     * @memberOf core.gameSim
     */
    GameSim.prototype.simPossessions = function () {
        var i, outcome, substitutions;

        this.o = 0;
        this.d = 1;

        i = 0;
        while (i < this.numPossessions * 2) {
            // Keep track of quarters
            if ((i * this.dt > 12 && this.team[0].stat.ptsQtrs.length === 1) ||
                    (i * this.dt > 24 && this.team[0].stat.ptsQtrs.length === 2) ||
                    (i * this.dt > 36 && this.team[0].stat.ptsQtrs.length === 3)) {
                this.team[0].stat.ptsQtrs.push(0);
                this.team[1].stat.ptsQtrs.push(0);
                this.t = 12;
                this.recordPlay("quarter");
            }

            // Clock
            this.t -= this.dt;
            if (this.t < 0) {
                this.t = 0;
            }

            // Possession change
            this.o = (this.o === 1) ? 0 : 1;
            this.d = (this.o === 1) ? 0 : 1;

            this.updateTeamCompositeRatings();

            outcome = this.simPossession();

            // Swap o and d so that o will get another possession when they are swapped again at the beginning of the loop.
            if (outcome === "orb") {
                this.o = (this.o === 1) ? 0 : 1;
                this.d = (this.o === 1) ? 0 : 1;
            }

            this.updatePlayingTime();

            this.injuries();

            if (i % this.subsEveryN === 0) {
                substitutions = this.updatePlayersOnCourt();
                if (substitutions) {
                    this.updateSynergy();
                }
            }

            i += 1;
        }
    };

    /**
     * Perform appropriate substitutions.
     *
     * Can this be sped up?
     * 
     * @memberOf core.gameSim
     * @return {boolean} true if a substitution occurred, false otherwise.
     */
    GameSim.prototype.updatePlayersOnCourt = function () {
        var b, i, ovrs, p, pp, substitutions, t;

        substitutions = false;

        for (t = 0; t < 2; t++) {
            // Overall values scaled by fatigue
            ovrs = [];
            for (p = 0; p < this.team[t].player.length; p++) {
                // Injured or foulded out players can't play
                if (this.team[t].player[p].injured || this.team[t].player[p].stat.pf >= 6) {
                    ovrs[p] = -Infinity;
                } else {
                    ovrs[p] = this.team[t].player[p].valueNoPot * this.fatigue(this.team[t].player[p].stat.energy) * this.team[t].player[p].ptModifier * random.uniform(0.9, 1.1);
                }
            }

            // Loop through players on court (in inverse order of current roster position)
            i = 0;
            for (pp = 0; pp < this.playersOnCourt[t].length; pp++) {
                p = this.playersOnCourt[t][pp];
                this.playersOnCourt[t][i] = p;
                // Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for (b = 0; b < this.team[t].player.length; b++) {
                    if (this.playersOnCourt[t].indexOf(b) === -1 && ((this.team[t].player[p].stat.courtTime > 3 && this.team[t].player[b].stat.benchTime > 3 && ovrs[b] > ovrs[p]) || ((this.team[t].player[p].injured || this.team[t].player[p].stat.pf >= 6) && (!this.team[t].player[b].injured && this.team[t].player[b].stat.pf < 6)))) {
                        substitutions = true;

                        // Substitute player
                        this.playersOnCourt[t][i] = b;
                        //p = b;
                        this.team[t].player[b].stat.courtTime = random.uniform(-2, 2);
                        this.team[t].player[b].stat.benchTime = random.uniform(-2, 2);
                        this.team[t].player[p].stat.courtTime = random.uniform(-2, 2);
                        this.team[t].player[p].stat.benchTime = random.uniform(-2, 2);

                        // Keep track of deviations from the normal starting lineup for the play-by-play
                        if (this.playByPlay !== undefined) {
                            this.playByPlay.push({
                                type: "sub",
                                t: t,
                                on: this.team[t].player[b].id,
                                off: this.team[t].player[p].id
                            });
                        }

                        // It's only a "substitution" if it's not the starting lineup
                        if (this.startersRecorded) {
                            this.recordPlay("sub", t, [this.team[t].player[b].name, this.team[t].player[p].name]);
                        }
                        break;
                    }
                }
                i += 1;
            }
        }

        // Record starters if that hasn't been done yet. This should run the first time this function is called, and never again.
        if (!this.startersRecorded) {
            for (t = 0; t < 2; t++) {
                for (p = 0; p < this.team[t].player.length; p++) {
                    if (this.playersOnCourt[t].indexOf(p) >= 0) {
                        this.recordStat(t, p, "gs");
                    }
                }
            }
            this.startersRecorded = true;
        }

        return substitutions;
    };

    /**
     * Update synergy.
     *
     * This should be called after this.updatePlayersOnCourt as it only produces different output when the players on the court change.
     * 
     * @memberOf core.gameSim
     */
    GameSim.prototype.updateSynergy = function () {
        var allSkills, i, p, perimFactor, sigmoid, t, skillsCount;

        // Input from 0 to 1
        sigmoid = function (x) {
            return 1 / (1 + Math.exp(-(15 * (x - 0.7)))); // 1 / (1 + e^-(15 * (x - 0.7))) from 0 to 1
        };

        for (t = 0; t < 2; t++) {
            // Count all the *fractional* skills of the active players on a team (including duplicates)
            skillsCount = {
                "3": 0,
                A: 0,
                B: 0,
                Di: 0,
                Dp: 0,
                Po: 0,
                Ps: 0,
                R: 0
            };

            allSkills = [];
            for (i = 0; i < 5; i++) {
                p = this.playersOnCourt[t][i];
                skillsCount["3"] += sigmoid(this.team[t].player[p].compositeRating.shootingThreePointer);
                skillsCount.A += sigmoid(this.team[t].player[p].compositeRating.athleticism);
                skillsCount.B += sigmoid(this.team[t].player[p].compositeRating.dribbling);
                skillsCount.Di += sigmoid(this.team[t].player[p].compositeRating.defenseInterior);
                skillsCount.Dp += sigmoid(this.team[t].player[p].compositeRating.defensePerimeter);
                skillsCount.Po += sigmoid(this.team[t].player[p].compositeRating.shootingLowPost);
                skillsCount.Ps += sigmoid(this.team[t].player[p].compositeRating.passing);
                skillsCount.R += sigmoid(this.team[t].player[p].compositeRating.rebounding);
                allSkills.push(this.team[t].player[p].skills);
            }
            allSkills = _.flatten(allSkills);

            // Just stick all players skills together in a list, then use _.countBy?
            // Base offensive synergy
            this.team[t].synergy.off = 0;
            if (skillsCount["3"] >= 2) { this.team[t].synergy.off += 3; }
            if (skillsCount["3"] >= 2.5) { this.team[t].synergy.off += 1; }
            if (skillsCount["3"] >= 3) { this.team[t].synergy.off += 1; }
            if (skillsCount.B >= 1) { this.team[t].synergy.off += 3; }
            if (skillsCount.B >= 2) { this.team[t].synergy.off += 1; }
            if (skillsCount.Ps >= 1) { this.team[t].synergy.off += 3; }
            if (skillsCount.Ps >= 2) { this.team[t].synergy.off += 1; }
            if (skillsCount.Ps >= 2.5) { this.team[t].synergy.off += 1; }
            if (skillsCount.Po >= 1) { this.team[t].synergy.off += 1; }
            if (skillsCount.A >= 2) { this.team[t].synergy.off += 1; }
            if (skillsCount.A >= 3) { this.team[t].synergy.off += 1; }
            this.team[t].synergy.off /= 17;

            // Punish teams for not having multiple players without perimeter skills
            skillsCount.B = skillsCount.B !== undefined ? skillsCount.B : 0;
            skillsCount.Ps = skillsCount.Ps !== undefined ? skillsCount.Ps : 0;
            skillsCount["3"] = skillsCount["3"] !== undefined ? skillsCount["3"] : 0;
            perimFactor = helpers.bound(Math.sqrt(1 + skillsCount.B + skillsCount.Ps + skillsCount["3"]) - 1, 0, 2) / 2; // Between 0 and 1, representing the perimeter skills
            this.team[t].synergy.off *= 0.5 + 0.5 * perimFactor;

            // Defensive synergy
            this.team[t].synergy.def = 0;
            if (skillsCount.Dp >= 1) { this.team[t].synergy.def += 1; }
            if (skillsCount.Di >= 1) { this.team[t].synergy.def += 2; }
            if (skillsCount.A >= 2.5) { this.team[t].synergy.def += 1; }
            if (skillsCount.A >= 3) { this.team[t].synergy.def += 1; }
            this.team[t].synergy.def /= 6;

            // Rebounding synergy
            this.team[t].synergy.reb = 0;
            if (skillsCount.R >= 1) { this.team[t].synergy.reb += 1; }
            if (skillsCount.R >= 2) { this.team[t].synergy.reb += 1; }
            this.team[t].synergy.reb /= 4;
        }
    };

    /**
     * Update team composite ratings.
     *
     * This should be called once every possession, after this.updatePlayersOnCourt and this.updateSynergy as they influence output, to update the team composite ratings based on the players currently on the court.
     * 
     * @memberOf core.gameSim
     */
    GameSim.prototype.updateTeamCompositeRatings = function () {
        var i, j, p, rating, t, toUpdate;

        // Only update ones that are actually used
        toUpdate = ["dribbling", "passing", "rebounding", "defense", "defensePerimeter", "blocking"];

        for (t = 0; t < 2; t++) {
            for (j = 0; j < toUpdate.length; j++) {
                rating = toUpdate[j];
                this.team[t].compositeRating[rating] = 0;

                for (i = 0; i < 5; i++) {
                    p = this.playersOnCourt[t][i];
                    this.team[t].compositeRating[rating] += this.team[t].player[p].compositeRating[rating] * this.fatigue(this.team[t].player[p].stat.energy);
                }

                this.team[t].compositeRating[rating] = this.team[t].compositeRating[rating] / 5;
            }

            this.team[t].compositeRating.dribbling += this.synergyFactor * this.team[t].synergy.off;
            this.team[t].compositeRating.passing += this.synergyFactor * this.team[t].synergy.off;
            this.team[t].compositeRating.rebounding += this.synergyFactor * this.team[t].synergy.reb;
            this.team[t].compositeRating.defense += this.synergyFactor * this.team[t].synergy.def;
            this.team[t].compositeRating.defensePerimeter += this.synergyFactor * this.team[t].synergy.def;
            this.team[t].compositeRating.blocking += this.synergyFactor * this.team[t].synergy.def;
        }
    };

    /**
     * Update playing time stats.
     *
     * This should be called once every possession, at the end, to record playing time and bench time for players.
     * 
     * @memberOf core.gameSim
     */
    GameSim.prototype.updatePlayingTime = function () {
        var p, t;

        for (t = 0; t < 2; t++) {
            // Update minutes (overall, court, and bench)
            for (p = 0; p < this.team[t].player.length; p++) {
                if (this.playersOnCourt[t].indexOf(p) >= 0) {
                    this.recordStat(t, p, "min", this.dt);
                    this.recordStat(t, p, "courtTime", this.dt);
                    this.recordStat(t, p, "energy", -this.dt * 0.04 * (1 - this.team[t].player[p].compositeRating.endurance));
                    if (this.team[t].player[p].stat.energy < 0) {
                        this.team[t].player[p].stat.energy = 0;
                    }
                } else {
                    this.recordStat(t, p, "benchTime", this.dt);
                    this.recordStat(t, p, "energy", this.dt * 0.1);
                    if (this.team[t].player[p].stat.energy > 1) {
                        this.team[t].player[p].stat.energy = 1;
                    }
                }
            }
        }
    };

    /**
     * See if any injuries occurred this possession, and handle the consequences.
     *
     * This doesn't actually compute the type of injury, it just determines if a player is injured bad enough to miss the rest of the game.
     * 
     * @memberOf core.gameSim
     */
    GameSim.prototype.injuries = function () {
        var newInjury, p, t;

        newInjury = false;

        for (t = 0; t < 2; t++) {
            for (p = 0; p < this.team[t].player.length; p++) {
                // Only players on the court can be injured
                if (this.playersOnCourt[t].indexOf(p) >= 0) {
                    // According to data/injuries.ods, 0.25 injuries occur every game. Divided over 10 players and ~200 possessions, that means each player on the court has P = 0.25 / 10 / 200 = 0.000125 probability of being injured this play.
                    if (Math.random() < 0.000125) {
                        this.team[t].player[p].injured = true;
                        newInjury = true;
                        this.recordPlay("injury", t, [this.team[t].player[p].name]);
                    }
                }
            }
        }

        // Sub out injured player
        if (newInjury) {
            this.updatePlayersOnCourt();
        }
    };

    /**
     * Simulate a single possession.
     * 
     * @memberOf core.gameSim
     * @return {string} Outcome of the possession, such as "tov", "drb", "orb", "fg", etc.
     */
    GameSim.prototype.simPossession = function () {
        var ratios, shooter;

        // Turnover?
        if (this.probTov() > Math.random()) {
            return this.doTov();  // tov
        }

        // Shot if there is no turnover
        ratios = this.ratingArray("usage", this.o);
        shooter = this.pickPlayer(ratios);

        return this.doShot(shooter);  // fg, orb, or drb
    };

    /**
     * Probability of the current possession ending in a turnover.
     * 
     * @memberOf core.gameSim
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probTov = function () {
        return 0.13 * (1 + this.team[this.d].compositeRating.defense) / (1 + 0.5 * (this.team[this.o].compositeRating.dribbling + this.team[this.o].compositeRating.passing));
    };

    /**
     * Turnover.
     * 
     * @memberOf core.gameSim
     * @return {string} Either "tov" or "stl" depending on whether the turnover was caused by a steal or not.
     */
    GameSim.prototype.doTov = function () {
        var p, ratios;

        ratios = this.ratingArray("turnovers", this.o, 0.5);
        p = this.playersOnCourt[this.o][this.pickPlayer(ratios)];
        this.recordStat(this.o, p, "tov");
        if (this.probStl() > Math.random()) {
            return this.doStl(p);  // "stl"
        } else {
            this.recordPlay("tov", this.o, [this.team[this.o].player[p].name]);
        }

        return "tov";
    };

    /**
     * Probability that a turnover occurring in this possession is a steal.
     * 
     * @memberOf core.gameSim
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probStl = function () {
        return 0.55 * this.team[this.d].compositeRating.defensePerimeter / (0.5 * (this.team[this.o].compositeRating.dribbling + this.team[this.o].compositeRating.passing));
    };

    /**
     * Steal.
     * 
     * @memberOf core.gameSim
     * @return {string} Currently always returns "stl".
     */
    GameSim.prototype.doStl = function (pStoleFrom) {
        var p, ratios;

        ratios = this.ratingArray("stealing", this.d);
        p = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
        this.recordStat(this.d, p, "stl");
        this.recordPlay("stl", this.d, [this.team[this.d].player[p].name, this.team[this.o].player[pStoleFrom].name]);

        return "stl";
    };

    /**
     * Shot.
     * 
     * @memberOf core.gameSim
     * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
     * @return {string} Either "fg" or output of this.doReb, depending on make or miss and free throws.
     */
    GameSim.prototype.doShot = function (shooter) {
        var fatigue, p, passer, probMake, probAndOne, probMissAndFoul, r1, r2, r3, ratios, type;

        p = this.playersOnCourt[this.o][shooter];

        fatigue = this.fatigue(this.team[this.o].player[p].stat.energy);

        // Is this an "assisted" attempt (i.e. an assist will be recorded if it's made)
        passer = -1;
        if (this.probAst() > Math.random()) {
            ratios = this.ratingArray("passing", this.o, 2);
            passer = this.pickPlayer(ratios, shooter);
        }

        // Pick the type of shot and store the success rate (with no defense) in probMake and the probability of an and one in probAndOne
        if (this.team[this.o].player[p].compositeRating.shootingThreePointer > 0.4 && Math.random() < (0.35 * this.team[this.o].player[p].compositeRating.shootingThreePointer)) {
            // Three pointer
            type = "threePointer";
            probMissAndFoul = 0.02;
            probMake = this.team[this.o].player[p].compositeRating.shootingThreePointer * 0.5 + 0.1;
            probAndOne = 0.01;
        } else {
            r1 = Math.random() * this.team[this.o].player[p].compositeRating.shootingMidRange;
            r2 = Math.random() * (this.team[this.o].player[p].compositeRating.shootingAtRim + this.synergyFactor * (this.team[this.o].synergy.off - this.team[this.d].synergy.def));  // Synergy makes easy shots either more likely or less likely
            r3 = Math.random() * (this.team[this.o].player[p].compositeRating.shootingLowPost + this.synergyFactor * (this.team[this.o].synergy.off - this.team[this.d].synergy.def));  // Synergy makes easy shots either more likely or less likely
            if (r1 > r2 && r1 > r3) {
                // Two point jumper
                type = "midRange";
                probMissAndFoul = 0.07;
                probMake = this.team[this.o].player[p].compositeRating.shootingMidRange * 0.3 + 0.29;
                probAndOne = 0.05;
            } else if (r2 > r3) {
                // Dunk, fast break or half court
                type = "atRim";
                probMissAndFoul = 0.37;
                probMake = this.team[this.o].player[p].compositeRating.shootingAtRim * 0.3 + 0.52;
                probAndOne = 0.25;
            } else {
                // Post up
                type = "lowPost";
                probMissAndFoul = 0.33;
                probMake = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.3 + 0.37;
                probAndOne = 0.15;
            }
        }

        probMake = (probMake - 0.25 * this.team[this.d].compositeRating.defense + this.synergyFactor * (this.team[this.o].synergy.off - this.team[this.d].synergy.def)) * fatigue;

        // Assisted shots are easier
        if (passer >= 0) {
            probMake += 0.025;
        }

        if (this.probBlk() > Math.random()) {
            return this.doBlk(shooter, type);  // orb or drb
        }

        // Make
        if (probMake > Math.random()) {
            // And 1
            if (probAndOne > Math.random()) {
                return this.doFg(shooter, passer, type, true);  // fg, orb, or drb
            }
            return this.doFg(shooter, passer, type);  // fg
        }

        // Miss, but fouled
        if (probMissAndFoul > Math.random()) {
            if (type === "threePointer") {
                return this.doFt(shooter, 3);  // fg, orb, or drb
            }
            return this.doFt(shooter, 2);  // fg, orb, or drb
        }

        // Miss
        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fga");
        if (type === "atRim") {
            this.recordStat(this.o, p, "fgaAtRim");
            this.recordPlay("missAtRim", this.o, [this.team[this.o].player[p].name]);
        } else if (type === "lowPost") {
            this.recordStat(this.o, p, "fgaLowPost");
            this.recordPlay("missLowPost", this.o, [this.team[this.o].player[p].name]);
        } else if (type === "midRange") {
            this.recordStat(this.o, p, "fgaMidRange");
            this.recordPlay("missMidRange", this.o, [this.team[this.o].player[p].name]);
        } else if (type === "threePointer") {
            this.recordStat(this.o, p, "tpa");
            this.recordPlay("missTp", this.o, [this.team[this.o].player[p].name]);
        }
        return this.doReb();  // orb or drb
    };

    /**
     * Probability that a shot taken this possession is blocked.
     * 
     * @memberOf core.gameSim
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probBlk = function () {
        return 0.1 * this.team[this.d].compositeRating.blocking;
    };

    /**
     * Blocked shot.
     * 
     * @memberOf core.gameSim
     * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
     * @return {string} Output of this.doReb.
     */
    GameSim.prototype.doBlk = function (shooter, type) {
        var p, p2, ratios;

        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fga");
        if (type === "atRim") {
            this.recordStat(this.o, p, "fgaAtRim");
        } else if (type === "lowPost") {
            this.recordStat(this.o, p, "fgaLowPost");
        } else if (type === "midRange") {
            this.recordStat(this.o, p, "fgaMidRange");
        } else if (type === "threePointer") {
            this.recordStat(this.o, p, "tpa");
        }

        ratios = this.ratingArray("blocking", this.d, 4);
        p2 = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
        this.recordStat(this.d, p2, "blk");


        if (type === "atRim") {
            this.recordPlay("blkAtRim", this.d, [this.team[this.d].player[p2].name, this.team[this.o].player[p].name]);
        } else if (type === "lowPost") {
            this.recordPlay("blkLowPost", this.d, [this.team[this.d].player[p2].name, this.team[this.o].player[p].name]);
        } else if (type === "midRange") {
            this.recordPlay("blkMidRange", this.d, [this.team[this.d].player[p2].name, this.team[this.o].player[p].name]);
        } else if (type === "threePointer") {
            this.recordPlay("blkTp", this.d, [this.team[this.d].player[p2].name, this.team[this.o].player[p].name]);
        }

        return this.doReb();  // orb or drb
    };

    /**
     * Field goal.
     *
     * Simulate a successful made field goal.
     * 
     * @memberOf core.gameSim
     * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
     * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the passing player, who will get an assist. -1 if no assist.
     * @param {number} type 2 for a two pointer, 3 for a three pointer.
     * @return {string} fg, orb, or drb (latter two are for and ones)
     */
    GameSim.prototype.doFg = function (shooter, passer, type, andOne) {
        var p;

        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fga");
        this.recordStat(this.o, p, "fg");
        this.recordStat(this.o, p, "pts", 2);  // 2 points for 2's
        if (type === "atRim") {
            this.recordStat(this.o, p, "fgaAtRim");
            this.recordStat(this.o, p, "fgAtRim");
            this.recordPlay("fgAtRim" + (andOne ? "AndOne" : ""), this.o, [this.team[this.o].player[p].name]);
        } else if (type === "lowPost") {
            this.recordStat(this.o, p, "fgaLowPost");
            this.recordStat(this.o, p, "fgLowPost");
            this.recordPlay("fgLowPost" + (andOne ? "AndOne" : ""), this.o, [this.team[this.o].player[p].name]);
        } else if (type === "midRange") {
            this.recordStat(this.o, p, "fgaMidRange");
            this.recordStat(this.o, p, "fgMidRange");
            this.recordPlay("fgMidRange" + (andOne ? "AndOne" : ""), this.o, [this.team[this.o].player[p].name]);
        } else if (type === "threePointer") {
            this.recordStat(this.o, p, "pts");  // Extra point for 3's
            this.recordStat(this.o, p, "tpa");
            this.recordStat(this.o, p, "tp");
            this.recordPlay("tp" + (andOne ? "AndOne" : ""), this.o, [this.team[this.o].player[p].name]);
        }

        if (passer >= 0) {
            p = this.playersOnCourt[this.o][passer];
            this.recordStat(this.o, p, "ast");
            this.recordPlay("ast", this.o, [this.team[this.o].player[p].name]);
        }

        if (andOne) {
            return this.doFt(shooter, 1);  // fg, orb, or drb
        }
        return "fg";
    };

    /**
     * Probability that a shot taken this possession is assisted.
     * 
     * @memberOf core.gameSim
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probAst = function () {
        return 0.6 * (2 + this.team[this.o].compositeRating.passing) / (2 + this.team[this.d].compositeRating.defense);
    };

    /**
     * Free throw.
     * 
     * @memberOf core.gameSim
     * @param {number} shooter Integer from 0 to 4 representing the index of this.playersOnCourt[this.o] for the shooting player.
     * @param {number} amount Integer representing the number of free throws to shoot
     * @return {string} "fg" if the last free throw is made; otherwise, this.doReb is called and its output is returned.
     */
    GameSim.prototype.doFt = function (shooter, amount) {
        var i, outcome, p;

        this.doPf(this.d);
        p = this.playersOnCourt[this.o][shooter];
        for (i = 0; i < amount; i++) {
            this.recordStat(this.o, p, "fta");
            if (Math.random() < this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6) {  // Between 60% and 90%
                this.recordStat(this.o, p, "ft");
                this.recordStat(this.o, p, "pts");
                this.recordPlay("ft", this.o, [this.team[this.o].player[p].name]);
                outcome = "fg";
            } else {
                this.recordPlay("missFt", this.o, [this.team[this.o].player[p].name]);
                outcome = null;
            }
        }

        if (outcome !== "fg") {
            outcome = this.doReb();  // orb or drb
        }

        return outcome;
    };

    /**
     * Personal foul.
     *
     * @memberOf core.gameSim
     * @param {number} t Team (0 or 1, this.or or this.d).
     */
    GameSim.prototype.doPf = function (t) {
        var p, ratios;

        ratios = this.ratingArray("fouling", t);
        p = this.playersOnCourt[t][this.pickPlayer(ratios)];
        this.recordStat(this.d, p, "pf");
        this.recordPlay("pf", this.d, [this.team[this.d].player[p].name]);
        // Foul out
        if (this.team[this.d].player[p].stat.pf >= 6) {
            this.recordPlay("foulOut", this.d, [this.team[this.d].player[p].name]);
            // Force substitutions now
            this.updatePlayersOnCourt();
            this.updateSynergy();
        }
    };

    /**
     * Rebound.
     *
     * Simulates a rebound opportunity (e.g. after a missed shot).
     * 
     * @memberOf core.gameSim
     * @return {string} "drb" for a defensive rebound, "orb" for an offensive rebound, null for no rebound (like if the ball goes out of bounds).
     */
    GameSim.prototype.doReb = function () {
        var p, ratios;

        if (0.15 > Math.random()) {
            return null;
        }

        if (0.75 * (2 + this.team[this.d].compositeRating.rebounding) / (2 + this.team[this.o].compositeRating.rebounding) > Math.random()) {
            ratios = this.ratingArray("rebounding", this.d);
            p = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
            this.recordStat(this.d, p, "drb");
            this.recordPlay("drb", this.d, [this.team[this.d].player[p].name]);

            return "drb";
        }

        ratios = this.ratingArray("rebounding", this.o);
        p = this.playersOnCourt[this.o][this.pickPlayer(ratios)];
        this.recordStat(this.o, p, "orb");
        this.recordPlay("orb", this.o, [this.team[this.o].player[p].name]);

        return "orb";
    };

    /**
     * Generate an array of composite ratings.
     * 
     * @memberOf core.gameSim
     * @param {string} rating Key of this.team[t].player[p].compositeRating to use.
     * @param {number} t Team (0 or 1, this.or or this.d).
     * @param {number=} power Power that the composite rating is raised to after the components are linearly combined by  the weights and scaled from 0 to 1. This can be used to introduce nonlinearities, like making a certain stat more uniform (power < 1) or more unevenly distributed (power > 1) or making a composite rating an inverse (power = -1). Default value is 1.
     * @return {Array.<number>} Array of composite ratings of the players on the court for the given rating and team.
     */
    GameSim.prototype.ratingArray = function (rating, t, power) {
        var array, i, p;

        power = power !== undefined ? power : 1;

        array = [0, 0, 0, 0, 0];
        for (i = 0; i < 5; i++) {
            p = this.playersOnCourt[t][i];
            array[i] = Math.pow(this.team[t].player[p].compositeRating[rating] * this.fatigue(this.team[t].player[p].stat.energy), power);
        }

        return array;
    };

    /**
     * Pick a player to do something.
     * 
     * @memberOf core.gameSim
     * @param {Array.<number>} ratios output of this.ratingArray.
     * @param {number} exempt An integer representing a player that can't be picked (i.e. you can't assist your own shot, which is the only current use of exempt). The value of exempt ranges from 0 to 4, corresponding to the index of the player in this.playersOnCourt. This is *NOT* the same value as the player ID *or* the index of the this.team[t].player list. Yes, that's confusing.
     */
    GameSim.prototype.pickPlayer = function (ratios, exempt) {
        var pick, rand;

        exempt = exempt !== undefined ? exempt : false;

        if (exempt !== false) {
            ratios[exempt] = 0;
        }
        rand = Math.random() * (ratios[0] + ratios[1] + ratios[2] + ratios[3] + ratios[4]);
        if (rand < ratios[0]) {
            pick = 0;
        } else if (rand < (ratios[0] + ratios[1])) {
            pick = 1;
        } else if (rand < (ratios[0] + ratios[1] + ratios[2])) {
            pick = 2;
        } else if (rand < (ratios[0] + ratios[1] + ratios[2] + ratios[3])) {
            pick = 3;
        } else {
            pick = 4;
        }
        return pick;
    };

    /**
     * Increments a stat (s) for a player (p) on a team (t) by amount (default is 1).
     *
     * @memberOf core.gameSim
     * @param {number} t Team (0 or 1, this.or or this.d).
     * @param {number} p Integer index of this.team[t].player for the player of interest.
     * @param {string} s Key for the property of this.team[t].player[p].stat to increment.
     * @param {number} amt Amount to increment (default is 1).
     */
    GameSim.prototype.recordStat = function (t, p, s, amt) {
        amt = amt !== undefined ? amt : 1;
        this.team[t].player[p].stat[s] += amt;
        if (s !== "gs" && s !== "courtTime" && s !== "benchTime" && s !== "energy") {
            this.team[t].stat[s] += amt;
            // Record quarter-by-quarter scoring too
            if (s === "pts") {
                this.team[t].stat.ptsQtrs[this.team[t].stat.ptsQtrs.length - 1] += amt;
            }
            if (this.playByPlay !== undefined) {
                this.playByPlay.push({
                    type: "stat",
                    qtr: this.team[t].stat.ptsQtrs.length - 1,
                    t: t,
                    p: p,
                    s: s,
                    amt: amt
                });
            }
        }
    };

    GameSim.prototype.recordPlay = function (type, t, names) {
        var i, qtr, sec, text, texts;

        if (this.playByPlay !== undefined) {
            if (type === "injury") {
                texts = ["{0} was injured!"];
            } else if (type === "tov") {
                texts = ["{0} turned the ball over"];
            } else if (type === "stl") {
                texts = ["{0} stole the ball from {1}"];
            } else if (type === "fgAtRim") {
                texts = ["{0} made a dunk/layup"];
            } else if (type === "fgAtRimAndOne") {
                texts = ["{0} made a dunk/layup and got fouled!"];
            } else if (type === "fgLowPost") {
                texts = ["{0} made a low post shot"];
            } else if (type === "fgLowPostAndOne") {
                texts = ["{0} made a low post shot and got fouled!"];
            } else if (type === "fgMidRange") {
                texts = ["{0} made a mid-range shot"];
            } else if (type === "fgMidRangeAndOne") {
                texts = ["{0} made a mid-range shot and got fouled!"];
            } else if (type === "tp") {
                texts = ["{0} made a three pointer shot"];
            } else if (type === "tpAndOne") {
                texts = ["{0} made a three pointer and got fouled!"];
            } else if (type === "blkAtRim") {
                texts = ["{0} blocked {1}'s dunk/layup"];
            } else if (type === "blkLowPost") {
                texts = ["{0} blocked {1}'s low post shot"];
            } else if (type === "blkMidRange") {
                texts = ["{0} blocked {1}'s mid-range shot"];
            } else if (type === "blkTp") {
                texts = ["{0} blocked {1}'s three pointer"];
            } else if (type === "missAtRim") {
                texts = ["{0} missed a dunk/layup"];
            } else if (type === "missLowPost") {
                texts = ["{0} missed a low post shot"];
            } else if (type === "missMidRange") {
                texts = ["{0} missed a mid-range shot"];
            } else if (type === "missTp") {
                texts = ["{0} missed a three pointer"];
            } else if (type === "orb") {
                texts = ["{0} grabbed the offensive rebound"];
            } else if (type === "drb") {
                texts = ["{0} grabbed the defensive rebound"];
            } else if (type === "ast") {
                texts = ["(assist: {0})"];
            } else if (type === "quarter") {
                texts = ["<b>Start of " + helpers.ordinal(this.team[0].stat.ptsQtrs.length) + " quarter</b>"];
            } else if (type === "overtime") {
                texts = ["<b>Start of " + helpers.ordinal(this.team[0].stat.ptsQtrs.length - 4) + " overtime period</b>"];
            } else if (type === "ft") {
                texts = ["{0} made a free throw"];
            } else if (type === "missFt") {
                texts = ["{0} missed a free throw"];
            } else if (type === "pf") {
                texts = ["Foul on {0}"];
            } else if (type === "foulOut") {
                texts = ["{0} fouled out"];
            } else if (type === "sub") {
                texts = ["Substitution: {0} for {1}"];
            }

            if (texts) {
                //text = random.choice(texts);
                text = texts[0];
                if (names) {
                    for (i = 0; i < names.length; i++) {
                        text = text.replace("{" + i + "}", names[i]);
                    }
                }

                if (type === "ast") {
                    // Find most recent made shot, count assist for it
                    for (i = this.playByPlay.length - 1; i >= 0; i--) {
                        if (this.playByPlay[i].type === "text") {
                            this.playByPlay[i].text += " " + text;
                            break;
                        }
                    }
                } else {
                    sec = Math.floor(this.t % 1 * 60);
                    if (sec < 10) {
                        sec = "0" + sec;
                    }
                    this.playByPlay.push({
                        type: "text",
                        text: text,
                        t: t,
                        time: Math.floor(this.t) + ":" + sec
                    });
                }
            } else {
                console.log("No text for " + type);
            }
        }
    };

    /**
     * Convert energy into fatigue, which can be multiplied by a rating to get a fatigue-adjusted value.
     * 
     * @memberOf core.gameSim
     * @param {number} energy A player's energy level, from 0 to 1 (0 = lots of energy, 1 = none).
     * @return {number} Fatigue, from 0 to 1 (0 = lots of fatigue, 1 = none).
     */
    GameSim.prototype.fatigue = function (energy) {
        energy += 0.05;
        if (energy > 1) {
            energy = 1;
        }

        return energy;
    };

    return {
        GameSim: GameSim
    };
});