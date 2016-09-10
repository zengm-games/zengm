const React = require('react');
const bbgmViewReact = require('./util/bbgmViewReact');

const staticPage = (name, title, inLeague, content) => {
    return bbgmViewReact.init({
        id: name,
        inLeague,
        Component: () => {
            bbgmViewReact.title(title);

            return content;
        },
    });
};

module.exports = {
    staticPage,

    account: require('./views/account'),
    accountUpdateCard: require('./views/accountUpdateCard'),
    awardsRecords: require('./views/awardsRecords'),
    changes: require('./views/changes'),
    customizePlayer: require('./views/customizePlayer'),
    dashboard: require('./views/dashboard'),
    deleteLeague: require('./views/deleteLeague'),
    deleteOldData: require('./views/deleteOldData'),
    draft: require('./views/draft'),
    draftScouting: require('./views/draftScouting'),
    draftSummary: require('./views/draftSummary'),
    editTeamInfo: require('./views/editTeamInfo'),
    eventLog: require('./views/eventLog'),
    exportLeague: require('./views/exportLeague'),
    exportStats: require('./views/exportStats'),
    fantasyDraft: require('./views/fantasyDraft'),
    freeAgents: require('./views/freeAgents'),
    gameLog: require('./views/gameLog'),
    godMode: require('./views/godMode'),
    hallOfFame: require('./views/hallOfFame'),
    history: require('./views/history'),
    historyAll: require('./views/historyAll'),
    inbox: require('./views/inbox'),
    leaders: require('./views/leaders'),
    leagueDashboard: require('./views/leagueDashboard'),
    leagueFinances: require('./views/leagueFinances'),
    live: require('./views/live'),
    liveGame: require('./views/liveGame'),
    loginOrRegister: require('./views/loginOrRegister'),
    lostPassword: require('./views/lostPassword'),
    manual: staticPage('manual', 'Manual', false, <div>
        <h1>Manual</h1>
        <p><a href="https://basketball-gm.com/manual/" rel="noopener noreferrer" target="_blank">Click here for an overview of Basketball GM.</a></p>
    </div>),
    message: require('./views/message'),
    multiTeamMode: require('./views/multiTeamMode'),
    negotiation: require('./views/negotiation'),
    negotiationList: require('./views/negotiationList'),
    newLeague: require('./views/newLeague'),
    newTeam: require('./views/newTeam'),
    player: require('./views/player'),
    playerFeats: require('./views/playerFeats'),
    playerRatingDists: require('./views/playerRatingDists'),
    playerRatings: require('./views/playerRatings'),
    playerShotLocations: require('./views/playerShotLocations'),
    playerStatDists: require('./views/playerStatDists'),
    playerStats: require('./views/playerStats'),
    playoffs: require('./views/playoffs'),
    powerRankings: require('./views/powerRankings'),
    resetPassword: require('./views/resetPassword'),
    roster: require('./views/roster'),
    schedule: require('./views/schedule'),
    standings: require('./views/standings'),
    teamFinances: require('./views/teamFinances'),
    teamHistory: require('./views/teamHistory'),
    teamRecords: require('./views/teamRecords'),
    teamShotLocations: require('./views/teamShotLocations'),
    teamStatDists: require('./views/teamStatDists'),
    teamStats: require('./views/teamStats'),
    trade: require('./views/trade'),
    tradingBlock: require('./views/tradingBlock'),
    transactions: require('./views/transactions'),
    upcomingFreeAgents: require('./views/upcomingFreeAgents'),
    watchList: require('./views/watchList'),
};
