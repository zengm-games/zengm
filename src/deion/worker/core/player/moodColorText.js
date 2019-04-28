// @flow

import { g } from "../../util";
import type { Player } from "../../../common/types";

// See views.negotiation for moods as well
const moodColorText = (p: Player<>) => {
    if (p.freeAgentMood[g.userTid] < 0.25) {
        return {
            color: "var(--green)",
            text: "Eager to reach an agreement.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.5) {
        return {
            color: "var(--gray)",
            text: "Willing to sign for the right price.",
        };
    }

    if (p.freeAgentMood[g.userTid] < 0.75) {
        return {
            color: "var(--yellow)",
            text: "Annoyed at you.",
        };
    }

    return {
        color: "var(--red)",
        text: "Insulted by your presence.",
    };
};

export default moodColorText;
