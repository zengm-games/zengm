// @flow

import _ from "underscore";
import { PHASE, PLAYER, g, helpers } from "../../common";
import {
    contractNegotiation,
    draft,
    finances,
    freeAgents,
    league,
    player,
    season,
    team,
} from "../core";
import { idb } from "../db";
import {
    account,
    env,
    genMessage,
    local,
    lock,
    logEvent,
    random,
    toUI,
    updatePhase,
    updatePlayMenu,
    updateStatus,
} from "../util";
import type { Conditions, Phase, UpdateEvents } from "../../common/types";

/**
 * Common tasks run after a new phrase is set.
 *
 * This updates the phase, executes a callback, and (if necessary) updates the UI. It should only be called from one of the NewPhase* functions defined below.
 *
 * @memberOf core.phase
 * @param {number} phase Integer representing the new phase of the game (see other functions in this module).
 * @param {string=} url Optional URL to pass to api.realtimeUpdate for redirecting on new phase. If undefined, then the current page will just be refreshed.
 * @param {Array.<string>=} updateEvents Array of strings.
 * @return {Promise}
 */
async function finalize(
    phase: Phase,
    url: string,
    updateEvents: UpdateEvents = [],
    conditions: Conditions,
) {
    await updateStatus("Saving...");

    // Set phase before saving to database
    await league.setGameAttributes({
        phase,
    });

    // Fill only in preseason, because not much changes before then
    await idb.cache.flush();
    if (phase === PHASE.PRESEASON) {
        await idb.cache.fill();
    }

    lock.set("newPhase", false);
    await updatePhase();
    await updatePlayMenu();
    await updateStatus("Idle");

    updateEvents.push("newPhase");

    // If auto-simulating, initiate next action but don't redirect to a new URL
    if (local.autoPlaySeasons > 0) {
        toUI(["realtimeUpdate", updateEvents], conditions);
        // Not totally sure why setTimeout is needed, but why not?
        setTimeout(() => {
            league.autoPlay(conditions);
        }, 100);
    } else {
        toUI(["realtimeUpdate", updateEvents, url], conditions);
    }
}

async function newPhasePreseason(conditions: Conditions) {
    await freeAgents.autoSign();
    await league.setGameAttributes({ season: g.season + 1 });

    const tids: number[] = _.range(g.numTeams);

    let scoutingRankTemp;
    await Promise.all(
        tids.map(async tid => {
            // Only actually need 3 seasons for userTid, but get it for all just in case there is a
            // skipped season (alternatively could use cursor to just find most recent season, but this
            // is not performance critical code)
            const teamSeasons = await idb.getCopies.teamSeasons({
                tid,
                seasons: [g.season - 3, g.season - 1],
            });
            const prevSeason = teamSeasons[teamSeasons.length - 1];

            // Only need scoutingRank for the user's team to calculate fuzz when ratings are updated below.
            // This is done BEFORE a new season row is added.
            if (tid === g.userTid) {
                scoutingRankTemp = finances.getRankLastThree(
                    teamSeasons,
                    "expenses",
                    "scouting",
                );
            }

            await idb.cache.teamSeasons.add(team.genSeasonRow(tid, prevSeason));
            await idb.cache.teamStats.add(team.genStatsRow(tid));
        }),
    );
    const scoutingRank = scoutingRankTemp;
    if (scoutingRank === undefined) {
        throw new Error("scoutingRank should be defined");
    }

    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [`${g.season - 1}`, `${g.season}`],
    );
    const coachingRanks = teamSeasons.map(
        teamSeason => teamSeason.expenses.coaching.rank,
    );

    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);

    // Small chance that a player was lying about his age!
    if (Math.random() < 0.01) {
        const p = await player.getPlayerFakeAge(players);
        if (p !== undefined) {
            const years = random.randInt(1, 4);
            const age0 = g.season - p.born.year;
            p.born.year -= years;
            const age1 = g.season - p.born.year;

            const name = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                p.firstName
            } ${p.lastName}</a>`;

            const reason = random.choice([
                `A newly discovered Kenyan birth certificate suggests that ${name}`,
                `In a televised press conference, the parents of ${name} explained how they faked his age as a child to make him perform better against younger competition. He`,
                `Internet sleuths on /r/nba uncovered evidence that ${name}`,
                `Internet sleuths on Twitter uncovered evidence that ${name}`,
                `In an emotional interview on 60 Minutes, ${name} admitted that he`,
                `During a preaseason locker room interview, ${name} accidentally revealed that he`,
                `In a Reddit AMA, ${name} confirmed that he`,
                `A recent Wikileaks report revealed that ${name}`,
                `A foreign ID from the stolen luggage of ${name} revealed he`,
            ]);

            logEvent(
                {
                    type: "ageFraud",
                    text: `${reason} is actually ${age1} years old, not ${age0} as was previously thought.`,
                    showNotification: p.tid === g.userTid,
                    pids: [p.pid],
                    tids: [p.tid],
                    persistent: true,
                },
                conditions,
            );

            await idb.cache.players.put(p);
        }
    }

    // Loop through all non-retired players
    for (const p of players) {
        // Update ratings
        player.addRatingsRow(p, scoutingRank);
        player.develop(p, 1, false, coachingRanks[p.tid]);

        // Update player values after ratings changes
        await player.updateValues(p);

        // Add row to player stats if they are on a team
        if (p.tid >= 0) {
            await player.addStatsRow(p, false);
        }

        await idb.cache.players.put(p);
    }

    if (local.autoPlaySeasons > 0) {
        local.autoPlaySeasons -= 1;
    }

    if (env.enableLogging && !env.inCordova) {
        toUI(["emit", "showAd", "modal", local.autoPlaySeasons], conditions);
    }

    return [undefined, ["playerMovement"]];
}

async function newPhaseRegularSeason() {
    const teams = await idb.cache.teams.getAll();
    await season.setSchedule(season.newSchedule(teams));

    if (g.autoDeleteOldBoxScores) {
        await idb.league.tx("games", "readwrite", tx => {
            return tx.games.clear();
        });
    }

    // First message from owner
    if (g.showFirstOwnerMessage) {
        await genMessage({ wins: 0, playoffs: 0, money: 0 });
    } else {
        const nagged = await idb.meta.attributes.get("nagged");

        if (g.season === g.startingSeason + 3 && g.lid > 3 && nagged === 0) {
            await idb.meta.attributes.put(1, "nagged");
            await idb.cache.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text:
                    '<p>Hi. Sorry to bother you, but I noticed that you\'ve been playing this game a bit. Hopefully that means you like it. Either way, we would really appreciate some feedback so we can make this game better. <a href="mailto:commissioner@basketball-gm.com">Send an email</a> (commissioner@basketball-gm.com) or <a href="http://www.reddit.com/r/BasketballGM/">join the discussion on Reddit</a>.</p>',
            });
        } else if (
            (nagged === 1 && Math.random() < 0.25) ||
            (nagged >= 2 && Math.random() < 0.025)
        ) {
            await idb.meta.attributes.put(2, "nagged");
            await idb.cache.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text:
                    '<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/basketball_gm">Follow Basketball GM on Twitter</a></p><p><a href="https://www.facebook.com/basketball.general.manager">Like Basketball GM on Facebook</a></p><p><a href="http://www.reddit.com/r/BasketballGM/">Discuss Basketball GM on Reddit</a></p><p><a href="https://discord.gg/caPFuM9">Chat with Basketball GM players and devs on Discord</a></p><p>The more people that play Basketball GM, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:commissioner@basketball-gm.com">email me</a>.</p>',
            });
        } else if (nagged >= 2 && nagged <= 3 && Math.random() < 0.5) {
            // Skipping 3, obsolete
            await idb.meta.attributes.put(4, "nagged");
            await idb.cache.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text:
                    '<p>Want to try multiplayer Basketball GM? Some intrepid souls have banded together to form online multiplayer leagues, and <a href="http://basketball-gm.co.nf/">you can find a user-made list of them here</a>.</p>',
            });
        }
    }

    return [undefined, ["playerMovement"]];
}

async function newPhasePlayoffs(
    conditions: Conditions,
    liveGameSim?: boolean = false,
) {
    // Achievements after regular season
    account.checkAchievement.septuawinarian(conditions);

    // Set playoff matchups
    const teams = helpers.orderByWinp(
        await idb.getCopies.teamsPlus({
            attrs: ["tid", "cid"],
            seasonAttrs: ["winp", "won"],
            season: g.season,
        }),
    );

    // Add entry for wins for each team, delete seasonAttrs just used for sorting
    for (let i = 0; i < teams.length; i++) {
        teams[i].won = 0;
        teams[i].winp = teams[i].seasonAttrs.winp;
        delete teams[i].seasonAttrs;
    }

    const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

    for (const tid of tidPlayoffs) {
        logEvent(
            {
                type: "playoffs",
                text: `The <a href="${helpers.leagueUrl([
                    "roster",
                    g.teamAbbrevsCache[tid],
                    g.season,
                ])}">${
                    g.teamNamesCache[tid]
                }</a> made the <a href="${helpers.leagueUrl([
                    "playoffs",
                    g.season,
                ])}">playoffs</a>.`,
                showNotification: tid === g.userTid,
                tids: [tid],
            },
            conditions,
        );
    }

    await idb.cache.playoffSeries.put({
        season: g.season,
        currentRound: 0,
        series,
    });

    // Add row to team stats and team season attributes
    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsBySeasonTid",
        [`${g.season}`, `${g.season},Z`],
    );
    for (const teamSeason of teamSeasons) {
        if (tidPlayoffs.includes(teamSeason.tid)) {
            await idb.cache.teamStats.add(
                team.genStatsRow(teamSeason.tid, true),
            );

            teamSeason.playoffRoundsWon = 0;

            // More hype for making the playoffs
            teamSeason.hype += 0.05;
            if (teamSeason.hype > 1) {
                teamSeason.hype = 1;
            }
        } else {
            // Less hype for missing the playoffs
            teamSeason.hype -= 0.05;
            if (teamSeason.hype < 0) {
                teamSeason.hype = 0;
            }
        }

        await idb.cache.teamSeasons.put(teamSeason);
    }

    // Add row to player stats
    await Promise.all(
        tidPlayoffs.map(async tid => {
            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                tid,
            );
            for (const p of players) {
                await player.addStatsRow(p, true);
                await idb.cache.players.put(p);
            }
        }),
    );

    await Promise.all([
        finances.assessPayrollMinLuxury(),
        season.newSchedulePlayoffsDay(),
    ]);

    // Don't redirect if we're viewing a live game now
    let url;
    if (!liveGameSim) {
        url = helpers.leagueUrl(["playoffs"]);
    }

    return [url, ["teamFinances"]];
}

async function newPhaseBeforeDraft(
    conditions: Conditions,
    liveGameSim?: boolean = false,
) {
    // Achievements after playoffs
    account.checkAchievement.fo_fo_fo(conditions);
    account.checkAchievement["98_degrees"](conditions);
    account.checkAchievement.dynasty(conditions);
    account.checkAchievement.dynasty_2(conditions);
    account.checkAchievement.dynasty_3(conditions);
    account.checkAchievement.moneyball(conditions);
    account.checkAchievement.moneyball_2(conditions);
    account.checkAchievement.small_market(conditions);

    await season.doAwards(conditions);

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid"],
        seasonAttrs: ["playoffRoundsWon"],
        season: g.season,
    });

    // Give award to all players on the championship team
    const t = teams.find(
        t2 => t2.seasonAttrs.playoffRoundsWon === g.numPlayoffRounds,
    );
    if (t !== undefined) {
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            t.tid,
        );
        for (const p of players) {
            p.awards.push({ season: g.season, type: "Won Championship" });
            await idb.cache.players.put(p);
        }
    }

    // Do annual tasks for each player, like checking for retirement

    // Players meeting one of these cutoffs might retire
    const maxAge = 34;
    const minPot = 40;

    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        let update = false;

        // Get player stats, used for HOF calculation
        const playerStats = await idb.getCopies.playerStats({ pid: p.pid });

        const age = g.season - p.born.year;
        const pot = p.ratings[p.ratings.length - 1].pot;

        if (age > maxAge || pot < minPot) {
            if (age > 34 || p.tid === PLAYER.FREE_AGENT) {
                // Only players older than 34 or without a contract will retire
                let excessAge = 0;
                if (age > 34) {
                    excessAge = (age - 34) / 20; // 0.05 for each year beyond 34
                }
                const excessPot = (40 - pot) / 50; // 0.02 for each potential rating below 40 (this can be negative)
                if (excessAge + excessPot + random.gauss(0, 1) > 0) {
                    player.retire(p, playerStats, conditions);
                    update = true;
                }
            }
        }

        // Update "free agent years" counter and retire players who have been free agents for more than one years
        if (p.tid === PLAYER.FREE_AGENT) {
            if (p.yearsFreeAgent >= 1) {
                player.retire(p, playerStats, conditions);
                update = true;
            } else {
                p.yearsFreeAgent += 1;
            }
            p.contract.exp += 1;
            update = true;
        } else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
            p.yearsFreeAgent = 0;
            update = true;
        }

        // Heal injures
        if (p.injury.type !== "Healthy") {
            // This doesn't use g.numGames because that would unfairly make injuries last longer if it was lower - if anything injury duration should be modulated based on that, but oh well
            if (p.injury.gamesRemaining <= 82) {
                p.injury = { type: "Healthy", gamesRemaining: 0 };
            } else {
                p.injury.gamesRemaining -= 82;
            }
            update = true;
        }

        if (update) {
            await idb.cache.players.put(p);
        }
    }

    const releasedPlayers = await idb.cache.releasedPlayers.getAll();
    for (const rp of releasedPlayers) {
        if (rp.contract.exp <= g.season && typeof rp.rid === "number") {
            await idb.cache.releasedPlayers.delete(rp.rid);
        }
    }

    await team.updateStrategies();

    // Achievements after awards
    account.checkAchievement.hardware_store(conditions);
    account.checkAchievement.sleeper_pick(conditions);

    const deltas = await season.updateOwnerMood();
    await genMessage(deltas);

    // Don't redirect if we're viewing a live game now
    let url;
    if (!liveGameSim) {
        url = helpers.leagueUrl(["history"]);
    }

    toUI(["bbgmPing", "season"], conditions);

    return [url, ["playerMovement"]];
}

async function newPhaseDraft(conditions: Conditions) {
    // Kill off old retired players (done here since not much else happens in this phase change, so making it a little
    // slower is fine). This assumes all killable players have no changes in the cache, which is almost certainly true,
    // but under certain rare cases could cause a minor problem.
    const promises = [];
    await idb.league.players.index("tid").iterate(PLAYER.RETIRED, p => {
        if (p.hasOwnProperty("diedYear") && p.diedYear) {
            return;
        }

        // Formula badly fit to http://www.ssa.gov/oact/STATS/table4c6.html
        const probDeath =
            0.0001165111 * Math.exp(0.0761889274 * (g.season - p.born.year));

        if (Math.random() < probDeath) {
            p.diedYear = g.season;
            promises.push(idb.cache.players.put(p)); // Can't await here because of Firefox IndexedDB issues
        }
    });
    await Promise.all(promises);

    // Run lottery only if it hasn't been done yet
    const draftLotteryResult = await idb.getCopy.draftLotteryResults({
        season: g.season,
    });
    if (!draftLotteryResult) {
        await draft.genOrder(false, conditions);
    }

    // This is a hack to handle weird cases where already-drafted players have draft.year set to the current season, which fucks up the draft UI
    const players = await idb.cache.players.getAll();
    for (const p of players) {
        if (p.draft.year === g.season && p.tid >= 0) {
            p.draft.year -= 1;
            await idb.cache.players.put(p);
        }
    }

    return [helpers.leagueUrl(["draft"]), []];
}

async function newPhaseAfterDraft() {
    await draft.genPicks(g.season + 4);

    // Delete any old draft picks
    const draftPicks = await idb.cache.draftPicks.getAll();
    for (const dp of draftPicks) {
        if (dp.season <= g.season) {
            await idb.cache.draftPicks.delete(dp.dpid);
        }
    }

    return [undefined, ["playerMovement"]];
}

async function newPhaseResignPlayers(conditions: Conditions) {
    const baseMoods = await player.genBaseMoods();

    // Re-sign players on user's team, and some AI players
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        if (
            p.contract.exp <= g.season &&
            g.userTids.includes(p.tid) &&
            local.autoPlaySeasons === 0
        ) {
            const tid = p.tid;

            // Add to free agents first, to generate a contract demand, then open negotiations with player
            await player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
            const error = await contractNegotiation.create(p.pid, true, tid);
            if (error !== undefined && error) {
                logEvent(
                    {
                        type: "refuseToSign",
                        text: error,
                        pids: [p.pid],
                        tids: [tid],
                    },
                    conditions,
                );
            }
        }
    }

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
}

async function newPhaseFreeAgency(conditions: Conditions) {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["strategy"],
        season: g.season,
    });
    const strategies = teams.map(t => t.strategy);

    // Delete all current negotiations to resign players
    await contractNegotiation.cancelAll();

    const baseMoods = await player.genBaseMoods();

    // Reset contract demands of current free agents and undrafted players
    // KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.UNDRAFTED,
        PLAYER.FREE_AGENT,
    ]);
    for (const p of players) {
        await player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
    }

    // AI teams re-sign players or they become free agents
    // Run this after upding contracts for current free agents, or addToFreeAgents will be called twice for these guys
    const players2 = await idb.cache.players.indexGetAll("playersByTid", [
        0,
        Infinity,
    ]);
    for (const p of players2) {
        if (
            p.contract.exp <= g.season &&
            (!g.userTids.includes(p.tid) || local.autoPlaySeasons > 0)
        ) {
            // Automatically negotiate with teams
            const factor = strategies[p.tid] === "rebuilding" ? 0.4 : 0;

            if (Math.random() < p.value / 100 - factor) {
                // Should eventually be smarter than a coin flip
                // See also core.team
                const contract = player.genContract(p);
                contract.exp += 1; // Otherwise contracts could expire this season
                player.setContract(p, contract, true);
                p.gamesUntilTradable = 15;

                logEvent(
                    {
                        type: "reSigned",
                        text: `The <a href="${helpers.leagueUrl([
                            "roster",
                            g.teamAbbrevsCache[p.tid],
                            g.season,
                        ])}">${
                            g.teamNamesCache[p.tid]
                        }</a> re-signed <a href="${helpers.leagueUrl([
                            "player",
                            p.pid,
                        ])}">${p.firstName} ${
                            p.lastName
                        }</a> for ${helpers.formatCurrency(
                            p.contract.amount / 1000,
                            "M",
                        )}/year through ${p.contract.exp}.`,
                        showNotification: false,
                        pids: [p.pid],
                        tids: [p.tid],
                    },
                    conditions,
                );

                // Else branch include call to addToFreeAgents, which handles updating the database
                await idb.cache.players.put(p);
            } else {
                await player.addToFreeAgents(
                    p,
                    PHASE.RESIGN_PLAYERS,
                    baseMoods,
                );
            }
        }
    }

    // Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
    const players3 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_2,
    );
    for (const p of players3) {
        p.tid = PLAYER.UNDRAFTED;
        p.ratings[0].fuzz /= 2;
        await idb.cache.players.put(p);
    }
    const players4 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_3,
    );
    for (const p of players4) {
        p.tid = PLAYER.UNDRAFTED_2;
        p.ratings[0].fuzz /= 2;
        await idb.cache.players.put(p);
    }
    idb.cache.markDirtyIndexes("players");
    await draft.genPlayers(PLAYER.UNDRAFTED_3);

    return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
}

async function newPhaseFantasyDraft(conditions: Conditions, position: number) {
    await contractNegotiation.cancelAll();
    await draft.genOrderFantasy(position);
    await league.setGameAttributes({ nextPhase: g.phase });
    await idb.cache.releasedPlayers.clear();

    // Protect draft prospects from being included in this
    const playersUndrafted = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );
    for (const p of playersUndrafted) {
        p.tid = PLAYER.UNDRAFTED_FANTASY_TEMP;
        await idb.cache.players.put(p);
    }

    // Make all players draftable
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        p.tid = PLAYER.UNDRAFTED;
        await idb.cache.players.put(p);
    }

    idb.cache.markDirtyIndexes("players");

    // Return traded draft picks to original teams
    const draftPicks = await idb.cache.draftPicks.getAll();
    for (const dp of draftPicks) {
        if (dp.tid !== dp.originalTid) {
            dp.tid = dp.originalTid;
            await idb.cache.draftPicks.put(dp);
        }
    }
    idb.cache.markDirtyIndexes("draftPicks");

    return [helpers.leagueUrl(["draft"]), ["playerMovement"]];
}

/**
 * Set a new phase of the game.
 *
 * @memberOf core.phase
 * @param {number} phase Numeric phase ID. This should always be one of the PHASE.* variables defined in globals.js.
 * @param {} extra Parameter containing extra info to be passed to phase changing function. Currently only used for newPhaseFantasyDraft.
 * @return {Promise}
 */
async function newPhase(phase: Phase, conditions: Conditions, extra?: any) {
    // Prevent at least some cases of code running twice
    if (phase === g.phase) {
        return;
    }

    const phaseChangeInfo = {
        [PHASE.PRESEASON]: {
            func: newPhasePreseason,
        },
        [PHASE.REGULAR_SEASON]: {
            func: newPhaseRegularSeason,
        },
        [PHASE.PLAYOFFS]: {
            func: newPhasePlayoffs,
        },
        [PHASE.DRAFT_LOTTERY]: {
            func: newPhaseBeforeDraft,
        },
        [PHASE.DRAFT]: {
            func: newPhaseDraft,
        },
        [PHASE.AFTER_DRAFT]: {
            func: newPhaseAfterDraft,
        },
        [PHASE.RESIGN_PLAYERS]: {
            func: newPhaseResignPlayers,
        },
        [PHASE.FREE_AGENCY]: {
            func: newPhaseFreeAgency,
        },
        [PHASE.FANTASY_DRAFT]: {
            func: newPhaseFantasyDraft,
        },
    };

    if (lock.get("newPhase")) {
        logEvent(
            {
                type: "error",
                text: "Phase change already in progress.",
                saveToDb: false,
            },
            conditions,
        );
    } else {
        try {
            await updateStatus("Processing...");

            lock.set("newPhase", true);
            await updatePlayMenu();

            if (phaseChangeInfo.hasOwnProperty(phase)) {
                const result = await phaseChangeInfo[phase].func(
                    conditions,
                    extra,
                );

                if (result && result.length === 2) {
                    const [url, updateEvents] = result;
                    await finalize(phase, url, updateEvents, conditions);
                } else {
                    throw new Error(
                        `Invalid result from phase change: ${JSON.stringify(
                            result,
                        )}`,
                    );
                }
            } else {
                throw new Error(`Unknown phase number ${phase}`);
            }
        } catch (err) {
            lock.set("newPhase", false);
            await updatePlayMenu();

            logEvent(
                {
                    type: "error",
                    text:
                        'Critical error during phase change. <a href="https://basketball-gm.com/manual/debugging/"><b>Read this to learn about debugging.</b></a>',
                    saveToDb: false,
                    persistent: true,
                },
                conditions,
            );

            console.error(err);
        }
    }
}

export default {
    // eslint-disable-next-line import/prefer-default-export
    newPhase,
};
