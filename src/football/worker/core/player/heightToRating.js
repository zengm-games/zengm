// @flow

import limitRating from "../../../../deion/worker/core/player/limitRating";

const heightToRating = (heightInInches: number) => {
    const minHgt = 64; // 5'4"
    const maxHgt = 82; // 6'10"
    return limitRating((100 * (heightInInches - minHgt)) / (maxHgt - minHgt));
};

export default heightToRating;
