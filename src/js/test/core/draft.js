import assert from 'assert';
import {Cache, connectMeta, getCopy, idb} from '../../db';
import {PLAYER, g} from '../../common';
import {draft, league} from '../../core';
import sampleTiebreakers from '../fixtures/sampleTiebreakers';

describe("core/draft", () => {
    before(async () => {
        idb.meta = await connectMeta();
        await league.create("Test", 15, undefined, 2015, false);
        idb.cache = new Cache();
        await idb.cache.fill();
    });
    after(() => league.remove(g.lid));

    const testDraftUntilUserOrEnd = async (numNow, numTotal) => {
        const pids = await draft.untilUserOrEnd();
        assert.equal(pids.length, numNow);
        const players = await idb.cache.players.indexGetAll('playersByTid', PLAYER.UNDRAFTED);
        assert.equal(players.length, 140 - numTotal);
    };

    let userPick1;
    let userPick2;
    const testDraftUser = async (round) => {
        const draftOrder = await draft.getOrder();
        const pick = draftOrder.shift();
        assert.equal(pick.round, round);
        if (round === 1) {
            assert.equal(pick.pick, userPick1);
        } else {
            assert.equal(pick.pick, userPick2 - 30);
        }
        assert.equal(pick.tid, g.userTid);

        const p = await idb.cache.indexGet('playersByTid', PLAYER.UNDRAFTED);
        await draft.selectPlayer(pick, p.pid);
        assert.equal(p.tid, g.userTid);
        await draft.setOrder(draftOrder);
    };

    describe("#genPlayers()", () => {
        it("should generate 70 players for the draft", async () => {
            await draft.genPlayers(PLAYER.UNDRAFTED, null, null);
            const players = await idb.cache.players.indexGetAll('playersByTid', PLAYER.UNDRAFTED);
            assert.equal(players.length, 140); // 70 from original league, 70 from this
        });
    });

    describe("#genOrder()", () => {
        before(async () => {
            await idb.cache.clear('teamSeasons');

            // Load static data
            const teams = await idb.cache.getAll('teams');
            for (const t of teams) {
                const st = sampleTiebreakers.teams[t.tid];
                const teamSeasons = st.seasons;
                delete st.seasons;
                delete st.stats;

                for (const teamSeason of teamSeasons) {
                    teamSeason.tid = t.tid;
                    await idb.cache.add('teamSeasons', teamSeason);
                }

                await idb.cache.put('teams', st);
            }
        });

        let draftResults;
        it("should schedule 60 draft picks", async () => {
            await draft.genOrder();
            const draftOrder = await draft.getOrder();
            assert.equal(draftOrder.length, 60);

            draftResults = draftOrder.map(d => d.originalTid);
            userPick1 = draftResults.indexOf(g.userTid) + 1;
            userPick2 = draftResults.lastIndexOf(g.userTid) + 1;
        });

        it("should give the 3 teams with the lowest win percentage picks not lower than 6", () => {
            const tids = [16, 28, 21]; // teams with lowest winp
            for (let i = 0; i < tids.length; i++) {
                assert(draftResults.indexOf(tids[i]) >= 0);
                assert(draftResults.indexOf(tids[i]) <= i + 3);
                assert.equal(draftResults.lastIndexOf(tids[i]), 30 + i);
            }
        });

        it("should give lottery team with better record than playoff teams a pick based on actual record for round 2", () => {
            const pofteams = [23, 10, 18, 24, 14];

            // good record lottery team
            assert(draftResults.indexOf(17) >= 0);
            assert(draftResults.indexOf(17) <= 13);
            assert.equal(draftResults.lastIndexOf(17), 48);

            // bad record playoff team
            for (let i = 0; i < pofteams.length; i++) {
                assert(draftResults.indexOf(pofteams[i]) > draftResults.indexOf(17));
                assert(draftResults.lastIndexOf(pofteams[i]) < draftResults.lastIndexOf(17));
            }
        });

        it("should give reverse round 2 order for teams with the same record", () => {
            const sameRec = [
                [3, 15, 25],
                [10, 18],
                [13, 26],
            ];
            for (let i = 0; i < sameRec.length; i++) {
                const tids = sameRec[i];
                const r1picks = [];
                const r2picks = [];
                for (let j = 0; j < 30; j++) {
                    if (tids.includes(draftResults[j])) {
                        r1picks.push(draftResults[j]);
                    }
                }
                for (let j = 59; j > 29; j--) {
                    if (tids.includes(draftResults[j])) {
                        r2picks.push(draftResults[j]);
                    }
                }
                assert.equal(r1picks.length, r2picks.length);
                for (let j = 0; j < r1picks.length; j++) {
                    assert.equal(r1picks[j], r2picks[j]);
                }
            }
        });
    });

    describe("#updateChances()", () => {
        it("should distribute combinations to teams with the same record", async () => {
            const teams = await getCopy.teams({
                attrs: ["tid", "cid"],
                seasonAttrs: ["winp", "playoffRoundsWon"],
                season: g.season,
            });
            const chances = [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5];
            // index instead of tid
            const sameRec = [
                [6, 7, 8],
                [10, 11, 12],
            ];
            draft.lotterySort(teams);
            draft.updateChances(chances, teams, false);
            for (let i = 0; i < sameRec.length; i++) {
                const tids = sameRec[i];
                let value = 0;
                for (let j = 0; j < tids.length; j++) {
                    if (value === 0) {
                        value = chances[tids[j]];
                    } else {
                        assert.equal(value, chances[tids[j]]);
                    }
                }
            }

            // test if isFinal is true
            draft.updateChances(chances, teams, true);
            for (let i = 0; i < sameRec.length; i++) {
                const tids = sameRec[i];
                let value = 0;
                let maxIdx = -1;
                for (let j = tids.length - 1; j >= 0; j--) {
                    if (value <= chances[tids[j]]) {
                        value = chances[tids[j]];
                        maxIdx = j;
                    }
                }
                assert.equal(maxIdx, 0);
            }
        });
    });

    describe("#selectPlayer() and #untilUserOrEnd()", () => {
        it("should draft players before the user's team first round pick", () => {
            return testDraftUntilUserOrEnd(userPick1 - 1, userPick1 - 1);
        });
        it("should then allow the user to draft in the first round", () => {
            return testDraftUser(1);
        });
        it("when called again after the user drafts, should draft players before the user's second round pick comes up", () => {
            return testDraftUntilUserOrEnd(userPick2 - userPick1 - 1, userPick2 - 1);
        });
        it("should then allow the user to draft in the second round", () => {
            return testDraftUser(2);
        });
        it("when called again after the user drafts, should draft more players to finish the draft", () => {
            const after = 60 - userPick2;
            return testDraftUntilUserOrEnd(after, userPick2 + after);
        });
    });
});

