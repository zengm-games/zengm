// @flow

import { PHASE } from "../../common";
import {
    contractNegotiation,
    draft,
    freeAgents,
    game,
    league,
    phase,
    season,
    trade,
} from "../core";
import { idb, reset } from "../db";
import {
    g,
    helpers,
    local,
    lock,
    logEvent,
    toUI,
    updatePlayMenu,
    updateStatus,
} from "../util";
import type { Conditions } from "../../common/types";

const liveGame = async (gid: number, conditions: Conditions) => {
    await toUI(
        [
            "realtimeUpdate",
            [],
            helpers.leagueUrl(["live_game"]),
            { fromAction: true },
        ],
        conditions,
    );
    game.play(1, conditions, true, gid);
};

const negotiate = async (pid: number, conditions: Conditions) => {
    // If there is no active negotiation with this pid, create it
    const negotiation = await idb.cache.negotiations.get(pid);
    if (!negotiation) {
        const errorMsg = await contractNegotiation.create(pid, false);
        if (errorMsg !== undefined && errorMsg) {
            logEvent(
                {
                    type: "error",
                    text: errorMsg,
                    saveToDb: false,
                },
                conditions,
            );
        } else {
            toUI(
                ["realtimeUpdate", [], helpers.leagueUrl(["negotiation", pid])],
                conditions,
            );
        }
    } else {
        toUI(
            ["realtimeUpdate", [], helpers.leagueUrl(["negotiation", pid])],
            conditions,
        );
    }
};

type TradeForOptions = {
    dpid?: number,
    pid?: number,
    otherDpids?: number[],
    otherPids?: number[],
    tid?: number,
    userDpids?: number[],
    userPids?: number[],
};

const tradeFor = async (arg: TradeForOptions, conditions: Conditions) => {
    let teams;

    if (arg.pid !== undefined) {
        const p = await idb.cache.players.get(arg.pid);

        if (!p || p.tid < 0) {
            return;
        }

        // Start new trade for a single player, like a Trade For button
        teams = [
            {
                tid: g.userTid,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
            {
                tid: p.tid,
                pids: [arg.pid],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
        ];
    } else if (arg.dpid !== undefined) {
        const dp = await idb.cache.draftPicks.get(arg.dpid);

        if (!dp) {
            return;
        }

        // Start new trade for a single player, like a Trade For button
        teams = [
            {
                tid: g.userTid,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
            {
                tid: dp.tid,
                pids: [],
                pidsExcluded: [],
                dpids: [arg.dpid],
                dpidsExcluded: [],
            },
        ];
    } else {
        // Start a new trade with everything specified, from the trading block
        teams = [
            {
                tid: g.userTid,
                pids: arg.userPids,
                pidsExcluded: [],
                dpids: arg.userDpids,
                dpidsExcluded: [],
            },
            {
                tid: arg.tid,
                pids: arg.otherPids,
                pidsExcluded: [],
                dpids: arg.otherDpids,
                dpidsExcluded: [],
            },
        ];
    }

    // Start a new trade based on a list of pids and dpids, like from the trading block
    await trade.create(teams);
    toUI(["realtimeUpdate", [], helpers.leagueUrl(["trade"])], conditions);
};

const playAmount = async (
    amount: "day" | "week" | "month" | "untilPreseason",
    conditions: Conditions,
) => {
    let numDays;
    if (amount === "day") {
        numDays = 1;
    } else if (amount === "week") {
        numDays =
            process.env.SPORT === "basketball" || g.phase === PHASE.FREE_AGENCY
                ? 7
                : 1;
    } else if (amount === "month") {
        numDays = process.env.SPORT === "basketball" ? 30 : 4;
    } else if (amount === "untilPreseason") {
        numDays = g.daysLeft;
    } else {
        throw new Error(`Invalid amount: ${amount}`);
    }

    if (g.phase <= PHASE.PLAYOFFS) {
        await updateStatus("Playing..."); // For quick UI updating, before game.play
        await game.play(numDays, conditions);
    } else if (g.phase === PHASE.FREE_AGENCY) {
        if (numDays > g.daysLeft) {
            numDays = g.daysLeft;
        }
        await freeAgents.play(numDays, conditions);
    }
};

const playStop = async () => {
    lock.set("stopGameSim", true);
    if (g.phase !== PHASE.FREE_AGENCY) {
        // This is needed because we can't be sure if core.game.play will be called again
        await updateStatus("Idle");
    }
    lock.set("gameSim", false);
    await updatePlayMenu();
};

const runDraft = async (onlyOne: boolean, conditions: Conditions) => {
    await updateStatus("Draft in progress...");

    await draft.runPicks(onlyOne, conditions);
    const draftPicks = await draft.getOrder();

    if (draftPicks.length === 0) {
        await updateStatus("Idle");
    }
};

const getNumDaysThisRound = playoffSeries => {
    let numDaysThisRound = 0;
    for (const series of playoffSeries.series[playoffSeries.currentRound]) {
        const num = series.away
            ? g.numGamesPlayoffSeries[playoffSeries.currentRound] -
              series.home.won -
              series.away.won
            : 0;
        if (num > numDaysThisRound) {
            numDaysThisRound = num;
        }
    }

    return numDaysThisRound;
};

const playMenu = {
    stop: async () => {
        await playStop();
    },

    day: async (conditions: Conditions) => {
        await playAmount("day", conditions);
    },

    week: async (conditions: Conditions) => {
        await playAmount("week", conditions);
    },

    month: async (conditions: Conditions) => {
        await playAmount("month", conditions);
    },

    untilPlayoffs: async (conditions: Conditions) => {
        if (g.phase < PHASE.PLAYOFFS) {
            await updateStatus("Playing..."); // For quick UI updating, before await
            const numDays = await season.getDaysLeftSchedule();
            game.play(numDays, conditions);
        }
    },

    untilEndOfRound: async (conditions: Conditions) => {
        if (g.phase === PHASE.PLAYOFFS) {
            await updateStatus("Playing..."); // For quick UI updating, before await
            const playoffSeries = await idb.cache.playoffSeries.get(g.season);
            local.playingUntilEndOfRound = true;

            game.play(getNumDaysThisRound(playoffSeries), conditions);
        }
    },

    throughPlayoffs: async (conditions: Conditions) => {
        if (g.phase === PHASE.PLAYOFFS) {
            await updateStatus("Playing..."); // For quick UI updating, before await
            const playoffSeries = await idb.cache.playoffSeries.get(g.season);

            // Max 7 days per round that hasn't started yet
            let numDaysFutureRounds = 0;
            for (
                let i = playoffSeries.currentRound + 1;
                i < g.numGamesPlayoffSeries.length;
                i++
            ) {
                numDaysFutureRounds += g.numGamesPlayoffSeries[i];
            }

            const numDays =
                numDaysFutureRounds + getNumDaysThisRound(playoffSeries);
            game.play(numDays, conditions);
        }
    },

    untilDraft: async (conditions: Conditions) => {
        if (g.phase === PHASE.DRAFT_LOTTERY) {
            await phase.newPhase(PHASE.DRAFT, conditions);
        }
    },

    onePick: async (conditions: Conditions) => {
        await runDraft(true, conditions);
    },

    untilYourNextPick: async (conditions: Conditions) => {
        await runDraft(false, conditions);
    },

    untilEnd: async (conditions: Conditions) => {
        await runDraft(false, conditions);
    },

    untilResignPlayers: async (conditions: Conditions) => {
        if (g.phase === PHASE.AFTER_DRAFT) {
            await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
        }
    },

    untilFreeAgency: async (conditions: Conditions) => {
        if (g.phase === PHASE.RESIGN_PLAYERS) {
            const negotiations = await idb.cache.negotiations.getAll();
            const numRemaining = negotiations.length;

            // Show warning dialog only if there are players remaining un-re-signed
            let proceed = true;
            if (numRemaining > 0) {
                proceed = await toUI(
                    [
                        "confirm",
                        `Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team${
                            g.hardCap
                                ? ""
                                : ", and you won't be able to go over the salary cap to sign them"
                        }.`,
                    ],
                    conditions,
                );
            }
            if (proceed) {
                await phase.newPhase(PHASE.FREE_AGENCY, conditions);
                await updateStatus(`${g.daysLeft} days left`);
            }
        }
    },

    untilPreseason: async (conditions: Conditions) => {
        await playAmount("untilPreseason", conditions);
    },

    untilRegularSeason: async (conditions: Conditions) => {
        if (g.phase === PHASE.PRESEASON) {
            await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
        }
    },

    stopAuto: async () => {
        local.autoPlaySeasons = 0;
        updatePlayMenu();
        await playStop();
    },
};

const toolsMenu = {
    autoPlaySeasons: (conditions: Conditions) => {
        return league.initAutoPlay(conditions);
    },

    skipToPlayoffs: async (conditions: Conditions) => {
        await phase.newPhase(PHASE.PLAYOFFS, conditions);
    },

    skipToBeforeDraft: async (conditions: Conditions) => {
        await phase.newPhase(PHASE.DRAFT_LOTTERY, conditions);
    },

    skipToAfterDraft: async (conditions: Conditions) => {
        await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
    },

    skipToPreseason: async (conditions: Conditions) => {
        await phase.newPhase(PHASE.PRESEASON, conditions);
    },

    resetDb: async (conditions: Conditions) => {
        const response = await toUI(
            [
                "confirm",
                "Are you sure you want to delete ALL data in ALL of your leagues?",
            ],
            conditions,
        );
        if (response) {
            await reset();
        }
        return response;
    },
};

export default {
    liveGame,
    negotiate,
    playMenu,
    toolsMenu,
    tradeFor,
};
