// @flow

import Promise from 'bluebird';
import {views} from '../worker';

const runBefore = async (viewId, inputs, updateEvents, prevData, setStateData, topMenu) => {
    if (views.hasOwnProperty(viewId) && views[viewId].hasOwnProperty('runBefore')) {
        // Resolve all the promises before updating the UI to minimize flicker
        return Promise.all(views[viewId].runBefore.map((fn) => {
            return fn(inputs, updateEvents, prevData, setStateData, topMenu);
        }));
    }

    return [];
};

export {
    // eslint-disable-next-line import/prefer-default-export
    runBefore,
};
