// @flow

import type { PlayerNames } from "../../common/types";
import g from "./g";
import overrides from "./overrides";

const genCumSums = (names: {
    [key: string]: [string, number][],
}): [string, number][] => {
    let cumsum = 0;
    return Object.keys(names)
        .sort()
        .map(country => {
            cumsum += names[country][names[country].length - 1][1];
            return [country, cumsum];
        });
};

const loadNames = (): PlayerNames => {
    let { first, last } = overrides.names;

    if (g.names && g.names.first) {
        if (Array.isArray(g.names.first)) {
            first = { USA: g.names.first };
        } else {
            first = g.names.first;
        }
    }
    if (g.names && g.names.last) {
        if (Array.isArray(g.names.last)) {
            last = { USA: g.names.last };
        } else {
            last = g.names.last;
        }
    }

    const countries = genCumSums(first);

    /*const max = countries[countries.length - 1][1];
    let prev = 0;
    for (const row of countries) {
        console.log(`${row[0]} ${(100 * (row[1] - prev) / max).toFixed(3)}%`);
        prev = row[1];
    }*/

    return { countries, first, last };
};

export default loadNames;
