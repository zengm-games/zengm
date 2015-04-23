/**
 * @name core.player
 * @namespace Functions operating on player objects, parts of player objects, or arrays of player objects.
 */
define(["dao", "globals", "core/finances", "data/injuries", "data/names", "lib/bluebird", "lib/faces", "lib/underscore", "util/eventLog", "util/helpers", "util/random"], function (dao, g, finances, injuries, names, Promise, faces, _, eventLog, helpers, random) {
    "use strict";

    var playerNames;

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

    function fuzzRating(rating, fuzz) {
        // Turn off fuzz in multi team mode, because it doesn't have any meaning there in its current form
        if (g.userTids.length > 1) {
            fuzz = 0;
        }

        return Math.round(helpers.bound(rating + fuzz, 0, 100));
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
            var denominator, i, numerator, rating;

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
                rating = components[i] === 'hgt' ? ratings[components[i]] : fuzzRating(ratings[components[i]], ratings.fuzz); // don't fuzz height
                numerator += rating * weights[i];
                denominator += 100 * weights[i];
            }

            if (numerator / denominator > 0.75) {
                return true;
            }
            return false;
        };

        // These use the same formulas as the composite rating definitions in core.game!
        if (hasSkill(ratings, g.compositeWeights.shootingThreePointer.ratings, g.compositeWeights.shootingThreePointer.weights)) {
            sk.push("3");
        }
        if (hasSkill(ratings, g.compositeWeights.athleticism.ratings, g.compositeWeights.athleticism.weights)) {
            sk.push("A");
        }
        if (hasSkill(ratings, g.compositeWeights.dribbling.ratings)) {
            sk.push("B");
        }
        if (hasSkill(ratings, g.compositeWeights.defenseInterior.ratings, g.compositeWeights.defenseInterior.weights)) {
            sk.push("Di");
        }
        if (hasSkill(ratings, g.compositeWeights.defensePerimeter.ratings, g.compositeWeights.defensePerimeter.weights)) {
            sk.push("Dp");
        }
        if (hasSkill(ratings, g.compositeWeights.shootingLowPost.ratings, g.compositeWeights.shootingLowPost.weights)) {
            sk.push("Po");
        }
        if (hasSkill(ratings, g.compositeWeights.passing.ratings, g.compositeWeights.passing.weights)) {
            sk.push("Ps");
        }
        if (hasSkill(ratings, g.compositeWeights.rebounding.ratings, g.compositeWeights.rebounding.weights)) {
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
    function genContract(p, randomizeExp, randomizeAmount, noLimit) {
        var amount, expiration, maxAmount, minAmount, potentialDifference, ratings, years;

        ratings = _.last(p.ratings);

        randomizeExp = randomizeExp !== undefined ? randomizeExp : false;
        randomizeAmount = randomizeAmount !== undefined ? randomizeAmount : true;
        noLimit = noLimit !== undefined ? noLimit : false;

        // Limits on yearly contract amount, in $1000's
        minAmount = 500;
        maxAmount = 20000;

        // Scale proportional to (ovr*2 + pot)*0.5 120-210
        //amount = ((3 * p.value) * 0.85 - 110) / (210 - 120);  // Scale from 0 to 1 (approx)
        //amount = amount * (maxAmount - minAmount) + minAmount;
        amount = ((p.value - 1) / 100 - 0.45) * 3.3 * (maxAmount - minAmount) + minAmount;
        if (randomizeAmount) {
            amount *= helpers.bound(random.realGauss(1, 0.1), 0, 2);  // Randomize
        }

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

        if (!noLimit) {
            if (amount < minAmount * 1.1) {
                amount = minAmount;
            } else if (amount > maxAmount) {
                amount = maxAmount;
            }
        } else {
            // Well, at least keep it positive
            if (amount < 0) {
                amount = 0;
            }
        }

        amount = 50 * Math.round(amount / 50);  // Make it a multiple of 50k

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
     * Make sure to call player.updateValues after this! Otherwise, player values will be out of sync.
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {number=} years Number of years to develop (default 1).
     * @param {boolean=} generate Generating a new player? (default false). If true, then the player's age is also updated based on years.
     * @param {number=} coachingRank From 1 to g.numTeams (default 30), where 1 is best coaching staff and g.numTeams is worst. Default is 15.5
     * @return {Object} Updated player object.
     */
    function develop(p, years, generate, coachingRank) {
        var age, baseChange, baseChangeLocal, calcBaseChange, i, j, r, ratingKeys;

        years = years !== undefined ? years : 1;
        generate = generate !== undefined ? generate : false;
        coachingRank = coachingRank !== undefined ? coachingRank : 15.5; // This applies to free agents!

        r = p.ratings.length - 1;

        age = g.season - p.born.year;

        calcBaseChange = function (age, potentialDifference) {
            var val;

            // Average rating change if there is no potential difference
            if (age <= 21) {
                val = 0;
            } else if (age <= 25) {
                val = 0;
            } else if (age <= 29) {
                val = -1;
            } else if (age <= 31) {
                val = -2;
            } else {
                val = -3;
            }

            // Factor in potential difference
            // This only matters for young players who have potentialDifference != 0
            if (age <= 21) {
                if (Math.random() < 0.75) {
                    val += potentialDifference * random.uniform(0.2, 0.9);
                } else {
                    val += potentialDifference * random.uniform(0.1, 0.3);
                }
            } else if (age <= 25) {
                if (Math.random() < 0.25) {
                    val += potentialDifference * random.uniform(0.2, 0.9);
                } else {
                    val += potentialDifference * random.uniform(0.1, 0.3);
                }
            } else {
                val += potentialDifference * random.uniform(0, 0.1);
            }

            // Noise
            if (age <= 25) {
                val += helpers.bound(random.realGauss(0, 5), -4, 10);
            } else {
                val += helpers.bound(random.realGauss(0, 3), -2, 10);
            }

            return val;
        };

        for (i = 0; i < years; i++) {
            age += 1;

            // Randomly make a big jump
            if (Math.random() > 0.985 && age <= 23) {
                p.ratings[r].pot += random.uniform(5, 25);
            }

            // Randomly regress
            if (Math.random() > 0.995 && age <= 23) {
                p.ratings[r].pot -= random.uniform(5, 25);
            }

            baseChange = calcBaseChange(age, p.ratings[r].pot - p.ratings[r].ovr);

            // Modulate by coaching
            if (baseChange >= 0) { // life is normal
                baseChange *= ((coachingRank - 1) * (-0.5) / (g.numTeams - 1) + 1.25);
            } else {
                baseChange *= ((coachingRank - 1) * (0.5) / (g.numTeams - 1) + 0.75);
            }

            // Ratings that can only increase a little, and only when young. Decrease when old.
            ratingKeys = ["spd", "jmp", "endu"];
            for (j = 0; j < ratingKeys.length; j++) {
                if (age <= 24) {
                    baseChangeLocal = baseChange;
                } else if (age <= 30) {
                    baseChangeLocal = baseChange - 1;
                } else {
                    baseChangeLocal = baseChange - 2.5;
                }
                p.ratings[r][ratingKeys[j]] = limitRating(p.ratings[r][ratingKeys[j]] + helpers.bound(baseChangeLocal * random.uniform(0.5, 1.5), -20, 10));
            }

            // Ratings that can only increase a little, and only when young. Decrease slowly when old.
            ratingKeys = ["drb", "pss", "reb"];
            for (j = 0; j < ratingKeys.length; j++) {
                p.ratings[r][ratingKeys[j]] = limitRating(p.ratings[r][ratingKeys[j]] + helpers.bound(baseChange * random.uniform(0.5, 1.5), -1, 10));
            }

            // Ratings that can increase a lot, but only when young. Decrease when old.
            ratingKeys = ["stre", "dnk", "blk", "stl"];
            for (j = 0; j < ratingKeys.length; j++) {
                p.ratings[r][ratingKeys[j]] = limitRating(p.ratings[r][ratingKeys[j]] + baseChange * random.uniform(0.5, 1.5));
            }

            // Ratings that increase most when young, but can continue increasing for a while and only decrease very slowly.
            ratingKeys = ["ins", "ft", "fg", "tp"];
            for (j = 0; j < ratingKeys.length; j++) {
                if (age <= 24) {
                    baseChangeLocal = baseChange;
                } else if (age <= 30) {
                    baseChangeLocal = baseChange + 1;
                } else {
                    baseChangeLocal = baseChange + 2.5;
                }
                p.ratings[r][ratingKeys[j]] = limitRating(p.ratings[r][ratingKeys[j]] + baseChangeLocal * random.uniform(0.5, 1.5));
            }

//console.log([age, p.ratings[r].pot - p.ratings[r].ovr, ovr(p.ratings[r]) - p.ratings[r].ovr])
            // Update overall and potential
            p.ratings[r].ovr = ovr(p.ratings[r]);
            p.ratings[r].pot += -2 + Math.round(random.realGauss(0, 2));
            if (p.ratings[r].ovr > p.ratings[r].pot || age > 28) {
                p.ratings[r].pot = p.ratings[r].ovr;
            }
        }

        // If this isn't here outside the loop, then 19 year old players could still have ovr > pot
        if (p.ratings[r].ovr > p.ratings[r].pot || age > 28) {
            p.ratings[r].pot = p.ratings[r].ovr;
        }

        // Likewise, If this isn't outside the loop, then 19 year old players don't get skills
        p.ratings[r].skills = skills(p.ratings[r]);

        if (generate) {
            age = g.season - p.born.year + years;
            p.born.year = g.season - age;
        }

        return p;
    }

    /**
     * Add or subtract amount from all current ratings and update the player's contract appropriately.
     *
     * This should only be called when generating players for a new league. Otherwise, develop should be used. Also, make sure you call player.updateValues and player.setContract after this, because ratings are changed!
     *
     * @memberOf core.player
     * @param {Object} p Player object.
     * @param {number} amount Number to be added to each rating (can be negative).
     * @return {Object} Updated player object.
     */
    function bonus(p, amount) {
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

        p.ratings[r].skills = skills(p.ratings[r]);

        return p;
    }

    /**
     * Calculates the base "mood" factor for any free agent towards a team.
     *
     * This base mood is then modulated for an individual player in addToFreeAgents.
     *
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on teams; if null is passed, then a new transaction will be used.
     * @return {Promise} Array of base moods, one for each team.
     */
    function genBaseMoods(ot) {
        return dao.teams.getAll({ot: ot}).then(function (teams) {
            var baseMoods, i, s;

            baseMoods = [];

            s = teams[0].seasons.length - 1;  // Most recent season index

            for (i = 0; i < teams.length; i++) {
                // Special case for winning a title - basically never refuse to re-sign unless a miracle occurs
                if (teams[i].seasons[s].playoffRoundsWon === 4 && Math.random() < 0.99) {
                    baseMoods[i] = -0.25; // Should guarantee no refusing to re-sign
                } else {
                    baseMoods[i] = 0;

                    // Hype
                    baseMoods[i] += 0.5 * (1 - teams[i].seasons[s].hype);

                    // Facilities
                    baseMoods[i] += 0.1 * (finances.getRankLastThree(teams[i], "expenses", "facilities") - 1) / (g.numTeams - 1);

                    // Population
                    baseMoods[i] += 0.2 * (1 - teams[i].seasons[s].pop / 10);

                    // Randomness
                    baseMoods[i] += random.uniform(-0.2, 0.2);

                    baseMoods[i] = helpers.bound(baseMoods[i], 0, 1);
                }
            }

            return baseMoods;
        });
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
     * @return {Promise}
     */
    function addToFreeAgents(ot, p, phase, baseMoods) {
        var pr;

        phase = phase !== null ? phase : g.phase;

        pr = _.last(p.ratings);
        p = setContract(p, genContract(p), false);

        // Set initial player mood towards each team
        p.freeAgentMood = _.map(baseMoods, function (mood) {
            if (pr.ovr + pr.pot < 80) {
                // Bad players don't have the luxury to be choosy about teams
                return 0;
            }
            if (phase === g.PHASE.RESIGN_PLAYERS) {
                // More likely to re-sign your own players
                return helpers.bound(mood + random.uniform(-1, 0.5), 0, 1000);
            }
            return helpers.bound(mood + random.uniform(-1, 1.5), 0, 1000);
        });

        // During regular season, or before season starts, allow contracts for
        // just this year.
        if (phase > g.PHASE.AFTER_TRADE_DEADLINE) {
            p.contract.exp += 1;
        }

        p.tid = g.PLAYER.FREE_AGENT;

        p.ptModifier = 1; // Reset

        // The put doesn't always work in Chrome. No idea why.
        return dao.players.put({ot: ot, value: p}).then(function () {
            return; // No output
        });
    }

    /**
     * Release player.
     *
     * This keeps track of what the player's current team owes him, and then calls player.addToFreeAgents.
     *
     * @memberOf core.player
     * @param {IDBTransaction} tx An IndexedDB transaction on players, releasedPlayers, and teams, readwrite.
     * @param {Object} p Player object.
     * @param {boolean} justDrafted True if the player was just drafted by his current team and the regular season hasn't started yet. False otherwise. If True, then the player can be released without paying his salary.
     * @return {Promise}
     */
    function release(tx, p, justDrafted) {
        // Keep track of player salary even when he's off the team, but make an exception for players who were just drafted
        // Was the player just drafted?
        if (!justDrafted) {
            dao.releasedPlayers.add({
                ot: tx,
                value: {
                    pid: p.pid,
                    tid: p.tid,
                    contract: p.contract
                }
            });
        }

        eventLog.add(null, {
            type: "release",
            text: 'The <a href="' + helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season]) + '">' + g.teamNamesCache[p.tid] + '</a> released <a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>.',
            showNotification: false,
            pids: [p.pid],
            tids: [p.tid]
        });

        return genBaseMoods(tx).then(function (baseMoods) {
            return addToFreeAgents(tx, p, g.phase, baseMoods);
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

        cutoff = 2 + 8 * (scoutingRank - 1) / (g.numTeams - 1);  // Max error is from 2 to 10, based on scouting rank
        sigma = 1 + 2 * (scoutingRank - 1) / (g.numTeams - 1);  // Stddev is from 1 to 3, based on scouting rank

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
     * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
     * @param {number} tid [description]
     * @return {Object} Ratings object
     */
    function genRatings(profile, baseRating, pot, season, scoutingRank, tid) {
        var i, j, key, profileId, profiles, ratingKeys, ratings, rawRating, rawRatings, sigmas;

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
        profiles = [[10, 10, 10, 10, 10, 10, 10, 10, 10, 25, 10, 10, 10, 10, 10], // Base
                    [-30, -10, 40, 20, 15, 0, 0, 10, 15, 25, 0, 30, 20, 20, 0], // Point Guard
                    [10, 10, 15, 15, 0, 0, 25, 15, 15, 20, 0, 10, 15, 0, 15], // Wing
                    [45, 30, -15, -15, -5, 30, 30, -5, -15, -25, 30, -5, -20, -20, 30]]; // Big
        sigmas = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
        baseRating = random.gauss(baseRating, 5);

        rawRatings = [];
        for (i = 0; i < sigmas.length; i++) {
            rawRating = profiles[profileId][i] + baseRating;
            rawRatings[i] = limitRating(random.gauss(rawRating, sigmas[i]));
        }

        // Small chance of freakish ability in 2 categories
        for (i = 0; i < 2; i++) {
            if (Math.random() < 0.2) {
                // Randomly pick a non-height rating to improve
                j = random.randInt(1, 14);
                rawRatings[j] = limitRating(rawRatings[j] + 50);
            }
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

        ratings.fuzz = genFuzz(scoutingRank);

        if (tid === g.PLAYER.UNDRAFTED_2) {
            ratings.fuzz *= 2;
        } else if (tid === g.PLAYER.UNDRAFTED_3) {
            ratings.fuzz *= 4;
        }

        ratings.skills = skills(ratings);

        return ratings;
    }

    function name() {
        var fn, fnRand, i, ln, lnRand;

        if (!playerNames) {
            // This makes it wait until g is loaded before calling names.load, so user-defined names will be used if provided
            playerNames = names.load();
        }

        // First name
        fnRand = random.uniform(0, playerNames.first[playerNames.first.length - 1][1]);
        for (i = 0; i < playerNames.first.length; i++) {
            if (playerNames.first[i][1] >= fnRand) {
                break;
            }
        }
        fn = playerNames.first[i][0];

        // Last name
        lnRand = random.uniform(0, playerNames.last[playerNames.last.length - 1][1]);
        for (i = 0; i < playerNames.last.length; i++) {
            if (playerNames.last[i][1] >= lnRand) {
                break;
            }
        }
        ln = playerNames.last[i][0];

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
            // This means that anyone with c=true and height >=70 will NOT be labeled just a C. only pure Cs are short guys!
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
     * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
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
     * Add a new row of stats to the playerStats database.
     *
     * A row contains stats for unique values of (pid, team, season, playoffs). So new rows need to be added when a player joins a new team, when a new season starts, or when a player's team makes the playoffs. The team ID in p.tid and player ID in p.pid will be used in the stats row, so if a player is changing teams, update p.tid before calling this.
     *
     * The return value is the player object with an updated statsTids as its argument. This is NOT written to the database within addStatsRow because it is often updated in several different ways before being written. Only the entry to playerStats is actually written to the databse by this function (which happens asynchronously). You probably want to write the updated player object to the database soon after calling this, in the same transaction.
     *
     * @memberOf core.player
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on playerStats readwrite; if null is passed, then a new transaction will be used.
     * @param {Object} p Player object.
     * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
     * @return {Object} Updated player object.
     */
    function addStatsRow(ot, p, playoffs) {
        var ps, statsRow, stopOnSeason;

        playoffs = playoffs !== undefined ? playoffs : false;

        statsRow = {pid: p.pid, season: g.season, tid: p.tid, playoffs: playoffs, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, per: 0, ewa: 0, yearsWithTeam: 1};

        p.statsTids.push(p.tid);
        p.statsTids = _.uniq(p.statsTids);

        // Calculate yearsWithTeam
        // Iterate over player stats objects, most recent first
        ps = [];
        Promise.try(function () {
            if (!playoffs) {
                // Because the "pid, season, tid" index does not order by psid, the first time we see a tid !== p.tid could
                // be the same season a player was traded to that team, and there still could be one more with tid ===
                // p.tid. So when we se tid !== p.tid, set stopOnSeason to the previous (next... I mean lower) season so we
                // can stop storing stats when it's totally safe.
                stopOnSeason = 0;

                return dao.playerStats.iterate({
                    ot: ot,
                    index: "pid, season, tid",
                    key: IDBKeyRange.bound([p.pid, 0], [p.pid, g.season + 1]),
                    direction: "prev",
                    callback: function (psTemp, shortCircuit) {
                        // Skip playoff stats
                        if (psTemp.playoffs) {
                            return;
                        }

                        // Continue only if we haven't hit a season with another team yet
                        if (psTemp.season === stopOnSeason) {
                            shortCircuit();
                        } else {
                            if (psTemp.tid !== p.tid) {
                                // Hit another team! Stop after this season is exhausted
                                stopOnSeason = psTemp.season - 1;
                            }

                            // Store stats
                            ps.push(psTemp);
                        }
                    }
                });
            }
        }).then(function () {
            var i;

            ps = ps.sort(function (a, b) {
                // Sort seasons in descending order. This is necessary because otherwise the index will cause ordering to be by tid within a season, which is probably not what is ever wanted.
                return b.psid - a.psid;
            });

            // Count non-playoff seasons starting from the current one
            for (i = 0; i < ps.length; i++) {
                if (ps[i].tid === p.tid) {
                    statsRow.yearsWithTeam += 1;
                } else {
                    break;
                }

                // Is this a complete duplicate entry? If so, not needed. This can happen e.g. in fantasy draft
                // This is not quite a unique constraint because if a player is traded away from a team then back again, this check won't be reached because of the "break" above. That's fine. It shows the stints separately, which is probably best.
                if (ps[i].pid === statsRow.pid && ps[i].season === statsRow.season && ps[i].tid === statsRow.tid && ps[i].playoffs === statsRow.playoffs) {
                    return;
                }
            }

            dao.playerStats.add({ot: ot, value: statsRow});
        });

        return p;
    }

    function generate(tid, age, profile, baseRating, pot, draftYear, newLeague, scoutingRank) {
        var maxHgt, maxWeight, minHgt, minWeight, nationality, p;

        p = {}; // Will be saved to database
        p.tid = tid;
        p.statsTids = [];
        p.rosterOrder = 666;  // Will be set later
        p.ratings = [];

        if (newLeague) {
            // Create player for new league
            p.ratings.push(genRatings(profile, baseRating, pot, g.startingSeason, scoutingRank, tid));
        } else {
            // Create player to be drafted
            p.ratings.push(genRatings(profile, baseRating, pot, draftYear, scoutingRank, tid));
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

        p.awards = [];

        p.freeAgentMood = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        p.yearsFreeAgent = 0;
        p.retiredYear = null;

        p.draft = {
            round: 0,
            pick: 0,
            tid: -1,
            originalTid: -1,
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
        p.watch = false;
        p.gamesUntilTradable = 0;

        // These should be set by player.updateValues after player is completely done (automatic in player.develop)
        p.value = 0;
        p.valueNoPot = 0;
        p.valueFuzz = 0;
        p.valueNoPotFuzz = 0;
        p.valueWithContract = 0;

        // Must be after value*s are set, because genContract depends on them
        p.salaries = [];
        p = setContract(p, genContract(p), false);

        return p;
    }

    /**
     * Pick injury type and duration.
     *
     * This depends on core.data.injuries, health expenses, and randomness.
     *
     * @param {number} healthRank Between 1 and g.numTeams (default 30), 1 if the player's team has the highest health spending this season and g.numTeams if the player's team has the lowest.
     * @return {Object} Injury object (type and gamesRemaining)
     */
    function injury(healthRank) {
        var i, rand;

        rand = random.uniform(0, 10882);
        for (i = 0; i < injuries.cumSum.length; i++) {
            if (injuries.cumSum[i] >= rand) {
                break;
            }
        }
        return {
            type: injuries.types[i],
            gamesRemaining: Math.round((0.7 * (healthRank - 1) / (g.numTeams - 1) + 0.65) * random.uniform(0.25, 1.75) * injuries.gamesRemainings[i])
        };
    }

    /**
     * How many seasons are left on this contract? The answer can be a fraction if the season is partially over
     *
     * @memberOf core.player
     * @param {Object} exp Contract expiration year.
     * @return {number} numGamesRemaining Number of games remaining in the current season (0 to 82).
     */
    function contractSeasonsRemaining(exp, numGamesRemaining) {
        return (exp - g.season) + numGamesRemaining / 82;
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
     * @param {boolean=} options.showRookies If true (default false), then future draft prospects and rookies drafted in the current season (g.season) are shown if that season is requested. This is mainly so, after the draft, rookies can show up in the roster, player ratings view, etc; and also so prospects can be shown in the watch list. After the next season starts, then they will no longer show up in a request for that season since they didn't actually play that season.
     * @param {boolean=} options.showRetired If true (default false), then players with no ratings for the current season are still returned, with either 0 for every rating and a blank array for skills (retired players) or future ratings (draft prospects). This is currently only used for the watch list, so retired players (and future draft prospects!) can still be watched.
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
        options.showRetired = options.showRetired !== undefined ? options.showRetired : false;
        options.fuzz = options.fuzz !== undefined ? options.fuzz : false;
        options.oldStats = options.oldStats !== undefined ? options.oldStats : false;
        options.numGamesRemaining = options.numGamesRemaining !== undefined ? options.numGamesRemaining : 0;
        options.per36 = options.per36 !== undefined ? options.per36 : false;

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
                } else if (options.attrs[i] === "diedYear") {
                    // Non-dead players wil not have any diedYear property
                    fp.diedYear = p.hasOwnProperty("diedYear") ? p.diedYear : null;
                } else if (options.attrs[i] === "draft") {
                    fp.draft = p.draft;
                    fp.draft.age = p.draft.year - p.born.year;
                    if (options.fuzz) {
                        fp.draft.ovr = fuzzRating(fp.draft.ovr, p.ratings[0].fuzz);
                        fp.draft.pot = fuzzRating(fp.draft.pot, p.ratings[0].fuzz);
                    }
                    // Inject abbrevs
                    fp.draft.abbrev = g.teamAbbrevsCache[fp.draft.tid];
                    fp.draft.originalAbbrev = g.teamAbbrevsCache[fp.draft.originalTid];
                } else if (options.attrs[i] === "hgtFt") {
                    fp.hgtFt = Math.floor(p.hgt / 12);
                } else if (options.attrs[i] === "hgtIn") {
                    fp.hgtIn = p.hgt - 12 * Math.floor(p.hgt / 12);
                } else if (options.attrs[i] === "contract") {
                    fp.contract = helpers.deepCopy(p.contract);  // [millions of dollars]
                    fp.contract.amount = fp.contract.amount / 1000;  // [millions of dollars]
                } else if (options.attrs[i] === "cashOwed") {
                    fp.cashOwed = contractSeasonsRemaining(p.contract.exp, options.numGamesRemaining) * p.contract.amount / 1000;  // [millions of dollars]
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
                    } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3 || p.tid === g.PLAYER.UNDRAFTED_FANTASY_TEMP) {
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
            var cat, hasStats, i, j, k, kk, pr, tidTemp;

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
                    if (options.showRetired && p.tid === g.PLAYER.RETIRED) {
                        // If forcing to show retired players, blank it out
                        fp.ratings = {};
                        for (k = 0; k < options.ratings.length; k++) {
                            if (options.ratings[k] === "skills") {
                                fp.ratings[options.ratings[k]] = [];
                            } else {
                                fp.ratings[options.ratings[k]] = 0;
                            }
                        }
                        return true;
                    } else if (options.showRetired && (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3)) {
                        // What not show draft prospects too? Just for fun.
                        pr = p.ratings[0]; // Only has one entry
                    } else {
                        return false;
                    }
                }

                if (options.ratings.length > 0) {
                    fp.ratings = {};
                    for (k = 0; k < options.ratings.length; k++) {
                        fp.ratings[options.ratings[k]] = pr[options.ratings[k]];
                        if (options.ratings[k] === "dovr" || options.ratings[k] === "dpot") {
                            // Handle dovr and dpot - if there are previous ratings, calculate the fuzzed difference
                            cat = options.ratings[k].slice(1); // either ovr or pot
                            if (j > 0) {
                                fp.ratings[options.ratings[k]] = fuzzRating(p.ratings[j][cat], p.ratings[j].fuzz) - fuzzRating(p.ratings[j - 1][cat], p.ratings[j - 1].fuzz);
                            } else {
                                fp.ratings[options.ratings[k]] = 0;
                            }
                        } else if (options.fuzz && options.ratings[k] !== "fuzz" && options.ratings[k] !== "season" && options.ratings[k] !== "skills" && options.ratings[k] !== "hgt") {
                            fp.ratings[options.ratings[k]] = fuzzRating(fp.ratings[options.ratings[k]], pr.fuzz);
                        }
                    }
                }
            } else {
                // All seasons
                fp.ratings = [];
                for (k = 0; k < p.ratings.length; k++) {
                    // If a specific tid was requested, only return ratings if a stat was accumulated for that tid
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
                                fp.ratings[kk][options.ratings[j]] = fuzzRating(p.ratings[k][options.ratings[j]], p.ratings[k].fuzz);
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
                    } else if (stats[j] === "tid") {
                        row.tid = s.tid;
                    } else if (stats[j] === "per") {
                        row.per = s.per;
                    } else if (stats[j] === "ewa") {
                        row.ewa = s.ewa;
                    } else if (stats[j] === "yearsWithTeam") {
                        row.yearsWithTeam = s.yearsWithTeam;
                    } else {
                        if (options.totals) {
                            row[stats[j]] = s[stats[j]];
                        } else if (options.per36 && stats[j] !== "min") { // Don't scale min by 36 minutes
                            row[stats[j]] = s[stats[j]] * 36 / s.min;
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
                    } else if (stats[j] === "yearsWithTeam" && !_.isEmpty(s)) {
                        // Everyone but players acquired in the offseason should be here
                        row.yearsWithTeam = s.yearsWithTeam;
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
            if ((options.showRookies && p.draft.year >= g.season && (options.season === g.season || options.season === null)) || (!_.isEmpty(ps) && !_.isEmpty(ps.r)) || (options.showNoStats && (options.season > p.draft.year || options.season === null))) {
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
                    // Special case for PER - weight by minutes per season
                    if (options.totals) {
                        fp.careerStats.per = _.reduce(ps.r, function (memo, psr) { return memo + psr.per * psr.min; }, 0) / (fp.careerStats.min);
                    } else {
                        fp.careerStats.per = _.reduce(ps.r, function (memo, psr) { return memo + psr.per * psr.min; }, 0) / (fp.careerStats.min * fp.careerStats.gp);
                    }
                    if (isNaN(fp.careerStats.per)) { fp.careerStats.per = 0; }
                    fp.careerStats.ewa = _.reduce(ps.r, function (memo, psr) { return memo + psr.ewa; }, 0); // Special case for EWA - sum
                    if (options.playoffs) {
                        fp.careerStatsPlayoffs = filterStatsPartial(p, ps.cp, options.stats);
                        fp.careerStatsPlayoffs.per = _.reduce(ps.p, function (memo, psp) { return memo + psp.per * psp.min; }, 0) / (fp.careerStatsPlayoffs.min * fp.careerStatsPlayoffs.gp); // Special case for PER - weight by minutes per season
                        if (isNaN(fp.careerStatsPlayoffs.per)) { fp.careerStatsPlayoffs.per = 0; }
                        fp.careerStatsPlayoffs.ewa = _.reduce(ps.p, function (memo, psp) { return memo + psp.ewa; }, 0); // Special case for EWA - sum
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
    function madeHof(p, playerStats) {
        var df, ewa, ewas, fudgeSeasons, i, mins, pers, prls, va;

        mins = _.pluck(playerStats, "min");
        pers = _.pluck(playerStats, "per");

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
     * @param {Array.<Object>} Array of playerStats objects, regular season only, starting with most recent. Only the first 1 or 2 will be used.
     * @param {Object=} options Object containing several optional options:
     *     noPot: When true, don't include potential in the value calcuation (useful for roster
     *         ordering and game simulation). Default false.
     *     fuzz: When true, used fuzzed ratings (useful for roster ordering, draft prospect
     *         ordering). Default false.
     * @return {boolean} Value of the player, usually between 50 and 100 like overall and potential
     *     ratings.
     */
    function value(p, ps, options) {
        var age, current, potential, pr, ps1, ps2, s;

        options = options !== undefined ? options : {};
        options.noPot = options.noPot !== undefined ? options.noPot : false;
        options.fuzz = options.fuzz !== undefined ? options.fuzz : false;
        options.withContract = options.withContract !== undefined ? options.withContract : false;

        // Current ratings
        pr = {}; // Start blank, add what we need (efficiency, wow!)
        s = p.ratings.length - 1; // Latest season

        // Fuzz?
        if (options.fuzz) {
            pr.ovr = fuzzRating(p.ratings[s].ovr, p.ratings[s].fuzz);
            pr.pot = fuzzRating(p.ratings[s].pot, p.ratings[s].fuzz);
        } else {
            pr.ovr = p.ratings[s].ovr;
            pr.pot = p.ratings[s].pot;
        }

        // 1. Account for stats (and current ratings if not enough stats)
        current = pr.ovr; // No stats at all? Just look at ratings more, then.
        if (ps.length > 0) {
            if (ps.length === 1) {
                // Only one year of stats
                current = 3.75 * ps[0].per;
                if (ps[0].min < 2000) {
                    current = current * ps[0].min / 2000 + pr.ovr * (1 - ps[0].min / 2000);
                }
            } else {
                // Two most recent seasons
                ps1 = ps[0];
                ps2 = ps[1];
                if (ps1.min + ps2.min > 0) {
                    current = 3.75 * (ps1.per * ps1.min + ps2.per * ps2.min) / (ps1.min + ps2.min);
                }
                if (ps1.min + ps2.min < 2000) {
                    current = current * (ps1.min + ps2.min) / 2000 + pr.ovr * (1 - (ps1.min + ps2.min) / 2000);
                }
            }
            current = 0.1 * pr.ovr + 0.9 * current; // Include some part of the ratings
        }

        // Short circuit if we don't care about potential
        if (options.noPot) {
            return current;
        }

        // 2. Potential
        potential = pr.pot;

        // If performance is already exceeding predicted potential, just use that
        if (current >= potential && age < 29) {
            return current;
        }

        // Otherwise, combine based on age
        if (p.draft.year > g.season) {
            // Draft prospect
            age = p.draft.year - p.born.year;
        } else {
            age = g.season - p.born.year;
        }
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

    // ps: player stats objects, regular season only, most recent first
    // Currently it is assumed that ps, if passed, will be the latest season. This assumption could be easily relaxed if necessary, just might make it a bit slower
    function updateValues(ot, p, ps) {
        return Promise.try(function () {
            var season;

            // Require up to the two most recent regular season stats entries, unless the current season has 2000+ minutes
            if (ps.length === 0 || (ps.length === 1 && ps[0].min < 2000)) {
                // Start search for past stats either at this season or at the most recent ps season
                // This assumes ps[0].season is the most recent entry for this player!
                if (ps.length === 0) {
                    season = g.season;
                } else {
                    season = ps[0].season - 1;
                }

                // New player objects don't have pids let alone stats, so just skip
                if (!p.hasOwnProperty("pid")) {
                    return;
                }

                // Start at season and look backwards until we hit
                // This will not work totally right if a player played for multiple teams in a season. It should be ordered by psid, instead it's ordered by tid because of the index used
                return dao.playerStats.iterate({
                    ot: ot,
                    index: "pid, season, tid",
                    key: IDBKeyRange.bound([p.pid, 0], [p.pid, season + 1]),
                    direction: "prev",
                    callback: function (psTemp, shortCircuit) {
                        // Skip playoff stats
                        if (psTemp.playoffs) {
                            return;
                        }

                        // Store stats
                        ps.push(psTemp);

                        // Continue only if we need another row
                        if (ps.length === 1 && ps[0].min < 2000) {
                            shortCircuit();
                        }
                    }
                });
            }
        }).then(function () {
            p.value = value(p, ps);
            p.valueNoPot = value(p, ps, {noPot: true});
            p.valueFuzz = value(p, ps, {fuzz: true});
            p.valueNoPotFuzz = value(p, ps, {noPot: true, fuzz: true});
            p.valueWithContract = value(p, ps, {withContract: true});

            return p;
        });
    }

    /**
     * Have a player retire, including all event and HOF bookkeeping.
     *
     * This just updates a player object. You need to write it to the database after.
     *
     * @memberOf core.player
     * @param {IDBTransaction} ot An IndexedDB transaction on events.
     * @param {Object} p Player object.
     * @return {Object} p Updated (retired) player object.
     */
    function retire(tx, p, playerStats, retiredNotification) {
        retiredNotification = retiredNotification !== undefined ? retiredNotification : true;

        if (retiredNotification) {
            eventLog.add(tx, {
                type: "retired",
                text: '<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a>  retired.',
                showNotification: p.tid === g.userTid,
                pids: [p.pid],
                tids: [p.tid]
            });
        }

        p.tid = g.PLAYER.RETIRED;
        p.retiredYear = g.season;

        // Add to Hall of Fame?
        if (madeHof(p, playerStats)) {
            p.hof = true;
            p.awards.push({season: g.season, type: "Inducted into the Hall of Fame"});
            eventLog.add(tx, {
                type: "hallOfFame",
                text: '<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a> was inducted into the <a href="' + helpers.leagueUrl(["hall_of_fame"]) + '">Hall of Fame</a>.',
                showNotification: p.statsTids.indexOf(g.userTid) >= 0,
                pids: [p.pid],
                tids: p.statsTids
            });
        }

        return p;
    }

    // See views.negotiation for moods as well
    function moodColorText(p) {
        if (p.freeAgentMood[g.userTid] < 0.25) {
            return {
                color: "#5cb85c",
                text: 'Eager to reach an agreement.'
            };
        }

        if (p.freeAgentMood[g.userTid] < 0.5) {
            return {
                color: "#ccc",
                text: 'Willing to sign for the right price.'
            };
        }

        if (p.freeAgentMood[g.userTid] < 0.75) {
            return {
                color: "#f0ad4e",
                text: 'Annoyed at you.'
            };
        }

        return {
            color: "#d9534f",
            text: 'Insulted by your presence.'
        };
    }

    /**
     * Take a partial player object, such as from an uploaded JSON file, and add everything it needs to be a real player object.
     *
     * This doesn't add the things from player.updateValues!
     *
     * @memberOf core.player
     * @param {Object} p Partial player object.
     * @return {Object} p Full player object.
     */
    function augmentPartialPlayer(p, scoutingRank) {
        var age, i, pg, simpleDefaults;

        if (!p.hasOwnProperty("born")) {
            age = random.randInt(19, 35);
        } else {
            age = g.startingSeason - p.born.year;
        }

        // This is used to get at default values for various attributes
        pg = generate(p.tid, age, "", 0, 0, g.startingSeason - age, true, scoutingRank);

        // Optional things
        simpleDefaults = ["awards", "born", "college", "contract", "draft", "face", "freeAgentMood", "gamesUntilTradable", "hgt", "hof", "imgURL", "injury", "pos", "ptModifier", "retiredYear", "rosterOrder", "watch", "weight", "yearsFreeAgent"];
        for (i = 0; i < simpleDefaults.length; i++) {
            if (!p.hasOwnProperty(simpleDefaults[i])) {
                p[simpleDefaults[i]] = pg[simpleDefaults[i]];
            }
        }
        if (!p.hasOwnProperty("salaries")) {
            p.salaries = [];
            if (p.contract.exp < g.startingSeason) {
                p.contract.exp = g.startingSeason;
            }
            if (p.tid >= 0) {
                p = setContract(p, p.contract, true);
            }
        }
        if (!p.hasOwnProperty("stats")) {
            p.stats = [];
        }
        if (!p.hasOwnProperty("statsTids")) {
            p.statsTids = [];
            if (p.tid >= 0 && g.phase <= g.PHASE.PLAYOFFS) {
                p.statsTids.push(p.tid);
            }
        }
        if (!p.ratings[0].hasOwnProperty("fuzz")) {
            p.ratings[0].fuzz = pg.ratings[0].fuzz;
        }
        if (!p.ratings[0].hasOwnProperty("skills")) {
            p.ratings[0].skills = skills(p.ratings[0]);
        }
        if (!p.ratings[0].hasOwnProperty("ovr")) {
            p.ratings[0].ovr = ovr(p.ratings[0]);
        }
        if (p.ratings[0].pot < p.ratings[0].ovr) {
            p.ratings[0].pot = p.ratings[0].ovr;
        }

        // Fix always-missing info
        if (p.tid === g.PLAYER.UNDRAFTED_2) {
            p.ratings[0].season = g.startingSeason + 1;
        } else if (p.tid === g.PLAYER.UNDRAFTED_3) {
            p.ratings[0].season = g.startingSeason + 2;
        } else {
            if (!p.ratings[0].hasOwnProperty("season")) {
                p.ratings[0].season = g.startingSeason;
            }
        }

        return p;
    }

    function checkStatisticalFeat(tx, pid, tid, p, results) {
        var doubles, feat, featText, featTextArr, i, j, k, key, logFeat, saveFeat, statArr, won;

        saveFeat = false;

        logFeat = function (text) {
            eventLog.add(tx, {
                type: "playerFeat",
                text: text,
                showNotification: tid === g.userTid,
                pids: [pid],
                tids: [tid]
            });
        };

        doubles = ["pts", "ast", "stl", "blk"].reduce(function (count, stat) {
            if (p.stat[stat] >= 10) {
                return count + 1;
            }
            return count;
        }, 0);
        if (p.stat.orb + p.stat.drb >= 10) {
            doubles += 1;
        }

        statArr = {};
        if (p.stat.pts >= 5 && p.stat.ast >= 5 && p.stat.stl >= 5 && p.stat.blk >= 5 && (p.stat.orb + p.stat.drb) >= 5) {
            statArr.points = p.stat.pts;
            statArr.rebounds = p.stat.orb + p.stat.drb;
            statArr.assists = p.stat.ast;
            statArr.steals = p.stat.stl;
            statArr.blocks = p.stat.blk;
            saveFeat = true;
        }
        if (doubles >= 3) {
            if (p.stat.pts >= 10) { statArr.points = p.stat.pts; }
            if (p.stat.orb + p.stat.drb >= 10) { statArr.rebounds = p.stat.orb + p.stat.drb; }
            if (p.stat.ast >= 10) { statArr.assists = p.stat.ast; }
            if (p.stat.stl >= 10) { statArr.steals = p.stat.stl; }
            if (p.stat.blk >= 10) { statArr.blocks = p.stat.blk; }
            saveFeat = true;
        }
        if (p.stat.pts >= 50) {
            statArr.points = p.stat.pts;
            saveFeat = true;
        }
        if (p.stat.orb + p.stat.drb >= 25) {
            statArr.rebounds = p.stat.orb + p.stat.drb;
            saveFeat = true;
        }
        if (p.stat.ast >= 20) {
            statArr.assists = p.stat.ast;
            saveFeat = true;
        }
        if (p.stat.stl >= 10) {
            statArr.steals = p.stat.stl;
            saveFeat = true;
        }
        if (p.stat.blk >= 10) {
            statArr.blocks = p.stat.blk;
            saveFeat = true;
        }
        if (p.stat.tp >= 10) {
            statArr["three pointers"] = p.stat.tp;
            saveFeat = true;
        }


        if (saveFeat) {
            if (results.team[0].id === tid) {
                i = 0;
                j = 1;
            } else {
                i = 1;
                j = 0;
            }

            if (results.team[i].stat.pts > results.team[j].stat.pts) {
                won = true;
            } else {
                won = false;
            }

            featTextArr = [];
            for (key in statArr) {
                if (statArr.hasOwnProperty(key)) {
                    featTextArr.push(statArr[key] + " " + key);
                }
            }

            featText = '<a href="' + helpers.leagueUrl(["player", pid]) + '">' + p.name + '</a> had <a href="' + helpers.leagueUrl(["game_log", g.teamAbbrevsCache[tid], g.season, results.gid]) + '">';
            for (k = 0; k < featTextArr.length; k++) {
                if (featTextArr.length > 1 && k === featTextArr.length - 1) {
                    featText += " and ";
                }

                featText += featTextArr[k];

                if (featTextArr.length > 2 && k < featTextArr.length - 2) {
                    featText += ", ";
                }
            }
            featText += '</a> in a ' + results.team[i].stat.pts + "-" + results.team[j].stat.pts + (won ? ' win over the ' : ' loss to the ') + g.teamNamesCache[results.team[j].id] + '.';

            logFeat(featText);

            feat = {
                pid: pid,
                name: p.name,
                pos: p.pos,
                season: g.season,
                tid: tid,
                oppTid: results.team[j].id,
                playoffs: g.phase === g.PHASE.PLAYOFFS,
                gid: results.gid,
                stats: p.stat,
                won: won,
                score: results.team[i].stat.pts + "-" + results.team[j].stat.pts,
                overtimes: results.overtimes
            };

            dao.playerFeats.add({ot: tx, value: feat});
        }
    }

    function killOne() {
        var p, reason, tid, tx;

        reason = random.choice([
            "died from a drug overdose",
            "was killed by a gunshot during an altercation at a night club",
            "was eaten by wolves",
            "died in a car crash",
            "was stabbed to death by a jealous ex-girlfriend",
            "committed suicide",
            "died from a rapidly progressing case of ebola"
        ]);

        // Pick random team
        tid = random.randInt(0, g.numTeams - 1);

        tx = dao.tx(["events", "playerStats", "players"], "readwrite");

        return dao.players.getAll({
            ot: tx,
            index: "tid",
            key: tid
        }).then(function (players) {
            // Pick a random player on that team
            p = random.choice(players);

            // Get player stats, used for HOF calculation
            return dao.playerStats.getAll({
                ot: tx,
                index: "pid, season, tid",
                key: IDBKeyRange.bound([p.pid], [p.pid, ''])
            });
        }).then(function (playerStats) {
            p = retire(tx, p, playerStats, false);

            p.diedYear = g.season;

            return dao.players.put({
                ot: tx,
                value: p
            });
        }).then(function () {
            eventLog.add(tx, {
                type: "tragedy",
                text: '<a href="' + helpers.leagueUrl(["player", p.pid]) + '">' + p.name + '</a> ' + reason + '.',
                showNotification: tid === g.userTid,
                pids: [p.pid],
                tids: [tid],
                persistent: true
            });

            return tx.complete();
        });
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
        //value: value,
        updateValues: updateValues,
        retire: retire,
        name: name,
        contractSeasonsRemaining: contractSeasonsRemaining,
        moodColorText: moodColorText,
        augmentPartialPlayer: augmentPartialPlayer,
        checkStatisticalFeat: checkStatisticalFeat,
        killOne: killOne
    };
});
