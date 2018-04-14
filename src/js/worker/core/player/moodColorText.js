// @flow

import { g } from "../../../common";
import type { Player } from "../../../common/types";

// See views.negotiation for moods as well
const moodColorText = (p: Player) => {
    if (p.freeAgentMood[g.userTid] < 0.25) {
        return {
            color: "#5cb85c",
            text: "Eager to reach an agreement.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.5) {
        return {
            color: "#ccc",
            text: "Willing to sign for the right price.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.75) {
        return {
            color: "#f0ad4e",
            text: "Annoyed at you.",
        };
    }

    return {
        color: "#d9534f",
        text: "Insulted by your presence.",
    };
};

export default moodColorText;
