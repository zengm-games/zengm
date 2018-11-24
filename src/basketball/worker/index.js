// @flow

import deionWorker from "../../deion/worker";
import achievements from "./achievements";

(async () => {
    await deionWorker({
        overrides: {
            achievements,
        },
    });
})();
