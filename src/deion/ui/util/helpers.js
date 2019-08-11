// @flow

import { helpers as commonHelpers } from "../../common";
import local from "./local";

const colorRating = (rating: number) => {
    const classes = ["table-danger", "table-warning", null, "table-success"];
    const cutoffs = [30, 45, 60, Infinity];

    const ind = cutoffs.findIndex(cutoff => rating < cutoff);
    return classes[ind];
};

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
    const playoffsByConference = numConfs === 2;

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

const roundOverrides =
    process.env.SPORT === "basketball"
        ? {
              gp: "none",
              gs: "none",
              yearsWithTeam: "none",
              gmsc: "oneDecimalPlace",
              fgp: "oneDecimalPlace",
              tpp: "oneDecimalPlace",
              ftp: "oneDecimalPlace",
              ws48: "roundWinp",
              pm: "plusMinus",
              ftpfga: "roundWinp",
          }
        : {
              gp: "none",
              gs: "none",
              yearsWithTeam: "none",
              cmpPct: "oneDecimalPlace",
              qbRat: "oneDecimalPlace",
              rusYdsPerAtt: "oneDecimalPlace",
              recYdsPerAtt: "oneDecimalPlace",
              fgPct: "oneDecimalPlace",
              xpPct: "oneDecimalPlace",
              pntYdsPerAtt: "oneDecimalPlace",
              krYdsPerAtt: "oneDecimalPlace",
              prYdsPerAtt: "oneDecimalPlace",
              pts: "noDecimalPlace",
              yds: "noDecimalPlace",
              ply: "noDecimalPlace",
              tov: "noDecimalPlace",
              fmbLost: "noDecimalPlace",
              pssCmp: "noDecimalPlace",
              pss: "noDecimalPlace",
              pssYds: "noDecimalPlace",
              pssLng: "noDecimalPlace",
              pssTD: "noDecimalPlace",
              pssInt: "noDecimalPlace",
              pssSk: "noDecimalPlace",
              pssSkYds: "noDecimalPlace",
              rus: "noDecimalPlace",
              rusYds: "noDecimalPlace",
              rusLng: "noDecimalPlace",
              rusTD: "noDecimalPlace",
              rec: "noDecimalPlace",
              recYds: "noDecimalPlace",
              recLng: "noDecimalPlace",
              recTD: "noDecimalPlace",
              pen: "noDecimalPlace",
              penYds: "noDecimalPlace",
              drives: "noDecimalPlace",
              defInt: "noDecimalPlace",
              defIntYds: "noDecimalPlace",
              defIntTD: "noDecimalPlace",
              defIntLng: "noDecimalPlace",
              defPssDef: "noDecimalPlace",
              defFmbFrc: "noDecimalPlace",
              defFmbRec: "noDecimalPlace",
              defFmbYds: "noDecimalPlace",
              defFmbTD: "noDecimalPlace",
              defSk: "noDecimalPlace",
              defTck: "noDecimalPlace",
              defTckSolo: "noDecimalPlace",
              defTckAst: "noDecimalPlace",
              defTckLoss: "noDecimalPlace",
              defSft: "noDecimalPlace",
              fmb: "noDecimalPlace",
              fg0: "noDecimalPlace",
              fga0: "noDecimalPlace",
              fg20: "noDecimalPlace",
              fga20: "noDecimalPlace",
              fg30: "noDecimalPlace",
              fga30: "noDecimalPlace",
              fg40: "noDecimalPlace",
              fga40: "noDecimalPlace",
              fg50: "noDecimalPlace",
              fga50: "noDecimalPlace",
              fg: "noDecimalPlace",
              fga: "noDecimalPlace",
              fgLng: "noDecimalPlace",
              xp: "noDecimalPlace",
              xpa: "noDecimalPlace",
              pnt: "noDecimalPlace",
              pntYds: "noDecimalPlace",
              pntLng: "noDecimalPlace",
              pntBlk: "noDecimalPlace",
              pr: "noDecimalPlace",
              prYds: "noDecimalPlace",
              prTD: "noDecimalPlace",
              prLng: "noDecimalPlace",
              kr: "noDecimalPlace",
              krYds: "noDecimalPlace",
              krTD: "noDecimalPlace",
              krLng: "noDecimalPlace",
              oppPts: "noDecimalPlace",
              oppYds: "noDecimalPlace",
              oppPly: "noDecimalPlace",
              oppTov: "noDecimalPlace",
              oppFmbLost: "noDecimalPlace",
              oppPssCmp: "noDecimalPlace",
              oppPss: "noDecimalPlace",
              oppPssYds: "noDecimalPlace",
              oppPssTD: "noDecimalPlace",
              oppPssInt: "noDecimalPlace",
              oppRus: "noDecimalPlace",
              oppRusYds: "noDecimalPlace",
              oppRusTD: "noDecimalPlace",
              oppPen: "noDecimalPlace",
              oppPenYds: "noDecimalPlace",
              oppDrives: "noDecimalPlace",
              touches: "noDecimalPlace",
              ydsFromScrimmage: "noDecimalPlace",
              rusRecTD: "noDecimalPlace",
              tgt: "noDecimalPlace",
              allPurposeYds: "noDecimalPlace",
              av: "noDecimalPlace",
          };

const roundStat = (
    value: number | string,
    stat: string,
    totals: boolean = false,
): string => {
    try {
        if (typeof value === "string") {
            return value;
        }

        // Number of decimals for many stats
        const d = totals ? 0 : 1;

        if (Number.isNaN(value)) {
            value = 0;
        }

        if (roundOverrides[stat] === "none") {
            return String(value);
        }
        if (roundOverrides[stat] === "oneDecimalPlace") {
            return value.toFixed(1);
        }
        if (roundOverrides[stat] === "roundWinp") {
            return commonHelpers.roundWinp(value);
        }
        if (roundOverrides[stat] === "plusMinus") {
            return plusMinus(value, d);
        }
        if (roundOverrides[stat] === "noDecimalPlace") {
            return value.toFixed(0);
        }

        return value.toFixed(d);
    } catch (err) {
        return "";
    }
};

const helpers = {
    ...commonHelpers,
    colorRating,
    leagueUrl,
    numberWithCommas,
    plusMinus,
    roundStat,
    roundsWonText,
};

export default helpers;
