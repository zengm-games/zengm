// @flow

import type {
    Names,
    WorkerOverridesConstants,
    WorkerOverridesCore,
    WorkerOverridesUtil,
} from "../../common/types";

const overrides: {
    common: {
        constants: WorkerOverridesConstants,
        [key: string]: any,
    },
    core: WorkerOverridesCore,
    names: Names,
    util: WorkerOverridesUtil,
    views: {
        [key: string]: any,
    },
} = {
    common: {
        constants: {
            COMPOSITE_WEIGHTS: {},
            PLAYER_STATS_TABLES: {},
            POSITION_COUNTS: {},
            POSITIONS: [],
            RATINGS: [],
            TEAM_STATS_TABLES: {},
            TIME_BETWEEN_GAMES: "",
        },
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
