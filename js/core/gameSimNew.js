define(["util/helpers", "util/random"], function (helpers, random) {
    /**
     * Single game simulation.
     * 
     * When an instance of this class is created, information about the two teams
     * is passed to GameSim(). Then GameSim.run() will actually simulate a game and
     * return the results (stats) of the simulation.
     */
    "use strict";

    /**
     * Initialize the two teams that are playing this game.
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
        this.numTicks = 5;  // Analogous to the shot clock. A tick happens when any action occurs, like passing the ball or dribbling towards the basket.
        this.discord = 0;  // Defensive discord. 0 = defense is comfortable. 1 = complete chaos.

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

        return {"gid": this.id, "overtimes": this.overtimes, "team": this.team};
    };



    /**
     * Simulate this.num_possessions possessions. So to simulate regulation or
     * overtime, just set this.num_possessions to appropriate values.
     */
    GameSim.prototype.simPossessions = function () {
        var i, outcome;

        for (this.o = 0; this.o < 2; this.o++) {
            this.d = (this.o === 1) ? 0 : 1;
            for (i = 0; i < this.num_possessions; i++) {
                this.ticks = this.numTicks;  // Reset shot clock
                if (i % this.subs_every_n === 0) {
                    this.update_players_on_court();
                }

                // Set the positions of offensive players relative to the basket
                this.initDistances();

                // Start with the PG dribbling the ball
                this.initBallHandler();

                // Start with all players defended tightly
                this.initOpenness();

                // Initialize defensive discord
                this.discord = 0;

                // Play each possession until the shot clock expires
                while (this.ticks > 0) {
                    if (this.probTurnover() > Math.random()) {
                        this.doTurnover();
                        break;
                    }

                    // Shoot, pass, or dribble
                    outcome = this.move();

                    // If the possession ended in a defensive rebound or a made shot, go to the next possession
                    if (outcome === "madeShot" || outcome === "defReb") {
                        break;
                    } else if (outcome === "offReb") {
                        this.ticks = this.numTicks;  // Reset shot clock
                    } else {
                        this.ticks = this.ticks - 1;
                    }
                }
            }
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
    GameSim.prototype.update_players_on_court = function () {
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
        this.distances = [c.DISTANCE_AT_RIM, c.DISTANCE_MID_RANGE, c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER, c.DISTANCE_THREE_POINTER];  // These correspond with this.players_on_court
    };



    /**
     * Initialize which player has the ball at the beginning of a possession.
     */
    GameSim.prototype.initBallHandler = function () {
        this.ballHandler = 4;  // This corresponds with this.players_on_court
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

        // Expected points for shooting
        expPtsShoot = this.expPtsShoot();

        // Expected points for passing
        x = this.expPtsPass();
        expPtsPass = x.expPtsPass;
        passTo = x.passTo;

        // Expected points for dribbling
        expPtsDribble = this.expPtsDribble();

        if (expPtsShoot > expPtsPass && expPtsShoot > expPtsDribble) {
            // Shoot
            shooter = this.ballHandler;
            if (this.is_block()) {
                return "defReb";
            }
            if (this.is_free_throw(shooter)) {
                return "madeShot";
            }
            if (!this.is_made_shot(shooter)) {
                this.do_rebound();
                return "defReb";
            }

            return "madeShot";
        }
        if (expPtsPass > expPtsShoot && expPtsPass > expPtsDribble) {
            // Pass
            this.ballHandler = passTo;
            return "pass";
        }

        // Dribble
        this.discord += 0.1;
        return "dribble";
    };



    /**
     * Calculates the expected points scored if the given player took a shot right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} i A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} i An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsShoot = function (i, discord, ticks) {
        var expPtsShoot, probFg;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        probFg = this.probFg(i, discord, ticks);
        expPtsShoot = probFg * this.distances[this.ballHandler] + this.probFt(i) * (probFg * this.probAndOne(i) + (1 - probFg) * this.probMissedAndFouled(i));

        return expPtsShoot;
    };



    /**
     * Calculates the expected points scored if the given player passed right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} i A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} i An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} An object containing "expPtsPass" which is points, from 0 to 4, and "passTo" the index of the player to pass to (like i).
     */
    GameSim.prototype.expPtsPass = function (i, discord, ticks) {
        var expPtsPass, expPtsPassTest, j, passTo, probFg;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsPass = 0;
        passTo = -1;  // Index of this.players_on_court[this.o], like i

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

        return {
            expPtsPass: expPtsPass,
            passTo: passTo
        };
    };



    /**
     * Calculates the expected points scored if the given player attacked off the dribble right now.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} i A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} i An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Points, from 0 to 4.
     */
    GameSim.prototype.expPtsDribble = function (i, discord, ticks) {
        var expPtsDribble, expPtsDribbleTest, j;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        expPtsDribble = 0;
        discord = discord + 0.1;

        if (ticks > 1) { // If ticks is 1, then any move besides a shot will result in 0 points.
            // Dribble, then shoot
            expPtsDribbleTest = this.expPtsShoot(j, discord, ticks - 1);
            if (expPtsDribbleTest > expPtsDribble) {
                expPtsDribble = expPtsDribbleTest;
            }

            // Dribble, then pass
            expPtsDribbleTest = this.expPtsPass(j, discord, ticks - 1);
            if (expPtsDribbleTest > expPtsDribble) {
                expPtsDribble = expPtsDribbleTest;
            }

            // Dribble, then dribble more
            expPtsDribbleTest = this.expPtsDribble(j, discord, ticks - 1);
            if (expPtsDribbleTest > expPtsDribble) {
                expPtsDribble = expPtsDribbleTest;
            }
        }

        return expPtsDribble;
    };



    /**
     * Calculates the probability of the current ball handler in the current situation making a shot if he takes one (situation-dependent field goal percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest. If undefined, then this.ballHandler is used.
     * @param {number} i A number between 0 and 1 representing defensive discord. If undefined, then this.discord is used.
     * @param {number} i An integer representing the number of ticks left (similar to shot clock). If undefined, then this.ticks is used.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFg = function (i, discord, ticks) {
        var d, p, P;

        i = i !== undefined ? i : this.ballHandler;
        discord = discord !== undefined ? discord : this.discord;
        ticks = ticks !== undefined ? ticks : this.ticks;

        p = this.players_on_court[this.o][i];
        d = this.distances[i];

        // Default values
        if (d === c.DISTANCE_AT_RIM) {  // At rim
            P = 0.8;
        } else if (d === c.DISTANCE_LOW_POST) {  // Low post
            P = 0.55;
        } else if (d === c.DISTANCE_MID_RANGE) {  // Mid range
            P = 0.39;
        } else if (d === c.DISTANCE_THREE_POINTER) {
            P = 0.36;
        }

        return P;
    };



    /**
     * Calculates the probability of the current ball handler making a free throw if he takes one (free throw percentage).
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probFt = function (i) {
        var p, P;

        p = this.players_on_court[this.o][i];

        P = this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6;

        return P;
    };



    /**
     * Assuming a shot was made, calculates the probability that the shooter was fouled.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probAndOne = function (i) {
        var d, p, P;

        p = this.players_on_court[this.o][i];
        d = this.distances[this.ballHandler];

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

        return P;
    };



    /**
     * Assuming a shot was missed, calculates the probability that the shooter was fouled.
     *
     * @param {number} i An integer between 0 and 4 representing the index of this.players_on_court[this.o] for the player of interest.
     * @return {number} Probability from 0 to 1.
     */
    GameSim.prototype.probMissedAndFouled = function (i) {
        var d, p, P;

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

        return P;
    };


    GameSim.prototype.probTurnover = function () {
        return (0.1 + this.team[this.d].defense) * 0.35;
    };



    GameSim.prototype.is_steal = function () {
        if (Math.random() < 0.55) {
            this.do_steal();
            return true;
        }
        return false;
    };



    GameSim.prototype.is_block = function () {
        if (Math.random() < (0.02 + this.team[this.d].defense) * 0.35) {
            this.do_block();
            return true;
        }
        return false;
    };



    GameSim.prototype.is_free_throw = function (shooter) {
        if (Math.random() < 0.15) {
            this.do_free_throw(shooter, 2);
            return true;
        }
        return false;
    };



    GameSim.prototype.is_made_shot = function (shooter) {
        var p, probMake, probAndOne, r1, r2, r3, type;

        p = this.players_on_court[this.o][shooter];
        this.record_stat(this.o, p, "fga");

        // Pick the type of shot and store the success rate (with no defense) in probMake and the probability of an and one in probAndOne
        if (this.team[this.o].player[p].compositeRating.shootingThreePointer > 0.4 && Math.random() < (0.25 * this.team[this.o].player[p].compositeRating.shootingThreePointer)) {
            // Three pointer
            this.record_stat(this.o, p, "tpa");
            type = 3;
            probMake = this.team[this.o].player[p].compositeRating.shootingThreePointer * 0.81;
            probAndOne = 0.01;
        } else {
            r1 = Math.random() * this.team[this.o].player[p].compositeRating.shootingMidRange;
            r2 = Math.random() * this.team[this.o].player[p].compositeRating.shootingAtRim;
            r3 = Math.random() * this.team[this.o].player[p].compositeRating.shootingLowPost;
            if (r1 > r2 && r1 > r3) {
                // Two point jumper
                type = 2;
                probMake = this.team[this.o].player[p].compositeRating.shootingMidRange * 0.3 + 0.31;
                probAndOne = 0.05;
            } else if (r2 > r3) {
                // Dunk, fast break or half court
                probMake = this.team[this.o].player[p].compositeRating.shootingAtRim * 0.3 + 0.54;
                probAndOne = 0.2;
            } else {
                // Post up
                probMake = this.team[this.o].player[p].compositeRating.shootingLowPost * 0.3 + 0.39;
                probAndOne = 0.2;
            }
        }
        // Make or miss
        if (Math.random() < (probMake - this.team[this.d].defense * 0.5)) {
            this.do_made_shot(shooter, type);
            // And 1
            if (Math.random() < probAndOne) {
                this.do_free_throw(shooter, 1);
            }
            return true;
        }
        return false;
    };



    GameSim.prototype.is_assist = function () {
        if (Math.random() < 0.65) {
            return true;
        }
        return false;
    };



    GameSim.prototype.doTurnover = function () {
        var p, ratios;

        ratios = this.rating_array("turnovers", this.o);
        p = this.players_on_court[this.o][this.pick_player(ratios)];
        this.record_stat(this.o, p, "tov");
        this.is_steal();
    };



    GameSim.prototype.do_steal = function () {
        var p, ratios;

        ratios = this.rating_array("steals", this.d);
        p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, "stl");
    };



    GameSim.prototype.do_block = function () {
        var p, ratios;

        ratios = this.rating_array("blocks", this.d);
        p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, "blk");
    };



    GameSim.prototype.do_free_throw = function (shooter, amount) {
        var i, p;

        this.do_foul(shooter);
        p = this.players_on_court[this.o][shooter];
        for (i = 0; i < amount; i++) {
            this.record_stat(this.o, p, "fta");
            if (Math.random() < this.team[this.o].player[p].compositeRating.shootingFT * 0.3 + 0.6) {  // Between 60% and 90%
                this.record_stat(this.o, p, "ft");
                this.record_stat(this.o, p, "pts");
            }
        }
    };


    /**
     * Assign a foul to anyone who isn't shooter.
     */
    GameSim.prototype.do_foul = function (shooter) {
        var p, ratios;

        ratios = this.rating_array("fouls", this.d);
        p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, "pf");
        // Foul out
        //if this.team[this.d].player[p].stat.pf >= 6 {
    };



    GameSim.prototype.do_made_shot = function (shooter, type) {
        var p, ratios;

        if (this.is_assist()) {
            ratios = this.rating_array("assists", this.o);
            p = this.players_on_court[this.o][this.pick_player(ratios, shooter)];
            this.record_stat(this.o, p, "ast");
        }
        p = this.players_on_court[this.o][shooter];
        this.record_stat(this.o, p, "fg");
        this.record_stat(this.o, p, "pts", 2);  // 2 points for 2's
        if (type === 3) {
            this.record_stat(this.o, p, "tp");  // Extra point for 3's
            this.record_stat(this.o, p, "pts");
        }
    };



    GameSim.prototype.do_rebound = function () {
        var p, ratios;

        if (Math.random() < 0.8) {
            ratios = this.rating_array("rebounds", this.d);
            p = this.players_on_court[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, "drb");
        } else {
            ratios = this.rating_array("rebounds", this.o);
            p = this.players_on_court[this.o][this.pick_player(ratios)];
            this.record_stat(this.o, p, "orb");
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
     *     exempt: An integer representing a player that can't be picked (i.e. you
     *         can't assist your own shot, which is the only current use of
     *         exempt). The value of exempt ranges from 0 to 4, corresponding to
     *         the index of the player in this.players_on_court. This is *NOT* the
     *         same value as the player ID *or* the index of the
     *         this.team[t].player list. Yes, that's confusing.
     */
    GameSim.prototype.pick_player = function (ratios, exempt) {
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
    GameSim.prototype.record_stat = function (t, p, s, amount) {
        amount = amount !== undefined ? amount : 1;
        this.team[t].player[p].stat[s] = this.team[t].player[p].stat[s] + amount;
        if (s !== "gs" && s !== "court_time" && s !== "bench_time" && s !== "energy") {
            this.team[t].stat[s] = this.team[t].stat[s] + amount;
        }
    };

    return {
        GameSim: GameSim
    };
});