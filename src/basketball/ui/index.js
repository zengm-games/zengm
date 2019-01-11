// @flow

import deionUI from "../../deion/ui";
import * as constants from "../common/constants";
import components from "./components";
import util from "./util";
import views from "./views";

(async () => {
    await deionUI({
        overrides: {
            constants,
            components,
            util,
            views,
        },
    });
})();
