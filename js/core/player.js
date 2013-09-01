/**
 * @name core.player
 * @namespace Functions operating on player objects, parts of player objects, or arrays of player objects.
 */
define(["globals", "core/finances", "data/injuries", "data/names", "lib/faces", "lib/underscore", "util/helpers", "util/random"], function (g, finances, injuries, names, faces, _, helpers, random) {
    "use strict";

    /**
     * Limit a rating to between 0 and 100.
     *
     * @memberOf core.player
     * @param {number} rating Input rating.
     * @return {number} If rating is below 0, 0. If rating is above 100, 100. Otherwise, rating.
     */
    function limitRating(rating) {
        if (rating > 100) {
            return 100;
        }
        if (rating < 0) {
            return 0;
        }
        return Math.floor(rating);
    }


    /**
     * Calculates the overall rating by averaging together all the other ratings.
     * 
     * @memberOf core.player
     * @param {Object.<string, number>} ratings Player's ratings object.
     * @return {number} Overall rating.
     */
    function ovr(ratings) {
        ///return Math.round((ratings.hgt + ratings.stre + ratings.spd + ratings.jmp + ratings.endu + ratings.ins + ratings.dnk + ratings.ft + ratings.fg + ratings.tp + ratings.blk + ratings.stl + ratings.drb + ratings.pss + ratings.reb) / 15);

        // This formula is loosely based on linear regression:
        //     player = require('core/player'); player.regressRatingsPer();
        return Math.round((4 * ratings.hgt + ratings.stre + 4 * ratings.spd + 2 * ratings.jmp + 3 * ratings.endu + 3 * ratings.ins + 4 * ratings.dnk + ratings.ft + ratings.fg + 2 * ratings.tp + ratings.blk + ratings.stl + ratings.drb + 3 * ratings.pss + ratings.reb) / 32);
    }

    /**
     * Assign "skills" based on ratings.
     *
     * "Skills" are discrete categories, like someone is a 3 point shooter or they aren't. These are displayed next to the player's name generally, and are also used in game simulation. The possible skills are:
     * 
     * * Three Point Shooter (3)
     * * Athlete (A)
     * * Ball Handler (B)
     * * Interior Defender (Di)
     * * Perimeter Defender (Dp)
     * * Post Scorer (Po)
     * * Passer (Ps)
     * * Rebounder (R)
     * 
     * @memberOf core.player
     * @param {Object.<string, number>} ratings Ratings object.
     * @return {Array.<string>} Array of skill IDs.
     */
    function skills(ratings) {
        var hasSkill, sk;

        sk = [];

        hasSkill = function (ratings, components, weights) {
            var denominator, i, numerator;

            if (weights === undefined) {
                // Default: array of ones with same size as components
                weights = [];
                for (i = 0; i < components.length; i++) {
                    weights.push(1);
                }
            }

            numerator = 0;
            denominator = 0;
            for (i = 0; i < components.length; i++) {
                numerator += ratings[components[i]] * weights[i];
                denominator += 100 * weights[i];
            }

            if (numerator / denominator > 0.75) {
                return true;
            }
            return false;
        };

        // Most of these use the same formulas as the composite rating definitions in core.game!
        if (hasSkill(ratings, ['hgt', 'tp'], [0.2, 1])) {
            sk.push("3");
        }
        if (hasSkill(ratings, ['stre', 'spd', 'jmp', 'hgt'], [1, 1, 1, 0.5])) {
            sk.push("A");
        }
        if (hasSkill(ratings, ['drb', 'spd'])) {
            sk.push("B");
        }
        if (hasSkill(ratings, ['hgt', 'stre', 'spd', 'jmp', 'blk'], [2, 1, 0.5, 0.5, 1])) {
            sk.push("Di");
        }
        if (hasSkill(ratings, ['hgt', 'stre', 'spd', 'jmp', 'stl'], [1, 1, 2, 0.5, 1])) {
            sk.push("Dp");
        }
        if (hasSkill(ratings, ['hgt', 'stre', 'spd', 'ins'], [1, 0.6, 0.2, 1])) {
            sk.push("Po");
        }
        if (hasSkill(ratings, ['drb', 'pss'], [0.4, 1])) {
            sk.push("Ps");
        }
        if (hasSkill(ratings, ['hgt', 'stre', 'jmp', 'reb'], [1, 0.1, 0.1, 0.7])) {
            sk.push("R");
        }

        return sk;
    }

    /**
     * Generate a contract for a player.
     * 
     * @memberOf core.player
     * @param {Object} ratings Player object. At a minimum, this must have one entry in the ratings array.
     * @param {boolean} randomizeExp If true, then it is assumed that some random amount of years has elapsed since the contract was signed, thus decreasing the expiration date. This is used when generating players in a new league.
     * @return {Object.<string, number>} Object containing two properties with integer values, "amount" with the contract amount in thousands of dollars and "exp" with the contract expiration year.
     */
    function genContract(p, randomizeExp) {
        var amount, expiration, maxAmount, minAmount, potentialDifference, ratings, years;

        ratings = _.last(p.ratings);

        randomizeExp = randomizeExp !== undefined ? randomizeExp : false;

        // Limits on yearly contract amount, in $1000's
        minAmount = 500;
        maxAmount = 20000;

        // Scale proportional to (ovr*2 + pot)*0.5 120-210
        //amount = ((3 * value(p)) * 0.85 - 110) / (210 - 120);  // Scale from 0 to 1 (approx)
        //amount = amount * (maxAmount - minAmount) + minAmount;
        amount = (value(p) / 100 - 0.45) * 3.5 * (maxAmount - minAmount) + minAmount;
        amount *= random.gauss(1, 0.1);  // Randomize

        // Expiration
        // Players with high potentials want short contracts
        potentialDifference = Math.round((ratings.pot - ratings.ovr) / 4.0);
        years = 5 - potentialDifference;
        if (years < 2) {
            years = 2;
        }
        // Bad players can only ask for short deals
        if (ratings.pot < 40) {
            years = 1;
        } else if (ratings.pot < 50) {
            years = 2;
        } else if (ratings.pot < 60) {
            years = 3;
        }

        // Randomize expiration for contracts generated at beginning of new game
        if (randomizeExp) {
            years = random.randInt(1, years);

            // Make rookie contracts more reasonable
            if (g.season - p.born.year <= 22) {
                amount /= 4; // Max $5 million/year
            }
        }

        expiration = g.season + years - 1;
        if (amount < minAmount * 1.1) {
            amount = minAmount;
        } else if (amount > maxAmount) {
            amount = maxAmount;
        } else {
            amount = 50 * Math.round(amount / 50);  // Make it a multiple of 50k
        }

        return {amount: amount, exp: expiration};
    }

    /**
     * Store a contract in a player object.
     * 
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {Object} contract Contract object with two properties, exp (year) and amount (thousands of dollars).
     * @param {boolean} signed Is this an official signed contract (true), or just part of a negotiation (false)?
     * @return {Object} Updated player object.
     */
    function setContract(p, contract, signed) {
        var i, start;

        p.contract = contract;

        // Only write to salary log if the player is actually signed. Otherwise, we're just generating a value for a negotiation.
        if (signed) {
            // Is this contract beginning with an in-progress season, or next season?
            start = g.season;
            if (g.phase > g.PHASE.AFTER_TRADE_DEADLINE) {
                start += 1;
            }

            for (i = start; i <= p.contract.exp; i++) {
                p.salaries.push({season: i, amount: contract.amount});
            }
        }

        return p;
    }

    /**
     * Develop (increase/decrease) player's ratings. This operates on whatever the last row of p.ratings is.
     * 
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {number=} years Number of years to develop (default 1).
     * @param {boolean=} generate Generating a new player? (default false). If true, then the player's age is also updated based on years.
     * @param {number=} coachingRank From 1 to 30, where 1 is best coaching staff and 30 is worst. Default is 15.5
     * @return {Object} Updated player object.
     */
    function develop(p, years, generate, coachingRank) {
        var age, baseChange, i, j, ratingKeys, r, sigma, sign;

        years = years !== undefined ? years : 1;
        generate = generate !== undefined ? generate : false;
        coachingRank = coachingRank !== undefined ? coachingRank : 15.5;

        r = p.ratings.length - 1;

        age = g.season - p.born.year;

        for (i = 0; i < years; i++) {
            age += 1;

            // Randomly make a big jump
            if (Math.random() > 0.985 && age < 22) {
                p.ratings[r].pot += 10;
            }

            // Variance of ratings change is proportional to the potential difference
            sigma = (p.ratings[r].pot - p.ratings[r].ovr) / 10;

            // 60% of the time, improve. 20%, regress. 20%, stay the same
            baseChange = random.gauss(random.randInt(-1, 3), sigma);

            // Bound possible changes
            if (baseChange > 30) {
                baseChange = 30;
            } else if (baseChange < -5) {
                baseChange = -5;
            }
            if (baseChange + p.ratings[r].pot > 95) {
                baseChange = 95 - p.ratings[r].pot;
            }

            // Modulate by potential difference, but only for growth, not regression
            if (baseChange > 0) {
                baseChange *= 1 + (p.ratings[r].pot - p.ratings[r].ovr) / 8;
            }

            // Modulate by age
            if (age > 23) {
                baseChange /= 3;
            }
            if (age > 29) {
                baseChange -= 1;
            }
            if (age > 31) {
                baseChange -= 1;
            }
            if (age > 33) {
                baseChange -= 1;
            }

            // Modulate by coaching
            sign = baseChange ? baseChange < 0 ? -1 : 1 : 0;
            if (sign >= 0) { // life is normal
                baseChange *= ((coachingRank - 1) * (-0.5) / 29 + 1.25);
            } else {
                baseChange *= ((coachingRank - 1) * (0.5) / 29 + 0.75);
            }

            ratingKeys = ['stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb'];
            for (j = 0; j < ratingKeys.length; j++) {
                //increase = plusMinus
                p.ratings[r][ratingKeys[j]] = limitRating(p.ratings[r][ratingKeys[j]] + random.gauss(1, 2) * baseChange);
            }

            // Update overall and potential
            p.ratings[r].ovr = ovr(p.ratings[r]);
            p.ratings[r].pot += -2 + Math.round(random.gauss(0, 2));
            if (p.ratings[r].ovr > p.ratings[r].pot || age > 28) {
                p.ratings[r].pot = p.ratings[r].ovr;
            }

            // Skills
            p.ratings[r].skills = skills(p.ratings[r]);
        }

        // If this isn't here outside the loop, then 19 year old players could still have ovr > pot
        if (p.ratings[r].ovr > p.ratings[r].pot || age > 28) {
            p.ratings[r].pot = p.ratings[r].ovr;
        }

        if (generate) {
            age = g.season - p.born.year + years;
            p.born.year = g.season - age;
        }

        return p;
    }

    /**
     * Add or subtract amount from all current ratings and update the player's contract appropriately.
     * 
     * This should only be called when generating players for a new league. Otherwise, develop should be used. 
     * 
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {number} amount Number to be added to each rating (can be negative).
     * @param {boolean} randomizeExp Should the number of years on the player's contract be randomized?.
     * @return {Object} Updated player object.
     */
    function bonus(p, amount, randomizeExp) {
        var age, i, key, r, ratingKeys;

        // Make sure age is always defined
        age = g.season - p.born.year;

        r = p.ratings.length - 1;

        ratingKeys = ['stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl', 'drb', 'pss', 'reb', 'pot'];
        for (i = 0; i < ratingKeys.length; i++) {
            key = ratingKeys[i];
            p.ratings[r][key] = limitRating(p.ratings[r][key] + amount);
        }

        // Update overall and potential
        p.ratings[r].ovr = ovr(p.ratings[r]);
        if (p.ratings[r].ovr > p.ratings[r].pot || age > 28) {
            p.ratings[r].pot = p.ratings[r].ovr;
        }

        // Update contract based on development. Only write contract to log if not a free agent.
        p = setContract(p, genContract(p, randomizeExp), p.tid >= 0);

        return p;
    }

    /**
     * Calculates the base "mood" factor for any free agent towards a team.
     *
     * This base mood is then modulated for an individual player in addToFreeAgents.
     * 
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on teams; if null is passed, then a new transaction will be used.
     * @return {function(Array.<number>)} Callback function whose argument is an array of base moods, one for each team.
     */
    function genBaseMoods(ot, cb) {
        var baseMoods, teamStore;

        baseMoods = [];

        teamStore = require("db").getObjectStore(ot, "teams", "teams");
        teamStore.getAll().onsuccess = function (event) {
            var facilitiesRank, i, s, teams;

            teams = event.target.result;

            s = teams[0].seasons.length - 1;  // Most recent season index

            for (i = 0; i < teams.length; i++) {
                baseMoods[i] = 0;

                // Hype
                baseMoods[i] += 0.5 * (1 - teams[i].seasons[s].hype);

                // Facilities
                baseMoods[i] += 0.1 * (1 - (finances.getRankLastThree(teams[i], "expenses", "facilities") - 1) / 29);

                // Population
                baseMoods[i] += 0.2 * (1 - teams[i].seasons[s].pop / 10);

                // Randomness
                baseMoods[i] += random.gauss(-0.2, 0.3);

                if (baseMoods[i] > 1) {
                    baseMoods[i] = 1;
                } else if (baseMoods[i] < 0) {
                    baseMoods[i] = 0;
                }
            }

            cb(baseMoods);
        };
    }

    /**
     * Adds player to the free agents list.
     * 
     * This should be THE ONLY way that players are added to the free agents
     * list, because this will also calculate their demanded contract and mood.
     * 
     * @memberOf core.player
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on players readwrite; if null is passed, then a new transaction will be used.
     * @param {Object} p Player object.
     * @param {?number} phase An integer representing the game phase to consider this transaction under (defaults to g.phase if null).
     * @param {Array.<number>} baseMoods Vector of base moods for each team from 0 to 1, as generated by genBaseMoods.
     * @param {function()=} cb Optional callback.
     */
    function addToFreeAgents(ot, p, phase, baseMoods, cb) {
        var expiration, pr;

        phase = phase !== null ? phase : g.phase;

        pr = _.last(p.ratings);
        p = setContract(p, genContract(p), false);

        // Set initial player mood towards each team
        p.freeAgentMood = _.map(baseMoods, function (mood) {
            if (pr.ovr + pr.pot < 80) {
                // Bad players don't have the luxury to be choosy about teams
                return 0;
            }
            // The better a player is, the more moody he is
            return mood * (pr.ovr + pr.pot) / 100;
        });

        // During regular season, or before season starts, allow contracts for
        // just this year.
        if (g.phase > g.PHASE.AFTER_TRADE_DEADLINE) {
            p.contract.exp += 1;
        }

        p.tid = g.PLAYER.FREE_AGENT;

        p.ptModifier = 1; // Reset

        require("db").getObjectStore(ot, "players", "players").put(p);

        if (cb !== undefined) {
            cb();
        }
    }

    /**
     * Release player.
     * 
     * This keeps track of what the player's current team owes him, and then calls player.addToFreeAgents.
     * 
     * @memberOf core.player
     * @param {IDBTransaction} transaction An IndexedDB transaction on players, releasedPlayers, and teams, readwrite.
     * @param {Object} p Player object.
     * @param {function()} cb Callback function.
     */
    function release(transaction, p, cb) {
        // Keep track of player salary even when he's off the team
        transaction.objectStore("releasedPlayers").add({
            pid: p.pid,
            tid: p.tid,
            contract: p.contract
        });

        genBaseMoods(transaction, function (baseMoods) {
            addToFreeAgents(transaction, p, g.phase, baseMoods, cb);
        });
    }

    /**
     * Generate fuzz.
     *
     * Fuzz is random noise that is added to a player's displayed ratings, depending on the scouting budget.
     *
     * @memberOf core.player
     * @param {number} scoutingRank Between 1 and 30, the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
     * @return {number} Fuzz, between -5 and 5.
     */
    function genFuzz(scoutingRank) {
        var cutoff, fuzz, sigma;

        cutoff = 2 + 8 * (scoutingRank - 1) / 29;  // Max error is from 2 to 10, based on scouting rank
        sigma = 1 + 2 * (scoutingRank - 1) / 29;  // Stddev is from 1 to 3, based on scouting rank

        fuzz = random.gauss(0, sigma);
        if (fuzz > cutoff) {
            fuzz = cutoff;
        } else if (fuzz < -cutoff) {
            fuzz = -cutoff;
        }

        return fuzz;
    }

    /**
     * Generate initial ratings for a newly-created player.
     *
     * @param {string} profile [description]
     * @param {number} baseRating [description]
     * @param {number} pot [description]
     * @param {number} season [description]
     * @param {number} scoutingRank Between 1 and 30, the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
     * @return {Object} Ratings object
     */
    function genRatings(profile, baseRating, pot, season, scoutingRank) {
        var i, key, profileId, profiles, ratingKeys, ratings, rawRating, rawRatings, sigmas;

        if (profile === "Point") {
            profileId = 1;
        } else if (profile === "Wing") {
            profileId = 2;
        } else if (profile === "Big") {
            profileId = 3;
        } else {
            profileId = 0;
        }

        // Each row should sum to ~150
        profiles = [[10,  10,  10,  10,  10,  10,  10,  10,  10,  25,  10,  10,  10,  10,  10],  // Base 
                    [-30, -10, 40,  15,  0,   0,   0,   10,  15,  15,   0,   20,  40,  40,  0],   // Point Guard
                    [10,  10,  15,  15,  0,   0,   25,  15,  15,  20,   0,   10,  15,  0,   15],  // Wing
                    [45,  30,  -15, -15, -5,  30,  30,  -5,   -15, -20, 25,  -5,   -20, -20, 30]];  // Big
        sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
        baseRating = random.gauss(baseRating, 5);

        rawRatings = [];
        for (i = 0; i < sigmas.length; i++) {
            rawRating = profiles[profileId][i] + baseRating;
            rawRatings[i] = limitRating(random.gauss(rawRating, sigmas[i]));
        }

        ratings = {};
        ratingKeys = ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
        for (i = 0; i < ratingKeys.length; i++) {
            key = ratingKeys[i];
            ratings[key] = rawRatings[i];
        }

        // Ugly hack: Tall people can't dribble/pass very well
        if (ratings.hgt > 40) {
            ratings.drb = limitRating(ratings.drb - (ratings.hgt - 50));
            ratings.pss = limitRating(ratings.pss - (ratings.hgt - 50));
        } else {
            ratings.drb = limitRating(ratings.drb + 10);
            ratings.pss = limitRating(ratings.pss + 10);
        }

        ratings.season = season;
        ratings.ovr = ovr(ratings);
        ratings.pot = pot;

        ratings.skills = skills(ratings);

        ratings.fuzz = genFuzz(scoutingRank);

        return ratings;
    }

    function name(nationality) {
        var fn, fnRand, i, ln, lnRand;

        // First name
        fnRand = random.uniform(0, 90.04);
        for (i = 0; i < names.first.length; i++) {
            if (names.first[i][1] >= fnRand) {
                break;
            }
        }
        fn = names.first[i][0];


        // Last name
        lnRand = random.uniform(0, 77.48);
        for (i = 0; i < names.last.length; i++) {
            if (names.last[i][1] >= lnRand) {
                break;
            }
        }
        ln = names.last[i][0];

        return fn + " " + ln;
    }

    /**
     * Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings.
     * 
     * @memberOf core.player
     * @param {Object.<string, number>} ratings Ratings object.
     * @return {string} Position.
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

    /**
     * Add a new row of ratings to a player object.
     * 
     * There should be one ratings row for each year a player is not retired, and a new row should be added for each non-retired player at the start of a season.
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {number} scoutingRank Between 1 and 30, the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
     * @return {Object} Updated player object.
     */
    function addRatingsRow(p, scoutingRank) {
        var key, newRatings, r;

        newRatings = {};
        r = p.ratings.length - 1; // Most recent ratings
        for (key in p.ratings[r]) {
            if (p.ratings[r].hasOwnProperty(key)) {
                newRatings[key] = p.ratings[r][key];
            }
        }
        newRatings.season = g.season;
        newRatings.fuzz = (newRatings.fuzz + genFuzz(scoutingRank)) / 2;
        p.ratings.push(newRatings);

        return p;
    }

    /**
     * Add a new row of stats to a player object.
     * 
     * A row contains stats for unique values of (team, season, playoffs). So new rows need to be added when a player joins a new team, when a new season starts, or when a player's team makes the playoffs. The team ID in p.tid will be used in the stats row, so if a player is changing teams, update p.tid before calling this.
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
     * @return {Object} Updated player object.
     */
    function addStatsRow(p, playoffs) {
        playoffs = playoffs !== undefined ? playoffs : false;

        p.stats.push({season: g.season, tid: p.tid, playoffs: playoffs, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, per: 0, ewa: 0});
        p.statsTids.push(p.tid);
        p.statsTids = _.uniq(p.statsTids);

        return p;
    }

    function generate(tid, age, profile, baseRating, pot, draftYear, newLeague, scoutingRank) {
        var maxHgt, minHgt, maxWeight, minWeight, nationality, p;

        p = {}; // Will be saved to database
        p.tid = tid;
        p.statsTids = [];
        p.stats = [];
        if (tid >= 0) {
            // This only happens when generating random players for a new league, as otherwis tid would be negative (draft prospect)
            addStatsRow(p, false);
        }
        p.rosterOrder = 666;  // Will be set later
        p.ratings = [];
        if (newLeague) {
            // Create player for new league
            p.ratings.push(genRatings(profile, baseRating, pot, g.startingSeason, scoutingRank));
        } else {
            // Create player to be drafted
            p.ratings.push(genRatings(profile, baseRating, pot, draftYear, scoutingRank));
        }

        minHgt = 71;  // 5'11"
        maxHgt = 85;  // 7'1"
        minWeight = 150;
        maxWeight = 290;

        p.pos = pos(p.ratings[0]);  // Position (PG, SG, SF, PF, C, G, GF, FC)
        p.hgt = Math.round(random.randInt(-2, 2) + p.ratings[0].hgt * (maxHgt - minHgt) / 100 + minHgt);  // Height in inches (from minHgt to maxHgt)
        p.weight = Math.round(random.randInt(-20, 20) + (p.ratings[0].hgt + 0.5 * p.ratings[0].stre) * (maxWeight - minWeight) / 150 + minWeight);  // Weight in pounds (from minWeight to maxWeight)

        // Randomly choose nationality  
        nationality = 'USA';
        p.born = {
            year: g.season - age,
            loc: nationality
        };

        p.name = name(nationality);
        p.college = "";
        p.imgURL = ""; // Custom rosters can define player image URLs to be used rather than vector faces

        p.salaries = [];
        p = setContract(p, genContract(p), false);

        p.awards = [];

        p.freeAgentMood = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        p.yearsFreeAgent = 0;
        p.retiredYear = null;

        p.draft = {
            round: 0,
            pick: 0,
            tid: -1,
            abbrev: null,
            originalTid: -1,
            originalAbbrev: null,
            year: draftYear,
            teamName: null,
            teamRegion: null,
            pot: pot,
            ovr: p.ratings[0].ovr,
            skills: p.ratings[0].skills
        };

        p.face = faces.generate();
        p.injury = {type: "Healthy", gamesRemaining: 0};

        p.ptModifier = 1;

        p.hof = false;

        return p;
    }

    /**
     * Pick injury type and duration.
     *
     * This depends on core.data.injuries, health expenses, and randomness.
     *
     * @param {number} healthRank From 1-30, 1 if the player's team has the highest health spending this season and 30 if the player's team has the lowest.
     * @return {Object} Injury object (type and gamesRemaining)
     */
    function injury(healthRank) {
        var gamesRemaining, i, rand, type;

        rand = random.uniform(0, 10882);
        for (i = 0; i < injuries.cumSum.length; i++) {
            if (injuries.cumSum[i] >= rand) {
                break;
            }
        }
        return {
            type: injuries.types[i],
            gamesRemaining: Math.round(((healthRank - 1) / 29 + 0.5)  * random.uniform(0.25, 1.75) * injuries.gamesRemainings[i])
        };
    }

    /**
     * Filter a player object (or an array of player objects) by removing/combining/processing some components.
     *
     * This can be used to retrieve information about a certain season, compute average statistics from the raw data, etc.
     *
     * For a player object (p), create an object suitible for output based on the appropriate options, most notably a options.season and options.tid to find rows in of stats and ratings, and options.attributes, options.stats, and options.ratings to extract teh desired information. In the output, the attributes keys will be in the root of the object. There will also be stats and ratings properties containing filtered stats and ratings objects.
     * 
     * If options.season is undefined, then the stats and ratings objects will contain lists of objects for each season and options.tid is ignored. Then, there will also be a careerStats property in the output object containing an object with career averages.
     *
     * There are several more options (all described below) which can make things pretty complicated, but most of the time, they are not needed.
     * 
     * @memberOf core.player
     * @param {Object|Array.<Object>} p Player object or array of player objects to be filtered.
     * @param {Object} options Options, as described below.
     * @param {number=} options.season Season to retrieve stats/ratings for. If undefined, return stats/ratings for all seasons in a list as well as career totals in player.careerStats.
     * @param {number=} options.tid Team ID to retrieve stats for. This is useful in the case where a player played for multiple teams in a season. Eventually, there should be some way to specify whether the stats for multiple teams in a single season should be merged together or not. For now, if this is undefined, it just picks the first entry, which is clearly wrong.
     * @param {Array.<string>=} options.attrs List of player attributes to include in output.
     * @param {Array.<string>=} options.ratings List of player ratings to include in output.
     * @param {Array.<string>=} options.stats List of player stats to include in output.
     * @param {boolean=} options.totals Boolean representing whether to return total stats (true) or per-game averages (false); default is false.
     * @param {boolean=} options.playoffs Boolean representing whether to return playoff stats (statsPlayoffs and careerStatsPlayoffs) or not; default is false. Either way, regular season stats are always returned.
     * @param {boolean=} options.showNoStats When true, players are returned with zeroed stats objects even if they have accumulated no stats for a team (such as  players who were just traded for, free agents, etc.); this applies only for regular season stats. Even when this is true, undefined will still be returned if a season is requested from before they entered the league. To show draft prospects, options.showRookies is needed. Default is false, but if options.stats is empty, this is always true.
     * @param {boolean=} options.showRookies If true (default false), then rookies drafted in the current season (g.season) are shown if that season is requested. This is mainly so, after the draft, rookies can show up in the roster, player ratings view, etc. After the next season starts, then they will no longer show up in a request for that season since they didn't actually play that season.
     * @param {boolean=} options.fuzz When true (default false), noise is added to any returned ratings based on the fuzz variable for the given season (default: false); any user-facing rating should use true, any non-user-facing rating should use false.
     * @param {boolean=} options.oldStats When true (default false), stats from the previous season are displayed if there are no stats for the current season. This is currently only used for the free agents list, so it will either display stats from this season if they exist, or last season if they don't.
     * @param {number=} options.numGamesRemaining If the "cashOwed" attr is requested, options.numGamesRemaining is used to calculate how much of the current season's contract remains to be paid. This is used for buying out players.
     * @return {Object|Array.<Object>} Filtered player object or array of filtered player objects, depending on the first argument.
     */
    function filter(p, options) {
        var filterAttrs, filterRatings, filterStats, filterStatsPartial, fp, fps, gatherStats, i, returnOnePlayer;

        returnOnePlayer = false;
        if (!_.isArray(p)) {
            p = [p];
            returnOnePlayer = true;
        }

        options = options !== undefined ? options : {};
        options.season = options.season !== undefined ? options.season : null;
        options.tid = options.tid !== undefined ? options.tid : null;
        options.attrs = options.attrs !== undefined ? options.attrs : [];
        options.stats = options.stats !== undefined ? options.stats : [];
        options.ratings = options.ratings !== undefined ? options.ratings : [];
        options.totals = options.totals !== undefined ? options.totals : false;
        options.playoffs = options.playoffs !== undefined ? options.playoffs : false;
        options.showNoStats = options.showNoStats !== undefined ? options.showNoStats : false;
        options.showRookies = options.showRookies !== undefined ? options.showRookies : false;
        options.fuzz = options.fuzz !== undefined ? options.fuzz : false;
        options.oldStats = options.oldStats !== undefined ? options.oldStats : false;
        options.numGamesRemaining = options.numGamesRemaining !== undefined ? options.numGamesRemaining : 0;

        // If no stats are requested, force showNoStats to be true since the stats will never be checked otherwise.
        if (options.stats.length === 0) {
            options.showNoStats = true;
        }

        // Copys/filters the attributes listed in options.attrs from p to fp.
        filterAttrs = function (fp, p, options) {
            var award, awardsGroupedTemp, i;

            for (i = 0; i < options.attrs.length; i++) {
                if (options.attrs[i] === "age") {
                    fp.age = g.season - p.born.year;
                } else if (options.attrs[i] === "draft") {
                    fp.draft = p.draft;
                    fp.draft.age = p.draft.year - p.born.year;
                    if (options.fuzz) {
                        fp.draft.ovr =  Math.round(helpers.bound(fp.draft.ovr + p.ratings[0].fuzz, 0, 100));
                        fp.draft.pot =  Math.round(helpers.bound(fp.draft.pot + p.ratings[0].fuzz, 0, 100));
                    }
                } else if (options.attrs[i] === "hgtFt") {
                    fp.hgtFt = Math.floor(p.hgt / 12);
                } else if (options.attrs[i] === "hgtIn") {
                    fp.hgtIn = p.hgt - 12 * Math.floor(p.hgt / 12);
                } else if (options.attrs[i] === "contract") {
                    fp.contract = helpers.deepCopy(p.contract);  // [millions of dollars]
                    fp.contract.amount = fp.contract.amount / 1000;  // [millions of dollars]
                } else if (options.attrs[i] === "cashOwed") {
                    fp.cashOwed = ((1 + p.contract.exp - g.season) * p.contract.amount - (1 - options.numGamesRemaining / 82) * p.contract.amount) / 1000;  // [millions of dollars]
                } else if (options.attrs[i] === "abbrev") {
                    fp.abbrev = helpers.getAbbrev(p.tid);
                } else if (options.attrs[i] === "teamRegion") {
                    if (p.tid >= 0) {
                        fp.teamRegion = g.teamRegionsCache[p.tid];
                    } else {
                        fp.teamRegion = "";
                    }
                } else if (options.attrs[i] === "teamName") {
                    if (p.tid >= 0) {
                        fp.teamName = g.teamNamesCache[p.tid];
                    } else if (p.tid === g.PLAYER.FREE_AGENT) {
                        fp.teamName = "Free Agent";
                    } else if (p.tid === g.PLAYER.UNDRAFTED) {
                        fp.teamName = "Draft Prospect";
                    } else if (p.tid === g.PLAYER.RETIRED) {
                        fp.teamName = "Retired";
                    }
                } else if (options.attrs[i] === "injury" && options.season !== null && options.season < g.season) {
                    fp.injury = {type: "Healthy", gamesRemaining: 0};
                } else if (options.attrs[i] === "salaries") {
                    fp.salaries = _.map(p.salaries, function (salary) { salary.amount /= 1000; return salary; });
                } else if (options.attrs[i] === "salariesTotal") {
                    fp.salariesTotal = _.reduce(fp.salaries, function (memo, salary) { return memo + salary.amount; }, 0);
                } else if (options.attrs[i] === "value") {
                    fp.value = value(p);
                } else if (options.attrs[i] === "awardsGrouped") {
                    fp.awardsGrouped = [];
                    awardsGroupedTemp = _.groupBy(p.awards, function (award) { return award.type; });
                    for (award in awardsGroupedTemp) {
                        if (awardsGroupedTemp.hasOwnProperty(award)) {
                            fp.awardsGrouped.push({
                                type: award,
                                count: awardsGroupedTemp[award].length,
                                seasons: _.pluck(awardsGroupedTemp[award], "season")
                            });
                        }
                    }
                } else {
                    fp[options.attrs[i]] = p[options.attrs[i]];
                }
            }
        };

        // Copys/filters the ratings listed in options.ratings from p to fp.
        filterRatings = function (fp, p, options) {
            var hasStats, i, j, k, kk, pr, tidTemp;

            if (options.season !== null) {
                // One season
                pr = null;
                for (j = 0; j < p.ratings.length; j++) {
                    if (p.ratings[j].season === options.season) {
                        pr = p.ratings[j];
                        break;
                    }
                }
                if (pr === null) {
                    // Must be retired, or not in the league yet
                    return false;
                }

                if (options.ratings.length > 0) {
                    fp.ratings = {};
                    for (j = 0; j < options.ratings.length; j++) {
                        fp.ratings[options.ratings[j]] = pr[options.ratings[j]];
                        if (options.fuzz && options.ratings[j] !== "fuzz" && options.ratings[j] !== "season" && options.ratings[j] !== "skills" && options.ratings[j] !== "hgt") {
                            fp.ratings[options.ratings[j]] = Math.round(helpers.bound(fp.ratings[options.ratings[j]] + pr.fuzz, 0, 100));
                        }
                    }
                }
            } else {
                // All seasons
                fp.ratings = [];
                for (k = 0; k < p.ratings.length; k++) {
                    // If a specific tid was requested, only return ratings is a stat was accumulated for that tid
                    if (options.tid !== null) {
                        hasStats = false;
                        for (j = 0; j < p.stats.length; j++) {
                            if (options.tid === p.stats[j].tid && p.ratings[k].season === p.stats[j].season) {
                                hasStats = true;
                                break;
                            }
                        }
                        if (!hasStats) {
                            continue;
                        }
                    }

                    kk = fp.ratings.length; // Not always the same as k, due to hasStats filtering above
                    fp.ratings[kk] = {};
                    for (j = 0; j < options.ratings.length; j++) {
                        if (options.ratings[j] === "age") {
                            fp.ratings[kk].age = p.ratings[k].season - p.born.year;
                        } else if (options.ratings[j] === "abbrev") {
                            // Find the last stats entry for that season, and use that to determine the team
                            for (i = 0; i < p.stats.length; i++) {
                                if (p.stats[i].season === p.ratings[k].season && p.stats[i].playoffs === false) {
                                    tidTemp = p.stats[i].tid;
                                }
                            }
                            if (tidTemp >= 0) {
                                fp.ratings[kk].abbrev = helpers.getAbbrev(tidTemp);
                                tidTemp = undefined;
                            } else {
                                fp.ratings[kk].abbrev = null;
                            }
                        } else {
                            fp.ratings[kk][options.ratings[j]] = p.ratings[k][options.ratings[j]];
                            if (options.fuzz && options.ratings[j] !== "fuzz" && options.ratings[j] !== "season" && options.ratings[j] !== "skills" && options.ratings[j] !== "hgt") {
                                fp.ratings[kk][options.ratings[j]] = Math.round(helpers.bound(p.ratings[k][options.ratings[j]] + p.ratings[k].fuzz, 0, 100));
                            }
                        }
                    }
                }
            }

            return true;
        };

        // Returns stats object, containing properties "r" for regular season, "p" for playoffs, and "cr"/"cp" for career. "r" and "p" can be either objects (single season) or arrays of objects (multiple seasons). All these outputs are raw season totals, not per-game averages.
        gatherStats = function (p, options) {
            var ignoredKeys, j, key, ps;

            ps = {};

            if (options.stats.length > 0) {
                if (options.season !== null) {
                    // Single season
                    ps.r = {}; // Regular season
                    ps.p = {}; // Playoffs
                    if (options.tid !== null) {
                        // Get stats for a single team
                        for (j = 0; j < p.stats.length; j++) {
                            if (p.stats[j].season === options.season && p.stats[j].playoffs === false && p.stats[j].tid === options.tid) {
                                ps.r = p.stats[j];
                            }
                            if (options.playoffs && p.stats[j].season === options.season && p.stats[j].playoffs === true && p.stats[j].tid === options.tid) {
                                ps.p = p.stats[j];
                            }
                        }
                    } else {
                        // Get stats for all teams - eventually this should imply adding together multiple stats objects rather than just using the first?
                        for (j = 0; j < p.stats.length; j++) {
                            if (p.stats[j].season === options.season && p.stats[j].playoffs === false) {
                                ps.r = p.stats[j];
                            }
                            if (options.playoffs && p.stats[j].season === options.season && p.stats[j].playoffs === true) {
                                ps.p = p.stats[j];
                            }
                        }
                    }

                    // Load previous season if no stats this year and options.oldStats set
                    if (options.oldStats && _.isEmpty(ps.r)) {
                        for (j = 0; j < p.stats.length; j++) {
                            if (p.stats[j].season === g.season - 1 && p.stats[j].playoffs === false) {
                                ps.r = p.stats[j];
                            }
                            if (options.playoffs && p.stats[j].season === g.season - 1 && p.stats[j].playoffs === true) {
                                ps.p = p.stats[j];
                            }
                        }
                    }
                } else {
                    // Multiple seasons
                    ps.r = []; // Regular season
                    ps.p = []; // Playoffs
                    for (j = 0; j < p.stats.length; j++) {
                        // Save stats for the requested tid, or any tid if no tid was requested
                        if (options.tid === null || options.tid === p.stats[j].tid) {
                            if (p.stats[j].playoffs === false) {
                                ps.r.push(p.stats[j]);
                            } else if (options.playoffs) {
                                ps.p.push(p.stats[j]);
                            }
                        }
                    }

                    // Career totals
                    ps.cr = {}; // Regular season
                    ps.cp = {}; // Playoffs
                    if (ps.r.length > 0) {
                        // Aggregate annual stats and ignore other things
                        ignoredKeys = ["age", "playoffs", "season", "tid"];
                        for (key in ps.r[0]) {
                            if (ps.r[0].hasOwnProperty(key)) {
                                if (ignoredKeys.indexOf(key) < 0) {
                                    ps.cr[key] = _.reduce(_.pluck(ps.r, key), function (memo, num) { return memo + num; }, 0);
                                    if (options.playoffs) {
                                        ps.cp[key] = _.reduce(_.pluck(ps.p, key), function (memo, num) { return memo + num; }, 0);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return ps;
        };

        // Filters s by stats (which should be options.stats) and returns a filtered object. This is to do one season of stats filtering.
        filterStatsPartial = function (p, s, stats) {
            var j, row;

            row = {};

            if (!_.isEmpty(s) && s.gp > 0) {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "gp") {
                        row.gp = s.gp;
                    } else if (stats[j] === "gs") {
                        row.gs = s.gs;
                    } else if (stats[j] === "fgp") {
                        if (s.fga > 0) {
                            row.fgp = 100 * s.fg / s.fga;
                        } else {
                            row.fgp = 0;
                        }
                    } else if (stats[j] === "fgpAtRim") {
                        if (s.fgaAtRim > 0) {
                            row.fgpAtRim = 100 * s.fgAtRim / s.fgaAtRim;
                        } else {
                            row.fgpAtRim = 0;
                        }
                    } else if (stats[j] === "fgpLowPost") {
                        if (s.fgaLowPost > 0) {
                            row.fgpLowPost = 100 * s.fgLowPost / s.fgaLowPost;
                        } else {
                            row.fgpLowPost = 0;
                        }
                    } else if (stats[j] === "fgpMidRange") {
                        if (s.fgaMidRange > 0) {
                            row.fgpMidRange = 100 * s.fgMidRange / s.fgaMidRange;
                        } else {
                            row.fgpMidRange = 0;
                        }
                    } else if (stats[j] === "tpp") {
                        if (s.tpa > 0) {
                            row.tpp = 100 * s.tp / s.tpa;
                        } else {
                            row.tpp = 0;
                        }
                    } else if (stats[j] === "ftp") {
                        if (s.fta > 0) {
                            row.ftp = 100 * s.ft / s.fta;
                        } else {
                            row.ftp = 0;
                        }
                    } else if (stats[j] === "season") {
                        row.season = s.season;
                    } else if (stats[j] === "age") {
                        row.age = s.season - p.born.year;
                    } else if (stats[j] === "abbrev") {
                        row.abbrev = helpers.getAbbrev(s.tid);
                    } else if (stats[j] === "per") {
                        row.per = s.per;
                    } else if (stats[j] === "ewa") {
                        row.ewa = s.ewa;
                    } else {
                        if (options.totals) {
                            row[stats[j]] = s[stats[j]];
                        } else {
                            row[stats[j]] = s[stats[j]] / s.gp;
                        }
                    }
                }
            } else {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "season") {
                        row.season = s.season;
                    } else if (stats[j] === "age") {
                        row.age = s.season - p.born.year;
                    } else if (stats[j] === "abbrev") {
                        row.abbrev = helpers.getAbbrev(s.tid);
                    } else {
                        row[stats[j]] = 0;
                    }
                }
            }

            return row;
        };

        // Copys/filters the stats listed in options.stats from p to fp. If no stats are found for the supplied settings, then fp.stats remains undefined.
        filterStats = function (fp, p, options) {
            var i, ps;

            ps = gatherStats(p, options);

            // Always proceed for options.showRookies; proceed if we found some stats (checking for empty objects or lists); proceed if options.showNoStats
            if ((options.showRookies && p.draft.year === g.season && (options.season === g.season || options.season === null)) || (!_.isEmpty(ps) && !_.isEmpty(ps.r)) || (options.showNoStats && (options.season > p.draft.year || options.season === null))) {
                if (options.season === null && options.stats.length > 0) {
                    if (!_.isEmpty(ps) && !_.isEmpty(ps.r)) {
                        // Multiple seasons, only show if there is data
                        fp.stats = [];
                        for (i = 0; i < ps.r.length; i++) {
                            fp.stats.push(filterStatsPartial(p, ps.r[i], options.stats));
                        }
                        if (options.playoffs) {
                            fp.statsPlayoffs = [];
                            for (i = 0; i < ps.p.length; i++) {
                                fp.statsPlayoffs.push(filterStatsPartial(p, ps.p[i], options.stats));
                            }
                        }
                    }
                    // Career totals
                    fp.careerStats = filterStatsPartial(p, ps.cr, options.stats);
                    fp.careerStats.per = _.reduce(ps.r, function (memo, psr) { return memo + psr.per * psr.min; }, 0) / (fp.careerStats.min * fp.careerStats.gp); // Special case for PER - weight by minutes per season
                    if (isNaN(fp.careerStats.per)) { fp.careerStats.per = 0; }
                    fp.careerStats.ewa = _.reduce(ps.r, function (memo, psr) { if (!isNaN(psr.ewa)) { return memo + psr.ewa; } return memo; }, 0); // Special case for EWA - sum
                    if (options.playoffs) {
                        fp.careerStatsPlayoffs = filterStatsPartial(p, ps.cp, options.stats);
                        fp.careerStatsPlayoffs.per = _.reduce(ps.p, function (memo, psp) { return memo + psp.per * psp.min; }, 0) / (fp.careerStatsPlayoffs.min * fp.careerStatsPlayoffs.gp); // Special case for PER - weight by minutes per season
                        if (isNaN(fp.careerStatsPlayoffs.per)) { fp.careerStatsPlayoffs.per = 0; }
                        fp.careerStatsPlayoffs.ewa = _.reduce(ps.p, function (memo, psp) { if (!isNaN(psp.ewa)) { return memo + psp.ewa; } return memo; }, 0); // Special case for EWA - sum
                    }
                } else if (options.stats.length > 0) { // Return 0 stats if no entry and a single year was requested, unless no stats were explicitly requested
                    // Single seasons
                    fp.stats = filterStatsPartial(p, ps.r, options.stats);
                    if (options.playoffs) {
                        if (!_.isEmpty(ps.p)) {
                            fp.statsPlayoffs = filterStatsPartial(p, ps.p, options.stats);
                        } else {
                            fp.statsPlayoffs = {};
                        }
                    }
                }

                return true;
            }
            return false;
        };

        fps = []; // fps = "filtered players"
        for (i = 0; i < p.length; i++) {
            fp = {};

            // Only add a player if filterStats finds something (either stats that season, or options overriding that check)
            if (filterStats(fp, p[i], options)) {
                // Only add a player if he was active for this season and thus has ratings for this season
                if (filterRatings(fp, p[i], options)) {
                    // This can never fail because every player has attributes
                    filterAttrs(fp, p[i], options);

                    fps.push(fp);
                }
            }
        }

        // Return an array or single object, based on the input
        return returnOnePlayer ? fps[0] : fps;
    }

    /**
     * Is a player worthy of the Hall of Fame?
     *
     * This calculation is based on http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine except it uses PER-based estimates of wins added http://insider.espn.go.com/nba/hollinger/statistics (since PER is already calculated for each season) and it includes each playoff run as a separate season.
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @return {boolean} Hall of Fame worthy?
     */
    function madeHof(p) {
        var df, ewa, ewas, fudgeSeasons, i, mins, pers, prls, va;

        mins = _.pluck(p.stats, "min");
        pers = _.pluck(p.stats, "per");

        // Position Replacement Levels http://insider.espn.go.com/nba/hollinger/statistics
        prls = {
            PG: 11,
            G: 10.75,
            SG: 10.5,
            GF: 10.5,
            SF: 10.5,
            F: 11,
            PF: 11.5,
            FC: 11.05,
            C: 10.6
        };

        // Estimated wins added for each season http://insider.espn.go.com/nba/hollinger/statistics
        ewas = [];
        for (i = 0; i < mins.length; i++) {
            va = mins[i] * (pers[i] - prls[p.pos]) / 67;
            ewas.push(va / 30 * 0.8); // 0.8 is a fudge factor to approximate the difference between (in-game) EWA and (real) win shares
        }
//console.log(ewas)
//console.log(_.pluck(p.stats, "ewa"))

        // Calculate career EWA and "dominance factor" DF (top 5 years EWA - 50)
        ewas.sort(function (a, b) { return b - a; }); // Descending order
        ewa = 0;
        df = -50;
        for (i = 0; i < ewas.length; i++) {
            ewa += ewas[i];
            if (i < 5) {
                df += ewas[i];
            }
        }

        // Fudge factor for players generated when the league started
        fudgeSeasons = g.startingSeason - p.draft.year - 5;
        if (fudgeSeasons > 0) {
            ewa += ewas[0] * fudgeSeasons;
        }

        // Final formula
        if (ewa + df > 100) {
            return true;
        }

        return false;
    }

    /**
     * Returns a numeric value for a given player, representing is general worth to a typical team
     * (i.e. ignoring how well he fits in with his teammates and the team's strategy/finances). It
     * is similar in scale to the overall and potential ratings of players (0-100), but it is based
     * on stats in addition to ratings. The main components are:
     *
     * 1. Recent stats: Avg of last 2 seasons' PER if min > 2000. Otherwise, scale by min / 2000 and
     *     use ratings to estimate the rest.
     * 2. Potential for improvement (or risk for decline): Based on age and potential rating.
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @return {boolean} Value of the player, usually between 50 and 100 like overall and potential
     *     ratings.
     */
    function value(p) {
        var age, current, i, potential, pr, ps, ps1, ps2;

        // Current ratings
        pr = _.last(p.ratings);

        // Regular season stats ONLY, in order starting with most recent
        ps = [];
        for (i = 0; i < p.stats.length; i++) {
            if (!p.stats[i].playoffs) {
                ps.push(p.stats[i]);
            }
        }
        ps.reverse();

        // 1. Account for stats (and current ratings if not enough stats)
        current = 0;
        if (ps.length === 0) {
            // No stats at all? Just look at ratings more, then.
            current = pr.ovr;
        } else if (ps.length === 1) {
            // Only one year of stats
            current = 4 * ps[0].per;
            if (ps[0].min < 2000) {
                current = current * ps[0].min / 2000 + pr.ovr * (1 - ps[0].min / 2000);
            }
        } else {
            // Two most recent seasons
            ps1 = ps[0];
            ps2 = ps[1];
            if (ps1.min + ps2.min > 0) {
                current = 4 * (ps1.per * ps1.min + ps2.per * ps2.min) / (ps1.min + ps2.min);
            }
            if (ps1.min + ps2.min < 2000) {
                current = current * (ps1.min + ps2.min) / 2000 + pr.ovr * (1 - (ps1.min + ps2.min) / 2000);
            }
        }

        // 2. Potential
        potential = pr.pot;

        // If performance is already exceeding predicted potential, just use that
        if (current >= potential && age < 29) {
            return current;
        }

        // Otherwise, combine based on age
        age = g.season - p.born.year;
        if (age <= 19) {
            return 0.8 * potential + 0.2 * current;
        }
        if (age === 20) {
            return 0.7 * potential + 0.3 * current;
        }
        if (age === 21) {
            return 0.5 * potential + 0.5 * current;
        }
        if (age === 22) {
            return 0.3 * potential + 0.7 * current;
        }
        if (age === 23) {
            return 0.15 * potential + 0.85 * current;
        }
        if (age === 24) {
            return 0.1 * potential + 0.9 * current;
        }
        if (age === 25) {
            return 0.05 * potential + 0.95 * current;
        }
        if (age > 25 && age < 29) {
            return current;
        }
        if (age === 29) {
            return 0.975 * current;
        }
        if (age === 30) {
            return 0.95 * current;
        }
        if (age === 31) {
            return 0.9 * current;
        }
        if (age === 32) {
            return 0.85 * current;
        }
        if (age === 33) {
            return 0.8 * current;
        }
        if (age > 33) {
            return 0.7 * current;
        }
    }

    function regressRatingsPer() {
        // http://rosettacode.org/wiki/Multiple_regression#JavaScript
        function Matrix(ary) {
            this.mtx = ary;
            this.height = ary.length;
            this.width = ary[0].length;
        }

        Matrix.prototype.toString = function () {
            var i, s;

            s = [];
            for (i = 0; i < this.mtx.length; i++) {
                s.push(this.mtx[i].join(","));
            }
            return s.join("\n");
        };

        // returns a new matrix
        Matrix.prototype.transpose = function () {
            var i, j, transposed;

            transposed = [];
            for (i = 0; i < this.width; i++) {
                transposed[i] = [];
                for (j = 0; j < this.height; j++) {
                    transposed[i][j] = this.mtx[j][i];
                }
            }
            return new Matrix(transposed);
        };

        // returns a new matrix
        Matrix.prototype.mult = function (other) {
            var i, j, k, result, sum;

            if (this.width !== other.height) {
                throw "error: incompatible sizes";
            }

            result = [];
            for (i = 0; i < this.height; i++) {
                result[i] = [];
                for (j = 0; j < other.width; j++) {
                    sum = 0;
                    for (k = 0; k < this.width; k++) {
                        sum += this.mtx[i][k] * other.mtx[k][j];
                    }
                    result[i][j] = sum;
                }
            }
            return new Matrix(result);
        };

        // modifies the matrix in-place
        Matrix.prototype.toReducedRowEchelonForm = function () {
            var i, j, lead, r, tmp, val;

            lead = 0;
            for (r = 0; r < this.height; r++) {
                if (this.width <= lead) {
                    return;
                }
                i = r;
                while (this.mtx[i][lead] === 0) {
                    i++;
                    if (this.height === i) {
                        i = r;
                        lead++;
                        if (this.width === lead) {
                            return;
                        }
                    }
                }

                tmp = this.mtx[i];
                this.mtx[i] = this.mtx[r];
                this.mtx[r] = tmp;

                val = this.mtx[r][lead];
                for (j = 0; j < this.width; j++) {
                    this.mtx[r][j] /= val;
                }

                for (i = 0; i < this.height; i++) {
                    if (i !== r) {
                        val = this.mtx[i][lead];
                        for (j = 0; j < this.width; j++) {
                            this.mtx[i][j] -= val * this.mtx[r][j];
                        }
                    }
                }
                lead++;
            }
            return this;
        };

        function IdentityMatrix(n) {
            var i, j;

            this.height = n;
            this.width = n;
            this.mtx = [];
            for (i = 0; i < n; i++) {
                this.mtx[i] = [];
                for (j = 0; j < n; j++) {
                    this.mtx[i][j] = (i === j ? 1 : 0);
                }
            }
        }
        IdentityMatrix.prototype = Matrix.prototype;

        // modifies the matrix "in place"
        Matrix.prototype.inverse = function () {
            var i, I;

            if (this.height !== this.width) {
                throw "can't invert a non-square matrix";
            }

            I = new IdentityMatrix(this.height);
            for (i = 0; i < this.height; i++) {
                this.mtx[i] = this.mtx[i].concat(I.mtx[i]);
            }
            this.width *= 2;

            this.toReducedRowEchelonForm();

            for (i = 0; i < this.height; i++) {
                this.mtx[i].splice(0, this.height);
            }
            this.width /= 2;

            return this;
        };

        function ColumnVector(ary) {
            return new Matrix(ary.map(function (v) { return [v]; }));
        }
        ColumnVector.prototype = Matrix.prototype;

        Matrix.prototype.regression_coefficients = function (x) {
            var x_t;

            x_t = x.transpose();

            return x_t.mult(x).inverse().mult(x_t).mult(this);
        }

        g.dbl.transaction("players").objectStore("players").getAll().onsuccess = function (event) {
            var c, i, j, k, p, pers, players, ratings, ratingLabels, x, y;

            pers = [];
            ratings = [];

            players = player.filter(event.target.result, {
                ratings: ["season", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"],
                stats: ["season", "per", "min"],
                totals: true
            });

            for (i = 0; i < players.length; i++) {
                p = players[i];

                // Loop through seasons
                for (j = 0; j < p.ratings.length; j++) {
                    // Find stats entry to match ratings
                    for (k = 0; k < p.stats.length; k++) {
                        if (p.ratings[j].season === p.stats[k].season && !p.stats[k].playoffs) {
                            // Ignore anything under 500 minutes
                            if (p.stats[k].min > 500) {
                                pers.push(p.stats[k].per);
                                ratings.push([p.ratings[j].hgt, p.ratings[j].stre, p.ratings[j].spd, p.ratings[j].jmp, p.ratings[j].endu, p.ratings[j].ins, p.ratings[j].dnk, p.ratings[j].ft, p.ratings[j].fg, p.ratings[j].tp, p.ratings[j].blk, p.ratings[j].stl, p.ratings[j].drb, p.ratings[j].pss, p.ratings[j].reb]);
                            }
                        }
                    }
                }
            }

            x = new Matrix(ratings);
            y = new ColumnVector(pers);

            c = y.regression_coefficients(x);

            ratingLabels = ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
            for (i = 0; i < ratingLabels.length; i++) {
                console.log(ratingLabels[i] + ": " + c.mtx[i][0] * 100);
            }
        };
    }

    return {
        addRatingsRow: addRatingsRow,
        addStatsRow: addStatsRow,
        genBaseMoods: genBaseMoods,
        addToFreeAgents: addToFreeAgents,
        bonus: bonus,
        genContract: genContract,
        setContract: setContract,
        develop: develop,
        injury: injury,
        generate: generate,
        ovr: ovr,
        release: release,
        skills: skills,
        filter: filter,
        madeHof: madeHof,
        value: value,
        regressRatingsPer: regressRatingsPer
    };
});