// @flow

import g from '../../globals';

let currentTitle = 'Basketball GM';
const setTitle = (newTitle: string) => {
    if (g.lid !== null) {
        newTitle += ` - ${g.leagueName}`;
    }
    newTitle = `${newTitle} - Basketball GM`;
    if (newTitle !== currentTitle) {
        currentTitle = newTitle;
        document.title = newTitle;
    }
};

export default setTitle;
