// @flow

import { Container } from "unstated";
import type { GameAttributes, LocalStateUI } from "../../common/types";

// These are variables that are needed to display parts of the UI not driven explicitly by worker/views/*.js files. Like
// the top navbar, the multi team menu, etc. They come from gameAttributes, the account system, and elsewhere.

class LocalContainer extends Container<LocalStateUI> {
    constructor() {
        super();
        this.state = {
            gold: true,
            godMode: false,
            hasViewedALeague: !!localStorage.getItem("hasViewedALeague"),
            lid: undefined,
            leagueName: "",
            phase: 0,
            phaseText: "",
            playMenuOptions: [],
            popup: window.location.search === "?w=popup",
            season: 0,
            startingSeason: 0,
            statusText: "",
            teamAbbrevsCache: [],
            teamNamesCache: [],
            teamRegionsCache: [],
            userTid: 0,
            userTids: [],
            username: undefined,
        };
    }

    resetLeague() {
        // Reset any values specific to a league
        this.setState({
            godMode: false,
            lid: undefined,
            leagueName: "",
            phase: 0,
            phaseText: "",
            playMenuOptions: [],
            season: 0,
            startingSeason: 0,
            statusText: "",
            teamAbbrevsCache: [],
            teamNamesCache: [],
            teamRegionsCache: [],
            userTid: 0,
            userTids: [],
        });
    }

    update(obj: $Shape<LocalStateUI> | (LocalStateUI => $Shape<LocalStateUI>)) {
        this.setState(obj);
    }

    updateGameAttributes(gameAttributes: GameAttributes) {
        const updates = {};

        const keys = [
            "godMode",
            "lid",
            "leagueName",
            "phase",
            "season",
            "startingSeason",
            "teamAbbrevsCache",
            "teamNamesCache",
            "teamRegionsCache",
            "userTid",
            "userTids",
        ];

        let update = false;
        for (const key of keys) {
            if (
                gameAttributes.hasOwnProperty(key) &&
                updates[key] !== gameAttributes[key]
            ) {
                updates[key] = gameAttributes[key];
                update = true;
            }
        }

        if (update) {
            this.setState(updates);
        }
    }
}

const local = new LocalContainer();

export default local;
