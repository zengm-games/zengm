import g from '../globals';
import season from '../core/season';
import bbgmViewReact from '../util/bbgmViewReact';
import Live from './views/Live';

async function updateGamesList() {
    const games = await season.getSchedule({oneDay: true});

    for (const game of games) {
        if (game.awayTid === g.userTid || game.homeTid === g.userTid) {
            game.highlight = true;
        } else {
            game.highlight = false;
        }
        game.awayRegion = g.teamRegionsCache[game.awayTid];
        game.awayName = g.teamNamesCache[game.awayTid];
        game.homeRegion = g.teamRegionsCache[game.homeTid];
        game.homeName = g.teamNamesCache[game.homeTid];
    }

    return {
        games,
    };
}

function updateGamesInProgress(inputs, updateEvents) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("g.gamesInProgress") >= 0) {
        return {
            gamesInProgress: g.gamesInProgress,
        };
    }
}

export default bbgmViewReact.init({
    id: "live",
    runBefore: [updateGamesList, updateGamesInProgress],
    Component: Live,
});
