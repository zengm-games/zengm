const db = require('../db');
const g = require('../globals');
const ui = require('../ui');
const contractNegotiation = require('../core/contractNegotiation');
const draft = require('../core/draft');
const freeAgents = require('../core/freeAgents');
const game = require('../core/game');
const league = require('../core/league');
const phase = require('../core/phase');
const season = require('../core/season');
const trade = require('../core/trade');
const helpers = require('./helpers');

const liveGame = async gid => {
    ui.realtimeUpdate([], helpers.leagueUrl(["live_game"]), () => {
        game.play(1, true, gid);
    }, {fromAction: true});
};

const negotiate = async pid => {
    // If there is no active negotiation with this pid, create it
    const negotiation = await g.dbl.negotiations.get(pid);
    if (!negotiation) {
        const error = await g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", tx => {
            return contractNegotiation.create(tx, pid, false);
        });
        if (error !== undefined && error) {
            helpers.errorNotify(error);
        } else {
            ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
        }
    } else {
        ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
    }
};

const tradeFor = async ({otherDpids, otherPids, pid, tid, userDpids, userPids}) => {
    let teams;

    if (pid !== undefined) {
        // Start new trade for a single player, like a Trade For button
        teams = [{
            tid: g.userTid,
            pids: [],
            dpids: [],
        }, {
            tid: undefined,
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

const playAmount = async amount => {
console.log('play', amount);
    if (['day', 'week', 'month', 'untilPreseason'].includes(amount)) {
        let numDays;
        if (amount === "day") {
            numDays = 1;
        } else if (amount === "week") {
            numDays = 7;
        } else if (amount === "month") {
            numDays = 30;
        } else if (amount === "untilPreseason") {
            numDays = g.daysLeft;
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
    } else {
        throw new Error(`Invalid amount: ${amount}`);
    }
};

const playStop = async () => {
    await league.setGameAttributesComplete({stopGames: true});
    if (g.phase !== g.PHASE.FREE_AGENCY) {
        // This is needed because we can't be sure if core.game.play will be called again
        ui.updateStatus("Idle");
    }
    await league.setGameAttributesComplete({gamesInProgress: false});
    ui.updatePlayMenu(null);
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
            const playoffSeries = await g.dbl.playoffSeries.get(g.season);

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
            const numRemaining = await g.dbl.negotiations.count();
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
        await league.setGameAttributesComplete({autoPlaySeasons: 0});
        ui.updatePlayMenu(null);
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
            db.reset();
        }
    },
};

module.exports = {
    liveGame,
    negotiate,
    playMenu,
    toolsMenu,
    tradeFor,
};
