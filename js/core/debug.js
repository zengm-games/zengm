/**
 * @name core.debug
 * @namespace Functions only used for debugging the game, particularly balance issues. This should not be included or loaded in the compiled version.
 */
define(["dao", "globals", "core/league", "core/player", "lib/underscore"], function (dao, g, league, player, _) {
    "use strict";

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
            var I, i;

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

        Matrix.prototype.regressionCoefficients = function (x) {
            var xT;

            xT = x.transpose();

            return xT.mult(x).inverse().mult(xT).mult(this);
        };

        dao.players.getAll({statsSeasons: "all"}).then(function (players) {
            var c, i, j, k, p, pers, ratingLabels, ratings, x, y;

            pers = [];
            ratings = [];

            players = player.filter(players, {
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

            c = y.regressionCoefficients(x);

            ratingLabels = ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
            for (i = 0; i < ratingLabels.length; i++) {
                console.log(ratingLabels[i] + ": " + c.mtx[i][0] * 100);
            }
        });
    }

    // Returns the average contract for the active players in the league
    // Useful to run this while playing with the contract formula in core.player.genContract
    function leagueAverageContract() {
        // All non-retired players
        dao.players.getAll({
            index: "tid",
            key: IDBKeyRange.lowerBound(g.PLAYER.FREE_AGENT)
        }).then(function (players) {
            var contract, i, p, total;

            total = 0;

            for (i = 0; i < players.length; i++) {
                p = players[i];
                contract = player.genContract(p);
                total += contract.amount;
            }

            console.log(total / players.length);
        });
    }

    function exportPlayerInfo() {
        // All non-retired players
        dao.players.getAll({
            index: "tid",
            key: IDBKeyRange.lowerBound(g.PLAYER.FREE_AGENT)
        }).then(function (players) {
            var contract, i, output, p;

            output = "<pre>value,contract.amount\n";

            for (i = 0; i < players.length; i++) {
                p = players[i];
                contract = player.genContract(p);
                output += p.value + "," + contract.amount + "," + _.last(p.ratings).ovr + "," + _.last(p.ratings).pot + "\n";
            }
            output += "</pre>";

            document.getElementById("league_content").innerHTML = output;
        });
    }

    function exportPlayerStats() {
        console.log("Go to Tools > Export Stats, it's better!");
    }

    function averageCareerArc(baseOvr, basePot, ratingToSave) {
        var averageOvr, averagePot, averageRat, i, j, k, numPlayers, numSeasons, p, profiles;

        numPlayers = 1000; // Number of players per profile
        numSeasons = 20;

        averageOvr = [];
        averagePot = [];
        averageRat = [];
        for (i = 0; i < numSeasons; i++) {
            averageOvr[i] = 0;
            averagePot[i] = 0;
            averageRat[i] = 0;
        }

        profiles = ["Point", "Wing", "Big", ""];

        for (i = 0; i < numPlayers; i++) {
            for (j = 0; j < profiles.length; j++) {
                p = player.generate(0, 19, profiles[j], baseOvr, basePot, 2013, true, 15);
                for (k = 0; k < numSeasons; k++) {
                    averageOvr[k] += p.ratings[0].ovr;
                    averagePot[k] += p.ratings[0].pot;
                    if (ratingToSave) { averageRat[k] += p.ratings[0][ratingToSave]; }
                    p = player.develop(p, 1, true);
                }
            }
        }


        for (i = 0; i < numSeasons; i++) {
            averageOvr[i] /= numPlayers * profiles.length;
            averagePot[i] /= numPlayers * profiles.length;
            if (ratingToSave) { averageRat[i] /= numPlayers * profiles.length; }
        }

        console.log("ovr:"); console.log(averageOvr);
        console.log("pot:"); console.log(averagePot);
        if (ratingToSave) { console.log(ratingToSave + ":"); console.log(averageRat); }
    }

    return {
        regressRatingsPer: regressRatingsPer,
        leagueAverageContract: leagueAverageContract,
        exportPlayerInfo: exportPlayerInfo,
        exportPlayerStats: exportPlayerStats,
        averageCareerArc: averageCareerArc
    };
});