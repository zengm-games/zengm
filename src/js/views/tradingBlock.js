import Promise from 'bluebird';
import g from '../globals';
import player from '../core/player';
import trade from '../core/trade';
import bbgmViewReact from '../util/bbgmViewReact';
import helpers from '../util/helpers';
import TradingBlock from './views/TradingBlock';

async function updateUserRoster(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
        let [userRoster, userPicks] = await Promise.all([
            g.dbl.players.index('tid').getAll(g.userTid).then(players => {
                return player.withStats(null, players, {
                    statsSeasons: [g.season],
                    statsTid: g.userTid,
                });
            }),
            g.dbl.draftPicks.index('tid').getAll(g.userTid),
        ]);

        userRoster = player.filter(userRoster, {
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
