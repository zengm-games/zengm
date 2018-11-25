// @flow

import deionWorker from "../../deion/worker";
import { COMPOSITE_WEIGHTS } from "../common";
import achievements from "./achievements";
import emptyPlayerStatsRow from "./emptyPlayerStatsRow";
import emptyTeamStatsRow from "./emptyTeamStatsRow";
import season from "./core/season";
import views from "./views";

(async () => {
    await deionWorker({
        overrides: {
            COMPOSITE_WEIGHTS,
            achievements,
            core: {
                season,
            },
            emptyPlayerStatsRow,
            emptyTeamStatsRow,
            views,
        },
    });
})();
