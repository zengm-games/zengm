define(["util/helpers", "util/random"], function(helpers, random) {
    /**
     * Single game simulation.
     * 
     * When an instance of this class is created, information about the two teams
     * is passed to GameSim(). Then GameSim.run() will actually simulate a game and
     * return the results (stats) of the simulation.
     * 
     * This function is self-contained and independent of the database, so that
     * eventually it can be ported to JavaScript and run client-side.
     */



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
     *         team stats), and composite_ratings (a dict containing various
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
     *                         "composite_rating": {}
     *                     },
     *                     ...
     *                 ]
     *             }
     *     team2: Same as team1, but for the away team.
     */
    function GameSim(gid, team1, team2) {
        this.id = gid;
        this.team = [deepCopy(team1), deepCopy(team2)];
        this.num_possessions = parseInt(Math.round((this.team[0]['pace'] + this.team[1]['pace']) / 2 * random.gauss(1, 0.03)), 10);

        // Starting lineups, which works because players are ordered by their roster_order
        this.players_on_court = [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];

        this.subs_every_n = 5;  // How many possessions to wait before doing subs
    }



    /**
     * Simulates the game and returns the results.
     * 
     * Returns:
     *     A list of dicts, one for each team, similar to the inputs to
     *     __init__, but with both the team and player "stat" dicts filled in
     *     and the extraneous data (defense, pace, ovr,
     *     composite_rating) removed. In other words...
     *         {
     *             'id': 0,
     *             'team': [
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
    GameSim.prototype.run = function() {
        // Simulate the game
        for (this.o = 0; this.o < 2; this.o++) {
            this.d = (this.o == 1) ? 0 : 1;
            for (var i = 0; i < this.num_possessions; i++) {
                if (i % this.subs_every_n == 0) {
                    this.update_players_on_court();
                }
                if (!this.is_turnover()) {
                    // Shot if there is no turnover
                    var ratios = this.rating_array('shot_ratio', this.o);
                    var shooter = this.pick_player(ratios);
                    if (!this.is_block()) {
                        if (!this.is_free_throw(shooter)) {
                            if (!this.is_made_shot(shooter)) {
                                this.do_rebound();
                            }
                        }
                    }
                }
            }
        }

        // Delete stuff that isn't needed before returning
        for (var t = 0; t < 2; t++) {
            delete this.team[t]['defense'];
            delete this.team[t]['pace'];
            for (var p=0; p < this.team[t]['player'].length; p++) {
                delete this.team[t]['player'][p]['ovr'];
                delete this.team[t]['player'][p]['composite_rating'];
            }
        }

        return {'gid': this.id, 'team': this.team};
    };



    /**
     * Do substitutions when appropriate, track energy levels, and record
     * the number of minutes each player plays. This function is currently VERY SLOW.
     */
    GameSim.prototype.update_players_on_court = function() {
        dt = 48.0 / (2 * this.num_possessions) * this.subs_every_n;  // Time elapsed in this possession

        for (var t = 0; t < 2; t++) {
            // Overall ratings scaled by fatigue
        	var ovrs = [];
            for (var i = 0; i < this.team[t]['player'].length; i++) {
                ovrs.push(this.team[t]['player'][i]['ovr'] * this.team[t]['player'][i]['stat']['energy'] * random.gauss(1, .04));
            }

            // Loop through players on court (in inverse order of current roster position)
            i = 0;
            for (var pp = 0; pp < this.players_on_court[t].length; pp++) {
                p = this.players_on_court[t][pp];
                this.players_on_court[t][i] = p;
                // Loop through bench players (in order of current roster position) to see if any should be subbed in)
                for (var b = 0; b < this.team[t]['player'].length; b++) {
                    if (this.players_on_court[t].indexOf(b) == -1 && this.team[t]['player'][p]['stat']['court_time'] > 3 && this.team[t]['player'][b]['stat']['bench_time'] > 3 && ovrs[b] > ovrs[p]) {
                        // Substitute player
                        this.players_on_court[t][i] = b;
                        this.team[t]['player'][b]['stat']['court_time'] = random.gauss(0, 2);
                        this.team[t]['player'][b]['stat']['bench_time'] = random.gauss(0, 2);
                        this.team[t]['player'][p]['stat']['court_time'] = random.gauss(0, 2);
                        this.team[t]['player'][p]['stat']['bench_time'] = random.gauss(0, 2);
                    }
                }
                i += 1;
            }

            // Update minutes (ovr, court, and bench)
            for (var p = 0; p < this.team[t]['player'].length; p++) {
                if (this.players_on_court[t].indexOf(p) >= 0) {
                    this.record_stat(t, p, 'min', dt);
                    this.record_stat(t, p, 'court_time', dt);
                    this.record_stat(t, p, 'energy', -dt * 0.01);
                    if (this.team[t]['player'][p]['stat']['energy'] < 0) {
                        this.team[t]['player'][p]['stat']['energy'] = 0;
                    }
                }
                else {
                    this.record_stat(t, p, 'bench_time', dt);
                    this.record_stat(t, p, 'energy', dt * 0.2);
                    if (this.team[t]['player'][p]['stat']['energy'] > 1) {
                        this.team[t]['player'][p]['stat']['energy'] = 1;
                    }
                }
            }
        }
    };



    GameSim.prototype.is_turnover = function() {
        if (Math.random() < 0.1 + this.team[this.d]['defense']) {
            this.do_turnover();
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.is_steal = function() {
        if (Math.random() < 0.55) {
            this.do_steal();
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.is_block = function() {
        if (Math.random() < (0.02 + this.team[this.d]['defense'])) {
            this.do_block();
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.is_free_throw = function(shooter) {
        if (Math.random() < 0.15) {
            this.do_free_throw(shooter, 2);
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.is_made_shot = function(shooter) {
        var p = this.players_on_court[this.o][shooter];
        this.record_stat(this.o, p, 'fga');
        // Three pointer or two pointer
        if (this.team[this.o]['player'][p]['composite_rating']['three_pointer_percentage'] > 0.25 && Math.random() < (0.5 * this.team[this.o]['player'][p]['composite_rating']['three_pointer_percentage'])) {
            this.record_stat(this.o, p, 'tpa');
            var type = 3;
            var stat = 'three_pointer_percentage';
        }
        else {
            var type = 2;
            var stat = 'field_goal_percentage';
        }
        // Make or miss
        if (Math.random() < (this.team[this.o]['player'][p]['composite_rating'][stat] - this.team[this.d]['defense'])) {
            this.do_made_shot(shooter, type);
            // And 1
            if (Math.random() < 0.1) {
                this.do_free_throw(shooter, 1);
            }
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.is_assist = function() {
        if (Math.random() < 0.6) {
            return true;
        }
        else {
            return false;
        }
    };



    GameSim.prototype.do_turnover = function() {
        var ratios = this.rating_array('turnover_ratio', this.o);
        var p = this.players_on_court[this.o][this.pick_player(ratios)];
        this.record_stat(this.o, p, 'tov');
        this.is_steal();
    };



    GameSim.prototype.do_steal = function() {
        var ratios = this.rating_array('steal_ratio', this.d);
        var p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, 'stl');
    };



    GameSim.prototype.do_block = function() {
        var ratios = this.rating_array('block_ratio', this.d);
        var p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, 'blk');
    };



    GameSim.prototype.do_free_throw = function(shooter, amount) {
        this.do_foul(shooter);
        var p = this.players_on_court[this.o][shooter];
        for (var i = 0; i < amount; i++) {
            this.record_stat(this.o, p, 'fta');
            if (Math.random() < this.team[this.o]['player'][p]['composite_rating']['free_throw_percentage']) {
                this.record_stat(this.o, p, 'ft');
                this.record_stat(this.o, p, 'pts');
            }
        }
    };


    /**
     * Assign a foul to anyone who isn't shooter.
     */
    GameSim.prototype.do_foul = function(shooter) {
        var ratios = this.rating_array('foul_ratio', this.d);
        var p = this.players_on_court[this.d][this.pick_player(ratios)];
        this.record_stat(this.d, p, 'pf');
        // Foul out
        //if this.team[this.d]['player'][p]['stat']['pf'] >= 6 {
    };



    GameSim.prototype.do_made_shot = function(shooter, type) {
        if (this.is_assist()) {
            var ratios = this.rating_array('assist_ratio', this.o);
            var p = this.players_on_court[this.o][this.pick_player(ratios, shooter)];
            this.record_stat(this.o, p, 'ast');
        }
        var p = this.players_on_court[this.o][shooter];
        this.record_stat(this.o, p, 'fg');
        this.record_stat(this.o, p, 'pts', 2);  // 2 points for 2's
        if (type == 3) {
            this.record_stat(this.o, p, 'tp');  // Extra point for 3's
            this.record_stat(this.o, p, 'pts');
        }
    };



    GameSim.prototype.do_rebound = function() {
        if (Math.random() < 0.8) {
            var ratios = this.rating_array('rebound_ratio', this.d);
            var p = this.players_on_court[this.d][this.pick_player(ratios)];
            this.record_stat(this.d, p, 'drb');
        }
        else {
            var ratios = this.rating_array('rebound_ratio', this.o);
            var p = this.players_on_court[this.o][this.pick_player(ratios)];
            this.record_stat(this.o, p, 'orb');
        }
    };



    GameSim.prototype.rating_array = function(rating, t) {
        array = [0, 0, 0, 0, 0];
        for (var i = 0; i < 5; i++) {
            var p = this.players_on_court[t][i];
            array[i] = this.team[t]['player'][p]['composite_rating'][rating];
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
     *         this.team[t]['player'] list. Yes, that's confusing.
     */
    GameSim.prototype.pick_player = function(ratios, exempt) {
        exempt = typeof exempt !== 'undefined' ? exempt : false;
        if (exempt != false) {
            ratios[exempt] = 0;
        }
        rand = Math.random() * (ratios[0] + ratios[1] + ratios[2] + ratios[3] + ratios[4]);
        if (rand < ratios[0]) {
            pick = 0;
        }
        else if (rand < (ratios[0] + ratios[1])) {
            pick = 1;
        }
        else if (rand < (ratios[0] + ratios[1] + ratios[2])) {
            pick = 2;
        }
        else if (rand < (ratios[0] + ratios[1] + ratios[2] + ratios[3])) {
            pick = 3;
        }
        else {
            pick = 4;
        }
        return pick;
    };



    /**
     * Increments a stat (s) for a player (p) on a team (t) by amount
     * (default is 1).
     */
    GameSim.prototype.record_stat = function(t, p, s, amount) {
        amount = typeof amount !== 'undefined' ? amount : 1;
        this.team[t]['player'][p]['stat'][s] = this.team[t]['player'][p]['stat'][s] + amount;
        if (s != 'gs' && s != 'court_time' && s != 'bench_time' && s != 'energy') {
            this.team[t]['stat'][s] = this.team[t]['stat'][s] + amount;
        }
    };

    return {
        GameSim: GameSim
    }
});
