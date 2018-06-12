// @flow

import { Container } from "unstated";
import type { GameAttributes, Option } from "../../common/types";

type LocalState = {
    gold: boolean,
    godMode: boolean,
    hasViewedALeague: boolean,
    lid: number | void,
    leagueName: string,
    phase: number,
    phaseText: string,
    playMenuOptions: Option[],
    popup: boolean,
    season: number,
    startingSeason: number,
    statusText: string,
    teamAbbrevsCache: string[],
    teamNamesCache: string[],
    teamRegionsCache: string[],
    userTid: number,
    userTids: number[],
    username: string | void,
};

class LocalContainer extends Container<LocalState> {
    constructor() {
        super();
        this.state = {
            gold: true,
            godMode: false,
            hasViewedALeague: false,
            lid: undefined,
            leagueName: "",
            phase: 0,
            phaseText: "",
            playMenuOptions: [],
            popup: false,
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
