// @flow

import romanNumerals from "roman-numerals";
import { g, helpers } from "../../../common";
import { finances, player } from "../../core";
import genPlayersWithoutSaving from "./genPlayersWithoutSaving";
import { idb } from "../../db";
import { logEvent, random } from "../../util";
import type {
    PlayerWithoutPid,
} from "../../../common/types";

const probSon = 0.5;
const probBrother = 0.5;

const parseLastName = (lastName: string): [string, number | undefined] => {
    const parts = lastName.split(" ");
    if (parts.length === 1) {
        return [lastName, undefined];
    }

    const suffix = parts[parts.length - 1];
    const parsedName = parts.slice(0, -1).join(" ");

    if (suffix === "Sr.") {
        return [parsedName, 1];
    }

    if (suffix === "Jr.") {
        return [parsedName, 2];
    }

    try {
        const suffixNumber = romanNumerals.toArabic(suffix);
        return [parsedName, suffixNumber];
    } catch (err) {
        return [lastName, undefined];
    }
};

const getSuffix = (suffixNumber: number): string => {
    if (suffixNumber === 2) {
        return "Jr.";
    }
    if (suffixNumber > 2) {
        return romanNumerals.toRoman(suffixNumber);
    }
    throw new Error(`Unexpected suffixNumber: "${suffixNumber}"`);
};

const makeSon = async (p: PlayerWithoutPid) => {
    // Find a player from a draft 17-27 years ago to make the father
    const draftYear = p.draft.year - random.randInt(17, 27);

    const possibleFathers = await idb.getCopies.players({
        draftYear,
    });
    if (possibleFathers.length === 0) {
        // League must be too new, draft class doesn't exist
        return;
    }

    const father = random.choice(possibleFathers);

    const [fatherLastName, fatherSuffixNumber] = parseLastName(father.lastName);
    const sonSuffixNumber = fatherSuffixNumber === undefined ? 2 : fatherSuffixNumber + 1;
    const sonSuffix = getSuffix(sonSuffixNumber);

    p.firstName = father.firstName;
    p.lastName = `${fatherLastName} ${sonSuffix}`;
    if (fatherSuffixNumber === undefined) {
        father.lastName += ` Sr.`;
    }

    p.relatives.push({
        type: "father",
        pid: father.pid,
    });
    father.relatives.push({
        type: "son",
        pid: p.pid,
    });

    await idb.cache.players.put(father);
    // No need to put p, that will be done in genPlayers
};

const makeBrother = async (p: PlayerWithoutPid) => {

};

/**
 * Generate a set of draft prospects.
 *
 * This is called after draft classes are moved up a year, to create the new UNDRAFTED_3 class. It's also called 3 times when a new league starts, to create all 3 draft classes.
 *
 * @memberOf core.draft
 * @param {number} tid Team ID number for the generated draft class. Should be PLAYER.UNDRAFTED, PLAYER.UNDRAFTED_2, or PLAYER.UNDRAFTED_3.
 * @param {?number=} scoutingRank Between 1 and g.numTeams, the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree. If null, then it's automatically found.
 * @param {?number=} numPlayers The number of prospects to generate. Default value is 70.
 * @return {Promise}
 */
const genPlayers = async (
    tid: number,
    scoutingRank?: ?number = null,
    numPlayers?: number,
    newLeague?: boolean = false,
) => {
    // If scoutingRank is not supplied, have to hit the DB to get it
    if (scoutingRank === undefined || scoutingRank === null) {
        const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
            "teamSeasonsByTidSeason",
            [`${g.userTid},${g.season - 2}`, `${g.userTid},${g.season}`],
        );
        scoutingRank = finances.getRankLastThree(
            teamSeasons,
            "expenses",
            "scouting",
        );
    }

    const { draftYear, players } = genPlayersWithoutSaving(
        tid,
        scoutingRank,
        numPlayers,
        newLeague,
    );

    for (const p of players) {
        if (Math.random() < probSon) {
            await makeSon(p);
        }
        if (Math.random() < probBrother) {
            await makeBrother(p);
        }
        await idb.cache.players.add(p);
    }

    // Easter eggs!
    if (Math.random() < 1 / 100000) {
        const p = player.generate(tid, 19, draftYear, false, scoutingRank);
        p.born.year = draftYear - 48;
        p.born.loc = "Los Angeles, CA";
        p.college = "Washington State University";
        p.firstName = "LaVar";
        p.hgt = 78;
        p.imgURL = "/img/lavar.jpg";
        p.lastName = "Ball";
        p.weight = 250;
        Object.assign(p.ratings[0], {
            hgt: 43,
            stre: 80,
            spd: 80,
            jmp: 80,
            endu: 80,
            ins: 80,
            dnk: 80,
            ft: 80,
            fg: 80,
            tp: 80,
            oiq: 80,
            diq: 80,
            drb: 80,
            pss: 80,
            reb: 80,
        });
        player.develop(p, 0);
        player.updateValues(p);
        const pid = await idb.cache.players.add(p);
        if (typeof pid === "number") {
            await logEvent({
                type: "playerFeat",
                text: `<a href="${helpers.leagueUrl(["player", pid])}">${
                    p.firstName
                } ${
                    p.lastName
                }</a> got sick of the haters and decided to show the world how a big baller plays.`,
                showNotification: false,
                pids: [pid],
                tids: [g.userTid],
            });
        }
    } else if (Math.random() < 1 / 100000) {
        const p = player.generate(tid, 19, draftYear, false, scoutingRank);
        p.born.year = draftYear - 71;
        p.born.loc = "Queens, NY";
        p.college = "Wharton";
        p.firstName = "Donald";
        p.hgt = 75;
        p.imgURL = "/img/trump.jpg";
        p.lastName = "Trump";
        p.weight = 240;
        Object.assign(p.ratings[0], {
            hgt: 40,
            stre: 80,
            spd: 80,
            jmp: 80,
            endu: 80,
            ins: 80,
            dnk: 80,
            ft: 80,
            fg: 80,
            tp: 80,
            oiq: 80,
            diq: 100,
            drb: 80,
            pss: 0,
            reb: 80,
        });
        player.develop(p, 0);
        player.updateValues(p);
        p.ratings[0].skills = ["Dp"];
        const pid = await idb.cache.players.add(p);
        if (typeof pid === "number") {
            await logEvent({
                type: "playerFeat",
                text: `<a href="${helpers.leagueUrl(["player", pid])}">${
                    p.firstName
                } ${p.lastName}</a> decided to Make Basketball GM Great Again.`,
                showNotification: false,
                pids: [pid],
                tids: [g.userTid],
            });
        }
    }
};

export default genPlayers;
