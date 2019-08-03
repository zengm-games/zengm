// @flow

import type { Local } from "../../common/types";

// These variables are transient and will be reset every refresh. See lock.js for more.

const defaultLocal: Local = {
    autoPlaySeasons: 0,
    fantasyDraftResults: [],
    goldUntil: Infinity, // Default is to assume Gold, until told otherwise by server
    leagueLoaded: false,
    phaseText: "",
    playerNames: undefined,
    playingUntilEndOfRound: false,
    statusText: "Idle",
    unviewedSeasonSummary: false, // Set to true when a live game sim of the final game prevents an automatic redirect to the season summary page
};

const local: Local & { reset: () => void } = {
    autoPlaySeasons: defaultLocal.autoPlaySeasons,
    fantasyDraftResults: defaultLocal.fantasyDraftResults,
    goldUntil: defaultLocal.goldUntil,
    leagueLoaded: defaultLocal.leagueLoaded,
    phaseText: defaultLocal.phaseText,
    playerNames: defaultLocal.playerNames,
    playingUntilEndOfRound: defaultLocal.playingUntilEndOfRound,
    statusText: defaultLocal.statusText,
    unviewedSeasonSummary: defaultLocal.unviewedSeasonSummary,

    reset: () => {
        local.autoPlaySeasons = defaultLocal.autoPlaySeasons;
        local.fantasyDraftResults = defaultLocal.fantasyDraftResults;
        local.leagueLoaded = defaultLocal.leagueLoaded;
        local.phaseText = defaultLocal.phaseText;
        local.playerNames = defaultLocal.playerNames;
        local.playingUntilEndOfRound = defaultLocal.playingUntilEndOfRound;
        local.statusText = defaultLocal.statusText;
        local.unviewedSeasonSummary = defaultLocal.unviewedSeasonSummary;

        // Don't reset goldUntil because that persists across leagues. Probably it shouldn't be in this file, but should
        // be somewhere else (like how g used to have some variables not persisted to database).
    },
};

export default local;
