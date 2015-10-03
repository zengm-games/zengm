'use strict';

var fs = require('fs');

var account = fs.readFileSync(__dirname + '/../templates/account.html', 'utf8');
var accountUpdateCard = fs.readFileSync(__dirname + '/../templates/accountUpdateCard.html', 'utf8');
var awardsRecords = fs.readFileSync(__dirname + '/../templates/awardsRecords.html', 'utf8');
var changes = fs.readFileSync(__dirname + '/../templates/changes.html', 'utf8');
var customizePlayer = fs.readFileSync(__dirname + '/../templates/customizePlayer.html', 'utf8');
var dashboard = fs.readFileSync(__dirname + '/../templates/dashboard.html', 'utf8');
var deleteLeague = fs.readFileSync(__dirname + '/../templates/deleteLeague.html', 'utf8');
var deleteOldData = fs.readFileSync(__dirname + '/../templates/deleteOldData.html', 'utf8');
var draft = fs.readFileSync(__dirname + '/../templates/draft.html', 'utf8');
var draftScouting = fs.readFileSync(__dirname + '/../templates/draftScouting.html', 'utf8');
var draftSummary = fs.readFileSync(__dirname + '/../templates/draftSummary.html', 'utf8');
var error = fs.readFileSync(__dirname + '/../templates/error.html', 'utf8');
var eventLog = fs.readFileSync(__dirname + '/../templates/eventLog.html', 'utf8');
var exportLeague = fs.readFileSync(__dirname + '/../templates/exportLeague.html', 'utf8');
var exportStats = fs.readFileSync(__dirname + '/../templates/exportStats.html', 'utf8');
var fantasyDraft = fs.readFileSync(__dirname + '/../templates/fantasyDraft.html', 'utf8');
var freeAgents = fs.readFileSync(__dirname + '/../templates/freeAgents.html', 'utf8');
var gameLog = fs.readFileSync(__dirname + '/../templates/gameLog.html', 'utf8');
var godMode = fs.readFileSync(__dirname + '/../templates/godMode.html', 'utf8');
var hallOfFame = fs.readFileSync(__dirname + '/../templates/hallOfFame.html', 'utf8');
var editTeamInfo = fs.readFileSync(__dirname + '/../templates/editTeamInfo.html', 'utf8');
var history = fs.readFileSync(__dirname + '/../templates/history.html', 'utf8');
var historyAll = fs.readFileSync(__dirname + '/../templates/historyAll.html', 'utf8');
var inbox = fs.readFileSync(__dirname + '/../templates/inbox.html', 'utf8');
var leaders = fs.readFileSync(__dirname + '/../templates/leaders.html', 'utf8');
var leagueDashboard = fs.readFileSync(__dirname + '/../templates/leagueDashboard.html', 'utf8');
var leagueFinances = fs.readFileSync(__dirname + '/../templates/leagueFinances.html', 'utf8');
var leagueLayout = fs.readFileSync(__dirname + '/../templates/leagueLayout.html', 'utf8');
var live = fs.readFileSync(__dirname + '/../templates/live.html', 'utf8');
var liveGame = fs.readFileSync(__dirname + '/../templates/liveGame.html', 'utf8');
var loginOrRegister = fs.readFileSync(__dirname + '/../templates/loginOrRegister.html', 'utf8');
var lostPassword = fs.readFileSync(__dirname + '/../templates/lostPassword.html', 'utf8');
var manual = fs.readFileSync(__dirname + '/../templates/manual.html', 'utf8');
var manualCustomRosters = fs.readFileSync(__dirname + '/../templates/manualCustomRosters.html', 'utf8');
var manualOverview = fs.readFileSync(__dirname + '/../templates/manualOverview.html', 'utf8');
var message = fs.readFileSync(__dirname + '/../templates/message.html', 'utf8');
var multiTeamMode = fs.readFileSync(__dirname + '/../templates/multiTeamMode.html', 'utf8');
var negotiation = fs.readFileSync(__dirname + '/../templates/negotiation.html', 'utf8');
var negotiationList = fs.readFileSync(__dirname + '/../templates/negotiationList.html', 'utf8');
var newLeague = fs.readFileSync(__dirname + '/../templates/newLeague.html', 'utf8');
var newTeam = fs.readFileSync(__dirname + '/../templates/newTeam.html', 'utf8');
var player = fs.readFileSync(__dirname + '/../templates/player.html', 'utf8');
var playerFeats = fs.readFileSync(__dirname + '/../templates/playerFeats.html', 'utf8');
var playerRatingDists = fs.readFileSync(__dirname + '/../templates/playerRatingDists.html', 'utf8');
var playerRatings = fs.readFileSync(__dirname + '/../templates/playerRatings.html', 'utf8');
var playerShotLocations = fs.readFileSync(__dirname + '/../templates/playerShotLocations.html', 'utf8');
var playerStatDists = fs.readFileSync(__dirname + '/../templates/playerStatDists.html', 'utf8');
var playerStats = fs.readFileSync(__dirname + '/../templates/playerStats.html', 'utf8');
var playoffs = fs.readFileSync(__dirname + '/../templates/playoffs.html', 'utf8');
var powerRankings = fs.readFileSync(__dirname + '/../templates/powerRankings.html', 'utf8');
var resetPassword = fs.readFileSync(__dirname + '/../templates/resetPassword.html', 'utf8');
var roster = fs.readFileSync(__dirname + '/../templates/roster.html', 'utf8');
var schedule = fs.readFileSync(__dirname + '/../templates/schedule.html', 'utf8');
var standings = fs.readFileSync(__dirname + '/../templates/standings.html', 'utf8');
var teamFinances = fs.readFileSync(__dirname + '/../templates/teamFinances.html', 'utf8');
var teamHistory = fs.readFileSync(__dirname + '/../templates/teamHistory.html', 'utf8');
var teamRecords = fs.readFileSync(__dirname + '/../templates/teamRecords.html', 'utf8');
var teamShotLocations = fs.readFileSync(__dirname + '/../templates/teamShotLocations.html', 'utf8');
var teamStatDists = fs.readFileSync(__dirname + '/../templates/teamStatDists.html', 'utf8');
var teamStats = fs.readFileSync(__dirname + '/../templates/teamStats.html', 'utf8');
var trade = fs.readFileSync(__dirname + '/../templates/trade.html', 'utf8');
var tradingBlock = fs.readFileSync(__dirname + '/../templates/tradingBlock.html', 'utf8');
var transactions = fs.readFileSync(__dirname + '/../templates/transactions.html', 'utf8');
var upcomingFreeAgents = fs.readFileSync(__dirname + '/../templates/upcomingFreeAgents.html', 'utf8');
var watchList = fs.readFileSync(__dirname + '/../templates/watchList.html', 'utf8');

module.exports = {
    account: account,
    accountUpdateCard: accountUpdateCard,
    awardsRecords: awardsRecords,
    changes: changes,
    customizePlayer: customizePlayer,
    dashboard: dashboard,
    deleteLeague: deleteLeague,
    deleteOldData: deleteOldData,
    draft: draft,
    draftScouting: draftScouting,
    draftSummary: draftSummary,
    error: error,
    eventLog: eventLog,
    exportLeague: exportLeague,
    exportStats: exportStats,
    fantasyDraft: fantasyDraft,
    freeAgents: freeAgents,
    gameLog: gameLog,
    godMode: godMode,
    hallOfFame: hallOfFame,
    editTeamInfo: editTeamInfo,
    history: history,
    historyAll: historyAll,
    inbox: inbox,
    leaders: leaders,
    leagueDashboard: leagueDashboard,
    leagueFinances: leagueFinances,
    leagueLayout: leagueLayout,
    live: live,
    liveGame: liveGame,
    loginOrRegister: loginOrRegister,
    lostPassword: lostPassword,
    manual: manual,
    manualCustomRosters: manualCustomRosters,
    manualOverview: manualOverview,
    message: message,
    multiTeamMode: multiTeamMode,
    negotiation: negotiation,
    negotiationList: negotiationList,
    newLeague: newLeague,
    newTeam: newTeam,
    player: player,
    playerFeats: playerFeats,
    playerRatingDists: playerRatingDists,
    playerRatings: playerRatings,
    playerShotLocations: playerShotLocations,
    playerStatDists: playerStatDists,
    playerStats: playerStats,
    playoffs: playoffs,
    powerRankings: powerRankings,
    resetPassword: resetPassword,
    roster: roster,
    schedule: schedule,
    standings: standings,
    teamFinances: teamFinances,
    teamHistory: teamHistory,
    teamRecords: teamRecords,
    teamShotLocations: teamShotLocations,
    teamStatDists: teamStatDists,
    teamStats: teamStats,
    transactions: transactions,
    trade: trade,
    tradingBlock: tradingBlock,
    upcomingFreeAgents: upcomingFreeAgents,
    watchList: watchList
};

