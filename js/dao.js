/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/contracts", "dao/gameAttributes", "dao/messages", "dao/payrolls", "dao/players", "dao/teams"], function (leagues, contracts, gameAttributes, messages, payrolls, players, teams) {
    "use strict";

    return {
        leagues: leagues,
        contracts: contracts,
        gameAttributes: gameAttributes,
        messages: messages,
        payrolls: payrolls,
        players: players,
        teams: teams
    };
});