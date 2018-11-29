// @flow

import faces from "facesjs";
import genContract from "./genContract";
import name from "./name";
import setContract from "./setContract";
import { g, overrides, random } from "../../util";
import type {
    MinimalPlayerRatings,
    PlayerWithoutPid,
} from "../../../common/types";

const generate = (
    tid: number,
    age: number,
    draftYear: number,
    newLeague: boolean,
    scoutingRank: number,
): PlayerWithoutPid<MinimalPlayerRatings> => {
    // RealHeight is drawn from a custom probability distribution and then offset by a fraction of an inch either way
    let realHeight = Math.random() - 0.5; // Fraction of an inch
    realHeight += random.heightDist();

    const wingspanAdjust = realHeight + random.randInt(-1, 1);

    // hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)
    if (!overrides.core.player.heightToRating) {
        throw new Error("Missing overrides.core.player.heightToRating");
    }
    const predetHgt = overrides.core.player.heightToRating(wingspanAdjust);
    realHeight = Math.round(realHeight);

    if (!overrides.core.player.genRatings) {
        throw new Error("Missing overrides.core.player.genRatings");
    }
    const ratings = overrides.core.player.genRatings(
        newLeague ? g.startingSeason : draftYear,
        scoutingRank,
        tid,
        predetHgt,
    );

    const { country, firstName, lastName } = name();

    if (!overrides.core.player.genWeight) {
        throw new Error("Missing overrides.core.player.genWeight");
    }
    const weight = overrides.core.player.genWeight(ratings.hgt, ratings.stre);

    const p = {
        awards: [],
        born: {
            year: g.season - age,
            loc: country,
        },
        college: "",
        contract: {
            // Will be set by setContract below
            amount: 0,
            exp: 0,
        },
        draft: {
            round: 0,
            pick: 0,
            tid: -1,
            originalTid: -1,
            year: draftYear,
            pot: 0,
            ovr: 0,
            skills: [],
        },
        face: faces.generate(),
        firstName,
        freeAgentMood: Array(g.numTeams).fill(0),
        gamesUntilTradable: 0,
        hgt: realHeight,
        hof: false,
        imgURL: "", // Custom rosters can define player image URLs to be used rather than vector faces
        injury: { type: "Healthy", gamesRemaining: 0 },
        lastName,
        ptModifier: 1,
        relatives: [],
        ratings: [ratings],
        retiredYear: Infinity,
        rosterOrder: 666, // Will be set later
        salaries: [],
        stats: [],
        statsTids: [],
        tid,
        watch: false,
        weight,
        yearsFreeAgent: 0,

        // These should be set by updateValues after player is completely done (automatic in develop)
        value: 0,
        valueNoPot: 0,
        valueFuzz: 0,
        valueNoPotFuzz: 0,
        valueWithContract: 0,
    };

    // $FlowFixMe
    setContract(p, genContract(p), false);

    return p;
};

export default generate;
