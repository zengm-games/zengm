// @flow

import { helpers } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

const ovr = (ratings: PlayerRatings, pos?: string): number => {
    pos = pos !== undefined ? pos : ratings.pos;

    let rating;

    if (pos === "QB") {
        rating =
            (ratings.hgt +
                ratings.spd +
                ratings.endu +
                8 * ratings.thv +
                4 * ratings.thp +
                8 * ratings.tha +
                ratings.bls +
                ratings.elu) /
            25;
    } else if (pos === "RB") {
        rating =
            (4 * ratings.stre +
                8 * ratings.spd +
                ratings.endu +
                8 * ratings.elu +
                ratings.rtr +
                2 * ratings.hnd +
                4 * ratings.bls +
                ratings.rbk +
                2 * ratings.pbk) /
            31;
    } else if (pos === "WR") {
        rating =
            (2 * ratings.hgt +
                ratings.stre +
                4 * ratings.spd +
                ratings.endu +
                ratings.elu +
                4 * ratings.rtr +
                8 * ratings.hnd +
                ratings.bls +
                ratings.rbk) /
            23;
    } else if (pos === "TE") {
        rating =
            (4 * ratings.hgt +
                4 * ratings.stre +
                2 * ratings.spd +
                ratings.endu +
                ratings.elu +
                4 * ratings.rtr +
                4 * ratings.hnd +
                ratings.bls +
                2 * ratings.rbk +
                2 * ratings.pbk) /
            25;
    } else if (pos === "OL") {
        rating =
            (ratings.hgt +
                2 * ratings.stre +
                ratings.spd +
                2 * ratings.rbk +
                2 * ratings.pbk) /
            8;
    } else if (pos === "C") {
        rating =
            (ratings.hgt +
                2 * ratings.stre +
                ratings.spd +
                2 * ratings.rbk +
                2 * ratings.pbk +
                4 * ratings.snp) /
            12;
    } else if (pos === "DL") {
        rating =
            (4 * ratings.hgt +
                8 * ratings.stre +
                2 * ratings.spd +
                ratings.endu +
                8 * ratings.prs +
                8 * ratings.rns +
                ratings.hnd) /
            32;
    } else if (pos === "LB") {
        rating =
            (2 * ratings.hgt +
                4 * ratings.stre +
                4 * ratings.spd +
                ratings.endu +
                4 * ratings.pcv +
                4 * ratings.prs +
                4 * ratings.rns +
                2 * ratings.hnd) /
            25;
    } else if (pos === "CB") {
        rating =
            (ratings.hgt +
                ratings.stre +
                8 * ratings.spd +
                ratings.endu +
                8 * ratings.pcv +
                ratings.rns +
                2 * ratings.hnd) /
            22;
    } else if (pos === "S") {
        rating =
            (ratings.hgt +
                2 * ratings.stre +
                4 * ratings.spd +
                ratings.endu +
                4 * ratings.pcv +
                4 * ratings.rns +
                2 * ratings.hnd) /
            18;
    } else if (pos === "K") {
        rating = (ratings.kpw + ratings.kac) / 2;
    } else if (pos === "P") {
        rating = (ratings.ppw + ratings.pac) / 2;
    } else if (pos === "KR") {
        rating =
            (ratings.stre +
                4 * ratings.spd +
                4 * ratings.elu +
                2 * ratings.hnd +
                8 * ratings.bls) /
            19;
    } else if (pos === "PR") {
        rating =
            (ratings.stre +
                4 * ratings.spd +
                4 * ratings.elu +
                8 * ratings.hnd +
                8 * ratings.bls) /
            25;
    } else {
        throw new Error(`Unknown position: "${pos}"`);
    }

    return helpers.bound(Math.round(rating), 0, 100);
};

export default ovr;
