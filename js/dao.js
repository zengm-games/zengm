/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/contracts", "dao/gameAttributes", "dao/messages", "dao/negotiations", "dao/payrolls", "dao/players", "dao/playoffSeries", "dao/teams"], function (leagues, contracts, gameAttributes, messages, negotiations, payrolls, players, playoffSeries, teams) {
    "use strict";

    return {
        leagues: leagues,
        contracts: contracts,
        gameAttributes: gameAttributes,
        messages: messages,
        negotiations: negotiations,
        payrolls: payrolls,
        players: players,
        playoffSeries: playoffSeries,
        teams: teams
    };
});