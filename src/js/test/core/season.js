import assert from 'assert';
import {g, helpers} from '../../common';
import * as season from '../../core/season';
import * as testHelpers from '../helpers';

const defaultTeams = helpers.getTeamsDefault();

describe("core/season", () => {
    describe("#newSchedule()", () => {
        it("should schedule 1230 games (82 each for 30 teams)", () => {
            assert.equal(season.newSchedule(defaultTeams).length, 1230);
        });
        it("should schedule 41 home games and 41 away games for each team", () => {
            const tids = season.newSchedule(defaultTeams);

            const home = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number of home games for each team
            const away = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number of away games for each team

            for (let i = 0; i < tids.length; i++) {
                home[tids[i][0]] += 1;
                away[tids[i][1]] += 1;
            }

            for (let i = 0; i < g.numTeams; i++) {
                assert.equal(home[i], 41);
                assert.equal(away[i], 41);
            }
        });
        it("should schedule each team one home game against every team in the other conference", () => {
            const tids = season.newSchedule(defaultTeams);

            const home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
            for (let i = 0; i < g.numTeams; i++) {
                home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            }

            const teams = helpers.getTeamsDefault();
            for (let i = 0; i < tids.length; i++) {
                if (teams[tids[i][0]].cid !== teams[tids[i][1]].cid) {
                    home[tids[i][1]][tids[i][0]] += 1;
                }
            }

            for (let i = 0; i < g.numTeams; i++) {
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 15);
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 15);
            }
        });
        it("should schedule each team two home games against every team in the same division", () => {
            const tids = season.newSchedule(defaultTeams);

            const home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
            for (let i = 0; i < g.numTeams; i++) {
                home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            }

            const teams = helpers.getTeamsDefault();
            for (let i = 0; i < tids.length; i++) {
                if (teams[tids[i][0]].did === teams[tids[i][1]].did) {
                    home[tids[i][1]][tids[i][0]] += 1;
                }
            }

            for (let i = 0; i < g.numTeams; i++) {
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 26);
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 2), 4);
            }
        });
        it("should schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", () => {
            const tids = season.newSchedule(defaultTeams);

            const home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
            for (let i = 0; i < g.numTeams; i++) {
                home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            }

            const teams = helpers.getTeamsDefault();
            for (let i = 0; i < tids.length; i++) {
                if (teams[tids[i][0]].cid === teams[tids[i][1]].cid && teams[tids[i][0]].did !== teams[tids[i][1]].did) {
                    home[tids[i][1]][tids[i][0]] += 1;
                }
            }

            for (let i = 0; i < g.numTeams; i++) {
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 20);
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 2);
                assert.equal(testHelpers.numInArrayEqualTo(home[i], 2), 8);
            }
        });
    });


    describe("#genPlayoffSeries()", () => {
        before(() => {
            g.numPlayoffRounds = 2;
        });
        it("should split teams by conference if there are two conferences", () => {
            const teams = [
                {tid: 0, cid: 0},
                {tid: 2, cid: 0},
                {tid: 3, cid: 0},
                {tid: 6, cid: 0},
                {tid: 5, cid: 1},
                {tid: 1, cid: 1},
                {tid: 4, cid: 1},
            ];
            g.confs = [
                {cid: 0, name: "Eastern Conference"},
                {cid: 1, name: "Western Conference"},
            ];

            const {series, tidPlayoffs} = season.genPlayoffSeries(teams);

            assert.deepEqual(tidPlayoffs.sort(), [0, 1, 2, 5]);
            assert.equal(series[0].length, 2);
        });
        it("should pick teams regardless of conference if there are not two conferences", () => {
            const teams = [
                {tid: 0, cid: 0},
                {tid: 2, cid: 0},
                {tid: 3, cid: 2},
                {tid: 6, cid: 0},
                {tid: 5, cid: 1},
                {tid: 1, cid: 1},
                {tid: 4, cid: 1},
            ];
            g.confs = [
                {cid: 0, name: "Eastern Conference"},
                {cid: 1, name: "Western Conference"},
                {cid: 2, name: "Whatever"},
            ];

            const {series, tidPlayoffs} = season.genPlayoffSeries(teams);

            assert.deepEqual(tidPlayoffs.sort(), [0, 2, 3, 6]);
            assert.equal(series[0].length, 2);
        });
        after(() => {
            g.numPlayoffRounds = 4;
            delete g.confs;
        });
    });
});
