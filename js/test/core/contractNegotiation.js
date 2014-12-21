/**
 * @name test.core.contractNegotiation
 * @namespace Tests for core.contractNegotiation.
 */
define(["dao", "db", "globals", "core/contractNegotiation", "core/league"], function (dao, db, g, contractNegotiation, league) {
    "use strict";

    describe("core/contractNegotiation", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 14, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });
        afterEach(function () {
            // Set to a trade with team 1 and no players;
            return contractNegotiation.cancelAll();
        });

        describe("#create()", function () {
            it("should start a negotiation with a free agent", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                return contractNegotiation.create(tx, 7, false).then(function (error) {
                    (typeof error).should.equal("undefined");

                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);
                    });
                });
            });
            it("should fail to start a negotiation with anyone but a free agent", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                return contractNegotiation.create(tx, 70, false).then(function (error) {
                    error.should.contain("is not a free agent.");

                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(0);
                    });
                });
            });
            it("should only allow one concurrent negotiation if resigning is false", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                return contractNegotiation.create(tx, 7, false).then(function (error) {
                    (typeof error).should.equal("undefined");

                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, false).then(function (error) {
                        error.should.equal("You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");
                    });
                }).then(function () {
                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);
                    });
                });
            });
            it("should allow multiple concurrent negotiations if resigning is true", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                return contractNegotiation.create(tx, 7, true).then(function (error) {
                    (typeof error).should.equal("undefined");

                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, true).then(function (error) {
                        (typeof error).should.equal("undefined");
                    });
                }).then(function () {
                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(2);
                        negotiations[0].pid.should.equal(7);
                        negotiations[1].pid.should.equal(8);
                    });
                });
            });
            // The use of txs here might cause race conditions
            it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                return dao.players.get({ot: tx, key: 7}).then(function (p) {
                    p.tid = g.userTid;
                    return dao.players.put({ot: tx, value: p});
                }).then(function () {
                    return contractNegotiation.create(tx, 8, false).then(function (error) {
                        error.should.equal("Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.");
                    });
                }).then(function () {
                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(0);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, true).then(function (error) {
                        (typeof error).should.equal("undefined");
                    });
                }).then(function () {
                    return dao.negotiations.getAll({ot: tx}).then(function (negotiations) {
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(8);
                    });
                }).then(function () {
                    return dao.players.get({ot: tx, key: 7}).then(function (p) {
                        p.tid = g.PLAYER.FREE_AGENT;
                        return dao.players.put({ot: tx, value: p});
                    });
                });
            });
        });

        describe("#accept()", function () {
            it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");
                contractNegotiation.create(tx, 8, false).then(function (error) {
                    (typeof error).should.equal("undefined");

                    // Force a minimum contract
                    dao.negotiations.get({ot: tx, key: 8}).then(function (negotiation) {
                        negotiation.player.amount = 60000;
                        dao.negotiations.put({ot: tx, value: negotiation});
                    });
                });

                return tx.complete().then(function () {
                    return contractNegotiation.accept(8).then(function (error) {
                        (typeof error).should.equal("string");
                        error.should.equal("This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.");
                    });
                });
            });
        });
        describe("#offer()", function () {
            it("should never counter with an offer below what has already been proposed", function () {
                var tx;

                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite");
                contractNegotiation.create(tx, 9, false);
                return tx.complete().then(function () {
                    return dao.negotiations.get({key: 9}).then(function (negotiation) {
                        var originalYears;

                        originalYears = negotiation.player.years;

                        // offer a max contract for however many years the player wants
                        return contractNegotiation.offer(9, 20000, originalYears).then(function () {
                            return dao.negotiations.get({key: 9}).then(function (negotiation) {
                                // player should be happy to accept the $20,000,000 for the years they specified
                                negotiation.player.amount.should.equal(20000);
                                negotiation.player.years.should.equal(originalYears);
                            });
                        }).then(function () {
                            // Try to skimp the player by offering slightly less
                            return contractNegotiation.offer(9, 19999, originalYears, function () {
                                return dao.negotiations.get({key: 9}).then(function (negotiation) {
                                    // Player should not fall for the bait and switch
                                    negotiation.player.amount.should.equal(20000);
                                    negotiation.player.years.should.equal(originalYears);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});