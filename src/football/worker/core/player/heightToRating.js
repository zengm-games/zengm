// @flow

import limitRating from "../../../../deion/worker/core/player/limitRating";

const heightToRating = (heightInInches: number) => {
    // Min/max for hgt rating.  Displayed height ranges from 4'6" to 9'0", though we might never see the true extremes
    const minHgt = 66; // 5'6"
    const maxHgt = 93; // 7'9"
    return limitRating((100 * (heightInInches - minHgt)) / (maxHgt - minHgt));
};

export default heightToRating;
