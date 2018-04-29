// @flow

import romanNumerals from "roman-numerals";
import { idb } from "../../db";
import { random } from "../../util";
import type { Player } from "../../../common/types";

const probSon = 0.5;
const probBrother = 0.5;

const parseLastName = (lastName: string): [string, number | void] => {
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
        if (err.message !== "toArabic expects a valid roman number") {
            throw err;
        }
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

const makeSon = async (p: Player) => {
    // Find a player from a draft 17-40 years ago to make the father
    const draftYear = p.draft.year - random.randInt(17, 40);

    const possibleFathers = await idb.getCopies.players({
        draftYear,
    });
    if (possibleFathers.length === 0) {
        // League must be too new, draft class doesn't exist
        return;
    }

    const father = random.choice(possibleFathers);

    const [fatherLastName, fatherSuffixNumber] = parseLastName(father.lastName);
    const sonSuffixNumber =
        fatherSuffixNumber === undefined ? 2 : fatherSuffixNumber + 1;
    const sonSuffix = getSuffix(sonSuffixNumber);

    // Only rename to be a Jr if the father has no son yet (first is always Jr)
    if (!father.relatives.find(relative => relative.type === "son")) {
        p.firstName = father.firstName;
        p.lastName = `${fatherLastName} ${sonSuffix}`;

        if (fatherSuffixNumber === undefined) {
            father.lastName += ` Sr.`;
        }
    } else {
        p.lastName = fatherLastName;
    }

    p.relatives.push({
        type: "father",
        pid: father.pid,
        name: `${father.firstName} ${father.lastName}`,
    });
    father.relatives.push({
        type: "son",
        pid: p.pid,
        name: `${p.firstName} ${p.lastName}`,
    });

    await idb.cache.players.put(p);
    await idb.cache.players.put(father);
};

const makeBrother = async (p: Player) => {};

const addRelatives = async (p: Player) => {
    if (Math.random() < probSon) {
        await makeSon(p);
    }
    if (Math.random() < probBrother) {
        await makeBrother(p);
    }
};

export default addRelatives;
