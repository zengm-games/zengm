/**
 * @name dao
 * @namespace Wrapper around IndexedDB for easy access to data.
 */
define(["dao/leagues", "dao/awards", "dao/contracts", "dao/draftOrder", "dao/gameAttributes", "dao/games", "dao/messages", "dao/negotiations", "dao/payrolls", "dao/players", "dao/playoffSeries", "dao/schedule", "dao/teams"], function (leagues, awards, contracts, draftOrder, gameAttributes, games, messages, negotiations, payrolls, players, playoffSeries, schedule, teams) {
    "use strict";

    return {
        leagues: leagues,
        awards: awards,
        contracts: contracts,
        draftOrder: draftOrder,
        gameAttributes: gameAttributes,
        games: games,
        messages: messages,
        negotiations: negotiations,
        payrolls: payrolls,
        players: players,
        playoffSeries: playoffSeries,
        schedule: schedule,
        teams: teams
    };
});