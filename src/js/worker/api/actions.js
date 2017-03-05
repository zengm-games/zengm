// @flow

import {PHASE, g, helpers} from '../../common';
import {contractNegotiation, draft, freeAgents, game, league, phase, season, trade} from '../core';
import {idb, reset} from '../db';
import {logEvent, toUI, updatePlayMenu, updateStatus} from '../util';

const liveGame = async (gid: number) => {
    await toUI('realtimeUpdate', [], helpers.leagueUrl(["live_game"]), {fromAction: true});
    game.play(1, true, gid);
};

const negotiate = async (pid: number) => {
    // If there is no active negotiation with this pid, create it
    const negotiation = await idb.cache.get('negotiations', pid);
    if (!negotiation) {
        const errorMsg = await contractNegotiation.create(pid, false);
        if (errorMsg !== undefined && errorMsg) {
            logEvent({
                type: 'error',
                text: errorMsg,
                saveToDb: false,
            });
        } else {
            toUI('realtimeUpdate', [], helpers.leagueUrl(["negotiation", pid]));
        }
    } else {
        toUI('realtimeUpdate', [], helpers.leagueUrl(["negotiation", pid]));
    }
};

type TradeForOptions = {
    otherDpids: number[],
    otherPids: number[],
    pid: number,
    tid: number,
    userDpids: number[],
    userPids: number[],
};

const tradeFor = async ({otherDpids, otherPids, pid, tid, userDpids, userPids}: TradeForOptions) => {
    let teams;

    if (pid !== undefined) {
        const p = await idb.cache.get('players', pid);

        if (!p || p.tid < 0) {
            return;
        }

        // Start new trade for a single player, like a Trade For button
        teams = [{
            tid: g.userTid,
            pids: [],
            dpids: [],
        }, {
            tid: p.tid,
            pids: [pid],
            dpids: [],
        }];
    } else {
        // Start a new trade with everything specified, from the trading block
        teams = [{
            tid: g.userTid,
            pids: userPids,
            dpids: userDpids,
        }, {
            tid,
            pids: otherPids,
            dpids: otherDpids,
        }];
    }

    // Start a new trade based on a list of pids and dpids, like from the trading block
    await trade.create(teams);
    toUI('realtimeUpdate', [], helpers.leagueUrl(["trade"]));
    league.updateLastDbChange();
};

const playAmount = async (amount: 'day' | 'week' | 'month' | 'untilPreseason') => {
    let numDays;
    if (amount === "day") {
        numDays = 1;
    } else if (amount === "week") {
        numDays = 7;
    } else if (amount === "month") {
        numDays = 30;
    } else if (amount === "untilPreseason") {
        numDays = g.daysLeft;
    } else {
        throw new Error(`Invalid amount: ${amount}`);
    }

    if (g.phase <= PHASE.PLAYOFFS) {
        updateStatus("Playing..."); // For quick UI updating, before game.play
        // Start playing games
        game.play(numDays);
    } else if (g.phase === PHASE.FREE_AGENCY) {
        if (numDays > g.daysLeft) {
            numDays = g.daysLeft;
        }
        freeAgents.play(numDays);
    }
};

const playStop = async () => {
    await league.setGameAttributes({stopGames: true});
    if (g.phase !== PHASE.FREE_AGENCY) {
        // This is needed because we can't be sure if core.game.play will be called again
        updateStatus("Idle");
    }
    await league.setGameAttributes({gamesInProgress: false});
    updatePlayMenu();
};

const playMenu = {
    stop: async () => {
        await playStop();
    },

    day: async () => {
        await playAmount('day');
    },

    week: async () => {
        await playAmount('week');
    },

    month: async () => {
        await playAmount('month');
    },

    untilPlayoffs: async () => {
        if (g.phase < PHASE.PLAYOFFS) {
            updateStatus("Playing..."); // For quick UI updating, before await
            const numDays = await season.getDaysLeftSchedule();
            game.play(numDays);
        }
    },

    throughPlayoffs: async () => {
        if (g.phase === PHASE.PLAYOFFS) {
            updateStatus("Playing..."); // For quick UI updating, before await
            const playoffSeries = await idb.cache.get('playoffSeries', g.season);

            // Max 7 days per round that hasn't started yet
            const numDaysFutureRounds = (g.numPlayoffRounds - 1 - playoffSeries.currentRound) * 7;

            // All current series are in sync, so just check one and see how many games are left
            const series = playoffSeries.series[playoffSeries.currentRound][0];
            const numDaysThisSeries = 7 - series.home.won - series.away.won;

            const numDays = numDaysFutureRounds + numDaysThisSeries;
            game.play(numDays);
        }
    },

    untilDraft: async () => {
        if (g.phase === PHASE.BEFORE_DRAFT) {
            await phase.newPhase(PHASE.DRAFT);
        }
    },

    untilResignPlayers: async () => {
        if (g.phase === PHASE.AFTER_DRAFT) {
            await phase.newPhase(PHASE.RESIGN_PLAYERS);
        }
    },

    untilFreeAgency: async () => {
        if (g.phase === PHASE.RESIGN_PLAYERS) {
            const negotiations = await idb.cache.getAll('negotiations');
            const numRemaining = negotiations.length;

            // Show warning dialog only if there are players remaining un-re-signed
            let proceed = true;
            if (numRemaining > 0) {
                proceed = await toUI('confirm', `Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.`);
            }
            if (proceed) {
                await phase.newPhase(PHASE.FREE_AGENCY);
                updateStatus(`${g.daysLeft} days left`);
            }
        }
    },

    untilPreseason: async () => {
        await playAmount('untilPreseason');
    },

    untilRegularSeason: async () => {
        if (g.phase === PHASE.PRESEASON) {
            await phase.newPhase(PHASE.REGULAR_SEASON);
        }
    },

    abortPhaseChange: () => {
        console.log('This does nothing');
    },

    stopAuto: async () => {
        await league.setGameAttributes({autoPlaySeasons: 0});
        updatePlayMenu();
        await playStop();
    },
};

const toolsMenu = {
    autoPlaySeasons: () => {
        league.initAutoPlay();
    },

    skipToPlayoffs: async () => {
        await phase.newPhase(PHASE.PLAYOFFS);
    },

    skipToBeforeDraft: async () => {
        await phase.newPhase(PHASE.BEFORE_DRAFT);
    },

    skipToAfterDraft: async () => {
        await phase.newPhase(PHASE.AFTER_DRAFT);
    },

    skipToPreseason: async () => {
        await phase.newPhase(PHASE.PRESEASON);
    },

    forceResumeDraft: async () => {
        await draft.untilUserOrEnd();
    },

    resetDb: async () => {
        const response = await toUI('confirm', 'Are you sure you want to reset the database? This will delete all your current saved games.');
        if (response) {
            reset();
        }
    },
};

export default {
    liveGame,
    negotiate,
    playMenu,
    toolsMenu,
    tradeFor,
};
