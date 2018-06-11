// @flow

import { g, helpers as commonHelpers } from "../../common";

const gameScore = (arg: { [key: string]: number }): string => {
    return (
        arg.pts +
        0.4 * arg.fg -
        0.7 * arg.fga -
        0.4 * (arg.fta - arg.ft) +
        0.7 * arg.orb +
        0.3 * arg.drb +
        arg.stl +
        0.7 * arg.ast +
        0.7 * arg.blk -
        0.4 * arg.pf -
        arg.tov
    ).toFixed(1);
};

const leagueUrl = (components: (number | string)[]): string =>
    commonHelpers.leagueUrlFactory(g.lid, components);

/**
 * Format a number as an integer with commas in the thousands places.
 */
const numberWithCommas = (x: number | string): string => {
    return parseFloat(x)
        .toFixed()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const plusMinus = (arg: number, d: number): string => {
    if (Number.isNaN(arg)) {
        return "";
    }
    return (arg > 0 ? "+" : "") + arg.toFixed(d);
};

/**
 * Delete all the things from the global variable g that are not stored in league databases.
 *
 * This is used to clear out values from other leagues, to ensure that the appropriate values are updated in the database when calling league.setGameAttributes.
 *
 * @memberOf util.helpers
 */
const resetG = () => {
    for (const key of commonHelpers.keys(g)) {
        if (key !== "lid") {
            delete g[key];
        }
    }
};

const roundsWonText = (
    playoffRoundsWon: number,
    numPlayoffRounds: number,
    numConfs: number,
): string => {
    const playoffsByConference = numConfs === 2; // && !localStorage.getItem('top16playoffs');

    if (playoffRoundsWon === numPlayoffRounds) {
        return "League champs";
    }
    if (playoffRoundsWon === numPlayoffRounds - 1) {
        return playoffsByConference ? "Conference champs" : "Made finals";
    }
    if (playoffRoundsWon === numPlayoffRounds - 2) {
        return playoffsByConference
            ? "Made conference finals"
            : "Made semifinals";
    }
    if (playoffRoundsWon >= 1) {
        return `Made ${commonHelpers.ordinal(playoffRoundsWon + 1)} round`;
    }
    if (playoffRoundsWon === 0) {
        return "Made playoffs";
    }
    return "";
};

const helpers = Object.assign({}, commonHelpers, {
    gameScore,
    leagueUrl,
    numberWithCommas,
    plusMinus,
    resetG,
    roundsWonText,
});

export default helpers;
