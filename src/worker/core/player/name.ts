import type { Race } from "../../../common/types";
import { loadNames, local, random } from "../../util";

const getFromCumSumArray = <T extends string>(array: [T, number][]) => {
	const rand = random.uniform(0, array[array.length - 1][1]);
	const foundRow = array.find(row => row[1] >= rand);

	if (foundRow === undefined) {
		throw new Error(`Undefined foundRow (rand=${rand}`);
	}

	return foundRow[0];
};

const name = (
	countryOverride?: string,
): {
	college: string;
	country: string;
	firstName: string;
	lastName: string;
	race: Race;
} => {
	// This makes it wait until g is loaded before calling loadNames, so user-defined playerBioInfo will be used if provided
	const playerBioInfo = local.playerBioInfo ?? loadNames();

	if (local.playerBioInfo === undefined) {
		local.playerBioInfo = playerBioInfo;
	}

	const frequencies = playerBioInfo.frequencies;
	if (!frequencies || frequencies.length === 0) {
		throw new Error("No countries in playerBioInfo");
	}

	let country;
	if (countryOverride && playerBioInfo.countries[countryOverride]) {
		country = countryOverride;
	} else {
		country = getFromCumSumArray(frequencies);
	}

	if (!playerBioInfo.countries[country]) {
		throw new Error(`Country "${country}" missing in playerBioInfo countries`);
	}

	const firstCountry = playerBioInfo.countries[country].first;
	if (!firstCountry || firstCountry.length === 0) {
		throw new Error(`No first names found for ${country}`);
	}
	const firstName = getFromCumSumArray(firstCountry);

	const lastCountry = playerBioInfo.countries[country].last;
	if (!lastCountry || lastCountry.length === 0) {
		throw new Error(`No last names found for ${country}`);
	}
	const lastName = getFromCumSumArray(lastCountry);

	let college = "";
	const colleges =
		playerBioInfo.countries[country].colleges ?? playerBioInfo.default.colleges;
	if (colleges && colleges.length > 0) {
		const fractionSkipCollege =
			playerBioInfo.countries[country].fractionSkipCollege ??
			playerBioInfo.default.fractionSkipCollege;

		if (Math.random() > fractionSkipCollege) {
			college = getFromCumSumArray(colleges);
		}
	}

	const races =
		playerBioInfo.countries[country].races ?? playerBioInfo.default.races;
	const race = getFromCumSumArray(races);
	console.log(country, race);

	return {
		college,
		country,
		firstName,
		lastName,
		race,
	};
};

export default name;
