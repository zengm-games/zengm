import { loadNames, local, random } from "../../util";

const getFromCumSumArray = (array: [string, number][]) => {
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
	const countryColleges = playerBioInfo.countries[country].colleges;
	const colleges =
		countryColleges !== undefined
			? countryColleges
			: playerBioInfo.default.colleges;
	if (colleges && colleges.length > 0) {
		const countryfractionSkipCollege =
			playerBioInfo.countries[country].fractionSkipCollege;
		const fractionSkipCollege =
			countryfractionSkipCollege !== undefined
				? countryfractionSkipCollege
				: playerBioInfo.default.fractionSkipCollege;

		if (Math.random() > fractionSkipCollege) {
			college = getFromCumSumArray(colleges);
		}
	}

	return {
		college,
		country,
		firstName,
		lastName,
	};
};

export default name;
