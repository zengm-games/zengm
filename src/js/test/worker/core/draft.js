import assert from "assert";
import { PLAYER, g } from "../../../common";
import sampleTiebreakers from "../../fixtures/sampleTiebreakers";
import helpers from "../../helpers";
import { draft } from "../../../worker/core";
import lotterySort from "../../../worker/core/draft/lotterySort";
import updateChances from "../../../worker/core/draft/updateChances";
import { idb } from "../../../worker/db";

describe("core/draft", () => {
    before(async () => {
        helpers.resetG();

        await helpers.resetCache();
    });

    const testDraftUntilUserOrEnd = async (numNow, numTotal) => {
        const pids = await draft.untilUserOrEnd();
        assert.equal(pids.length, numNow);
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            PLAYER.UNDRAFTED,
        );
        assert.equal(players.length, 70 - numTotal);
    };

    let userPick1;
    let userPick2;
    const testDraftUser = async round => {
        const draftOrder = await draft.getOrder();
        const pick = draftOrder.shift();
        assert.equal(pick.round, round);
        if (round === 1) {
            assert.equal(pick.pick, userPick1);
        } else {
            assert.equal(pick.pick, userPick2 - 30);
        }
        assert.equal(pick.tid, g.userTid);

        const p = await idb.cache.players.indexGet(
            "playersByTid",
            PLAYER.UNDRAFTED,
        );
        await draft.selectPlayer(pick, p.pid);
        assert.equal(p.tid, g.userTid);
        await draft.setOrder(draftOrder);
    };

    describe("#genPlayers()", () => {
        it("should generate 70 players for the draft", async () => {
            await draft.genPlayers(PLAYER.UNDRAFTED, 15.5);
            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.UNDRAFTED,
            );
            assert.equal(players.length, 70); // 70 players in a draft class
        });
    });

    describe("#genOrder()", () => {
        before(async () => {
            await idb.cache.teamSeasons.clear();

            // Load static data
            for (let tid = 0; tid < g.numTeams; tid++) {
                const st = sampleTiebreakers.teams[tid];
                const teamSeasons = st.seasons;
                delete st.seasons;
                delete st.stats;

                for (const teamSeason of teamSeasons) {
                    teamSeason.tid = tid;
                    await idb.cache.teamSeasons.add(teamSeason);
                }

                await idb.cache.teams.add(st);
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
                assert(
                    draftResults.indexOf(pofteams[i]) >
                        draftResults.indexOf(17),
                );
                assert(
                    draftResults.lastIndexOf(pofteams[i]) <
                        draftResults.lastIndexOf(17),
                );
            }
        });

        it("should give reverse round 2 order for teams with the same record", () => {
            const sameRec = [[3, 15, 25], [10, 18], [13, 26]];

            // First set of tids can fail because all 3 teams are in the lottery, although with low odds
            const lotteryTids = draftResults.slice(0, 3);
            for (const tid of sameRec[0]) {
                if (lotteryTids.includes(tid)) {
                    // Skip this test, it will fail otherwise
                    sameRec.shift();
                    break;
                }
            }

            for (const tids of sameRec) {
                const r1picks = draftResults.filter(
                    (tid, i) => tids.includes(tid) && i < 30,
                );
                const r2picks = draftResults.filter(
                    (tid, i) => tids.includes(tid) && i >= 30,
                );
                assert.deepEqual(r1picks, r2picks.reverse());
            }
        });
    });

    describe("#updateChances()", () => {
        it("should distribute combinations to teams with the same record", async () => {
            const teams = await idb.getCopies.teamsPlus({
                attrs: ["tid", "cid"],
                seasonAttrs: ["winp", "playoffRoundsWon"],
                season: g.season,
            });
            const chances = [
                250,
                199,
                156,
                119,
                88,
                63,
                43,
                28,
                17,
                11,
                8,
                7,
                6,
                5,
            ];
            // index instead of tid
            const sameRec = [[6, 7, 8], [10, 11, 12]];
            lotterySort(teams);
            updateChances(chances, teams, false);
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
            updateChances(chances, teams, true);
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
            return testDraftUntilUserOrEnd(
                userPick2 - userPick1 - 1,
                userPick2 - 1,
            );
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
