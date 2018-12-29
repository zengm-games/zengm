// @flow

import type { WorkerOverridesConstants } from "../../common/types";

const overrides: {
    constants: WorkerOverridesConstants,
    components: {
        [key: string]: any,
    },
    views: { [key: string]: any },
} = {
    constants: {
        COMPOSITE_WEIGHTS: {},
        PLAYER_STATS_TABLES: {},
        POSITION_COUNTS: {},
        POSITIONS: [],
        RATINGS: [],
        TEAM_STATS_TABLES: {},
    },
    components: {},
    views: {},
};

export default overrides;
