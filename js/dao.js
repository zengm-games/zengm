/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/messages", "dao/players", "dao/teams"], function (leagues, messages, players, teams) {
    "use strict";

    return {
        leagues: leagues,
        messages: messages,
        players: players,
        teams: teams
    };
});