// @flow

import type {
    Achievements,
    CompositeWeights,
    OverridesCore,
    PlayerStats,
    TeamStats,
} from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    achievements: Achievements,
    core: OverridesCore,
    emptyPlayerStatsRow: PlayerStats,
    emptyTeamStatsRow: TeamStats,
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
    views: {},
};

export default overrides;
