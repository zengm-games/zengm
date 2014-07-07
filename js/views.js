/**
 * @name views
 * @namespace Contains all the view modules.
 */
define(["ui", "util/bbgmView", "util/viewHelpers", "views/account", "views/changes", "views/customizePlayer", "views/dashboard", "views/deleteLeague", "views/deleteOldData", "views/draft", "views/draftScouting", "views/draftSummary", "views/editTeamInfo", "views/eventLog", "views/exportLeague", "views/fantasyDraft", "views/freeAgents", "views/gameLog", "views/godMode", "views/hallOfFame", "views/history", "views/historyAll", "views/inbox", "views/leaders", "views/leagueDashboard", "views/leagueFinances", "views/live", "views/liveGame", "views/loginOrRegister", "views/lostPassword", "views/manual", "views/message", "views/negotiation", "views/negotiationList", "views/newLeague", "views/newTeam", "views/player", "views/playerRatingDists", "views/playerRatings", "views/playerShotLocations", "views/playerStatDists", "views/playerStats", "views/playoffs", "views/resetPassword", "views/roster", "views/schedule", "views/standings", "views/teamFinances", "views/teamHistory", "views/teamShotLocations", "views/teamStatDists", "views/teamStats", "views/trade", "views/tradingBlock", "views/upcomingFreeAgents", "views/watchList"], function (ui, bbgmView, viewHelpers, account, changes, customizePlayer, dashboard, deleteLeague, deleteOldData, draft, draftScouting, draftSummary, editTeamInfo, eventLog, exportLeague, fantasyDraft, freeAgents, gameLog, godMode, hallOfFame, history, historyAll, inbox, leaders, leagueDashboard, leagueFinances, live, liveGame, loginOrRegister, lostPassword, manual, message, negotiation, negotiationList, newLeague, newTeam, player, playerRatingDists, playerRatings, playerShotLocations, playerStatDists, playerStats, playoffs, resetPassword, roster, schedule, standings, teamFinances, teamHistory, teamShotLocations, teamStatDists, teamStats, trade, tradingBlock, upcomingFreeAgents, watchList) {
    "use strict";

    function staticPage(name, title) {
        return bbgmView.init({
            id: name,
            beforeReq: viewHelpers.beforeNonLeague,
            runBefore: [function () {}],
            uiFirst: function () {
                ui.title(title);
            }
        });
    }

    return {
        staticPage: staticPage,

        dashboard: dashboard,
        newLeague: newLeague,
        deleteLeague: deleteLeague,
        manual: manual,
        changes: changes,
        account: account,
        loginOrRegister: loginOrRegister,
        lostPassword: lostPassword,
        resetPassword: resetPassword,

        leagueDashboard: leagueDashboard,
        inbox: inbox,
        message: message,
        standings: standings,
        playoffs: playoffs,
        leagueFinances: leagueFinances,
        history: history,
        hallOfFame: hallOfFame,
        editTeamInfo: editTeamInfo,
        roster: roster,
        schedule: schedule,
        teamFinances: teamFinances,
        teamHistory: teamHistory,
        freeAgents: freeAgents,
        trade: trade,
        draft: draft,
        draftSummary: draftSummary,
        gameLog: gameLog,
        leaders: leaders,
        playerRatings: playerRatings,
        playerStats: playerStats,
        teamStats: teamStats,
        newTeam: newTeam,
        player: player,
        negotiationList: negotiationList,
        negotiation: negotiation,
        playerRatingDists: playerRatingDists,
        playerStatDists: playerStatDists,
        teamStatDists: teamStatDists,
        playerShotLocations: playerShotLocations,
        teamShotLocations: teamShotLocations,
        exportLeague: exportLeague,
        tradingBlock: tradingBlock,
        fantasyDraft: fantasyDraft,
        live: live,
        liveGame: liveGame,
        eventLog: eventLog,
        deleteOldData: deleteOldData,
        draftScouting: draftScouting,
        watchList: watchList,
        customizePlayer: customizePlayer,
        historyAll: historyAll,
        upcomingFreeAgents: upcomingFreeAgents,
        godMode: godMode
    };
});