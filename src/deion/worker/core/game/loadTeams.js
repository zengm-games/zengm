// @flow

import range from "lodash/range";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, overrides } from "../../util";

/**
 * Load all teams into an array of team objects.
 *
 * The team objects contain all the information needed to simulate games. It would be more efficient if it only loaded team data for teams that are actually playing, particularly in the playoffs.
 *
 * @memberOf core.game
 * @param {IDBTransaction} ot An IndexedDB transaction on players and teams.
 * @param {Promise} Resolves to an array of team objects, ordered by tid.
 */
const loadTeams = async () => {
    return Promise.all(
        range(g.numTeams).map(async tid => {
            const [players, { cid, did }, teamSeason] = await Promise.all([
                idb.cache.players.indexGetAll("playersByTid", tid),
                idb.cache.teams.get(tid),
                idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
                    tid,
                    g.season,
                ]),
            ]);

            players.sort((a, b) => a.rosterOrder - b.rosterOrder);

            // Initialize team composite rating object
            const compositeRating = {};
            for (const rating of Object.keys(overrides.COMPOSITE_WEIGHTS)) {
                compositeRating[rating] = 0;
            }

            const t = {
                id: tid,
                pace: 0,
                won: teamSeason.won,
                lost: teamSeason.lost,
                cid,
                did,
                stat: {},
                player: [],
                synergy: { off: 0, def: 0, reb: 0 },
                healthRank: teamSeason.expenses.health.rank,
                compositeRating,
            };

            for (let i = 0; i < players.length; i++) {
                let rating = players[i].ratings.find(
                    r => r.season === g.season,
                );
                if (rating === undefined) {
                    // Sometimes this happens for unknown reasons, so gracefully handle it
                    rating = players[i].ratings[players[i].ratings.length - 1];
                }

                const p = {
                    id: players[i].pid,
                    name: `${players[i].firstName} ${players[i].lastName}`,
                    pos: rating.pos,
                    valueNoPot: players[i].valueNoPot,
                    stat: {},
                    compositeRating: {},
                    skills: rating.skills,
                    injury: players[i].injury,
                    injured: players[i].injury.type !== "Healthy",
                    ptModifier: players[i].ptModifier,
                };

                // Reset ptModifier for AI teams. This should not be necessary since it should always be 1, but let's be safe.
                if (!g.userTids.includes(t.id)) {
                    p.ptModifier = 1;
                }

                // These use the same formulas as the skill definitions in player.skills!
                for (const k of helpers.keys(overrides.COMPOSITE_WEIGHTS)) {
                    p.compositeRating[k] = player.compositeRating(
                        rating,
                        overrides.COMPOSITE_WEIGHTS[k].ratings,
                        overrides.COMPOSITE_WEIGHTS[k].weights,
                        false,
                    );
                }
                // eslint-disable-next-line operator-assignment
                p.compositeRating.usage = p.compositeRating.usage ** 1.9;

                p.stat = {
                    gs: 0,
                    min: 0,
                    fg: 0,
                    fga: 0,
                    fgAtRim: 0,
                    fgaAtRim: 0,
                    fgLowPost: 0,
                    fgaLowPost: 0,
                    fgMidRange: 0,
                    fgaMidRange: 0,
                    tp: 0,
                    tpa: 0,
                    ft: 0,
                    fta: 0,
                    pm: 0,
                    orb: 0,
                    drb: 0,
                    ast: 0,
                    tov: 0,
                    stl: 0,
                    blk: 0,
                    ba: 0,
                    pf: 0,
                    pts: 0,
                    courtTime: 0,
                    benchTime: 0,
                    energy: 1,
                };

                t.player.push(p);
            }

            // Number of players to factor into pace and defense rating calculation
            let numPlayers = t.player.length;
            if (numPlayers > 7) {
                numPlayers = 7;
            }

            // Would be better if these were scaled by average min played and endurancence
            t.pace = 0;
            for (let i = 0; i < numPlayers; i++) {
                t.pace += t.player[i].compositeRating.pace;
            }
            t.pace /= numPlayers;
            t.pace = t.pace * 15 + 100; // Scale between 100 and 115

            t.stat = {
                min: 0,
                fg: 0,
                fga: 0,
                fgAtRim: 0,
                fgaAtRim: 0,
                fgLowPost: 0,
                fgaLowPost: 0,
                fgMidRange: 0,
                fgaMidRange: 0,
                tp: 0,
                tpa: 0,
                ft: 0,
                fta: 0,
                orb: 0,
                drb: 0,
                ast: 0,
                tov: 0,
                stl: 0,
                blk: 0,
                ba: 0,
                pf: 0,
                pts: 0,
                ptsQtrs: [0],
            };

            return t;
        }),
    );
};

export default loadTeams;
