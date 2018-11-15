// @flow

import { local } from ".";

let currentTitle = "Basketball GM";
const setTitle = (newTitle: string) => {
    if (
        window.location.pathname.startsWith("/l/") &&
        local.state.leagueName !== ""
    ) {
        newTitle += ` - ${local.state.leagueName}`;
    }
    newTitle = `${newTitle} - Basketball GM`;
    if (newTitle !== currentTitle) {
        currentTitle = newTitle;
        document.title = newTitle;
    }
};

export default setTitle;
