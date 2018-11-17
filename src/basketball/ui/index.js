// @flow

import deionUI from "../../deion/ui";
import views from "./views";

(async () => {
    await deionUI({
        overrides: {
            views,
        },
    });
})();
