// @flow

import type {
    Achievements,
    CompositeWeights,
    OverridesCore,
    Names,
    PlayerStats,
    TeamStats,
} from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    achievements: Achievements,
    core: OverridesCore,
    emptyPlayerStatsRow: PlayerStats,
    emptyTeamStatsRow: TeamStats,
    names: Names,
    views: {
        [key: string]: any,
    },
} = {
    COMPOSITE_WEIGHTS: {},
    achievements: {},
    core: {
        season: {},
    },
    emptyPlayerStatsRow: {},
    emptyTeamStatsRow: {},
    names: {
        first: {},
        last: {},
    },
    views: {},
};

export default overrides;
