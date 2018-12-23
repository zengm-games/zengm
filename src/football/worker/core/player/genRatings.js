// @flow

import { PLAYER } from "../../../../deion/common";
import { player } from "../../../../deion/worker/core";
import { overrides, random } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

const genRatings = (
    season: number,
    scoutingRank: number,
    tid: number,
    hgt: number,
): PlayerRatings => {
    const ratings = {
        stre: random.randInt(0, 100),
        spd: random.randInt(0, 100),
        endu: random.randInt(0, 100),
        thv: random.randInt(0, 100),
        thp: random.randInt(0, 100),
        tha: random.randInt(0, 100),
        bls: random.randInt(0, 100),
        elu: random.randInt(0, 100),
        rtr: random.randInt(0, 100),
        hnd: random.randInt(0, 100),
        rbk: random.randInt(0, 100),
        pbk: random.randInt(0, 100),
        pcv: random.randInt(0, 100),
        prs: random.randInt(0, 100),
        rns: random.randInt(0, 100),
        kpw: random.randInt(0, 100),
        kac: random.randInt(0, 100),
        ppw: random.randInt(0, 100),
        pac: random.randInt(0, 100),
        hgt,
        fuzz: player.genFuzz(scoutingRank),
        ovr: 0,
        pos: "F",
        pot: 0,
        season,
        skills: [],
    };

    if (tid === PLAYER.UNDRAFTED_2) {
        ratings.fuzz *= Math.sqrt(2);
    } else if (tid === PLAYER.UNDRAFTED_3) {
        ratings.fuzz *= 2;
    }

    if (!overrides.core.player.pos) {
        throw new Error("Missing overrides.core.player.pos");
    }
    ratings.pos = overrides.core.player.pos(ratings);

    return ratings;
};

export default genRatings;
