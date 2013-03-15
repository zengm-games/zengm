/**
 * @name core.team
 * @namespace Functions operating on team objects, or parts of team objects.
 */
define(["globals", "util/helpers", "util/random"], function (g, helpers, random) {
    "use strict";

    /**
     * Add a new row of season attributes to a team object.
     * 
     * There should be one season attributes row for each year, and a new row should be added for each team at the start of a season.
     *
     * @memberOf core.team
     * @param {Object} t Team object.
     * @return {Object} Updated team object.
     */
    function addSeasonRow(t) {
        var key, newSeason, s;

        s = t.seasons.length - 1; // Most recent ratings

        // Initial entry
        newSeason = {
            season: g.season,
            gp: 0,
            att: 0,
            cash: 10000,
            won: 0,
            lost: 0,
            wonHome: 0,
            lostHome: 0,
            wonAway: 0,
            lostAway: 0,
            wonDiv: 0,
            lostDiv: 0,
            wonConf: 0,
            lostConf: 0,
            lastTen: [],
            streak: 0,
            madePlayoffs: false,
            confChamps: false,
            leagueChamps: false,
            hype: Math.random(),
            pop: 0,  // Needs to be set somewhere!
            tvContract: {
                amount: 0,
                exp: 0
            },
            revenues: {
                merch: {
                    amount: 0,
                    rank: 0
                },
                sponsor: {
                    amount: 0,
                    rank: 0
                },
                ticket: {
                    amount: 0,
                    rank: 0
                },
                nationalTv: {
                    amount: 0,
                    rank: 0
                },
                localTv: {
                    amount: 0,
                    rank: 0
                }
            },
            expenses: {
                salary: {
                    amount: 0,
                    rank: 0
                },
                luxuryTax: {
                    amount: 0,
                    rank: 0
                },
                minTax: {
                    amount: 0,
                    rank: 0
                },
                scouting: {
                    amount: 0,
                    rank: 0
                },
                coaching: {
                    amount: 0,
                    rank: 0
                },
                health: {
                    amount: 0,
                    rank: 0
                },
                facilities: {
                    amount: 0,
                    rank: 0
                },
                stadium: {
                    amount: 0,
                    rank: 0
                },
            },
            payrollEndOfSeason: -1
        };

        if (s >= 0) {
            // New season, carrying over some values from the previous season
            newSeason.pop = t.seasons[s].pop * random.uniform(0.98, 1.02);  // Mean population should stay constant, otherwise the economics change too much
            newSeason.hype = t.seasons[s].hype;
            newSeason.cash = t.seasons[s].cash;
            newSeason.tvContract = t.seasons[s].tvContract;
        }

        t.seasons.push(newSeason);

        return t;
    }

    /**
     * Add a new row of stats to a team object.
     * 
     * A row contains stats for unique values of (season, playoffs). So new rows need to be added when a new season starts or when a team makes the playoffs.
     *
     * @memberOf core.team
     * @param {Object} t Team object.
     * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
     * @return {Object} Updated team object.
     */
    function addStatsRow(t, playoffs) {
        var key, newStats;

        playoffs = playoffs !== undefined ? playoffs : false;

        t.stats.push({
            season: g.season,
            playoffs: playoffs,
            gp: 0,
            min: 0,
            fg: 0,
            fga: 0,
            fgAtRim: 0,
            fgaAtRim: 0,
            fgLowPost: 0,
            fgaLowPost: 0,
            fgMidRange: 0,
            fgaMidRange: 0,
            tp: 0,
            tpa: 0,
            ft: 0,
            fta: 0,
            orb: 0,
            drb: 0,
            trb: 0,
            ast: 0,
            tov: 0,
            stl: 0,
            blk: 0,
            pf: 0,
            pts: 0,
            oppPts: 0
        });

        return t;
    }

    /**
     * Create a new team object.
     * 
     * @memberOf core.team
     * @param {Object} tm Team metadata object, likely from util.helpers.getTeams.
     * @return {Object} Team object to insert in the database.
     */
    function generate(tm) {
        var t;

        t = {
            tid: tm.tid,
            cid: tm.cid,
            did: tm.did,
            region: tm.region,
            name: tm.name,
            abbrev: tm.abbrev,
            stats: [],
            seasons: [],
            budget: {
                ticketPrice: {
                    amount: helpers.round(25 + 25 * (30 - tm.popRank) / 29, 2),
                    rank: tm.popRank
                },
                scouting: {
                    amount: helpers.round(200 + 300 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                coaching: {
                    amount: helpers.round(200 + 300 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                health: {
                    amount: helpers.round(200 + 300 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                facilities: {
                    amount: helpers.round(200 + 300 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                stadium: {
                    amount: helpers.round(200 + 300 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                }
            }
        };

        t = addSeasonRow(t);
        t = addStatsRow(t);

        t.seasons[0].pop = tm.pop;

        return t;
    }

    return {
        addSeasonRow: addSeasonRow,
        addStatsRow: addStatsRow,
        generate: generate
    };
});