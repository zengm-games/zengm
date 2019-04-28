// @flow

import { random } from "../../../../deion/worker/util";

const MIN_WEIGHT = 155;
const MAX_WEIGHT = 305;

const genHeight = (hgt: number, stre: number) => {
    // Weight in pounds (from minWeight to maxWeight)
    return Math.round(
        random.randInt(-20, 20) +
            ((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
            MIN_WEIGHT,
    );
};

export default genHeight;
