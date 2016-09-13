import assert from 'assert';
import db from '../../db';
import g from '../../globals';
import league from '../../core/league';
import testHelpers from '../helpers';

describe("core/league", () => {
    before(async () => {
        await db.connectMeta();
        await league.create("Test", 0, undefined, 2013, false);
    });
    // After not needed because last test removes DB

    describe("#create()", () => {
        it("should add entry in meta leagues object store", async () => {
            const l = await g.dbm.leagues.get(g.lid);
            assert.equal(l.name, "Test");
            assert.equal(l.tid, 0);
            assert.equal(l.phaseText, `${g.startingSeason} preseason`);
        });
        it("should create all necessary object stores", () => {
            assert.equal(g.dbl.objectStoreNames.length, 18);
            assert.equal(g.dbl.objectStoreNames.contains("awards"), true);
            assert.equal(g.dbl.objectStoreNames.contains("events"), true);
            assert.equal(g.dbl.objectStoreNames.contains("draftOrder"), true);
            assert.equal(g.dbl.objectStoreNames.contains("gameAttributes"), true);
            assert.equal(g.dbl.objectStoreNames.contains("games"), true);
            assert.equal(g.dbl.objectStoreNames.contains("messages"), true);
            assert.equal(g.dbl.objectStoreNames.contains("negotiations"), true);
            assert.equal(g.dbl.objectStoreNames.contains("players"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playerFeats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playerStats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playoffSeries"), true);
            assert.equal(g.dbl.objectStoreNames.contains("releasedPlayers"), true);
            assert.equal(g.dbl.objectStoreNames.contains("schedule"), true);
            assert.equal(g.dbl.objectStoreNames.contains("teams"), true);
            assert.equal(g.dbl.objectStoreNames.contains("teamSeasons"), true);
            assert.equal(g.dbl.objectStoreNames.contains("teamStats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("trade"), true);
        });
        it("should initialize gameAttributes object store", async () => {
            const gameAttributes = await g.dbl.gameAttributes.getAll();
            const gTest = gameAttributes.reduce((obj, row) => { obj[row.key] = row.value; return obj; }, {});

            assert.equal(gTest.gamesInProgress, false);
            assert.equal(typeof gTest.lastDbChange, "number");
            assert.equal(gTest.leagueName, "Test");
            assert.equal(gTest.phase, 0);
            assert.equal(gTest.phaseText, `${gTest.startingSeason} preseason`);
            assert.equal(gTest.season, gTest.startingSeason);
            assert.equal(gTest.statusText, "Idle");
            assert.equal(gTest.stopGames, false);
            assert.equal(gTest.userTid, 0);
            assert.equal(gTest.gameOver, false);
            assert.equal(gTest.daysLeft, 0);
            assert.equal(gTest.showFirstOwnerMessage, true);

            assert.equal(Object.keys(gTest).length, 38);
        });
        it("should initialize draftOrder object store", async () => {
            const draftOrder = await g.dbl.draftOrder.getAll();
            assert.equal(draftOrder.length, 1);
            assert.equal(draftOrder[0].rid, 1);
            assert.equal(draftOrder[0].draftOrder.length, 0);
        });
        it("should initialize teams object store", async () => {
            const teams = await g.dbl.teams.getAll();

            const cids = teams.map(t => t.cid);
            const dids = teams.map(t => t.did);

            assert.equal(teams.length, g.numTeams);
            for (let i = 0; i < 2; i++) {
                assert.equal(testHelpers.numInArrayEqualTo(cids, i), 15);
            }
            for (let i = 0; i < 6; i++) {
                assert.equal(testHelpers.numInArrayEqualTo(dids, i), 5);
            }
            for (let i = 0; i < g.numTeams; i++) {
                assert.equal(typeof teams[i].name, "string");
                assert.equal(typeof teams[i].region, "string");
                assert.equal(typeof teams[i].tid, "number");
            }
        });
        it("should initialize teamSeasons object store", async () => {
            const teamSeasons = await g.dbl.teamSeasons.getAll();
            assert.equal(teamSeasons.length, g.numTeams);
        });
        it("should initialize teamStats object store", async () => {
            const teamStats = await g.dbl.teamStats.getAll();
            assert.equal(teamStats.length, g.numTeams);
        });
        it("should initialize trade object store", async () => {
            const tr = await g.dbl.trade.getAll();
            assert.equal(tr.length, 1);
            assert.equal(tr[0].rid, 0);
            assert.equal(tr[0].teams.length, 2);
        });
        it("should initialize players object store", async () => {
            const players = await g.dbl.players.getAll();
            assert.equal(players.length, 33 * 14 + 70 * 3);
        });
    });

    describe("#remove()", () => {
        it("should remove league database", () => league.remove(g.lid));
    });
});
