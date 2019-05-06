// @flow

import { helpers } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

const info = {
    QB: {
        hgt: [1, 1],
        spd: [1, 1],
        endu: [1, 1],
        thv: [8, 1.5],
        thp: [4, 1.5],
        tha: [8, 1.5],
        bsc: [1, 1],
        elu: [1, 1],
    },
    RB: {
        stre: [4, 1],
        spd: [8, 1],
        endu: [1, 1],
        elu: [8, 2],
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
        hgt: [4, 3],
        stre: [8, 3],
        spd: [2, 1],
        endu: [1, 1],
        prs: [8, 1],
        rns: [8, 1],
        hnd: [1, 1],
    },
    LB: {
        hgt: [2, 3],
        stre: [4, 1],
        spd: [4, 1],
        endu: [1, 1],
        pcv: [2, 1],
        tck: [8, 1],
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
        stre: [3, 1],
        spd: [4, 1.5],
        endu: [1, 1],
        pcv: [4, 1],
        tck: [4, 1],
        rns: [2, 1],
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

// Handle some nonlinear interactions
const bonuses = {
    RB: ratings => helpers.bound((ratings.spd * ratings.elu) / 300, 6, 20),
    WR: ratings => helpers.bound((ratings.spd * ratings.hnd) / 550, 0, 5),
    TE: ratings => helpers.bound((ratings.stre * ratings.hnd) / 550, 2, 10),
    LB: ratings => helpers.bound(ratings.tck / 30, 2, 5),
    S: ratings =>
        helpers.bound(((ratings.stre + 25) * ratings.pcv) / 550, 2, 15),
};

const ovr = (ratings: PlayerRatings, pos?: string): number => {
    pos = pos !== undefined ? pos : ratings.pos;

    let r = 0;

    if (info[pos]) {
        let sumCoeffs = 0;
        // $FlowFixMe
        for (const [key, [coeff, power]] of Object.entries(info[pos])) {
            const powerFactor = 100 / 100 ** power;
            r += coeff * powerFactor * ratings[key] ** power;
            sumCoeffs += coeff;
        }
        r /= sumCoeffs;

        if (bonuses.hasOwnProperty(pos)) {
            // $FlowFixMe
            r += bonuses[pos](ratings);
        }
    } else {
        throw new Error(`Unknown position: "${pos}"`);
    }

    // Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
    // +8 at 68
    // +4 at 50
    // -5 at 42
    // -10 at 31
    let fudgeFactor = 0;
    if (r >= 68) {
        fudgeFactor = 8;
    } else if (r >= 50) {
        fudgeFactor = 4 + (r - 50) * (4 / 18);
    } else if (r >= 42) {
        fudgeFactor = -5 + (r - 42) * (10 / 8);
    } else if (r >= 31) {
        fudgeFactor = -5 - (42 - r) * (5 / 11);
    } else {
        fudgeFactor = -10;
    }

    r = helpers.bound(Math.round(r + fudgeFactor), 0, 100);

    // Feels silly that the highest rated players are kickers and punters
    if (pos === "K" || pos === "P") {
        r = Math.round(r * 0.75);
    }

    // QB should never be KR/PR
    if (ratings.pos === "QB" && (pos === "KR" || pos === "PR")) {
        r = Math.round(r * 0.5);
    }

    return r;
};

export default ovr;
