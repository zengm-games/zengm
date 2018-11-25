// @flow

import deionWorker from "../../deion/worker";
import { COMPOSITE_WEIGHTS } from "../common";
import achievements from "./achievements";
import views from "./views";

(async () => {
    await deionWorker({
        overrides: {
            COMPOSITE_WEIGHTS,
            achievements,
            views,
        },
    });
})();
