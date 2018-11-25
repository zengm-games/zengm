// @flow

import deionWorker from "../../deion/worker";
import { COMPOSITE_WEIGHTS } from "../common";
import achievements from "./achievements";
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
            views,
        },
    });
})();
