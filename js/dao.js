/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/contracts", "dao/messages", "dao/players", "dao/teams"], function (contracts, leagues, messages, players, teams) {
    "use strict";

    return {
        leagues: leagues,
        contracts: contracts,
        messages: messages,
        players: players,
        teams: teams
    };
});