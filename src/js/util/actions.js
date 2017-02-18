// @flow

import {reset} from '../db';
import g from '../globals';
import * as ui from '../ui';
import * as contractNegotiation from '../core/contractNegotiation';
import * as draft from '../core/draft';
import * as freeAgents from '../core/freeAgents';
import * as game from '../core/game';
import * as league from '../core/league';
import * as phase from '../core/phase';
import * as season from '../core/season';
import * as trade from '../core/trade';
import * as helpers from './helpers';

const liveGame = async (gid: number) => {
    ui.realtimeUpdate([], helpers.leagueUrl(["live_game"]), () => {
        game.play(1, true, gid);
    }, {fromAction: true});
};

const negotiate = async (pid: number) => {
    // If there is no active negotiation with this pid, create it
    const negotiation = await g.dbl.negotiations.get(pid);
    if (!negotiation) {
        const error = await contractNegotiation.create(pid, false);
        if (error !== undefined && error) {
            helpers.errorNotify(error);
        } else {
            ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
        }
    } else {
        ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
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
        const p = await g.dbl.players.get(pid);
        const otherTid = p.tid;
        if (otherTid < 0) {
            console.log("Can't trade for a player not on a team");
            return;
        }

        // Start new trade for a single player, like a Trade For button
        teams = [{
            tid: g.userTid,
            pids: [],
            dpids: [],
        }, {
            tid: otherTid,
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
    ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
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

    if (g.phase <= g.PHASE.PLAYOFFS) {
        ui.updateStatus("Playing..."); // For quick UI updating, before game.play
        // Start playing games
        game.play(numDays);
    } else if (g.phase === g.PHASE.FREE_AGENCY) {
        if (numDays > g.daysLeft) {
            numDays = g.daysLeft;
        }
        freeAgents.play(numDays);
    }
};

const playStop = async () => {
    await league.setGameAttributes({stopGames: true});
    if (g.phase !== g.PHASE.FREE_AGENCY) {
        // This is needed because we can't be sure if core.game.play will be called again
        ui.updateStatus("Idle");
    }
    await league.setGameAttributes({gamesInProgress: false});
    ui.updatePlayMenu();
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
        if (g.phase < g.PHASE.PLAYOFFS) {
            ui.updateStatus("Playing..."); // For quick UI updating, before await
            const numDays = await season.getDaysLeftSchedule();
            game.play(numDays);
        }
    },

    throughPlayoffs: async () => {
        if (g.phase === g.PHASE.PLAYOFFS) {
            ui.updateStatus("Playing..."); // For quick UI updating, before await
            const playoffSeries = await g.cache.get('playoffSeries', g.season);

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
        if (g.phase === g.PHASE.BEFORE_DRAFT) {
            await phase.newPhase(g.PHASE.DRAFT);
        }
    },

    untilResignPlayers: async () => {
        if (g.phase === g.PHASE.AFTER_DRAFT) {
            await phase.newPhase(g.PHASE.RESIGN_PLAYERS);
        }
    },

    untilFreeAgency: async () => {
        if (g.phase === g.PHASE.RESIGN_PLAYERS) {
            const negotiations = await g.cache.getAll('negotiations');
            const numRemaining = negotiations.length;
            // Show warning dialog only if there are players remaining un-re-signed
            if (numRemaining === 0 || window.confirm(`Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.`)) {
                await phase.newPhase(g.PHASE.FREE_AGENCY);
                ui.updateStatus(`${g.daysLeft} days left`);
            }
        }
    },

    untilPreseason: async () => {
        await playAmount('untilPreseason');
    },

    untilRegularSeason: async () => {
        if (g.phase === g.PHASE.PRESEASON) {
            await phase.newPhase(g.PHASE.REGULAR_SEASON);
        }
    },

    abortPhaseChange: () => {
        phase.abort();
    },

    stopAuto: async () => {
        await league.setGameAttributes({autoPlaySeasons: 0});
        ui.updatePlayMenu();
        await playStop();
    },
};

const toolsMenu = {
    autoPlaySeasons: () => {
        league.initAutoPlay();
    },

    skipToPlayoffs: async () => {
        await phase.newPhase(g.PHASE.PLAYOFFS);
    },

    skipToBeforeDraft: async () => {
        await phase.newPhase(g.PHASE.BEFORE_DRAFT);
    },

    skipToAfterDraft: async () => {
        await phase.newPhase(g.PHASE.AFTER_DRAFT);
    },

    skipToPreseason: async () => {
        await phase.newPhase(g.PHASE.PRESEASON);
    },

    forceResumeDraft: async () => {
        await draft.untilUserOrEnd();
    },

    resetDb: () => {
        if (window.confirm("Are you sure you want to reset the database? This will delete all your current saved games.")) {
            reset();
        }
    },
};

export {
    liveGame,
    negotiate,
    playMenu,
    toolsMenu,
    tradeFor,
};
