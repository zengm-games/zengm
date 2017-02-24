// @flow

import Promise from 'bluebird';
import {init, views} from '../worker';

const runBefore = async (viewId, inputs, updateEvents, prevData, setStateData, topMenu) => {
    if (views.hasOwnProperty(viewId) && views[viewId].hasOwnProperty('runBefore')) {
        return Promise.all(views[viewId].runBefore.map((fn) => {
            return fn(inputs, updateEvents, prevData, setStateData, topMenu);
        }));
    }

    return [];
};

export {
    init,
    runBefore,
};
