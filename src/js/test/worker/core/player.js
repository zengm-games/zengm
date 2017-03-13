/*eslint no-unused-expressions: 0*/
import assert from 'assert';
import _ from 'underscore';
import {PLAYER, g, helpers} from '../../../common';
import {player} from '../../../worker/core';

// Default values needed
g.teamAbbrevsCache = helpers.getTeamsDefault().map(t => t.abbrev);
g.numTeams = 30;
g.userTids = [0];

describe("core/player", () => {
    describe("#generate()", () => {
        it.skip("should add stats row only for players generated on teams, not free agents or undrafted players", () => {
// Needs DB to check since stats are not in player object anymore
            let p = player.generate(-2, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 0);

            p = player.generate(-1, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 0);

            p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 1);

            p = player.generate(15, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 1);
        });
    });

    describe("#madeHof()", () => {
        it("should correctly assign players to the Hall of Fame", () => {
            // Like player from http://www.reddit.com/r/BasketballGM/comments/222k8b/so_a_10x_dpoy_apparently_doesnt_have_what_it/
            const p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
            const playerStats = [{
                min: 1 * 2.6,
                per: 18.7,
                ewa: 0,
            }, {
                min: 77 * 19.3,
                per: 13,
                ewa: 1.1,
            }, {
                min: 82 * 26,
                per: 18.9,
                ewa: 6.6,
            }, {
                min: 82 * 33.9,
                per: 15.3,
                ewa: 4.7,
            }, {
                min: 79 * 33.8,
                per: 16,
                ewa: 5.3,
            }, {
                min: 81 * 31,
                per: 17.1,
                ewa: 6.1,
            }, {
                min: 80 * 28,
                per: 16.2,
                ewa: 4.6,
            }, {
                min: 82 * 34.1,
                per: 16.6,
                ewa: 6.2,
            }, {
                min: 80 * 34.8,
                per: 16.9,
                ewa: 6.5,
            }, {
                min: 82 * 31.7,
                per: 17.8,
                ewa: 7,
            }, {
                min: 81 * 33.5,
                per: 18.8,
                ewa: 8.3,
            }, {
                min: 82 * 32,
                per: 17.8,
                ewa: 7,
            }, {
                min: 82 * 30.5,
                per: 17,
                ewa: 5.9,
            }, {
                min: 76 * 30.6,
                per: 16.3,
                ewa: 4.8,
            }, {
                min: 82 * 30.8,
                per: 16,
                ewa: 5,
            }, {
                min: 82 * 28,
                per: 15.6,
                ewa: 4.1,
            }];

            assert.equal(player.madeHof(p, playerStats), false);
        });
    });
});
