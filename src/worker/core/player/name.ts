import { loadNames, local, random } from "../../util";
import defaultColleges from "../../data/defaultColleges";

const defaultCollegeNames = Object.keys(defaultColleges);
const defaultCollegeWeights = (key: string) => defaultColleges[key];

// 98% skip by default (all countries except USA and Canada)
const getCollege = (
	percentSkipCollege: number = 0.98,
	colleges?: Record<string, number>,
) => {
	if (Math.random() < percentSkipCollege) {
		return "";
	}

	if (colleges) {
		return random.choice(Object.keys(colleges), (key: string) => colleges[key]);
	}

	return random.choice(defaultCollegeNames, defaultCollegeWeights);
};

const name = (): {
	college: string;
	country: string;
	firstName: string;
	lastName: string;
} => {
	// This makes it wait until g is loaded before calling loadNames, so user-defined playerBioInfo will be used if provided
	const playerBioInfo =
		local.playerBioInfo === undefined ? loadNames() : local.playerBioInfo;

	if (local.playerBioInfo === undefined) {
		local.playerBioInfo = playerBioInfo;
	}

	const country = random.choice(
		Object.keys(playerBioInfo.countries),
		(key: string) => playerBioInfo.countries[key],
	);

	if (!playerBioInfo.data[country]) {
		throw new Error(`Country "${country}" missing in playerBioInfo data`);
	}

	const firstCountry = playerBioInfo.data[country].first;
	const firstCountryKeys = firstCountry ? Object.keys(firstCountry) : [];
	if (!firstCountry) {
		throw new Error(`No first names found for ${country}`);
	}
	const firstName = random.choice(
		firstCountryKeys,
		(key: string) => firstCountry[key],
	);

	const lastCountry = playerBioInfo.data[country].last;
	const lastCountryKeys = lastCountry ? Object.keys(lastCountry) : [];
	if (!lastCountry) {
		throw new Error(`No last names found for ${country}`);
	}
	const lastName = random.choice(
		lastCountryKeys,
		(key: string) => lastCountry[key],
	);

	const college = getCollege();

	return {
		college,
		country,
		firstName,
		lastName,
	};
};

export default name;
