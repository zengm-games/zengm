/**
 * @name templates
 * @namespace Loads all the templates.
 */
define(["lib/require.text!../templates/dashboard.html", "lib/require.text!../templates/deleteLeague.html", "lib/require.text!../templates/draft.html", "lib/require.text!../templates/draftSummary.html", "lib/require.text!../templates/error.html", "lib/require.text!../templates/exportRosters.html", "lib/require.text!../templates/freeAgents.html", "lib/require.text!../templates/gameLog.html", "lib/require.text!../templates/hallOfFame.html", "lib/require.text!../templates/editTeamInfo.html", "lib/require.text!../templates/history.html", "lib/require.text!../templates/inbox.html", "lib/require.text!../templates/leaders.html", "lib/require.text!../templates/leagueDashboard.html", "lib/require.text!../templates/leagueFinances.html", "lib/require.text!../templates/leagueLayout.html", "lib/require.text!../templates/manual.html", "lib/require.text!../templates/manualCustomRosters.html", "lib/require.text!../templates/manualOverview.html", "lib/require.text!../templates/message.html", "lib/require.text!../templates/negotiation.html", "lib/require.text!../templates/negotiationList.html", "lib/require.text!../templates/newLeague.html", "lib/require.text!../templates/newTeam.html", "lib/require.text!../templates/player.html", "lib/require.text!../templates/playerRatingDists.html", "lib/require.text!../templates/playerRatings.html", "lib/require.text!../templates/playerShotLocations.html", "lib/require.text!../templates/playerStatDists.html", "lib/require.text!../templates/playerStats.html", "lib/require.text!../templates/playoffs.html", "lib/require.text!../templates/roster.html", "lib/require.text!../templates/schedule.html", "lib/require.text!../templates/standings.html", "lib/require.text!../templates/teamFinances.html", "lib/require.text!../templates/teamHistory.html", "lib/require.text!../templates/teamShotLocations.html", "lib/require.text!../templates/teamStatDists.html", "lib/require.text!../templates/teamStats.html", "lib/require.text!../templates/trade.html"], function (dashboard, deleteLeague, draft, draftSummary, error, exportRosters, freeAgents, gameLog, hallOfFame, editTeamInfo, history, inbox, leaders, leagueDashboard, leagueFinances, leagueLayout, manual, manualCustomRosters, manualOverview, message, negotiation, negotiationList, newLeague, newTeam, player, playerRatingDists, playerRatings, playerShotLocations, playerStatDists, playerStats, playoffs, roster, schedule, standings, teamFinances, teamHistory, teamShotLocations, teamStatDists, teamStats, trade) {
    "use strict";

    return {
        dashboard: dashboard,
        deleteLeague: deleteLeague,
        draft: draft,
        draftSummary: draftSummary,
        error: error,
        exportRosters: exportRosters,
        freeAgents: freeAgents,
        gameLog: gameLog,
        hallOfFame: hallOfFame,
        editTeamInfo: editTeamInfo,
        history: history,
        inbox: inbox,
        leaders: leaders,
        leagueDashboard: leagueDashboard,
        leagueFinances: leagueFinances,
        leagueLayout: leagueLayout,
        manual: manual,
        manualCustomRosters: manualCustomRosters,
        manualOverview: manualOverview,
        message: message,
        negotiation: negotiation,
        negotiationList: negotiationList,
        newLeague: newLeague,
        newTeam: newTeam,
        player: player,
        playerRatingDists: playerRatingDists,
        playerRatings: playerRatings,
        playerShotLocations: playerShotLocations,
        playerStatDists: playerStatDists,
        playerStats: playerStats,
        playoffs: playoffs,
        roster: roster,
        schedule: schedule,
        standings: standings,
        teamFinances: teamFinances,
        teamHistory: teamHistory,
        teamShotLocations: teamShotLocations,
        teamStatDists: teamStatDists,
        teamStats: teamStats,
        trade: trade
    };
});