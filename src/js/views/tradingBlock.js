const g = require('../globals');
const player = require('../core/player');
const trade = require('../core/trade');
const Promise = require('bluebird');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const TradingBlock = require('./views/TradingBlock');

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

module.exports = bbgmViewReact.init({
    id: "tradingBlock",
    runBefore: [updateUserRoster],
    Component: TradingBlock,
});
