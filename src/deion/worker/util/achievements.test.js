import assert from "assert";
import testHelpers from "../../test/helpers";
import { player, team } from "../core";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import achievements from "./achievements";

const get = slug => {
    const achievement = achievements.find(
        achievement2 => slug === achievement2.slug,
    );
    if (!achievement) {
        throw new Error(`No achievement found for slug "${slug}"`);
    }
    return achievement;
};

describe("worker/util/account/checkAchievement", () => {
    beforeAll(async () => {
        testHelpers.resetG();
        g.season = 2013;
        g.userTid = 7;

        const teamsDefault = helpers.getTeamsDefault();
        await testHelpers.resetCache({
            players: [
                player.generate(0, 30, 2010, true, 15.5),
                player.generate(0, 30, 2010, true, 15.5),
            ],
            teams: teamsDefault.map(team.generate),
            teamSeasons: teamsDefault.map(t => team.genSeasonRow(t.tid)),
        });

        idb.league = testHelpers.mockIDBLeague();
    });
    afterAll(() => {
        idb.league = undefined;
    });

    const addExtraSeasons = async (tid, lastSeason, extraSeasons) => {
        for (const extraSeason of extraSeasons) {
            lastSeason += 1;
            extraSeason.tid = tid;
            extraSeason.season = lastSeason;
            await idb.cache.teamSeasons.add(extraSeason);
        }
    };

    describe("dynasty*", () => {
        afterAll(async () => {
            const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
                "teamSeasonsByTidSeason",
                [[g.userTid], [g.userTid, "Z"]],
            );
            for (const teamSeason of teamSeasons) {
                if (teamSeason.season > g.season) {
                    await idb.cache.teamSeasons.delete(teamSeason.rid);
                }
            }
        });

        test("gracefully handle case where not enough seasons are present", async () => {
            let awarded = await get("dynasty").check();
            assert.equal(awarded, false);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, false);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, false);
        });
        test("award dynasty for 6 titles in 8 seasons, but not dynasty_2 or dynasty_3", async () => {
            const extraSeasons = [
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
            ];

            // Add 6 to the existing season, making 7 seasons total
            await addExtraSeasons(g.userTid, g.season, extraSeasons);

            let awarded = await get("dynasty").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, false);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, false);

            // Add 1 to the existing 7 seasons, making 8 seasons total
            await addExtraSeasons(g.userTid, g.season + 6, [
                { playoffRoundsWon: 3 },
            ]);

            awarded = await get("dynasty").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, false);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, false);
        });
        test("award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", async () => {
            // Update non-winning years from last test
            let teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season + 7],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("dynasty").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, false);
        });
        test("award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", async () => {
            const extraSeasons = [
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
                { playoffRoundsWon: 4 },
            ];

            // Add 5 to the existing season, making 13 seasons total
            await addExtraSeasons(g.userTid, g.season + 7, extraSeasons);

            let teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 0;
            await idb.cache.teamSeasons.put(teamSeason);

            teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season + 1],
            );
            teamSeason.playoffRoundsWon = 0;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("dynasty").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, true);
        });
        test("award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", async () => {
            // Swap a couple titles to make no 8 in a row
            let teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season + 9],
            );
            teamSeason.playoffRoundsWon = 0;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("dynasty").check();
            assert.equal(awarded, true);

            awarded = await get("dynasty_2").check();
            assert.equal(awarded, false);

            awarded = await get("dynasty_3").check();
            assert.equal(awarded, true);
        });
    });

    describe("moneyball*", () => {
        test("award moneyball and moneyball_2 for title with payroll <= $45M", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            teamSeason.expenses.salary.amount = 45000;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("moneyball").check();
            assert.equal(awarded, true);

            awarded = await get("moneyball_2").check();
            assert.equal(awarded, true);
        });
        test("don't award either if didn't win title", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 3;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("moneyball").check();
            assert.equal(awarded, false);

            awarded = await get("moneyball_2").check();
            assert.equal(awarded, false);
        });
        test("award moneyball but not moneyball_2 for title with payroll > $45M and <= $60M", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            teamSeason.expenses.salary.amount = 60000;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("moneyball").check();
            assert.equal(awarded, true);

            awarded = await get("moneyball_2").check();
            assert.equal(awarded, false);
        });
        test("don't award either if payroll > $40M", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            teamSeason.expenses.salary.amount = 60001;
            await idb.cache.teamSeasons.put(teamSeason);

            let awarded = await get("moneyball").check();
            assert.equal(awarded, false);

            awarded = await get("moneyball_2").check();
            assert.equal(awarded, false);
        });
    });

    describe("small_market", () => {
        test("award achievement if user's team wins title in a small market", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            teamSeason.pop = 1.5;
            await idb.cache.teamSeasons.put(teamSeason);

            const awarded = await get("small_market").check();
            assert.equal(awarded, true);
        });
        test("don't award achievement if user's team is not in a small market", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            teamSeason.pop = 3;
            await idb.cache.teamSeasons.put(teamSeason);

            const awarded = await get("small_market").check();
            assert.equal(awarded, false);
        });
        test("don't award achievement if user's team does not win the title", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 3;
            teamSeason.pop = 1.5;
            await idb.cache.teamSeasons.put(teamSeason);

            const awarded = await get("small_market").check();
            assert.equal(awarded, false);
        });
    });

    describe("homegrown", () => {
        test("award achievement if user's team wins title with players it drafted", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            for (const p of await idb.cache.players.getAll()) {
                p.draft.tid = g.userTid;
                p.tid = g.userTid;
                await idb.cache.players.put(p);
            }

            const awarded = await get("homegrown").check();
            assert.equal(awarded, true);
        });
        test("don't award achievement if user's team it has another team's drafted player", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            const otherTid = 0;
            const p = (await idb.cache.players.getAll())[0];
            p.draft.tid = otherTid;
            await idb.cache.players.put(p);

            const awarded = await get("homegrown").check();
            assert.equal(awarded, false);
        });
    });

    describe("golden_oldies", () => {
        test("award achievement if all players are old", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 4;
            await idb.cache.teamSeasons.put(teamSeason);

            for (const p of await idb.cache.players.getAll()) {
                p.tid = g.userTid;
                p.draft.year = g.season - 30;
                await idb.cache.players.put(p);
            }

            const awarded = await get("golden_oldies").check();
            assert.equal(awarded, true);

            const awarded2 = await get("golden_oldies_2").check();
            assert.equal(awarded2, false);

            const awarded3 = await get("golden_oldies_3").check();
            assert.equal(awarded3, false);
        });
        test("don't award achievement if user's team didn't win title", async () => {
            const teamSeason = await idb.cache.teamSeasons.indexGet(
                "teamSeasonsByTidSeason",
                [g.userTid, g.season],
            );
            teamSeason.playoffRoundsWon = 3;
            await idb.cache.teamSeasons.put(teamSeason);

            const awarded = await get("golden_oldies").check();
            assert.equal(awarded, false);
        });
    });
});
