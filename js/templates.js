/**
 * @name templates
 * @namespace Loads all the templates.
 */
define(["lib/require.text!../templates/dashboard.handlebars", "lib/require.text!../templates/deleteLeague.handlebars", "lib/require.text!../templates/draft.handlebars", "lib/require.text!../templates/draftSummary.handlebars", "lib/require.text!../templates/error.handlebars", "lib/require.text!../templates/freeAgents.handlebars", "lib/require.text!../templates/gameLog.handlebars", "lib/require.text!../templates/history.handlebars", "lib/require.text!../templates/inbox.handlebars", "lib/require.text!../templates/leaders.handlebars", "lib/require.text!../templates/leagueDashboard.handlebars", "lib/require.text!../templates/leagueFinances.handlebars", "lib/require.text!../templates/leagueLayout.handlebars", "lib/require.text!../templates/manualOverview.handlebars", "lib/require.text!../templates/message.handlebars", "lib/require.text!../templates/negotiation.handlebars", "lib/require.text!../templates/negotiationList.handlebars", "lib/require.text!../templates/newLeague.handlebars", "lib/require.text!../templates/player.handlebars", "lib/require.text!../templates/playerRatingDists.handlebars", "lib/require.text!../templates/playerRatings.handlebars", "lib/require.text!../templates/playerShotLocations.handlebars", "lib/require.text!../templates/playerStatDists.handlebars", "lib/require.text!../templates/playerStats.handlebars", "lib/require.text!../templates/playoffs.handlebars", "lib/require.text!../templates/roster.handlebars", "lib/require.text!../templates/schedule.handlebars", "lib/require.text!../templates/standings.handlebars", "lib/require.text!../templates/teamFinances.handlebars", "lib/require.text!../templates/teamHistory.handlebars", "lib/require.text!../templates/teamShotLocations.handlebars", "lib/require.text!../templates/teamStatDists.handlebars", "lib/require.text!../templates/teamStats.handlebars", "lib/require.text!../templates/trade.handlebars"], function (dashboard, deleteLeague, draft, draftSummary, error, freeAgents, gameLog, history, inbox, leaders, leagueDashboard, leagueFinances, leagueLayout, manualOverview, message, negotiation, negotiationList, newLeague, player, playerRatingDists, playerRatings, playerShotLocations, playerStatDists, playerStats, playoffs, roster, schedule, standings, teamFinances, teamHistory, teamShotLocations, teamStatDists, teamStats, trade) {
    "use strict";

    return {
        dashboard: dashboard,
        deleteLeague: deleteLeague,
        draft: draft,
        draftSummary: draftSummary,
        error: error,
        freeAgents: freeAgents,
        gameLog: gameLog,
        history: history,
        inbox: inbox,
        leaders: leaders,
        leagueDashboard: leagueDashboard,
        leagueFinances: leagueFinances,
        leagueLayout: leagueLayout,
        manualOverview: manualOverview,
        message: message,
        negotiation: negotiation,
        negotiationList: negotiationList,
        newLeague: newLeague,
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