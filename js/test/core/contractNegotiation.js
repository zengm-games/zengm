/**
 * @name test.core.contractNegotiation
 * @namespace Tests for core.contractNegotiation.
 */
define(["db", "globals", "core/contractNegotiation", "core/league", "core/player"], function (db, g, contractNegotiation, league, player) {
    "use strict";

    describe("core/contractNegotiation", function () {
        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 14, undefined, undefined, 2013, function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });
        afterEach(function (done) {
            // Set to a trade with team 1 and no players;
            contractNegotiation.cancelAll(done);
        });

        describe("#create()", function () {
            it("should start a negotiation with a free agent", function (done) {
                var transaction;

                transaction = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                contractNegotiation.create(transaction, 7, false, function (error) {
                    (typeof error).should.equal("undefined");

                    transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                        var negotiations;

                        negotiations = event.target.result;
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);

                        done();
                    };
                });
            });
            it("should fail to start a negotiation with anyone but a free agent", function (done) {
                var transaction;

                transaction = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                contractNegotiation.create(transaction, 70, false, function (error) {
                    error.should.contain("is not a free agent.");

                    transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                        var negotiations;

                        negotiations = event.target.result;
                        negotiations.length.should.equal(0);

                        done();
                    };
                });
            });
            it("should only allow one concurrent negotiation if resigning is false", function (done) {
                var transaction;

                transaction = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                contractNegotiation.create(transaction, 7, false, function (error) {
                    (typeof error).should.equal("undefined");

                    transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                        var negotiations;

                        negotiations = event.target.result;
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);

                        contractNegotiation.create(transaction, 8, false, function (error) {
                            error.should.equal("You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");

                            transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                                var negotiations;

                                negotiations = event.target.result;
                                negotiations.length.should.equal(1);
                                negotiations[0].pid.should.equal(7);

                                done();
                            };
                        });
                    };
                });
            });
            it("should allow multiple concurrent negotiations if resigning is true", function (done) {
                var transaction;

                transaction = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                contractNegotiation.create(transaction, 7, true, function (error) {
                    (typeof error).should.equal("undefined");

                    transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                        var negotiations;

                        negotiations = event.target.result;
                        negotiations.length.should.equal(1);
                        negotiations[0].pid.should.equal(7);

                        contractNegotiation.create(transaction, 8, true, function (error) {
                            (typeof error).should.equal("undefined");

                            transaction.objectStore("negotiations").getAll().onsuccess = function (event) {
                                var negotiations;

                                negotiations = event.target.result;
                                negotiations.length.should.equal(2);
                                negotiations[0].pid.should.equal(7);
                                negotiations[1].pid.should.equal(8);

                                done();
                            };
                        });
                    };
                });
            });
            // The use of transactions here might cause race conditions
            it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", function (done) {
                var tx;

                tx = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");

                tx.objectStore("players").openCursor(7).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;
                    p.tid = g.userTid;

                    cursor.update(p);

                    contractNegotiation.create(tx, 8, false, function (error) {
                        error.should.equal("Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.");

                        tx.objectStore("negotiations").getAll().onsuccess = function (event) {
                            var negotiations;

                            negotiations = event.target.result;
                            negotiations.length.should.equal(0);

                            contractNegotiation.create(tx, 8, true, function (error) {
                                (typeof error).should.equal("undefined");

                                tx.objectStore("negotiations").getAll().onsuccess = function (event) {
                                    var negotiations;

                                    negotiations = event.target.result;
                                    negotiations.length.should.equal(1);
                                    negotiations[0].pid.should.equal(8);

                                    tx.objectStore("players").openCursor(7).onsuccess = function (event) {
                                        var cursor, p;

                                        cursor = event.target.result;
                                        p = cursor.value;
                                        p.tid = g.PLAYER.FREE_AGENT;

                                        cursor.update(p);

                                        done();
                                    };
                                };
                            });
                        };
                    });
                };
            });
        });

        describe("#accept()", function () {
            it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", function (done) {
                var i, tx;

                tx = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");
                contractNegotiation.create(tx, 8, false, function (error) {
                    var errorUndefined;

                    errorUndefined = error === undefined;
                    errorUndefined.should.equal(true);

                    // Force a minimum contract
                    tx.objectStore("negotiations").openCursor(8).onsuccess = function (event) {
                        var cursor, negotiation;

                        cursor = event.target.result;
                        negotiation = cursor.value;
                        negotiation.player.amount = 60000;
                        cursor.update(negotiation);
                    };
                });

                tx.oncomplete = function () {
                    contractNegotiation.accept(8, function (error) {
                        error.should.equal("This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract, buy out a player currently on your roster, or cancel the negotiation.");

                        done();
                    });
                };
            });
        });
        describe("#offer()", function () {
            it("should never counter with an offer below what has already been proposed", function (done) {
                var i, tx;

                tx = g.dbl.transaction(["gameAttributes", "messages", "negotiations", "players"], "readwrite");
                contractNegotiation.create(tx, 9, false);

                tx.oncomplete = function () {

                    g.dbl.transaction("negotiations").objectStore("negotiations").openCursor(9).onsuccess = function (event) {
                        var negotiation, originalYears;

                        negotiation = event.target.result.value;
                        originalYears = negotiation.player.years;

                        // offer a max contract for however many years the player wants
                        contractNegotiation.offer(9, 20000, originalYears, function () {

                            g.dbl.transaction("negotiations").objectStore("negotiations").openCursor(9).onsuccess = function (event) {
                                var negotiation;

                                negotiation = event.target.result.value;

                                // player should be happy to accept the $20,000,000 for the years they specified
                                negotiation.player.amount.should.equal(20000);
                                negotiation.player.years.should.equal(originalYears);

                                // Try to skimp the player by offering slightly less
                                contractNegotiation.offer(9, 19999, originalYears, function () {

                                    g.dbl.transaction("negotiations").objectStore("negotiations").openCursor(9).onsuccess = function (event) {
                                        var negotiation;

                                        negotiation = event.target.result.value;

                                        // Player should not fall for the bait and switch
                                        negotiation.player.amount.should.equal(20000);
                                        negotiation.player.years.should.equal(originalYears);

                                        done();
                                    };
                                });
                            };
                        });
                    };
                };
            });
        });
    });
});