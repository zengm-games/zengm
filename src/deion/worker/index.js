// @flow

/* eslint-disable import/first */
import "../common/polyfills";
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";
import type { Achievements, CompositeWeights } from "../common/types";

const overrides = util.overrides;

// eslint-disable-next-line no-restricted-globals
self.bbgm = Object.assign({}, common, core, db, util);

const deionWorker = async (options: {
    overrides: {
        COMPOSITE_WEIGHTS: CompositeWeights<>,
        achievements: Achievements,
        views: {
            [key: string]: any,
        },
    },
}) => {
    overrides.COMPOSITE_WEIGHTS = options.overrides.COMPOSITE_WEIGHTS;
    overrides.achievements = options.overrides.achievements;
    Object.assign(
        overrides.COMPOSITE_WEIGHTS,
        options.overrides.COMPOSITE_WEIGHTS,
    );
    Object.assign(overrides.achievements, options.overrides.achievements);
    Object.assign(overrides.views, options.overrides.views);

    // God damn this function is ugly, clean up! Can probably share with ui.
    util.promiseWorker.register(([name, ...params], hostID) => {
        const conditions = {
            hostID,
        };

        if (name.indexOf("actions.") === 0) {
            let subname = name.replace("actions.", "");

            if (subname.indexOf("playMenu.") === 0) {
                subname = subname.replace("playMenu.", "");

                if (!api.actions.playMenu.hasOwnProperty(subname)) {
                    throw new Error(
                        `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                            params,
                        )}`,
                    );
                }

                return api.actions.playMenu[subname](...params, conditions);
            }
            if (subname.indexOf("toolsMenu.") === 0) {
                subname = subname.replace("toolsMenu.", "");

                if (!api.actions.toolsMenu.hasOwnProperty(subname)) {
                    throw new Error(
                        `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                            params,
                        )}`,
                    );
                }

                return api.actions.toolsMenu[subname](...params, conditions);
            }

            if (!api.actions.hasOwnProperty(subname)) {
                throw new Error(
                    `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                        params,
                    )}`,
                );
            }

            return api.actions[subname](...params, conditions);
        }

        if (name.indexOf("processInputs.") === 0) {
            const subname = name.replace("processInputs.", "");

            if (!api.processInputs.hasOwnProperty(subname)) {
                // processInputs is not needed for every page
                return {};
            }

            const obj = api.processInputs[subname](...params, conditions);

            // Return empty object rather than undefined
            return obj === undefined ? {} : obj;
        }

        if (!api.hasOwnProperty(name)) {
            throw new Error(
                `API call to nonexistant worker function "${name}" with params ${JSON.stringify(
                    params,
                )}`,
            );
        }

        return api[name](...params, conditions);
    });
};

export default deionWorker;
