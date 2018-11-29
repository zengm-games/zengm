// @flow

import type {
    CompositeWeights,
    Names,
    WorkerOverridesCore,
    WorkerOverridesDB,
    WorkerOverridesUtil,
} from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    core: WorkerOverridesCore,
    db: WorkerOverridesDB,
    names: Names,
    util: WorkerOverridesUtil,
    views: {
        [key: string]: any,
    },
} = {
    COMPOSITE_WEIGHTS: {},
    core: {
        GameSim: undefined,
        player: {},
        season: {},
        team: {},
    },
    db: {
        getCopies: {},
    },
    names: {
        first: {},
        last: {},
    },
    util: {
        achievements: {},
        advStats: async () => {},
        changes: [],
        emptyPlayerStatsRow: {},
        emptyTeamStatsRow: {},
        processTeamStats: () => {},
    },
    views: {},
};

export default overrides;
