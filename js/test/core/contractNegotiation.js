'use strict';

var assert = require('assert');
var db = require('../../db');
var g = require('../../globals');
var contractNegotiation = require('../../core/contractNegotiation');
var league = require('../../core/league');

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
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                return contractNegotiation.create(tx, 7, false).then(function (error) {
                    assert.equal((typeof error), "undefined");

                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 1);
                        assert.equal(negotiations[0].pid, 7);
                    });
                });
            });
        });
        it("should fail to start a negotiation with anyone but a free agent", function () {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                return contractNegotiation.create(tx, 70, false).then(function (error) {
                    assert(error.indexOf("is not a free agent.") >= 0);

                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 0);
                    });
                });
            });
        });
        it("should only allow one concurrent negotiation if resigning is false", function () {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                return contractNegotiation.create(tx, 7, false).then(function (error) {
                    assert.equal((typeof error), "undefined");

                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 1);
                        assert.equal(negotiations[0].pid, 7);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, false).then(function (error) {
                        assert.equal(error, "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");
                    });
                }).then(function () {
                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 1);
                        assert.equal(negotiations[0].pid, 7);
                    });
                });
            });
        });
        it("should allow multiple concurrent negotiations if resigning is true", function () {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                return contractNegotiation.create(tx, 7, true).then(function (error) {
                    assert.equal((typeof error), "undefined");

                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 1);
                        assert.equal(negotiations[0].pid, 7);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, true).then(function (error) {
                        assert.equal((typeof error), "undefined");
                    });
                }).then(function () {
                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 2);
                        assert.equal(negotiations[0].pid, 7);
                        assert.equal(negotiations[1].pid, 8);
                    });
                });
            });
        });
        // The use of txs here might cause race conditions
        it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", function () {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                return tx.players.get(7).then(function (p) {
                    p.tid = g.userTid;
                    return tx.players.put(p);
                }).then(function () {
                    return contractNegotiation.create(tx, 8, false).then(function (error) {
                        assert.equal(error, "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.");
                    });
                }).then(function () {
                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 0);
                    });
                }).then(function () {
                    return contractNegotiation.create(tx, 8, true).then(function (error) {
                        assert.equal((typeof error), "undefined");
                    });
                }).then(function () {
                    return tx.negotiations.getAll().then(function (negotiations) {
                        assert.equal(negotiations.length, 1);
                        assert.equal(negotiations[0].pid, 8);
                    });
                }).then(function () {
                    return tx.players.get(7).then(function (p) {
                        p.tid = g.PLAYER.FREE_AGENT;
                        return tx.players.put(p);
                    });
                });
            });
        });
    });

    describe("#accept()", function () {
        it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", function () {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", function (tx) {
                contractNegotiation.create(tx, 8, false).then(function (error) {
                    assert.equal((typeof error), "undefined");

                    // Force a minimum contract
                    tx.negotiations.get(8).then(function (negotiation) {
                        negotiation.player.amount = 60000;
                        tx.negotiations.put(negotiation);
                    });
                });
            }).then(function () {
                return contractNegotiation.accept(8, 60000, 2017).then(function (error) {
                    assert.equal(error, "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.");
                });
            });
        });
    });
});
