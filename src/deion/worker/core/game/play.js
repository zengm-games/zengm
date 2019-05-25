// @flow

import { PHASE, PLAYER } from "../../../common";
import { finances, freeAgents, phase, player, season, team, trade } from "..";
import loadTeams from "./loadTeams";
import updatePlayoffSeries from "./updatePlayoffSeries";
import writeGameStats from "./writeGameStats";
import writePlayerStats from "./writePlayerStats";
import writeTeamStats from "./writeTeamStats";
import { idb } from "../../db";
import {
    g,
    helpers,
    lock,
    logEvent,
    overrides,
    toUI,
    updatePlayMenu,
    updateStatus,
} from "../../util";
import type { Conditions } from "../../../common/types";

/**
 * Play one or more days of games.
 *
 * This also handles the case where there are no more games to be played by switching the phase to either the playoffs or before the draft, as appropriate.
 *
 * @memberOf core.game
 * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all games will be simulated up until either the end of the regular season or the end of the playoffs, whichever happens first.
 * @param {boolean} start Is this a new request from the user to play games (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed. Default true.
 * @param {number?} gidPlayByPlay If this number matches a game ID number, then an array of strings representing the play-by-play game simulation are included in the api.realtimeUpdate raw call.
 */
const play = async (
    numDays: number,
    conditions: Conditions,
    start?: boolean = true,
    gidPlayByPlay?: number,
) => {
    // This is called when there are no more games to play, either due to the user's request (e.g. 1 week) elapsing or at the end of the regular season
    const cbNoGames = async (playoffsOver?: boolean = false) => {
        await updateStatus("Saving...");
        await idb.cache.flush();

        await updateStatus("Idle");
        lock.set("gameSim", false);

        // Check to see if the season is over
        if (g.phase < PHASE.PLAYOFFS) {
            const schedule = await season.getSchedule();
            if (schedule.length === 0) {
                await phase.newPhase(
                    PHASE.PLAYOFFS,
                    conditions,
                    gidPlayByPlay !== undefined,
                );
            }
        } else if (playoffsOver) {
            await phase.newPhase(
                PHASE.DRAFT_LOTTERY,
                conditions,
                gidPlayByPlay !== undefined,
            );
        }

        await updatePlayMenu();
    };

    // Saves a vector of results objects for a day, as is output from cbSimGames
    const cbSaveResults = async results => {
        const {
            injuryTexts,
            pidsInjuredOneGameOrLess,
            stopPlay,
        } = await writePlayerStats(results, conditions); // Before writeGameStats, so injury is set correctly

        const gidsFinished = await Promise.all(
            results.map(async result => {
                const att = await writeTeamStats(result);
                await writeGameStats(result, att, conditions);
                return result.gid;
            }),
        );

        const promises = [];

        // Update playoff series W/L
        if (g.phase === PHASE.PLAYOFFS) {
            promises.push(updatePlayoffSeries(results, conditions));
        }

        // Delete finished games from schedule
        for (let j = 0; j < gidsFinished.length; j++) {
            promises.push(idb.cache.schedule.delete(gidsFinished[j]));
        }

        // Update ranks
        promises.push(finances.updateRanks(["expenses", "revenues"]));

        if (injuryTexts.length > 0) {
            logEvent(
                {
                    type: "injuredList",
                    text: injuryTexts.join("<br>"),
                    showNotification: true,
                    persistent: stopPlay,
                    saveToDb: false,
                },
                conditions,
            );
        }

        const healedTexts = [];

        // Injury countdown - This must be after games are saved, of there is a race condition involving new injury assignment in writeStats
        const players = await idb.cache.players.indexGetAll("playersByTid", [
            PLAYER.FREE_AGENT,
            Infinity,
        ]);
        for (const p of players) {
            let changed = false;
            if (p.injury.gamesRemaining > 0) {
                p.injury.gamesRemaining -= 1;
                changed = true;
            }
            // Is it already over?
            if (p.injury.type !== "Healthy" && p.injury.gamesRemaining <= 0) {
                p.injury = { type: "Healthy", gamesRemaining: 0 };
                changed = true;

                const healedText = `${
                    p.ratings[p.ratings.length - 1].pos
                } <a href="${helpers.leagueUrl(["player", p.pid])}">${
                    p.firstName
                } ${p.lastName}</a>`;
                if (
                    p.tid === g.userTid &&
                    !pidsInjuredOneGameOrLess.has(p.pid)
                ) {
                    healedTexts.push(healedText);
                }

                logEvent(
                    {
                        type: "healed",
                        text: `${healedText} has recovered from his injury.`,
                        showNotification: false,
                        pids: [p.pid],
                        tids: [p.tid],
                    },
                    conditions,
                );
            }

            // Also check for gamesUntilTradable
            if (!p.hasOwnProperty("gamesUntilTradable")) {
                p.gamesUntilTradable = 0; // Initialize for old leagues
                changed = true;
            } else if (p.gamesUntilTradable > 0) {
                p.gamesUntilTradable -= 1;
                changed = true;
            }

            if (changed) {
                await idb.cache.players.put(p);
            }
        }

        if (healedTexts.length > 0) {
            logEvent(
                {
                    type: "healedList",
                    text: healedTexts.join("<br>"),
                    showNotification: true,
                    saveToDb: false,
                },
                conditions,
            );
        }

        await Promise.all(promises);

        await overrides.util.advStats();

        const updateEvents = ["gameSim"];

        // Tragic deaths only happen during the regular season!
        if (g.phase !== PHASE.PLAYOFFS && Math.random() < g.tragicDeathRate) {
            await player.killOne(conditions);
            if (g.stopOnInjury) {
                lock.set("stopGameSim", true);
            }
            updateEvents.push("playerMovement");
        }

        const playoffsOver =
            g.phase === PHASE.PLAYOFFS &&
            (await season.newSchedulePlayoffsDay());

        // If there was a play by play done for one of these games, get it
        let raw;
        let url;
        if (gidPlayByPlay !== undefined) {
            for (let i = 0; i < results.length; i++) {
                if (results[i].playByPlay !== undefined) {
                    raw = {
                        gidPlayByPlay,
                        playByPlay: results[i].playByPlay,
                    };
                    url = helpers.leagueUrl(["live_game"]);
                }
            }

            await toUI(["realtimeUpdate", updateEvents, url, raw], conditions);
        } else {
            url = undefined;

            await toUI(["realtimeUpdate", updateEvents]);
        }

        if (numDays - 1 <= 0 || playoffsOver) {
            await cbNoGames(playoffsOver);
        } else {
            await play(numDays - 1, conditions, false);
        }
    };

    // Simulates a day of games (whatever is in schedule) and passes the results to cbSaveResults
    const cbSimGames = async (schedule, teams) => {
        const results = [];
        for (let i = 0; i < schedule.length; i++) {
            const doPlayByPlay = gidPlayByPlay === schedule[i].gid;
            const gs = new overrides.core.GameSim(
                schedule[i].gid,
                teams[schedule[i].homeTid],
                teams[schedule[i].awayTid],
                doPlayByPlay,
            );
            results.push(gs.run());
        }
        await cbSaveResults(results);
    };

    // Simulates a day of games. If there are no games left, it calls cbNoGames.
    // Promise is resolved after games are run
    const cbPlayGames = async () => {
        if (numDays === 1) {
            await updateStatus(
                `Playing (1 ${
                    overrides.common.constants.TIME_BETWEEN_GAMES
                } left)`,
            );
        } else {
            await updateStatus(
                `Playing (${numDays} ${
                    overrides.common.constants.TIME_BETWEEN_GAMES
                }s left)`,
            );
        }

        let schedule = await season.getSchedule(true);

        // Stop if no games
        // This should also call cbNoGames after the playoffs end, because g.phase will have been incremented by season.newSchedulePlayoffsDay after the previous day's games
        if (schedule.length === 0 && g.phase !== PHASE.PLAYOFFS) {
            return cbNoGames();
        }

        // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
        const teams = await loadTeams();

        // Play games
        // Will loop through schedule and simulate all games
        if (schedule.length === 0 && g.phase === PHASE.PLAYOFFS) {
            // Sometimes the playoff schedule isn't made the day before, so make it now
            // This works because there should always be games in the playoffs phase. The next phase will start before reaching this point when the playoffs are over.

            await season.newSchedulePlayoffsDay();
            schedule = await season.getSchedule(true);
        }
        await cbSimGames(schedule, teams);
    };

    // This simulates a day, including game simulation and any other bookkeeping that needs to be done
    const cbRunDay = async () => {
        // setTimeout is for responsiveness during gameSim with UI that doesn't hit IDB
        if (numDays > 0) {
            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock), continue even if stopGameSim was just seen
            const stopGameSim = lock.get("stopGameSim");
            if (start || !stopGameSim) {
                // If start is set, then reset stopGames
                if (stopGameSim) {
                    lock.set("stopGameSim", false);
                }

                if (g.phase !== PHASE.PLAYOFFS) {
                    await freeAgents.decreaseDemands();
                    await freeAgents.autoSign();
                    if (Math.random() < 0.5) {
                        await trade.betweenAiTeams();
                    }
                }

                await cbPlayGames();
            } else {
                // Update UI if stopped
                await cbNoGames();
            }
        } else if (numDays === 0) {
            // If this is the last day, update play menu
            await cbNoGames();
        }
    };

    // If this is a request to start a new simulation... are we allowed to do
    // that? If so, set the lock and update the play menu
    if (start) {
        const canStartGames = await lock.canStartGames();
        if (canStartGames) {
            const userTeamSizeError = await team.checkRosterSizes();
            if (userTeamSizeError === undefined) {
                await updatePlayMenu();
                await cbRunDay();
            } else {
                lock.set("gameSim", false); // Counteract auto-start in lock.canStartGames
                await updateStatus("Idle");
                logEvent(
                    {
                        type: "error",
                        text: userTeamSizeError,
                        saveToDb: false,
                    },
                    conditions,
                );
            }
        }
    } else {
        await cbRunDay();
    }
};

export default play;
