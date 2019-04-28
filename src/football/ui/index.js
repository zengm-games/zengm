// @flow

import deionUI from "../../deion/ui";
import common from "../common";
import components from "./components";
import util from "./util";
import views from "./views";

(async () => {
    await deionUI({
        overrides: {
            common,
            components,
            util,
            views,
        },
    });
})();
