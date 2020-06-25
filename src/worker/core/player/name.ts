import { loadNames, local, random } from "../../util";

const name = (): {
	country: string;
	firstName: string;
	lastName: string;
} => {
	// This makes it wait until g is loaded before calling names.load, so user-defined names will be used if provided
	const playerNames =
		local.playerNames === undefined ? loadNames() : local.playerNames;

	if (local.playerNames === undefined) {
		local.playerNames = playerNames;
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

	const firstCountry = playerNames.first[country];
	const lastCountry = playerNames.last[country];

	if (!firstCountry) {
		throw new Error(`No first names found for ${country}`);
	}
	if (!lastCountry) {
		throw new Error(`No last names found for ${country}`);
	}

	// First name
	const fnRand = random.uniform(0, firstCountry[firstCountry.length - 1][1]);
	const firstNameRow = firstCountry.find(row => row[1] >= fnRand);

	if (firstNameRow === undefined) {
		throw new Error(`Undefined firstNameRow (fnRand=${fnRand}`);
	}

	const firstName = firstNameRow[0];

	// Last name
	const lnRand = random.uniform(0, lastCountry[lastCountry.length - 1][1]);
	const lastNameRow = lastCountry.find(row => row[1] >= lnRand);

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
