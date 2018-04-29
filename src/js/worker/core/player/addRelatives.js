// @flow

import romanNumerals from "roman-numerals";
import { idb } from "../../db";
import { random } from "../../util";
import type { Player, RelativeType } from "../../../common/types";

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

const hasRelative = (p: Player, type: RelativeType) => {
    return !!p.relatives.find(relative => relative.type === type);
};

const getRelatives = async (
    p: Player,
    type: RelativeType,
): Promise<Player[]> => {
    const players = await Promise.all(
        p.relatives
            .filter(rel => rel.type === type)
            // $FlowFixMe
            .map(({ pid }) => idb.getCopy.players({ pid })),
    );

    return players.filter(p2 => p2 !== undefined);
};

export const makeSon = async (p: Player) => {
    // Sanity check - player must not already have father
    if (hasRelative(p, "father")) {
        return;
    }

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
    if (!hasRelative(father, "son")) {
        p.firstName = father.firstName;
        p.lastName = `${fatherLastName} ${sonSuffix}`;

        if (fatherSuffixNumber === undefined) {
            father.lastName += ` Sr.`;
        }
    } else {
        p.lastName = fatherLastName;
    }

    // Handle case where father has other sons
    if (hasRelative(father, "son")) {
        const existingSons = await getRelatives(father, "son");
        for (const existingSon of existingSons) {
            // Add new brother to each of the existing sons
            existingSon.relatives.push({
                type: "brother",
                pid: p.pid,
                name: `${p.firstName} ${p.lastName}`,
            });
            await idb.cache.players.put(existingSon);

            // Add existing brothers to new son
            p.relatives.push({
                type: "brother",
                pid: existingSon.pid,
                name: `${existingSon.firstName} ${existingSon.lastName}`,
            });
        }
    }

    const relFather = {
        type: "father",
        pid: father.pid,
        name: `${father.firstName} ${father.lastName}`,
    };

    // Handle case where son already has other brothers
    if (hasRelative(p, "brother")) {
        const brothers = await getRelatives(p, "brother");

        for (const brother of brothers) {
            if (!hasRelative(brother, "father")) {
                // Add father to each brother (assuming they don't somehow already have another father)
                brother.relatives.unshift(relFather);
                await idb.cache.players.put(brother);

                // Add existing brothers as sons to father
                father.relatives.push({
                    type: "son",
                    pid: brother.pid,
                    name: `${brother.firstName} ${brother.lastName}`,
                });
            }
        }
    }

    p.relatives.unshift(relFather);
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
