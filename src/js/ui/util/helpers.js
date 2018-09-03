// @flow

import { helpers as commonHelpers } from "../../common";
import { local } from ".";

const leagueUrl = (components: (number | string)[]): string => {
    const lid = local.state.lid;
    if (typeof lid !== "number") {
        return "/";
    }

    return commonHelpers.leagueUrlFactory(lid, components);
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
    leagueUrl,
    numberWithCommas,
    plusMinus,
    roundsWonText,
});

export default helpers;
