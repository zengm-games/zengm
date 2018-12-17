// @flow

import type {
    Names,
    WorkerOverridesConstants,
    WorkerOverridesCore,
    WorkerOverridesUtil,
} from "../../common/types";

const overrides: {
    constants: WorkerOverridesConstants,
    core: WorkerOverridesCore,
    names: Names,
    util: WorkerOverridesUtil,
    views: {
        [key: string]: any,
    },
} = {
    constants: {
        COMPOSITE_WEIGHTS: {},
        POSITIONS: [],
        RATINGS: [],
    },
    core: {
        GameSim: undefined,
        player: {},
        season: {},
        team: {},
    },
    names: {
        first: {},
        last: {},
    },
    util: {
        achievements: [],
        advStats: async () => {},
        changes: [],
    },
    views: {},
};

export default overrides;
