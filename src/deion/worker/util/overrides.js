// @flow

import type {
    CompositeWeights,
    Names,
    WorkerOverridesCore,
    WorkerOverridesUtil,
} from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    POSITIONS: string[],
    core: WorkerOverridesCore,
    names: Names,
    util: WorkerOverridesUtil,
    views: {
        [key: string]: any,
    },
} = {
    COMPOSITE_WEIGHTS: {},
    POSITIONS: [],
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
