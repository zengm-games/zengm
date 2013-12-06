/**
 * @name core.debug
 * @namespace Functions only used for debugging the game, particularly balance issues. This should not be included or loaded in the compiled version.
 */
define(["globals", "core/finances", "core/player", "data/injuries", "data/names", "lib/faces", "lib/underscore", "util/eventLog", "util/helpers", "util/random"], function (g, finances, player, injuries, names, faces, _, eventLog, helpers, random) {
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

    // Returns the average contract for the active players in the league
    // Useful to run this while playing with the contract formula in core.player.genContract
    function leagueAverageContract() {
        var total;

        total = 0;

        // All non-retired players
        g.dbl.transaction("players").objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED, true)).onsuccess = function (event) {
            var contract, i, p, players;

            players = event.target.result;

            for (i = 0; i < players.length; i++) {
                p = players[i];
                contract = player.genContract(p);
                total += contract.amount;
            }

            console.log(total / players.length);
        };
    }

    return {
        regressRatingsPer: regressRatingsPer,
        leagueAverageContract: leagueAverageContract
    };
});