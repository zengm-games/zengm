import Promise from 'bluebird';
import g from '../globals';
import * as trade from '../core/trade';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import TradingBlock from './views/TradingBlock';

async function updateUserRoster(inputs, updateEvents) {
    if (updateEvents.includes('firstRun') || updateEvents.includes('playerMovement') || updateEvents.includes('gameSim')) {
        let [userRoster, userPicks] = await Promise.all([
            g.cache.indexGetAll('playersByTid', g.userTid),
            g.dbl.draftPicks.index('tid').getAll(g.userTid),
        ]);

        userRoster = await getCopy.players(userRoster, {
            attrs: ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["min", "pts", "trb", "ast", "per"],
            season: g.season,
            tid: g.userTid,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });
        userRoster = trade.filterUntradable(userRoster);

        for (let i = 0; i < userPicks.length; i++) {
            userPicks[i].desc = helpers.pickDesc(userPicks[i]);
        }

        return {
            gameOver: g.gameOver,
            phase: g.phase,
            userPicks,
            userRoster,
        };
    }
}

export default bbgmViewReact.init({
    id: "tradingBlock",
    runBefore: [updateUserRoster],
    Component: TradingBlock,
});
