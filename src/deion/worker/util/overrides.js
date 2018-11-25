// @flow

import type { Achievements, CompositeWeights } from "../../common/types";

const overrides: {
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    achievements: Achievements,
    views: {
        [key: string]: any,
    },
} = {
    COMPOSITE_WEIGHTS: {},
    achievements: {},
    views: {},
};

export default overrides;
