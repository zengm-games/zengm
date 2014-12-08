/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/contracts", "dao/messages", "dao/payrolls", "dao/players", "dao/teams"], function (contracts, leagues, messages, payrolls, players, teams) {
    "use strict";

    return {
        leagues: leagues,
        contracts: contracts,
        messages: messages,
        payrolls: payrolls,
        players: players,
        teams: teams
    };
});