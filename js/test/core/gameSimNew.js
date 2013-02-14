/**
 * @name test.core.gameSimNew
 * @namespace Tests for core.gameSimNew.
 */
define(["core/gameSimNew", "util/random"], function (gameSim, random) {
    "use strict";

    describe("core/gameSimNew", function () {
        var generateTeams;

        /**
         * Generate two random teams to use in the simulation.
         * @return {Array.<Object>} A list of two team objects.
         */
        generateTeams = function () {
            var i, j, p, teams;

            teams = [];
            for (i = 0; i  < 2; i++) {
                teams[i] = {id: i, defense: 0, pace: 100, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: []};
                for (j = 0; j < 15; j++) {
                    p = {id: j + i * 15, name: "Bob " + (j + i * 15), pos: "F", ovr: random.randInt(50, 90), stat: {}, compositeRating: {}};

                    p.compositeRating = {
                        pace: Math.random(),
                        usage: Math.random(),
                        ballHandling: Math.random(),
                        passing: Math.random(),
                        turnovers: Math.random(),
                        shootingLowPost: Math.random(),
                        shootingAtRim: Math.random(),
                        shootingMidRange: Math.random(),
                        shootingThreePointer: Math.random(),
                        shootingFT: Math.random(),
                        rebounds: Math.random(),
                        steals: Math.random(),
                        blocks: Math.random(),
                        fouls: Math.random(),
                        defenseInterior: Math.random(),
                        defensePerimeter: Math.random()
                    };

                    p.stat = {gs: 0, min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, court_time: 0, bench_time: 0, energy: 1};

                    teams[i].player.push(p);
                }

                teams[i].defense = random.randInt(0, 10);
                teams[i].stat = {min: 0, fg: 0, fga: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0};
            }

            return teams;
        };

        describe("#expPts*()", function () {
            it("identical arguments should result in identical return values within the same possession", function () {
                var discord, expPtsDribble, expPtsPass, expPtsShoot, gs, i, passTo, teams, x;

                teams = generateTeams();
                discord = Math.random();

                gs = new gameSim.GameSim(0, teams[0], teams[1]);

                for (gs.o = 0; gs.o < 2; gs.o++) {
                    gs.d = (gs.o === 1) ? 0 : 1;
                    gs.ticks = gs.numTicks;
                    gs.updatePlayersOnCourt();
                    gs.initDistances();
                    gs.initBallHandler();
                    gs.initOpenness();
                    gs.discord = 0;
                    gs.passer = -1;

                    expPtsShoot = [];
                    expPtsPass = [];
                    expPtsDribble = [];
                    passTo = [];
                    for (i = 0; i < 4; i++) {
                        expPtsShoot[i] = gs.expPtsShoot(i, discord, i);

                        x = gs.expPtsPass(i, discord, i);
                        expPtsPass[i] = x.expPtsPass;
                        passTo[i] = x.passTo;

                        expPtsDribble[i] = gs.expPtsDribble(i, discord, i);
                    }

                    while (gs.ticks >= 0) {
                        for (i = 0; i < 4; i++) {
                            gs.expPtsShoot(i, discord, i).should.equal(expPtsShoot[i]);

                            x = gs.expPtsPass(i, discord, i);
                            x.expPtsPass.should.equal(expPtsPass[i]);
                            x.passTo.should.equal(passTo[i]);

                            gs.expPtsDribble(i, discord, i).should.equal(expPtsDribble[i]);
                        }

                        // Randomly pass or dribble
                        if (Math.random() > 0.5) {
                            gs.moveDribble();
                        } else {
                            gs.movePass(random.randInt(0, 4));
                        }

                        gs.ticks = gs.ticks - 1;
                    }
                }
            });
        });
    });
});