// @flow

import * as names from "../../../data/names";
import { random } from "../../../../deion/worker/util";

let playerNames;

const name = (): { country: string, firstName: string, lastName: string } => {
    if (playerNames === undefined) {
        // This makes it wait until g is loaded before calling names.load, so user-defined names will be used if provided
        playerNames = names.load();
    }

    // Country
    const cRand = random.uniform(
        0,
        playerNames.countries[playerNames.countries.length - 1][1],
    );
    const countryRow = playerNames.countries.find(row => row[1] >= cRand);
    if (countryRow === undefined) {
        throw new Error(`Undefined countryRow (cRand=${cRand}`);
    }
    const country = countryRow[0];

    // First name
    const fnRand = random.uniform(
        0,
        playerNames.first[country][playerNames.first[country].length - 1][1],
    );
    const firstNameRow = playerNames.first[country].find(
        row => row[1] >= fnRand,
    );
    if (firstNameRow === undefined) {
        throw new Error(`Undefined firstNameRow (fnRand=${fnRand}`);
    }
    const firstName = firstNameRow[0];

    // Last name
    const lnRand = random.uniform(
        0,
        playerNames.last[country][playerNames.last[country].length - 1][1],
    );
    const lastNameRow = playerNames.last[country].find(row => row[1] >= lnRand);
    if (lastNameRow === undefined) {
        throw new Error(`Undefined lastNameRow (lnRand=${lnRand}`);
    }
    const lastName = lastNameRow[0];

    return {
        country,
        firstName,
        lastName,
    };
};

export default name;
