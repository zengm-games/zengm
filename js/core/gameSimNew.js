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
     *         float containing the overall team defensive rating), stat (a dict
     *         for storing team stats), and player (a list of dicts, one for
     *         each player on the team, ordered by roster_order). Each player's
     *         dict contains another four elements: id (player's unique ID
     *         number), ovr (overall rating, as stored in the DB),
     *         stat (a dict for storing player stats, similar to the one for
     *         team stats), and compositeRatings (an object containing various
     *         ratings used in the game simulation). In other words...
     *             {
     *                 "id": 0,
     *                 "defense": 0,
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
        this.numTicks = 4;  // Analogous to the shot clock. A tick happens when any action occurs, like passing the ball or dribbling towards the basket.
        this.timeRemaining = 48 * 60;  // Length of the game, in seconds.
        this.playByPlay = "";  // String of HTML-formatted play-by-play for this game

        // Amount of "noise" in decision making, where 0 means players are completely knowledgable and logical (of course, they still don't know if a shot will go in or not, but they know the odds for every situation) and 1 is meant to provide a reasonable amount of randomness.
        this.noise = 1;

        // Starting lineups, which works because players are ordered by their roster_order
        this.playersOnCourt = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];

        this.subs_every_n = 5;  // How many possessions to wait before doing subs

        this.overtimes = 0;
    }

    /**
     * Simulates the game and returns the results.
     * 
     * Returns:
     *     A list of dicts, one for each team, similar to the inputs to
     *     __init__, but with both the team and player "stat" dicts filled in
     *     and the extraneous data (defense, ovr, compositeRating) removed.
     *     In other words...
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
     *             ],
     *             "playByPlay": ""
     *         }
     */
    GameSim.prototype.run = function () {
        var p, t;

        // Simulate the game up to the end of regulation
        this.simPossessions();

        // Play overtime periods if necessary
        while (this.team[0].stat.pts === this.team[1].stat.pts) {
            this.timeRemaining = 5 * 60;  // 5 minutes of overtime
            this.overtimes += 1;
            this.simPossessions();
        }

        // Delete stuff that isn't needed before returning
        for (t = 0; t < 2; t++) {
            delete this.team[t].defense;
            for (p = 0; p < this.team[t].player.length; p++) {
                delete this.team[t].player[p].ovr;
                delete this.team[t].player[p].compositeRating;
            }
        }

        return {"gid": this.id, "overtimes": this.overtimes, "team": this.team, "playByPlay": this.playByPlay};
    };

    /**
     * Simulates possessions until this.timeRemaining is 0.
     */
    GameSim.prototype.simPossessions = function () {
        var outcome;

        this.o = 0;
        this.d = 1;
        outcome = "";
        this.timeOfSubstitution = this.timeRemaining;

        while (this.timeRemaining > 0) {
            // Possession change
            this.o = (this.o === 1) ? 0 : 1;
            this.d = (this.o === 1) ? 0 : 1;

            this.ticks = this.numTicks;  // Reset shot clock

            // Subs every 5 minutes
            if (this.timeOfSubstitution - this.timeRemaining > 5 * 60) {
                this.updatePlayersOnCourt();
            }

            // Set the positions of offensive players relative to the basket
            this.initDistances();

            // Start with the PG dribbling the ball
            this.initBallHandler();

            // Start with all players defended tightly
            this.initOpenness();

            // Keep track of the last person to pass the ball, used for assist tracking. -1 means no assist for a shot taken.
            this.passer = -1;

            // Play each possession until the shot clock expires
            while (this.ticks > 0) {
                if (this.probTurnover() > Math.random()) {
                    this.doTurnover();
                    break;
                }

                // Shoot, pass, or dribble
                outcome = this.move();

                this.ticks = this.ticks - 1;

                if (outcome === "madeShot" || outcome === "defReb") {
                    // Start a new possession for the other team
                    break;
                } else if (outcome === "offReb") {
                    // Continue this possession
                    this.ticks = this.numTicks;  // Reset shot clock
                    this.passer = -1;
                }
            }

            // Convert ticks to seconds, and decrease timeRemaining by the number of ticks used
            this.timeRemaining = this.timeRemaining - (this.numTicks - this.ticks) * 16 / this.numTicks;
        }
    };

    /**
     * Pick which players are defending each other.
     *
     * Currently this naively matches based on height/athleticism and also assumes that matchups go both ways. Obviously both of those assumptions could be improved.
     */
    GameSim.prototype.setMatchups = function () {
        var ind, p, playersOnCourtTemp, sortBy, t;

        for (t = 0; t < 2; t++) {
            sortBy = this.rating_array("defenseInterior", t);
            ind = [0, 1, 2, 3, 4];
            ind.sort(function (a, b) { return sortBy[a] - sortBy[b]; });

            playersOnCourtTemp = this.playersOnCourt[t].slice();  // Copy by value, not reference
            for (p = 0; p < 5; p++) {
                this.playersOnCourt[t][p] = playersOnCourtTemp[ind[p]];
            }
        }
    };

    /**
     * Do substitutions when appropriate, track energy levels, and record
     * the number of minutes each player plays. This function is currently VERY SLOW.
     */
    GameSim.prototype.updatePlayersOnCourt = function () {
        var b, dt, i, ovrs, p, pp, t;

        // Time elapsed since last substitution
        dt = (this.timeOfSubstitution - this.timeRemaining) / 60;  // [minutes]

        for (t = 0; t < 2; t++) {
            // Update minutes (ovr, court, and bench)
            for (p = 0; p < this.team[t].player.length; p++) {
                if (this.playersOnCourt[t].indexOf(p) >= 0) {
                    this.record_stat(t, p, "min", dt);
                    this.record_stat(t, p, "court_time", dt);
                    this.record_stat(t, p, "energy", -dt * 0.01);
                    if (this.team[t].player[p].stat.energy < 0) {
                        this.team[t].player[p].stat.energy = 0;
                    }
                } else {
                    this.record_stat(t, p, "bench_time", dt);
                    this.record_stat(t, p, "energy", dt * 0.2);
                    if (this.team[t].player[p].stat.energy > 1) {
                        this.team[t].player[p].stat.energy = 1;
                    }
                }
            }

            // Overall ratings scaled by fatigue
            ovrs = [];
            for (i = 0; i < this.team[t].player.length; i++) {
                ovrs.push(this.team[t].player[i].ovr * this.team[t].player[i].stat.energy * random.gauss(1, 0.04));
            }

            // Loop through players on court (in inverse order of current roster position)
            i = 0;
            for (pp = 0; pp < this.playersOnCourt[t].length; pp++) {
                p = this.playersOnCourt[t][pp];
                this.playersOnCourt[t][i] = p;
                // Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for (b = 0; b < this.team[t].player.length; b++) {
                    if (this.playersOnCourt[t].indexOf(b) === -1 && this.team[t].player[p].stat.court_time > 3 && this.team[t].player[b].stat.bench_time > 3 && ovrs[b] > ovrs[p]) {
                        // Substitute player
                        this.playersOnCourt[t][i] = b;
                        this.team[t].player[b].stat.court_time = random.gauss(0, 2);
                        this.team[t].player[b].stat.bench_time = random.gauss(0, 2);
                        this.team[t].player[p].stat.court_time = random.gauss(0, 2);
                        this.team[t].player[p].stat.bench_time = random.gauss(0, 2);
                    }
                }
                i += 1;
            }
        }

        this.timeOfSubstitution = this.timeRemaining;

        this.setMatchups();
    };

    /**
     * Initialize the distance of each offensive player from the basket at the beginning of a possession.
     *
     * 0 = at basket
     * 1 = low post
     * 2 = midrange
     * 3 = 3 point range
     */
    GameSim.prototype.initDistances = function () {
        this.distances = [c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER, c.DISTANCE_MID_RANGE, c.DISTANCE_LOW_POST];  // These correspond with this.playersOnCourt
    };

    /**
     * Initialize which player has the ball at the beginning of a possession.
     */
    GameSim.prototype.initBallHandler = function () {
        this.ballHandler = 0;  // This corresponds with this.playersOnCourt
        this.log(this.team[this.o].player[this.ballHandler].name + " brings the ball up the court<br>");
    };

    /**
     * Initialize how open each offensive player is at the beginning of a possession.
     *
     * 0 = not open at all
     * 1 = completely open
     */
    GameSim.prototype.initOpenness = function () {
        this.openness = [0, 0, 0, 0, 0];  // These correspond with this.playersOnCourt for the offensive team
    };

    /**
     * This simulates the player with the ball doing a "move", which means dribbling, passing, or shoting. This works by estimating the expected value of points for this possession based on all three options and picking whatever action maximizes this metric.
     *
     * So, before calling this function, various things need to be set up, like matchups between offensive and defensive players, positioning of offensive players, who has the ball, etc.
     */
    GameSim.prototype.move = function () {
        var expPtsDribble, expPtsPass, expPtsShoot, i, passTo, ratios, shooter, x;

        for (i = 0; i < 5; i++) {
            this.log("---- " + this.team[this.o].player[this.playersOnCourt[this.o][i]].name + ": expPtsShoot " +  this.round(this.expPtsShoot(i), 3) + ", openness " + this.round(this.openness[i], 3) + ", distance " + c.DISTANCES[this.distances[i]] + "<br>");
        }

//console.log('Expected points for shooting');
        // Expected points for shooting
        expPtsShoot = this.expPtsShoot();

//console.log('Expected points for passing');
        // Expected points for passing
        x = this.expPtsPass();
        expPtsPass = x.expPtsPass;
        passTo = x.passTo;

//console.log('Expected points for dribbling');
        // Expected points for dribbling
        expPtsDribble = this.expPtsDribble();

//console.log("expPts: " + expPtsShoot + " " + expPtsPass + " " + expPtsDribble);
        // Shoot
        if (expPtsShoot > expPtsPass && expPtsShoot > expPtsDribble) {
//console.log("SHOOT " + this.ballHandler);
            return this.moveShoot();  // madeShot, offReb, or defReb
        }

        // Pass
        if (expPtsPass > expPtsShoot && expPtsPass > expPtsDribble) {
//console.log("PASS " + this.ballHandler + " " + passTo);
            return this.movePass(passTo);  // pass
        }

        // Dribble
//console.log("DRIBBLE " + this.ballHandler);
        return this.moveDribble();  // dribble
    };

    /**
     * Calculates the expected points scored if the given player took a shot right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsShoot = function (i, openness, ticks) {
        var expPtsShoot, probFg, twoOrThree;

        i = i !== undefined ? i : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;

        twoOrThree = this.distances[i] === c.DISTANCE_THREE_POINTER ? 3 : 2;

        probFg = this.probFg(i, openness, ticks);
        expPtsShoot = probFg * twoOrThree + this.probFt(i) * (probFg * this.probAndOne(i) + (1 - probFg) * this.probMissAndFoul(i));
//console.log('shoot ' + i + ' at tick ' + ticks + ', openness ' + openness[i] + ', expPtsShoot ' + expPtsShoot);

//        return random.uniform(0, 4 * this.noise) + expPtsShoot;
        return expPtsShoot;
    };

    /**
     * Calculates the expected points scored if the given player passed right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} An object containing "expPtsPass" which is points, from 0 to 4, and "passTo" the index of the player to pass to (like i).
     */
    GameSim.prototype.expPtsPass = function (i, openness, ticks) {
        var expPtsPass, expPtsPassTest, j, passTo, probFg, opennesses;

        i = i !== undefined ? i : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsPass = 0;
        passTo = -1;  // Index of this.playersOnCourt[this.o], like i

        // Openness for passing to each player
        opennesses = [];
        for (j = 0; j < 5; j++) {
            if (i === j) {
                opennesses[j] = NaN;
            } else {
                opennesses[j] = this.updateOpennessPass(i, j, openness.slice(), ticks, false);
            }
        }

        if (ticks > 1) { // If ticks is 1, then any move besides a shot will result in 0 points.
            // Try passing to each player, who will then dribble, pass or shoot
            for (j = 0; j < 5; j++) {
                if (j !== i) {
                    // Pass to j, j shoots
                    expPtsPassTest = this.expPtsShoot(j, opennesses[j], ticks - 1);
                    if (expPtsPassTest > expPtsPass) {
                        expPtsPass = expPtsPassTest;
                        passTo = j;
                    }

                    if (ticks > 2) {
                        // Pass to j, j passes
                        expPtsPassTest = this.expPtsPass(j, opennesses[j], ticks - 1);
                        if (expPtsPassTest > expPtsPass) {
                            expPtsPass = expPtsPassTest;
                            passTo = j;
                        }

                        // Pass to j, j dribbles
                        expPtsPassTest = this.expPtsDribble(j, opennesses[j], ticks - 1);
                        if (expPtsPassTest > expPtsPass) {
                            expPtsPass = expPtsPassTest;
                            passTo = j;
                        }
                    }
                }
            }
        }
//console.log('pass from ' + i + ' to ' + passTo + ' at tick ' + ticks + ', openness ' + openness[i] + ', expPtsPass ' + expPtsPass);

        return {
            expPtsPass: expPtsPass,
            passTo: passTo
        };
    };

    /**
     * Calculates the expected points scored if the given player attacked off the dribble right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsDribble = function (i, openness, ticks) {
        var expPtsDribble, expPtsDribbleTest, pd, po;

        i = i !== undefined ? i : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsDribble = 0;

        openness = this.updateOpennessDribble(i, openness.slice(), ticks, false);

        if (ticks > 1) { // If ticks is 1, then any move besides a shot will result in 0 points.
            // Dribble, then shoot
            expPtsDribbleTest = this.expPtsShoot(i, openness, ticks - 1);
            if (expPtsDribbleTest > expPtsDribble) {
                expPtsDribble = expPtsDribbleTest;
            }

            if (ticks > 2) {
                // Dribble, then pass
                expPtsDribbleTest = this.expPtsPass(i, openness, ticks - 1);
                if (expPtsDribbleTest > expPtsDribble) {
                    expPtsDribble = expPtsDribbleTest;
                }

                // Dribble, then dribble more
                expPtsDribbleTest = this.expPtsDribble(i, openness, ticks - 1);
                if (expPtsDribbleTest > expPtsDribble) {
                    expPtsDribble = expPtsDribbleTest;
                }
            }
        }
//console.log('dribble ' + i + ' at tick ' + ticks + ', openness ' + openness[i] + ', expPtsDribble ' + expPtsDribble);

        return expPtsDribble;
    };



    /**
     * Calculates the probability of the current ball handler in the current situation making a shot if he takes one (situation-dependent field goal percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFg = function (i, openness, ticks) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;

        p = this.playersOnCourt[this.o][i];
        d = this.distances[i];

        // Base probabilities
        if (d === c.DISTANCE_AT_RIM) {
            P = this.team[this.o].player[p].compositeRating.shootingAtRim * 0.15 + 0.64;
        } else if (d === c.DISTANCE_LOW_POST) {
            P = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.15 + 0.49;
        } else if (d === c.DISTANCE_MID_RANGE) {
            P = this.team[this.o].player[p].compositeRating.shootingMidRange * 0.15 + 0.41;
        } else if (d === c.DISTANCE_THREE_POINTER) {
            P = 0.2 * this.team[this.o].player[p].compositeRating.shootingThreePointer;
        }

        // Modulate by openness
        P *= 1 + 0.9 * (openness[i] - 0.3);

        return this.bound(P, 0, 1);
    };

    /**
     * Calculates the probability of the current ball handler making a free throw if he takes one (free throw percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFt = function (i) {
        var p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.playersOnCourt[this.o][i];

        P = this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6;

        return this.bound(P, 0, 1);
    };

    /**
     * Assuming a shot was made, calculates the probability that the shooter was fouled.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probAndOne = function (i) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.playersOnCourt[this.o][i];
        d = this.distances[i];

        // Default values
        if (d === c.DISTANCE_AT_RIM) {  // At rim
            P = 0.2;
        } else if (d === c.DISTANCE_LOW_POST) {  // Low post
            P = 0.1;
        } else if (d === c.DISTANCE_MID_RANGE) {  // Mid range
            P = 0.025;
        } else if (d === c.DISTANCE_THREE_POINTER) {
            P = 0.025;
        }

        return this.bound(P, 0, 1);
    };

    /**
     * Assuming a shot was missed, calculates the probability that the shooter was fouled.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probMissAndFoul = function (i) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.playersOnCourt[this.o][i];
        d = this.distances[i];

        // Default values
        if (d === c.DISTANCE_AT_RIM) {  // At rim
            P = 0.2;
        } else if (d === c.DISTANCE_LOW_POST) {  // Low post
            P = 0.1;
        } else if (d === c.DISTANCE_MID_RANGE) {  // Mid range
            P = 0.025;
        } else if (d === c.DISTANCE_THREE_POINTER) {
            P = 0.025;
        }

        return this.bound(P, 0, 1);
    };

    GameSim.prototype.probTurnover = function () {
        return this.bound((0.1 + this.team[this.d].defense) * 0.06, 0, 1);
    };

    GameSim.prototype.probBlk = function () {
        return this.bound((0.02 + this.team[this.d].defense) * 0.35, 0, 1);
    };

    GameSim.prototype.moveShoot = function () {
        var p, ratios;

        p = this.playersOnCourt[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " shoots " + c.DISTANCES[this.distances[this.ballHandler]] + "... ");

        // Blocked shot
        if (this.probBlk() > Math.random()) {
            ratios = this.rating_array("blocks", this.d);
            p = this.playersOnCourt[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "blk");
            this.log("blocked by " + this.team[this.o].player[p].name + "!<br>");

            p = this.playersOnCourt[this.d][this.ballHandler];
            this.record_stat(this.o, p, "fga");

            return this.doReb();  // offReb or defReb
        }

//console.log(this.probFg())
        // Make
        if (this.probFg() > Math.random()) {
            // And one
            if (this.probAndOne() > Math.random()) {
                this.log("he makes the shot and is fouled!<br>");
                this.doFg();
                return this.doFt(1);  // offReb, defReb, or madeShot
            }

            this.log("he makes the shot<br><br>");
            // No foul
            return this.doFg();  // madeShot
        }

        // Miss, but fouled
        if (this.probMissAndFoul() > Math.random()) {
            this.log("he misses the shot but is fouled<br>");
            return this.doFt(2);  // offReb, defReb, or madeShot
        }

        // Miss
        this.log("he misses<br>");
        return this.doFgMiss();  // offReb or defReb
    };

    GameSim.prototype.movePass = function (passTo) {
        var p, p2;

        this.passer = this.ballHandler;
        this.ballHandler = passTo;

        this.openness = this.updateOpennessPass();  // Important - call this after updating this.ballHandler and this.passer

        p = this.playersOnCourt[this.o][this.passer];
        p2 = this.playersOnCourt[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " passes to " + this.team[this.o].player[p2].name + "<br>");

        return "pass";
    };

    GameSim.prototype.moveDribble = function () {
        var p;

        this.openness = this.updateOpennessDribble();

        this.passer = -1;  // No assist if the player dribbles first

        p = this.playersOnCourt[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " attacks his man off the dribble<br>");

        return "dribble";
    };

    /**
     * Updates openness after the ball handler dribbles.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {Array.<number>} Updated openness array, as described for the openness input.
     */
    GameSim.prototype.updateOpennessDribble = function (i, openness, ticks, noise) {
        var defenseRating, discord, expPts, expPtsDribble, expPtsPass, expPtsShoot, expPtsSum, j, order, pd, po, weights, x;

        i = i !== undefined ? i : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;
        noise = noise !== undefined ? noise : true;

        po = this.playersOnCourt[this.o][i];
        pd = this.playersOnCourt[this.d][i];

        // Direct effect of dribbling - dribbler becomes more open
        openness[i] = this.bound(2 * (this.team[this.o].player[po].compositeRating.ballHandling - this.team[this.d].player[pd].compositeRating.defensePerimeter), 0, 1);

        // Defense's response to dribbling - off ball defensive attention shifts from non-dribblers to the dribbler
        expPts = [];
        expPtsSum = 0;
        for (j = 0; j < 5; j++) {
            if (i === j) {
                expPts[j] = 0;
            } else {
                // tick - 1 because that factors in a pass to this player
                expPtsShoot = this.expPtsShoot(j, openness, ticks - 1);
                expPts[j] = expPtsShoot;
                //x = this.expPtsPass(j, openness, ticks - 1);
                //expPtsPass = x.expPtsPass;
                //expPtsDribble = this.expPtsDribble(j, openness, ticks - 1);
                //expPts[j] = _.max([expPtsShoot, expPtsPass, expPtsDribble]);
            }
            expPtsSum += Math.pow(expPts[j], 2);
        }
        weights = _.map(expPts,  function (num) { return Math.pow(num, 2) / expPtsSum; });

        for (j = 0; j < 5; j++) {
            if (i !== j) {
                if (noise) {
                    weights[j] *= random.uniform(1 - (0.2 * this.noise), 1 + (0.2 * this.noise));
                }

                pd = this.playersOnCourt[this.d][j];
                if (this.distances[j] <= c.DISTANCE_LOW_POST) {
                    defenseRating = this.team[this.d].player[pd].compositeRating.defenseInterior;
                } else {
                    defenseRating = this.team[this.d].player[pd].compositeRating.defensePerimeter;
                }
                openness[j] = this.bound(openness[j] + 8 * weights[j] * (1 - defenseRating), 0, 1);
                openness[i] = this.bound(openness[i] - 0.5 * weights[j] * (1 - defenseRating), 0, 1);
            }
        }

        return openness;
    };

    /**
     * Updates openness after the ball handler passes.
     *
     * @param {number} passer An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player who passes the ball. If undefined, then this.passer is used.
     * @param {number} passTo An integer between 0 and 4 representing the index of this.playersOnCourt[this.o] for the player who the ball is passed to. If undefined, then this.ballHandler is used.
     * @param {Array.<number>} openness An array of numbers between 0 and 1 representing how open (0: none, 1: very) each offensive player is (same order as this.playersOnCourt). If undefined, then this.openness is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {Array.<number>} Updated openness array, as described for the openness input.
     */
    GameSim.prototype.updateOpennessPass = function (passer, passTo, openness, ticks, noise) {
        var discord, expPts, expPtsDribble, expPtsPass, expPtsShoot, j, order, pd, po, weights, x;

        passer = passer !== undefined ? passer : this.passer;
        passTo = passTo !== undefined ? passTo : this.ballHandler;
        openness = openness !== undefined ? openness : this.openness;
        ticks = ticks !== undefined ? ticks : this.ticks;
        noise = noise !== undefined ? noise : true;



        return openness;
    };

    GameSim.prototype.doReb = function () {
        var p, ratios;

        if (0.8 > Math.random()) {
            ratios = this.rating_array("rebounds", this.d);
            p = this.playersOnCourt[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "drb");
            this.log(this.team[this.d].player[p].name + " comes down with the defensive rebound<br><br>");
            return "defReb";
        }
        ratios = this.rating_array("rebounds", this.o);
        this.ballHandler = this.pick_player(ratios);
        p = this.playersOnCourt[this.o][this.ballHandler];
        this.record_stat(this.o, p, "orb");
        this.log(this.team[this.o].player[p].name + " comes down with the offensive rebound<br>");
        return "offReb";
    };

    /**
     * Free throw(s).
     *
     * This simulates any number of free throws by this.ballHandler, followed by a rebound opportunity if the last one is missed.
     *
     * @param {number} amount Amount of free throws that this.ballHandler will shoot (should be an integer from 1 to 3).
     */
    GameSim.prototype.doFt = function (amount) {
        var i, outcome, p;

        this.doPf(this.d);

        p = this.playersOnCourt[this.o][this.ballHandler];
        for (i = 0; i < amount; i++) {
            this.record_stat(this.o, p, "fta");
            if (this.probFt() > Math.random()) {
                this.record_stat(this.o, p, "ft");
                this.record_stat(this.o, p, "pts");
                outcome = "madeShot";
            } else {
                outcome = "missedShot";
            }

            if (outcome === "madeShot" && amount === 1) {
                this.log(this.team[this.o].player[p].name + " makes the free throw<br>");
            } else if (outcome === "missedShot" && amount === 1) {
                this.log(this.team[this.o].player[p].name + " misses the free throw<br>");
            } else if (outcome === "madeShot" && amount > 1 && i === 0) {
                this.log(this.team[this.o].player[p].name + " makes the first free throw<br>");
            } else if (outcome === "madeShot" && amount > 1 && i === 1) {
                this.log(this.team[this.o].player[p].name + " makes the second free throw<br>");
            } else if (outcome === "madeShot" && amount > 1 && i === 2) {
                this.log(this.team[this.o].player[p].name + " makes the third free throw<br>");
            } else if (outcome === "missedShot" && amount > 1 && i === 0) {
                this.log(this.team[this.o].player[p].name + " misses the first free throw<br>");
            } else if (outcome === "missedShot" && amount > 1 && i === 1) {
                this.log(this.team[this.o].player[p].name + " misses the second free throw<br>");
            } else if (outcome === "missedShot" && amount > 1 && i === 2) {
                this.log(this.team[this.o].player[p].name + " misses the third free throw<br>");
            }
        }

        // If the last free throw was missed, then there is a rebound opportunity
        if (outcome === "missedShot") {
            return this.doReb();  // offReb or defReb
        }

        return outcome;
    };

    GameSim.prototype.doFg = function () {
        var d, p;

//console.log("madeShot " + this.team[this.o].stat.fg / this.team[this.o].stat.fga);
        p = this.playersOnCourt[this.o][this.ballHandler];
        d = this.distances[this.ballHandler];

        this.record_stat(this.o, p, "fg");
        this.record_stat(this.o, p, "fga");
        this.record_stat(this.o, p, "pts", 2);  // 2 points for 2s

        if (d === c.DISTANCE_THREE_POINTER) {
            this.record_stat(this.o, p, "tp");
            this.record_stat(this.o, p, "tpa");
            this.record_stat(this.o, p, "pts");  // Extra point for 3s
        }

        // Assist?
        if (this.passer >= 0) {
            p = this.playersOnCourt[this.o][this.passer];
            this.record_stat(this.o, p, "ast");
        }

        return "madeShot";
    };

    GameSim.prototype.doFgMiss = function () {
        var d, p;

        p = this.playersOnCourt[this.o][this.ballHandler];
        d = this.distances[this.ballHandler];

        this.record_stat(this.o, p, "fga");
        if (d === c.DISTANCE_THREE_POINTER) {
            this.record_stat(this.o, p, "tpa");
        }

        return this.doReb();
    };

    /**
     * Personal foul.
     *
     * @param {Object} od Either this.o or this.d for an offensive or defensive foul.
     */
    GameSim.prototype.doPf = function (od) {
        var p, ratios;

        ratios = this.rating_array("fouls", od);
        p = this.playersOnCourt[this.d][this.pick_player(ratios)];
        this.record_stat(od, p, "pf");
    };

    GameSim.prototype.doTurnover = function () {
        var p, ratios;

        ratios = this.rating_array("turnovers", this.o);
        p = this.playersOnCourt[this.o][this.pick_player(ratios)];
        this.record_stat(this.o, p, "tov");

        // Steal?
        if (0.55 > Math.random()) {
            ratios = this.rating_array("steals", this.d);
            p = this.playersOnCourt[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "stl");
            this.log(this.team[this.d].player[p].name + " steals the ball<br><br>");
        } else {
            this.log(this.team[this.o].player[p].name + " turns the ball over<br><br>");
        }
    };

    GameSim.prototype.rating_array = function (rating, t) {
        var array, i, p;

        array = [0, 0, 0, 0, 0];
        for (i = 0; i < 5; i++) {
            p = this.playersOnCourt[t][i];
            array[i] = this.team[t].player[p].compositeRating[rating];
        }

        return array;
    };

    /**
     * Pick a player to do something.
     * 
     * Args:
     *     ratios: 
     */
    GameSim.prototype.pick_player = function (ratios) {
        var pick, rand;

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
    GameSim.prototype.record_stat = function (t, p, s, amount) {
        amount = amount !== undefined ? amount : 1;
        this.team[t].player[p].stat[s] = this.team[t].player[p].stat[s] + amount;
        if (s !== "gs" && s !== "court_time" && s !== "bench_time" && s !== "energy") {
            this.team[t].stat[s] = this.team[t].stat[s] + amount;
        }
    };

    GameSim.prototype.bound = function (x, min, max) {
        if (x > max) {
            return max;
        }
        if (x < min) {
            return min;
        }
        return x;
    };

    GameSim.prototype.round = function (value, precision) {
        var i;

        precision = precision !== undefined ? parseInt(precision, 10) : 0;

        if (value instanceof Array) {
            for (i = 0; i < value.length; i++) {
                value[i] = this.round(value[i], precision);
            }

            return value;
        }

        return parseFloat(value).toFixed(precision);
    };

    GameSim.prototype.log = function (msg) {
//console.log(msg);
        this.playByPlay += msg;
    };

    return {
        GameSim: GameSim
    };
});