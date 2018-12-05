// @flow

import type { PlayerRatings } from "../../../common/types";

/**
 * Assign a position (PG, SG, SF, PF, C, G, GF, FC) based on ratings.
 *
 * @memberOf core.player
 * @param {Object.<string, number>} ratings Ratings object.
 * @return {string} Position.
 */
const pos = (ratings: PlayerRatings): string => {
    let pg = false;
    let sg = false;
    let sf = false;
    let pf = false;
    let c = false;

    let position;

    // Without other skills, slot primarily by height
    if (ratings.hgt >= 59) {
        // 6'10"
        position = "C";
    } else if (ratings.hgt >= 52) {
        // 6'8"
        position = "PF";
    } else if (ratings.hgt >= 44) {
        // 6'6"
        position = "SF";
    } else if (ratings.hgt >= 30) {
        position = "SG";
    } else {
        position = "G";
    }

    // No height requirements for point guards
    // PG is a fast ball handler, or a super ball handler
    if (
        (ratings.spd >= 60 && ratings.pss >= 50 && ratings.drb >= 50) ||
        (ratings.spd >= 40 && ratings.pss >= 65 && ratings.drb >= 65)
    ) {
        pg = true;
    }

    // SG is secondary ball handler and at least one of: slasher or 3p shooter
    if (
        ratings.spd >= 50 &&
        ratings.drb >= 50 &&
        ratings.hgt >= 30 &&
        (ratings.dnk >= 58 || ratings.tp >= 63)
    ) {
        sg = true;
    }

    // SF is similar to SG but must be taller and has lower dribble/speed requirements
    if (
        ratings.spd >= 40 &&
        ratings.drb > 30 &&
        ratings.hgt >= 44 &&
        (ratings.dnk >= 58 || ratings.tp >= 63)
    ) {
        sf = true;
    }

    // PF must meet height/strength requirements.  If they are too tall then they are a Center only... unless they can shoot
    if (
        ratings.hgt >= 44 &&
        ratings.stre >= 55 &&
        ratings.hgt + ratings.stre >= 110 &&
        (ratings.hgt <= 63 || ratings.tp >= 60)
    ) {
        pf = true;
    }

    // C must be extra tall or is strong/shotblocker but not quite as tall
    if (ratings.hgt >= 63 || (ratings.hgt >= 54 && ratings.stre >= 75)) {
        c = true;

        // To make sure player will always be C or FC
        pg = false;
        sg = false;
    }

    if (pg && !sg && !sf && !pf && !c) {
        position = "PG";
    } else if (!pg && sg && !sf && !pf && !c) {
        position = "SG";
    } else if (!pg && !sg && sf && !pf && !c) {
        position = "SF";
    } else if (!pg && !sg && !sf && pf && !c) {
        position = "PF";
    } else if (!pg && !sg && !sf && !pf && c) {
        position = "C";
    }

    // Multiple positions
    if ((pg || sg) && c) {
        position = "F";
    } else if ((pg || sg) && (sf || pf)) {
        position = "GF";
    } else if (c && (pf || sf)) {
        position = "FC";
    } else if (pf && sf) {
        position = "F";
    } else if (pg && sg) {
        position = "G";
    }

    return position;
};

export default pos;
