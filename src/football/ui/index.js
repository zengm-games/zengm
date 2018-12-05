// @flow

import deionUI from "../../deion/ui";
import components from "../../basketball/ui/components";
import views from "../../basketball/ui/views";

(async () => {
    await deionUI({
        overrides: {
            components,
            views,
        },
    });
})();
