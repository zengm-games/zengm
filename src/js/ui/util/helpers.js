// @flow

import { helpers as commonHelpers } from "../../common";

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
    numberWithCommas,
    plusMinus,
    roundsWonText,
});

export default helpers;
