// @flow

import deionWorker from "../../deion/worker";
import { COMPOSITE_WEIGHTS } from "../common";
import achievements from "./achievements";

(async () => {
    await deionWorker({
        overrides: {
            achievements,
            COMPOSITE_WEIGHTS,
        },
    });
})();
