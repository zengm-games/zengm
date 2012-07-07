define(["util/random"], function (random) {
    "use strict";

    function Player() {
    }

    /**
     * Load existing player's current ratings and attributes from the database.
     */
    Player.prototype.load = function (playerStore, pid, cb) {
        playerStore.get(pid).onsuccess = function (event) {
            this.p = event.target.result;
            cb(); // What goes here?
        };
    };

    /**
     * Add a new player to the database or update an existing player.
     */
    Player.prototype.save = function (playerStore) {
        playerStore.put(this.p);
    };

    /**
     * Develop (increase/decrease) player's ratings. This operates on whatever the last row of p.ratings is.
     * @param {number} years Number of years to develop (default 1).
     * @param {generate} generate Generating a new player? (default false). If true, then
     *     the player's age is also updated based on years.
     */
    Player.prototype.develop = function (years, generate) {
        var age, i, increase, j, key, ovr, plusMinus, pot, r, ratingKeys;

        years = typeof years !== "undefined" ? years : 1;
        generate = typeof generate !== "undefined" ? generate : false;

        r = this.p.ratings.length - 1;

        // Make sure age is always defined
        if (g.hasOwnProperty('season')) {
            age = g.season - this.p.bornYear;
        } else {
            age = g.startingSeason - this.p.bornYear;
        }

        for (i = 0; i < years; i++) {
            age += 1;
            pot = random.gauss(this.p.ratings[r].pot, 5);
            ovr = this.p.ratings[r].ovr;

            ratingKeys = ['stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb'];
            for (j = 0; j < ratingKeys.length; j++) {
                key = ratingKeys[j];
                plusMinus = 28 - age;
                if (plusMinus > 0) {
                    if (pot > ovr) {
                        // Cap potential growth
                        if (pot - ovr < 20) {
                            plusMinus *= (pot - ovr) / 20.0 + 0.5;
                        } else {
                            plusMinus *= 1.5;
                        }
                    } else {
                        plusMinus *= 0.5;
                    }
                } else {
                    plusMinus *= 30.0 / pot;
                }
                increase = random.gauss(1, 2) * plusMinus;
                //increase = plusMinus
                this.p.ratings[r][key] = this._limitRating(this.p.ratings[r][key] + increase);
            }

            // Update overall and potential
            this.p.ratings[r].ovr = this.ovr();
            this.p.ratings[r].pot += -2 + parseInt(random.gauss(0, 2), 10);
            if (this.p.ratings[r].ovr > this.p.ratings[r].pot || age > 28) {
                this.p.ratings[r].pot = this.p.ratings[r].ovr;
            }
        }

        if (generate) {
            if (g.hasOwnProperty('season')) {
                age = g.season - this.p.bornYear + years;
                this.p.bornYear = g.season - age;
            } else {
                age = g.startingSeason - this.p.bornYear + years;
                this.p.bornYear = g.startingSeason - age;
            }
        }
    };

    /**
     * Add or subtract amount from all ratings.
     * @param {number} amount Number to be added to each rating (can be negative).
     */
    Player.prototype.bonus = function (amount) {
        var i, key, r, ratingKeys;

        r = this.p.ratings.length - 1;
        ratingKeys = ['stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb', 'pot'];
        for (i = 0; i < ratingKeys.length; i++) {
            key = ratingKeys[i];
            this.p.ratings[r][key] = this._limitRating(this.p.ratings[r][key] + amount);
        }

        // Update overall and potential
        this.p.ratings[r].ovr = this.ovr();
        if (this.p.ratings[r].ovr > this.p.ratings[r].pot) {
            this.p.ratings[r].pot = this.p.ratings[r].ovr;
        }
    };

    Player.prototype._limitRating = function (rating) {
        if (rating > 100) {
            return 100;
        }
        if (rating < 0) {
            return 0;
        }
        return parseInt(rating, 10);
    };

    /**
     * Calculates the overall rating by averaging together all the other ratings.
     * @return {number} Overall rating.
     */
    Player.prototype.ovr = function () {
        var r, ratings;

        r = this.p.ratings.length - 1;
        ratings = this.p.ratings[r];
        return parseInt((ratings.hgt + ratings.stre + ratings.spd + ratings.jmp + ratings.endu + ratings.ins + ratings.dnk + ratings.ft + ratings.fg + ratings.tp + ratings.blk + ratings.stl + ratings.drb + ratings.pss + ratings.reb) / 15, 10);
    };

    Player.prototype.contract = function (randomizeExp) {
        var amount, expiration, maxAmount, minAmount, potentialDifference, r, years;

        randomizeExp = typeof randomizeExp !== "undefined" ? randomizeExp : false;

        r = this.p.ratings.length - 1;

        // Limits on yearly contract amount, in $1000's
        minAmount = 500;
        maxAmount = 20000;

        // Scale amount from 500k to 15mil, proportional to (ovr*2 + pot)*0.5 120-210
        amount = ((2.0 * this.p.ratings[r].ovr + this.p.ratings[r].pot) * 0.85 - 120) / (210 - 120);  // Scale from 0 to 1 (approx)
        amount = amount * (maxAmount - minAmount) + minAmount;  // Scale from 500k to 15mil
        amount *= random.gauss(1, 0.1);  // Randomize

        // Expiration
        // Players with high potentials want short contracts
        potentialDifference = Math.round((this.p.ratings[r].pot - this.p.ratings[r].ovr) / 4.0);
        years = 5 - potentialDifference;
        if (years < 2) {
            years = 2;
        }
        // Bad players can only ask for short deals
        if (this.p.ratings[r].pot < 40) {
            years = 1;
        } else if (this.p.ratings[r].pot < 50) {
            years = 2;
        } else if (this.p.ratings[r].pot < 60) {
            years = 3;
        }

        // Randomize expiration for contracts generated at beginning of new game
        if (randomizeExp) {
            years = random.randInt(1, years);
        }

        if (g.hasOwnProperty('season')) {
            expiration = g.season + years - 1;
        } else {
            expiration = g.startingSeason + years - 1;
        }
        if (amount < minAmount) {
            amount = minAmount;
        } else if (amount > maxAmount) {
            amount = maxAmount;
        } else {
            amount = 50 * Math.round(amount / 50);  // Make it a multiple of 50k
        }

        return {"amount": amount, "exp": expiration};
    };

    /**
     * Adds player to the free agents list.
     * 
     * This should be THE ONLY way that players are added to the free agents
     * list, because this will also calculate their demanded contract. But
     * currently, the free agents generated at the beginning of the game don't
     * use this function.
     */
    Player.prototype.addToFreeAgents = function (phase) {
        var contract, expiration;

        phase = typeof phase !== "undefined" ? phase : g.phase;

        // Player's desired contract
        contract = this.contract();

        // During regular season, or before season starts, allow contracts for
        // just this year.
        if (g.phase > c.PHASE_AFTER_TRADE_DEADLINE) {
            expiration += 1;
        }

//        g.dbex('UPDATE player_attributes SET tid = :tid, contractAmount = :contractAmount, contractExp = :contractExp, free_agent_times_asked = 0 WHERE pid = :pid', tid=c.PLAYER_FREE_AGENT, contractAmount=contract.amount, contractExp=contract.exp, pid=this.id)
    };

    /**
     * Release player.
     * 
     * This keeps track of what the player's current team owes him, and then
     * calls this.addToFreeAgents.
     */
    Player.prototype.release = function () {
        // Keep track of player salary even when he's off the team
/*        r = g.dbex('SELECT contractAmount, contractExp, tid FROM player_attributes WHERE pid = :pid', pid=this.id)
        contractAmount, contractExp, tid = r.fetchone()
        g.dbex('INSERT INTO released_players_salaries (pid, tid, contractAmount, contractExp) VALUES (:pid, :tid, :contractAmount, :contractExp)', pid=this.id, tid=tid, contractAmount=contractAmount, contractExp=contractExp)*/

        this.addToFreeAgents();
    };

    Player.prototype.generate = function (tid, age, profile, baseRating, pot, draftYear) {
        this.p = {}; // Will be saved to database
        this.p.tid = tid;
        this.p.statsTids = [];
        this.p.stats = [];
        if (tid >= 0) {
            this.p.statsTids.push(tid);
            this.p.stats.push({season: g.startingSeason, tid: this.p.tid, playoffs: false, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0});
        }
        this.p.rosterOrder = 666;  // Will be set later
        this.p.draftYear = draftYear;
        this.generateRatings(profile, baseRating, pot);
        this.generateAttributes(age);
        this.p.draftPot = pot;
        this.p.draftOvr = this.p.ratings[0].ovr;
    };

    Player.prototype.generateRatings = function (profile, baseRating, pot) {
        var i, key, profileId, profiles, rating, ratingKeys, ratings, sigmas;

        if (profile === 'Point') {
            profileId = 1;
        } else if (profile === 'Wing') {
            profileId = 2;
        } else if (profile === 'Big') {
            profileId = 3;
        } else {
            profileId = 0;
        }

        // Each row should sum to ~150
        profiles = [[10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10],  // Base 
                    [-30, -10, 40,  15,  0,   0,   0,   10,  15,  0,   0,   20,  40,  40,  0],   // Point Guard
                    [10,  10,  15,  15,  0,   0,   25,  15,  15,  5,   0,   10,  15,  0,   15],  // Wing
                    [40,  30,  -10, -10, 10,  30,  30,  0,   -10, -20, 30,  0,   -10, -10, 30]];  // Big
        sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
        baseRating = random.gauss(baseRating, 5);

        ratings = [];
        for (i = 0; i < sigmas.length; i++) {
            rating = profiles[profileId][i] + baseRating;
            ratings[i] = this._limitRating(random.gauss(rating, sigmas[i]));
        }

        this.p.ratings = [{}];
        ratingKeys = ['hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb'];
        for (i = 0; i < ratingKeys.length; i++) {
            key = ratingKeys[i];
            this.p.ratings[0][key] = ratings[i];
        }

        this.p.ratings[0].season = g.startingSeason;
        this.p.ratings[0].ovr = this.ovr();
        this.p.ratings[0].pot = pot;
    };

    // Call generate_ratings before this method!
    Player.prototype.generateAttributes = function (age, player_nat) {
        var contract, maxHgt, minHgt, maxWeight, minWeight, nationality, r;

        r = this.p.ratings.length - 1;

        minHgt = 69;  // 5'9"
        maxHgt = 89;  // 7'5"
        minWeight = 150;
        maxWeight = 290;

        this.p.pos = pos(this.p.ratings[r]);  // Position (PG, SG, SF, PF, C, G, GF, FC)
        this.p.hgt = parseInt(random.gauss(1, 0.02) * (this.p.ratings[r].hgt * (maxHgt - minHgt) / 100 + minHgt), 10);  // Height in inches (from minHgt to maxHgt)
        this.p.weight = parseInt(random.gauss(1, 0.02) * ((this.p.ratings[r].hgt + 0.5 * this.p.ratings[r].stre) * (maxWeight - minWeight) / 150 + minWeight), 10);  // Weight in pounds (from minWeight to maxWeight)
        if (g.hasOwnProperty('season')) {
            this.p.bornYear = g.season - age;
        } else {
            this.p.bornYear = g.startingSeason - age;
        }

        // Randomly choose nationality	
        nationality = 'USA';

        this.p.bornLoc = nationality;
        this.p.name = name(nationality);

        this.p.college = 0;
        this.p.draftRound = 0;
        this.p.draftPick = 0;
        this.p.draftTid = 0;
        contract = this.contract();
        this.p.contractAmount = contract.amount;
        this.p.contractExp = contract.exp;

        this.p.freeAgentTimesAsked = 0;
        this.p.yearsFreeAgent = 0;
    };

    function name(nationality) {
        var fn, fnRand, i, ln;

        fn = "Bob";
        ln = "Johnson";

        // First name
        fnRand = random.uniform(0, g.firstNames.length - 1);
        for (i=0; i<g.firstNames.length; i++) {
            //if row[4].upper() == nationality.upper():
            if (g.firstNames[i][2] >= fnRand) {
                break;
            }
        }
        console.log(i)
        fn = g.firstNames[i][0];

/*
        // Last name
        ln_rand = random.uniform(0, this.ln_max)
        for row in this.ln_data:
            if row[4].upper() == nationality.upper():
                if float(row[2]) >= ln_rand:
                //   if (random.random() < 0.3):  // This is needed because there are some duplicate CDF's in last_names.txt
                    break
        ln = string.capitalize(row[0])
        // McWhatever
        if len(ln) > 3:
            ln = re.sub('^Mc(\w)', 'Mc' + ln[2].upper(), ln)
*/
        return fn + " " + ln;
    }

    /**
     * Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings.
     */
    function pos(ratings) {
        var c, g, pf, pg, position, sf, sg;

        g = false;
        pg = false;
        sg = false;
        sf = false;
        pf = false;
        c = false;

        // Default position
        if (ratings.drb >= 50) {
            position = 'GF';
        } else {
            position = 'F';
        }

        if (ratings.hgt <= 30 || ratings.spd >= 85) {
            g = true;
            if ((ratings.pss + ratings.drb) >= 100) {
                pg = true;
            }
            if (ratings.hgt >= 30) {
                sg = true;
            }
        }
        if (ratings.hgt >= 50 && ratings.hgt <= 65 && ratings.spd >= 40) {
            sf = true;
        }
        if (ratings.hgt >= 70) {
            pf = true;
        }
        if ((ratings.hgt + ratings.stre) >= 130) {
            c = true;
        }

        if (pg && !sg && !sf && !pf && !c) {
            position = 'PG';
        } else if (!pg && (g || sg) && !sf && !pf && !c) {
            position = 'SG';
        } else if (!pg && !sg && sf && !pf && !c) {
            position = 'SF';
        } else if (!pg && !sg && !sf && pf && !c) {
            position = 'PF';
        } else if (!pg && !sg && !sf && !pf && c) {
            position = 'C';
        }

        // Multiple poss
        if ((pf || sf) && g) {
            position = 'GF';
        } else if (c && (pf || sf)) {
            position = 'FC';
        } else if (pg && sg) {
            position = 'G';
        }
        if (position === 'F' && ratings.drb <= 20) {
            position = 'PF';
        }

        return position;
    }

    return {
        Player: Player
    };
});
/* THSES SHOULDN'T BE NEEDED, IDEALLY
    def get_attributes(this):
        d = this.attribute
        d.pid = this.id
        return d

    def get_ratings(this):
        d = this.rating
        if not hasattr(g, 'season'):
            d.season = g.startingSeason
        else {
            d.season = g.season
        d.ovr = this.ovr()
        d.pid = this.id
        return d*/