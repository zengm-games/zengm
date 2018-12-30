// @flow

import { helpers } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

const info = {
    QB: {
        hgt: [1, 1],
        spd: [1, 1],
        endu: [1, 1],
        thv: [8, 1],
        thp: [4, 1],
        tha: [8, 1],
        bsc: [1, 1],
        elu: [1, 1],
    },
    RB: {
        stre: [4, 1],
        spd: [8, 1],
        endu: [1, 1],
        elu: [8, 1],
        rtr: [1, 1],
        hnd: [2, 1],
        bsc: [4, 1],
        rbk: [1, 1],
        pbk: [2, 1],
    },
    WR: {
        hgt: [2, 1],
        stre: [1, 1],
        spd: [4, 2],
        endu: [1, 1],
        elu: [1, 1],
        rtr: [4, 1],
        hnd: [8, 1],
        bsc: [1, 1],
        rbk: [1, 1],
    },
    TE: {
        hgt: [4, 1],
        stre: [4, 2],
        spd: [1, 1],
        endu: [1, 1],
        elu: [1, 1],
        rtr: [4, 1],
        hnd: [4, 1],
        bsc: [1, 1],
        rbk: [2, 1],
    },
    OL: {
        hgt: [1, 1],
        stre: [2, 3],
        spd: [1, 1],
        rbk: [2, 1],
        pbk: [2, 1],
    },
    DL: {
        hgt: [4, 1],
        stre: [8, 3],
        spd: [2, 1],
        endu: [1, 1],
        prs: [8, 1],
        rns: [8, 1],
        hnd: [1, 1],
    },
    LB: {
        hgt: [2, 1],
        stre: [4, 1],
        spd: [4, 1],
        endu: [1, 1],
        pcv: [2, 1],
        prs: [2, 1],
        rns: [2, 1],
        hnd: [1, 1],
    },
    CB: {
        hgt: [1, 1],
        stre: [1, 1],
        spd: [8, 2],
        endu: [1, 1],
        pcv: [8, 1],
        rns: [1, 1],
        hnd: [2, 1],
    },
    S: {
        hgt: [1, 1],
        stre: [2, 1],
        spd: [4, 1.5],
        endu: [1, 1],
        pcv: [4, 1],
        rns: [4, 1],
        hnd: [2, 1],
    },
    K: {
        kpw: [1, 1],
        kac: [1, 1],
    },
    P: {
        ppw: [1, 1],
        pac: [1, 1],
    },
    KR: {
        stre: [1, 1],
        spd: [4, 1],
        elu: [4, 1],
        hnd: [2, 1],
        bsc: [8, 1],
    },
    PR: {
        stre: [1, 1],
        spd: [4, 1],
        elu: [4, 1],
        hnd: [8, 1],
        bsc: [8, 1],
    },
};

const ovr = (ratings: PlayerRatings, pos?: string): number => {
    pos = pos !== undefined ? pos : ratings.pos;

    let rating = 0;

    if (info[pos]) {
        let sumCoeffs = 0;
        for (const [key, [coeff, power]] of Object.entries(info[pos])) {
            const powerFactor = 100 / 100 ** power;
            rating += coeff * powerFactor * ratings[key] ** power;
            sumCoeffs += coeff;
        }
        rating /= sumCoeffs;
    } else {
        throw new Error(`Unknown position: "${pos}"`);
    }

    return helpers.bound(Math.round(rating), 0, 100);
};

export default ovr;
