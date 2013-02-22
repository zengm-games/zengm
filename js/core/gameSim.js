/**
 * @name core.gameSim
 * @namespace Individual game simulation.
 */
define(["util/helpers", "util/random"], function (helpers, random) {
    "use strict";

    /**
     * Initialize the two teams that are playing this game.
     * 
     * When an instance of this class is created, information about the two teams
     * is passed to GameSim(). Then GameSim.run() will actually simulate a game and
     * return the results (stats) of the simulation.
     * 
     * Args:
     *     team1: dict containing information about the home team. There are
     *         four top-level elements in this dict: id (team), defense (a
     *         float containing the overall team defensive rating), pace (a
     *         float containing the team's pace, which is the mean number of
     *         possessions they like to have in a game), stat (a dict for
     *         storing team stats), and player (a list of dicts, one for each
     *         player on the team, ordered by rosterOrder). Each player's
     *         dict contains another four elements: id (player's unique ID
     *         number), ovr (overall rating, as stored in the DB),
     *         stat (a dict for storing player stats, similar to the one for
     *         team stats), and compositeRatings (an object containing various
     *         ratings used in the game simulation). In other words...
     *             {
     *                 "id": 0,
     *                 "defense": 0,
     *                 "pace": 0,
     *                 "stat": {},
     *                 "player": [
     *                     {
     *                         "id": 0,
     *                         "ovr": 0,
     *                         "stat": {},
     *                         "compositeRating": {}
     *                     },
     *                     ...
     *                 ]
     *             }
     *     team2: Same as team1, but for the away team.
     */
    function GameSim(gid, team1, team2) {
        this.id = gid;
        this.team = [team1, team2];  // If a team plays twice in a day, this needs to be a deep copy
        this.numPossessions = Math.round((this.team[0].pace + this.team[1].pace) / 2 * random.uniform(0.9, 1.1));

        // Starting lineups, which works because players are ordered by their rosterOrder
        this.playersOnCourt = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];
        this.updateTeamCompositeRatings();

        this.subsEveryN = 6;  // How many possessions to wait before doing substitutions

        this.overtimes = 0;  // Number of overtime periods that have taken place
    }



    /**
     * Simulates the game and returns the results.
     * 
     * Returns:
     *     A list of dicts, one for each team, similar to the inputs to
     *     the class, but with both the team and player "stat" dicts filled in
     *     and the extraneous data (defense, pace, ovr,
     *     compositeRating) removed. In other words...
     *         {
     *             "gid": 0,
     *             "overtimes": 0,
     *             "team": [
     *                 {
     *                     "id": 0,
     *                     "stat": {},
     *                     "player": [
     *                         {
     *                             "id": 0,
     *                             "stat": {}
     *                         },
     *                         ...
     *                     ]
     *                 },
     *             ...
     *             ]
     *         }
     */
    GameSim.prototype.run = function () {
        var p, t;

        // Simulate the game up to the end of regulation
        this.simPossessions();

        // Play overtime periods if necessary
        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            if (this.overtimes === 0) {
                this.numPossessions = Math.round(this.numPossessions * 5 / 48);  // 5 minutes of possessions
            }
            this.overtimes += 1;
            this.simPossessions();
        }

        // Delete stuff that isn't needed before returning
        for (t = 0; t < 2; t++) {
            delete this.team[t].compositeRating;
            delete this.team[t].pace;
            for (p = 0; p < this.team[t].player.length; p++) {
                delete this.team[t].player[p].ovr;
                delete this.team[t].player[p].compositeRating;
            }
        }

        return {"gid": this.id, "overtimes": this.overtimes, "team": this.team};
    };

    /**
     * Simulate this.numPossessions possessions. So to simulate regulation or
     * overtime, just set this.numPossessions to appropriate values.
     */
    GameSim.prototype.simPossessions = function () {
        var i, outcome;

        this.o = 0;
        this.d = 1;

        i = 0;
        while (i < this.numPossessions * 2) {
            // Possession change
            this.o = (this.o === 1) ? 0 : 1;
            this.d = (this.o === 1) ? 0 : 1;

            if (i % this.subsEveryN === 0) {
                this.updatePlayersOnCourt();
            }

            outcome = this.simPossession();

            // Swap o and d so that o will get another possession when they are swapped again at the beginning of the loop.
            if (outcome === "orb") {
                this.o = (this.o === 1) ? 0 : 1;
                this.d = (this.o === 1) ? 0 : 1;
            }

            i += 1;
        }
    };

    /**
     * Do substitutions when appropriate, track energy levels, and record
     * the number of minutes each player plays. This function is currently VERY SLOW.
     */
    GameSim.prototype.updatePlayersOnCourt = function () {
        var b, dt, i, ovrs, p, pp, t;

        // Time elapsed
        dt = (this.overtimes > 0 ? 5 : 48) / (2 * this.numPossessions) * this.subsEveryN;

        for (t = 0; t < 2; t++) {
            // Overall ratings scaled by fatigue
            ovrs = [];
            for (p = 0; p < this.team[t].player.length; p++) {
                ovrs.push(this.team[t].player[p].ovr * this.fatigue(this.team[t].player[p].stat.energy) * random.uniform(0.9, 1.1));
            }

            // Loop through players on court (in inverse order of current roster position)
            i = 0;
            for (pp = 0; pp < this.playersOnCourt[t].length; pp++) {
                p = this.playersOnCourt[t][pp];
                this.playersOnCourt[t][i] = p;
                // Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for (b = 0; b < this.team[t].player.length; b++) {
                    if (this.playersOnCourt[t].indexOf(b) === -1 && this.team[t].player[p].stat.courtTime > 3 && this.team[t].player[b].stat.benchTime > 3 && ovrs[b] > ovrs[p]) {
                        // Substitute player
                        this.playersOnCourt[t][i] = b;
                        this.team[t].player[b].stat.courtTime = random.gauss(0, 2);
                        this.team[t].player[b].stat.benchTime = random.gauss(0, 2);
                        this.team[t].player[p].stat.courtTime = random.gauss(0, 2);
                        this.team[t].player[p].stat.benchTime = random.gauss(0, 2);
                    }
                }
                i += 1;
            }

            // Update minutes (ovr, court, and bench)
            for (p = 0; p < this.team[t].player.length; p++) {
                if (this.playersOnCourt[t].indexOf(p) >= 0) {
                    this.recordStat(t, p, "min", dt);
                    this.recordStat(t, p, "courtTime", dt);
                    this.recordStat(t, p, "energy", -dt * 0.04 * (1 - this.team[t].player[p].compositeRating.endurance));
                    if (this.team[t].player[p].stat.energy < 0) {
                        this.team[t].player[p].stat.energy = 0;
                    }
                } else {
                    this.recordStat(t, p, "benchTime", dt);
                    this.recordStat(t, p, "energy", dt * 0.1);
                    if (this.team[t].player[p].stat.energy > 1) {
                        this.team[t].player[p].stat.energy = 1;
                    }
                }
            }
        }

        this.updateTeamCompositeRatings();
    };

    GameSim.prototype.updateTeamCompositeRatings = function () {
        var i, p, rating, t;

        for (t = 0; t < 2; t++) {
            // Reset team composite ratings
            for (rating in this.team[t].compositeRating) {
                if (this.team[t].compositeRating.hasOwnProperty(rating)) {
                    this.team[t].compositeRating[rating] = 0;


                    for (i = 0; i < 5; i++) {
                        p = this.playersOnCourt[t][i];
                        this.team[t].compositeRating[rating] += this.team[t].player[p].compositeRating[rating] * this.fatigue(this.team[t].player[p].stat.energy);
                    }

                    this.team[t].compositeRating[rating] = this.team[t].compositeRating[rating] / 5;
                }
            }
        }
    };

    /**
     * Simulate a single possession.
     * 
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
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probTov = function () {
        return 0.15 * this.team[this.d].compositeRating.defense / (0.5 * (this.team[this.o].compositeRating.dribbling + this.team[this.o].compositeRating.passing));
    };

    GameSim.prototype.doTov = function () {
        var p, ratios;

        ratios = this.ratingArray("turnovers", this.o);
        p = this.playersOnCourt[this.o][this.pickPlayer(ratios)];
        this.recordStat(this.o, p, "tov");
        if (this.probStl() > Math.random()) {
            return this.doStl();  // "stl"
        }

        return "tov";
    };

    /**
     * Probability that a turnover occurring in this possession is a steal.
     * 
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probStl = function () {
        return 0.55 * this.team[this.d].compositeRating.defensePerimeter / (0.5 * (this.team[this.o].compositeRating.dribbling + this.team[this.o].compositeRating.passing));
    };

    GameSim.prototype.doStl = function () {
        var p, ratios;

        ratios = this.ratingArray("stealing", this.d);
        p = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
        this.recordStat(this.d, p, "stl");

        return "stl";
    };

    GameSim.prototype.doShot = function (shooter) {
        var p, probMake, probAndOne, probMissAndFoul, r1, r2, r3, type;

        p = this.playersOnCourt[this.o][shooter];

        // Pick the type of shot and store the success rate (with no defense) in probMake and the probability of an and one in probAndOne
        if (this.team[this.o].player[p].compositeRating.shootingThreePointer > 0.4 && Math.random() < (0.35 * this.team[this.o].player[p].compositeRating.shootingThreePointer)) {
            // Three pointer
            type = 3;
            probMissAndFoul = 0.025;
            probMake = this.team[this.o].player[p].compositeRating.shootingThreePointer * 0.75;
            probAndOne = 0.01;
        } else {
            type = 2;
            r1 = Math.random() * this.team[this.o].player[p].compositeRating.shootingMidRange;
            r2 = Math.random() * this.team[this.o].player[p].compositeRating.shootingAtRim;
            r3 = Math.random() * this.team[this.o].player[p].compositeRating.shootingLowPost;
            if (r1 > r2 && r1 > r3) {
                // Two point jumper
                probMissAndFoul = 0.1;
                probMake = this.team[this.o].player[p].compositeRating.shootingMidRange * 0.3 + 0.31;
                probAndOne = 0.05;
            } else if (r2 > r3) {
                // Dunk, fast break or half court
                probMissAndFoul = 0.4;
                probMake = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.3 + 0.54;
                probAndOne = 0.25;
            } else {
                // Post up
                probMissAndFoul = 0.35;
                probMake = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.3 + 0.39;
                probAndOne = 0.15;
            }
        }

        probMake = probMake - this.team[this.d].compositeRating.defense * 0.25;

        if (this.probBlk() > Math.random()) {
            return this.doBlk(shooter);  // orb or drb
        }

        // Make
        if (probMake > Math.random()) {
            // And 1
            if (probAndOne > Math.random()) {
                this.doFg(shooter, type);
                return this.doFt(shooter, 1);  // fg, orb, or drb
            }
            return this.doFg(shooter, type);  // fg
        }

        // Miss, but fouled
        if (probMissAndFoul > Math.random()) {
            return this.doFt(shooter, type);  // fg, orb, or drb
        }

        // Miss
        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fga");
        if (type === 3) {
            this.recordStat(this.o, p, "tpa");
        }
        return this.doReb();  // orb or drb
    };

    /**
     * Probability that a shot taken this possession is blocked.
     * 
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probBlk = function () {
        var p;

        return 0.1 * this.team[this.d].compositeRating.blocking;
    };

    GameSim.prototype.doBlk = function (shooter) {
        var p, ratios;

        ratios = this.ratingArray("blocking", this.d);
        p = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
        this.recordStat(this.d, p, "blk");

        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fga");

        return this.doReb();  // orb or drb
    };

    GameSim.prototype.doFg = function (shooter, type) {
        var p, ratios;

        if (this.probAst() > Math.random()) {
            ratios = this.ratingArray("passing", this.o);
            p = this.playersOnCourt[this.o][this.pickPlayer(ratios, shooter)];
            this.recordStat(this.o, p, "ast");
        }
        p = this.playersOnCourt[this.o][shooter];
        this.recordStat(this.o, p, "fg");
        this.recordStat(this.o, p, "fga");
        this.recordStat(this.o, p, "pts", 2);  // 2 points for 2's
        if (type === 3) {
            this.recordStat(this.o, p, "tp");
            this.recordStat(this.o, p, "tpa");
            this.recordStat(this.o, p, "pts");  // Extra point for 3's
        }

        return "fg";
    };

    /**
     * Probability that a shot taken this possession is assisted.
     * 
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probAst = function () {
        return 0.65;
    };

    GameSim.prototype.doFt = function (shooter, amount) {
        var i, outcome, p;

        this.doPf(this.d);
        p = this.playersOnCourt[this.o][shooter];
        for (i = 0; i < amount; i++) {
            this.recordStat(this.o, p, "fta");
            if (Math.random() < this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6) {  // Between 60% and 90%
                this.recordStat(this.o, p, "ft");
                this.recordStat(this.o, p, "pts");
                outcome = "fg";
            } else {
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
     * @param {number} od Either this.o or this.d for an offensive or defensive foul.
     */
    GameSim.prototype.doPf = function (od) {
        var p, ratios;

        ratios = this.ratingArray("fouling", od);
        p = this.playersOnCourt[od][this.pickPlayer(ratios)];
        this.recordStat(this.d, p, "pf");
        // Foul out
        //if this.team[this.d].player[p].stat.pf >= 6 {
    };

    GameSim.prototype.doReb = function () {
        var p, ratios;

        if (0.8 * (1 + this.team[this.d].compositeRating.rebounding) / (1 + this.team[this.o].compositeRating.rebounding) > Math.random()) {
            ratios = this.ratingArray("rebounding", this.d);
            p = this.playersOnCourt[this.d][this.pickPlayer(ratios)];
            this.recordStat(this.d, p, "drb");

            return "drb";
        }

        ratios = this.ratingArray("rebounding", this.o);
        p = this.playersOnCourt[this.o][this.pickPlayer(ratios)];
        this.recordStat(this.o, p, "orb");

        return "orb";
    };

    GameSim.prototype.ratingArray = function (rating, t) {
        var array, i, p;

        array = [0, 0, 0, 0, 0];
        for (i = 0; i < 5; i++) {
            p = this.playersOnCourt[t][i];
            array[i] = this.team[t].player[p].compositeRating[rating] * this.fatigue(this.team[t].player[p].stat.energy);
        }

        return array;
    };

    /**
     * Pick a player to do something.
     * 
     * Args:
     *     ratios: 
     *     exempt: An integer representing a player that can't be picked (i.e. you
     *         can't assist your own shot, which is the only current use of
     *         exempt). The value of exempt ranges from 0 to 4, corresponding to
     *         the index of the player in this.playersOnCourt. This is *NOT* the
     *         same value as the player ID *or* the index of the
     *         this.team[t].player list. Yes, that's confusing.
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
     * Increments a stat (s) for a player (p) on a team (t) by amount
     * (default is 1).
     */
    GameSim.prototype.recordStat = function (t, p, s, amount) {
        amount = amount !== undefined ? amount : 1;
        this.team[t].player[p].stat[s] = this.team[t].player[p].stat[s] + amount;
        if (s !== "gs" && s !== "courtTime" && s !== "benchTime" && s !== "energy") {
            this.team[t].stat[s] = this.team[t].stat[s] + amount;
        }
    };

    /**
     * Convert energy into fatigue, which can be multiplied by a rating to get a fatigue-adjusted value.
     * 
     * @param {number} energy A player's energy level, from 0 to 1.
     * @return {number} Fatigue, from 0 to 1.
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