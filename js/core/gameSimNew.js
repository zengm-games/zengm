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
     *         player on the team, ordered by roster_order). Each player's
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
        this.num_possessions = Math.round((this.team[0].pace + this.team[1].pace) / 2 * random.gauss(1, 0.03));
        this.numTicks = 4;  // Analogous to the shot clock. A tick happens when any action occurs, like passing the ball or dribbling towards the basket.
        this.discord = 0;  // Defensive discord. 0 = defense is comfortable. 1 = complete chaos.
        this.timeRemaining = 48 * 60;  // Length of the game, in seconds.
        this.playByPlay = "";  // String of HTML-formatted play-by-play for this game

        // Starting lineups, which works because players are ordered by their roster_order
        this.players_on_court = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];

        this.subs_every_n = 5;  // How many possessions to wait before doing subs

        this.overtimes = 0;
    }

    /**
     * Simulates the game and returns the results.
     * 
     * Returns:
     *     A list of dicts, one for each team, similar to the inputs to
     *     __init__, but with both the team and player "stat" dicts filled in
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
            if (this.overtimes === 0) {
                this.num_possessions = Math.round(this.num_possessions * 5 / 48);  // 5 minutes of possessions
            }
            this.overtimes += 1;
            this.simPossessions();
        }

        // Delete stuff that isn't needed before returning
        for (t = 0; t < 2; t++) {
            delete this.team[t].defense;
            delete this.team[t].pace;
            for (p = 0; p < this.team[t].player.length; p++) {
                delete this.team[t].player[p].ovr;
                delete this.team[t].player[p].compositeRating;
            }
        }

        return {"gid": this.id, "overtimes": this.overtimes, "team": this.team, "playByPlay": this.playByPlay};
    };

    /**
     * Simulate this.num_possessions possessions. So to simulate regulation or
     * overtime, just set this.num_possessions to appropriate values.
     */
    GameSim.prototype.simPossessions = function () {
        var i, outcome;

        this.o = 0;
        this.d = 1;
        outcome = "";

        while (this.timeRemaining > 0) {
            // Possession change
            this.o = (this.o === 1) ? 0 : 1;
            this.d = (this.o === 1) ? 0 : 1;

            this.ticks = this.numTicks;  // Reset shot clock
            if (i % this.subs_every_n === 0) {
                this.updatePlayersOnCourt();
            }

            // Set the positions of offensive players relative to the basket
            this.initDistances();

            // Start with the PG dribbling the ball
            this.initBallHandler();

            // Start with all players defended tightly
            this.initOpenness();

            // Initialize defensive discord
            this.discord = 0;

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

                // If the possession ended in a defensive rebound or a made shot, go to the next possession
                if (outcome === "madeShot" || outcome === "defReb") {
                    break;
                } else if (outcome === "offReb") {
                    this.ticks = this.numTicks;  // Reset shot clock
                    this.initDistances();
                    this.initOpenness();
                    this.passer = -1;
                }
            }

            // Convert ticks to seconds, and decrease timeRemaining by the number of ticks used
            this.timeRemaining = this.timeRemaining - (this.numTicks - this.ticks) * 24 / this.numTicks;
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

            playersOnCourtTemp = this.players_on_court[t].slice();  // Copy by value, not reference
            for (p = 0; p < 5; p++) {
                this.players_on_court[t][p] = playersOnCourtTemp[ind[p]];
            }
        }
    };

    /**
     * Do substitutions when appropriate, track energy levels, and record
     * the number of minutes each player plays. This function is currently VERY SLOW.
     */
    GameSim.prototype.updatePlayersOnCourt = function () {
        var b, dt, i, ovrs, p, pp, t;

        // Time elapsed
        dt = (this.overtimes > 0 ? 5 : 48) / (2 * this.num_possessions) * this.subs_every_n;

        for (t = 0; t < 2; t++) {
            // Overall ratings scaled by fatigue
            ovrs = [];
            for (i = 0; i < this.team[t].player.length; i++) {
                ovrs.push(this.team[t].player[i].ovr * this.team[t].player[i].stat.energy * random.gauss(1, 0.04));
            }

            // Loop through players on court (in inverse order of current roster position)
            i = 0;
            for (pp = 0; pp < this.players_on_court[t].length; pp++) {
                p = this.players_on_court[t][pp];
                this.players_on_court[t][i] = p;
                // Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for (b = 0; b < this.team[t].player.length; b++) {
                    if (this.players_on_court[t].indexOf(b) === -1 && this.team[t].player[p].stat.court_time > 3 && this.team[t].player[b].stat.bench_time > 3 && ovrs[b] > ovrs[p]) {
                        // Substitute player
                        this.players_on_court[t][i] = b;
                        this.team[t].player[b].stat.court_time = random.gauss(0, 2);
                        this.team[t].player[b].stat.bench_time = random.gauss(0, 2);
                        this.team[t].player[p].stat.court_time = random.gauss(0, 2);
                        this.team[t].player[p].stat.bench_time = random.gauss(0, 2);
                    }
                }
                i += 1;
            }

            // Update minutes (ovr, court, and bench)
            for (p = 0; p < this.team[t].player.length; p++) {
                if (this.players_on_court[t].indexOf(p) >= 0) {
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
        }

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
        this.distances = [c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER, c.DISTANCE_MID_RANGE, c.DISTANCE_LOW_POST];  // These correspond with this.players_on_court
    };

    /**
     * Initialize which player has the ball at the beginning of a possession.
     */
    GameSim.prototype.initBallHandler = function () {
        this.ballHandler = 0;  // This corresponds with this.players_on_court
        this.log(this.team[this.o].player[this.ballHandler].name + " brings the ball up the court<br>");
    };

    /**
     * Initialize how open each offensive player is at the beginning of a possession.
     *
     * 0 = not open at all
     * 1 = completely open
     */
    GameSim.prototype.initOpenness = function () {
        this.openness = [0, 0, 0, 0, 0];  // These correspond with this.players_on_court
    };

    /**
     * This simulates the player with the ball doing a "move", which means dribbling, passing, or shoting. This works by estimating the expected value of points for this possession based on all three options and picking whatever action maximizes this metric.
     *
     * So, before calling this function, various things need to be set up, like matchups between offensive and defensive players, positioning of offensive players, who has the ball, etc.
     */
    GameSim.prototype.move = function () {
        var expPtsDribble, expPtsPass, expPtsShoot, passTo, ratios, shooter, x;

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
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} discord A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsShoot = function (i, discord, ticks) {
        var expPtsShoot, probFg, twoOrThree;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        twoOrThree = this.distances[i] === c.DISTANCE_THREE_POINTER ? 3 : 2;

        probFg = this.probFg(i, discord, ticks);
        expPtsShoot = probFg * twoOrThree + this.probFt(i) * (probFg * this.probAndOne(i) + (1 - probFg) * this.probMissAndFoul(i));
//console.log('shoot ' + i + ' at tick ' + ticks + ', discord ' + discord + ', expPtsShoot ' + expPtsShoot);

        return expPtsShoot;
    };

    /**
     * Calculates the expected points scored if the given player passed right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} discord A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} An object containing "expPtsPass" which is points, from 0 to 4, and "passTo" the index of the player to pass to (like i).
     */
    GameSim.prototype.expPtsPass = function (i, discord, ticks) {
        var expPtsPass, expPtsPassTest, j, passTo, probFg;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsPass = 0;
        passTo = -1;  // Index of this.players_on_court[this.o], like i

        discord = this.updateDiscord("pass", i, discord);

        if (ticks > 1) { // If ticks is 1, then any move besides a shot will result in 0 points.
            // Try passing to each player, who will then dribble, pass or shoot
            for (j = 0; j < 5; j++) {
                if (j !== i) {
                    // Pass to j, j shoots
                    expPtsPassTest = this.expPtsShoot(j, discord, ticks - 1);
                    if (expPtsPassTest > expPtsPass) {
                        expPtsPass = expPtsPassTest;
                        passTo = j;
                    }

                    if (ticks > 2) {
                        // Pass to j, j passes
                        expPtsPassTest = this.expPtsPass(j, discord, ticks - 1);
                        if (expPtsPassTest > expPtsPass) {
                            expPtsPass = expPtsPassTest;
                            passTo = j;
                        }

                        // Pass to j, j dribbles
                        expPtsPassTest = this.expPtsDribble(j, discord, ticks - 1);
                        if (expPtsPassTest > expPtsPass) {
                            expPtsPass = expPtsPassTest;
                            passTo = j;
                        }
                    }
                }
            }
        }
//console.log('pass from ' + i + ' to ' + passTo + ' at tick ' + ticks + ', discord ' + discord + ', expPtsPass ' + expPtsPass);

        return {
            expPtsPass: expPtsPass,
            passTo: passTo
        };
    };

    /**
     * Calculates the expected points scored if the given player attacked off the dribble right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} discord A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsDribble = function (i, discord, ticks) {
        var expPtsDribble, expPtsDribbleTest, pd, po;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsDribble = 0;

        discord = this.updateDiscord("dribble", i, discord);

        if (ticks > 1) { // If ticks is 1, then any move besides a shot will result in 0 points.
            // Dribble, then shoot
            expPtsDribbleTest = this.expPtsShoot(i, discord, ticks - 1);
            if (expPtsDribbleTest > expPtsDribble) {
                expPtsDribble = expPtsDribbleTest;
            }

            if (ticks > 2) {
                // Dribble, then pass
                expPtsDribbleTest = this.expPtsPass(i, discord, ticks - 1);
                if (expPtsDribbleTest > expPtsDribble) {
                    expPtsDribble = expPtsDribbleTest;
                }

                // Dribble, then dribble more
                expPtsDribbleTest = this.expPtsDribble(i, discord, ticks - 1);
                if (expPtsDribbleTest > expPtsDribble) {
                    expPtsDribble = expPtsDribbleTest;
                }
            }
        }
//console.log('dribble ' + i + ' at tick ' + ticks + ', discord ' + discord + ', expPtsDribble ' + expPtsDribble);

        return expPtsDribble;
    };



    /**
     * Calculates the probability of the current ball handler in the current situation making a shot if he takes one (situation-dependent field goal percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} discord A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} ticks An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFg = function (i, discord, ticks) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        p = this.players_on_court[this.o][i];
        d = this.distances[i];

        // Base probabilities
        if (d === c.DISTANCE_AT_RIM) {
            P = this.team[this.o].player[p].compositeRating.shootingAtRim * 0.3 + 0.54;
        } else if (d === c.DISTANCE_LOW_POST) {
            P = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.3 + 0.39;
        } else if (d === c.DISTANCE_MID_RANGE) {
            P = this.team[this.o].player[p].compositeRating.shootingMidRange * 0.3 + 0.31;
        } else if (d === c.DISTANCE_THREE_POINTER) {
            P = 0.25 * this.team[this.o].player[p].compositeRating.shootingThreePointer;
        }

        // Modulate by defensive discord
        P = P + 0.1 * (discord - 0.1);

        return this.bound(P, 0, 1);
    };

    /**
     * Calculates the probability of the current ball handler making a free throw if he takes one (free throw percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFt = function (i) {
        var p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.players_on_court[this.o][i];

        P = this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6;

        return this.bound(P, 0, 1);
    };

    /**
     * Assuming a shot was made, calculates the probability that the shooter was fouled.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probAndOne = function (i) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.players_on_court[this.o][i];
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
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probMissAndFoul = function (i) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;

        p = this.players_on_court[this.o][i];
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

        p = this.players_on_court[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " shoots from " + c.DISTANCES[this.distances[this.ballHandler]] + "... ");

        // Blocked shot
        if (this.probBlk() > Math.random()) {
            ratios = this.rating_array("blocks", this.d);
            p = this.players_on_court[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "blk");
            this.log("blocked by " + this.team[this.o].player[p].name + "!<br>");

            p = this.players_on_court[this.d][this.ballHandler];
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

        this.discord = this.updateDiscord("pass");  // Important - call this before updating this.ballHandler

        this.passer = this.ballHandler;
        this.ballHandler = passTo;

        p = this.players_on_court[this.o][this.passer];
        p2 = this.players_on_court[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " passes to " + this.team[this.o].player[p2].name + "<br>");

        return "pass";
    };

    GameSim.prototype.moveDribble = function () {
        var p;

        this.discord = this.updateDiscord("dribble");

        this.passer = -1;  // No assist if the player dribbles first

        p = this.players_on_court[this.o][this.ballHandler];
        this.log(this.team[this.o].player[p].name + " attacks his man off the dribble<br>");

        return "dribble";
    };

    /**
     * Updates defensive discord in a predefined manner for dribbling or passsing.
     *
     * @param {string} move Either "dribble" or "pass", which lets the function know which ratings to use to inform the updated discord.
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} discord A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.updateDiscord = function (move, i, discord) {
        var pd, po;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;

        po = this.players_on_court[this.o][i];
        pd = this.players_on_court[this.d][i];

        if (move === "dribble") {
            discord = this.bound(discord + 0.2 * (this.team[this.o].player[po].compositeRating.ballHandling - this.team[this.d].player[pd].compositeRating.defensePerimeter), 0, 1);
        } else if (move === "pass") {
            discord = this.bound(discord + 0.2 * (this.team[this.o].player[po].compositeRating.passing - this.team[this.d].player[pd].compositeRating.defensePerimeter), 0, 1);
        }

        return discord;
    };

    GameSim.prototype.doReb = function () {
        var p, ratios;

        if (0.8 > Math.random()) {
            ratios = this.rating_array("rebounds", this.d);
            p = this.players_on_court[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "drb");
            this.log(this.team[this.d].player[p].name + " comes down with the defensive rebound<br><br>");
            return "defReb";
        }
        ratios = this.rating_array("rebounds", this.o);
        this.ballHandler = this.pick_player(ratios);
        p = this.players_on_court[this.o][this.ballHandler];
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

        p = this.players_on_court[this.o][this.ballHandler];
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
        p = this.players_on_court[this.o][this.ballHandler];
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
            p = this.players_on_court[this.o][this.passer];
            this.record_stat(this.o, p, "ast");
        }

        return "madeShot";
    };

    GameSim.prototype.doFgMiss = function () {
        var d, p;

        p = this.players_on_court[this.o][this.ballHandler];
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
        p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(od, p, "pf");
    };

    GameSim.prototype.doTurnover = function () {
        var p, ratios;

        ratios = this.rating_array("turnovers", this.o);
        p = this.players_on_court[this.o][this.pick_player(ratios)];
        this.record_stat(this.o, p, "tov");

        // Steal?
        if (0.55 > Math.random()) {
            ratios = this.rating_array("steals", this.d);
            p = this.players_on_court[this.d][this.pick_player(ratios)];
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
            p = this.players_on_court[t][i];
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


    GameSim.prototype.log = function (msg) {
console.log(msg);
        this.playByPlay += msg;
    };

    return {
        GameSim: GameSim
    };
});