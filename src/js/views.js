import React from 'react';
import bbgmViewReact from './util/bbgmViewReact';
import account from './views/account';
import accountUpdateCard from './views/accountUpdateCard';
import awardsRecords from './views/awardsRecords';
import changes from './views/changes';
import customizePlayer from './views/customizePlayer';
import dashboard from './views/dashboard';
import deleteLeague from './views/deleteLeague';
import deleteOldData from './views/deleteOldData';
import * as draft from './views/draft';
import draftScouting from './views/draftScouting';
import draftSummary from './views/draftSummary';
import editTeamInfo from './views/editTeamInfo';
import eventLog from './views/eventLog';
import exportLeague from './views/exportLeague';
import exportStats from './views/exportStats';
import fantasyDraft from './views/fantasyDraft';
import freeAgents from './views/freeAgents';
import gameLog from './views/gameLog';
import godMode from './views/godMode';
import hallOfFame from './views/hallOfFame';
import history from './views/history';
import historyAll from './views/historyAll';
import inbox from './views/inbox';
import leaders from './views/leaders';
import leagueDashboard from './views/leagueDashboard';
import leagueFinances from './views/leagueFinances';
import live from './views/live';
import liveGame from './views/liveGame';
import loginOrRegister from './views/loginOrRegister';
import lostPassword from './views/lostPassword';
import message from './views/message';
import multiTeamMode from './views/multiTeamMode';
import negotiation from './views/negotiation';
import negotiationList from './views/negotiationList';
import newLeague from './views/newLeague';
import newTeam from './views/newTeam';
import player from './views/player';
import playerFeats from './views/playerFeats';
import playerRatingDists from './views/playerRatingDists';
import playerRatings from './views/playerRatings';
import playerShotLocations from './views/playerShotLocations';
import playerStatDists from './views/playerStatDists';
import playerStats from './views/playerStats';
import playoffs from './views/playoffs';
import powerRankings from './views/powerRankings';
import resetPassword from './views/resetPassword';
import roster from './views/roster';
import schedule from './views/schedule';
import standings from './views/standings';
import teamFinances from './views/teamFinances';
import teamHistory from './views/teamHistory';
import teamRecords from './views/teamRecords';
import teamShotLocations from './views/teamShotLocations';
import teamStatDists from './views/teamStatDists';
import teamStats from './views/teamStats';
import trade from './views/trade';
import tradingBlock from './views/tradingBlock';
import transactions from './views/transactions';
import upcomingFreeAgents from './views/upcomingFreeAgents';
import watchList from './views/watchList';

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

const manual = staticPage('manual', 'Manual', false, <div>
    <h1>Manual</h1>
    <p><a href="https://basketball-gm.com/manual/" rel="noopener noreferrer" target="_blank">Click here for an overview of Basketball GM.</a></p>
</div>);

export {
    account,
    accountUpdateCard,
    awardsRecords,
    changes,
    customizePlayer,
    dashboard,
    deleteLeague,
    deleteOldData,
    draft,
    draftScouting,
    draftSummary,
    editTeamInfo,
    eventLog,
    exportLeague,
    exportStats,
    fantasyDraft,
    freeAgents,
    gameLog,
    godMode,
    hallOfFame,
    history,
    historyAll,
    inbox,
    leaders,
    leagueDashboard,
    leagueFinances,
    live,
    liveGame,
    loginOrRegister,
    lostPassword,
    manual,
    message,
    multiTeamMode,
    negotiation,
    negotiationList,
    newLeague,
    newTeam,
    player,
    playerFeats,
    playerRatingDists,
    playerRatings,
    playerShotLocations,
    playerStatDists,
    playerStats,
    playoffs,
    powerRankings,
    resetPassword,
    roster,
    schedule,
    standings,
    staticPage,
    teamFinances,
    teamHistory,
    teamRecords,
    teamShotLocations,
    teamStatDists,
    teamStats,
    trade,
    tradingBlock,
    transactions,
    upcomingFreeAgents,
    watchList,
};
