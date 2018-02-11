// @flow

import type { Local } from "../../common/types";

// These variables are transient and will be reset every refresh. See lock.js for more.

const defaultLocal: Local = {
    autoPlaySeasons: 0,
    goldUntil: Infinity, // Default is to assume Gold, until told otherwise by server
    phaseText: "",
    statusText: "Idle",
};

const local: Local & { reset: () => void } = {
    autoPlaySeasons: 0,
    goldUntil: Infinity,
    phaseText: "",
    statusText: "Idle",
    reset: () => {
        local.autoPlaySeasons = defaultLocal.autoPlaySeasons;
        local.phaseText = defaultLocal.phaseText;
        local.statusText = defaultLocal.statusText;

        // Don't reset goldUntil because that persists across leagues. Probably it shouldn't be in this file, but should
        // be somewhere else (like how g used to have some variables not persisted to database).
    },
};

export default local;
