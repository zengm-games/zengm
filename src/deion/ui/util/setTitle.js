// @flow

import local from "./local";

const gameName = `${process.env.SPORT.charAt(0).toUpperCase() +
    process.env.SPORT.slice(1)} GM`;

let currentTitle = gameName;
const setTitle = (newTitle: string) => {
    if (
        window.location.pathname.startsWith("/l/") &&
        local.state.leagueName !== ""
    ) {
        newTitle += ` - ${local.state.leagueName}`;
    }
    newTitle = `${newTitle} - ${gameName}`;
    if (newTitle !== currentTitle) {
        currentTitle = newTitle;
        document.title = newTitle;
    }
};

export default setTitle;
