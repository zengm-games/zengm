/**
 * @name views
 * @namespace Contains all the view modules.
 */
'use strict';

var ui = require('./ui');
var bbgmView = require('./util/bbgmView');
var viewHelpers = require('./util/viewHelpers');
var account = require('./views/account');
var accountUpdateCard = require('./views/accountUpdateCard');
var changes = require('./views/changes');
var customizePlayer = require('./views/customizePlayer');
var dashboard = require('./views/dashboard');
var deleteLeague = require('./views/deleteLeague');
var deleteOldData = require('./views/deleteOldData');
var draft = require('./views/draft');
var draftScouting = require('./views/draftScouting');
var draftSummary = require('./views/draftSummary');
var editTeamInfo = require('./views/editTeamInfo');
var eventLog = require('./views/eventLog');
var exportLeague = require('./views/exportLeague');
var exportStats = require('./views/exportStats');
var fantasyDraft = require('./views/fantasyDraft');
var freeAgents = require('./views/freeAgents');
var gameLog = require('./views/gameLog');
var godMode = require('./views/godMode');
var hallOfFame = require('./views/hallOfFame');
var history = require('./views/history');
var historyAll = require('./views/historyAll');
var inbox = require('./views/inbox');
var leaders = require('./views/leaders');
var leagueDashboard = require('./views/leagueDashboard');
var leagueFinances = require('./views/leagueFinances');
var live = require('./views/live');
var liveGame = require('./views/liveGame');
var loginOrRegister = require('./views/loginOrRegister');
var lostPassword = require('./views/lostPassword');
var manual = require('./views/manual');
var message = require('./views/message');
var multiTeamMode = require('./views/multiTeamMode');
var negotiation = require('./views/negotiation');
var negotiationList = require('./views/negotiationList');
var newLeague = require('./views/newLeague');
var newTeam = require('./views/newTeam');
var player = require('./views/player');
var playerFeats = require('./views/playerFeats');
var playerRatingDists = require('./views/playerRatingDists');
var playerRatings = require('./views/playerRatings');
var playerShotLocations = require('./views/playerShotLocations');
var playerStatDists = require('./views/playerStatDists');
var playerStats = require('./views/playerStats');
var playoffs = require('./views/playoffs');
var powerRankings = require('./views/powerRankings');
var resetPassword = require('./views/resetPassword');
var roster = require('./views/roster');
var schedule = require('./views/schedule');
var standings = require('./views/standings');
var teamFinances = require('./views/teamFinances');
var teamHistory = require('./views/teamHistory');
var teamShotLocations = require('./views/teamShotLocations');
var teamStatDists = require('./views/teamStatDists');
var teamStats = require('./views/teamStats');
var trade = require('./views/trade');
var tradingBlock = require('./views/tradingBlock');
var upcomingFreeAgents = require('./views/upcomingFreeAgents');
var watchList = require('./views/watchList');
var teamRecords = require('./views/teamRecords');
var awardsRecords = require('./views/awardsRecords');
var transactions = require('./views/transactions');

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

module.exports = {
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
    godMode: godMode,
    powerRankings: powerRankings,
    exportStats: exportStats,
    playerFeats: playerFeats,
    accountUpdateCard: accountUpdateCard,
    multiTeamMode: multiTeamMode,
    teamRecords: teamRecords,
    awardsRecords: awardsRecords,
    transactions: transactions
};

