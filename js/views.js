/**
 * @name views
 * @namespace Contains all the view modules.
 */
define(["views/dashboard", "views/deleteLeague", "views/draft", "views/draftSummary", "views/exportRosters", "views/freeAgents", "views/gameLog", "views/hallOfFame", "views/editTeamInfo", "views/history", "views/inbox", "views/leaders", "views/leagueDashboard", "views/leagueFinances", "views/manual", "views/message", "views/negotiation", "views/negotiationList", "views/newLeague", "views/newTeam", "views/player", "views/playerRatingDists", "views/playerRatings", "views/playerShotLocations", "views/playerStatDists", "views/playerStats", "views/playoffs", "views/roster", "views/schedule", "views/standings", "views/teamFinances", "views/teamHistory", "views/teamShotLocations", "views/teamStatDists", "views/teamStats", "views/trade"], function (dashboard, deleteLeague, draft, draftSummary, exportRosters, freeAgents, gameLog, hallOfFame, editTeamInfo, history, inbox, leaders, leagueDashboard, leagueFinances, manual, message, negotiation, negotiationList, newLeague, newTeam, player, playerRatingDists, playerRatings, playerShotLocations, playerStatDists, playerStats, playoffs, roster, schedule, standings, teamFinances, teamHistory, teamShotLocations, teamStatDists, teamStats, trade) {
    "use strict";

    return {
        dashboard: dashboard,
        newLeague: newLeague,
        deleteLeague: deleteLeague,
        manual: manual,

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
        exportRosters: exportRosters
    };
});