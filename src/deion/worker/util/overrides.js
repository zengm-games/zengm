// @flow

import type {
    Achievements,
    CompositeWeights,
    OverridesCore,
} from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    achievements: Achievements,
    core: OverridesCore,
    views: {
        [key: string]: any,
    },
} = {
    COMPOSITE_WEIGHTS: {},
    achievements: {},
    core: {
        season: {},
    },
    views: {},
};

export default overrides;
