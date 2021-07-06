import { isSport } from "../../../common";
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

// https://www.quanthockey.com/nhl/state-totals/active-nhl-players-career-stats.html with 0.5 filled in for states with no players for hockey, 2020 census populations for other sports
const usaStateFrequencies = isSport("hockey")
	? {
			Alabama: 1,
			Alaska: 2,
			Arizona: 3,
			Arkansas: 0.5,
			California: 12,
			Colorado: 7,
			Connecticut: 8,
			Delaware: 0.5,
			"District of Columbia": 0.5,
			Florida: 8,
			Georgia: 0.5,
			Hawaii: 0.5,
			Idaho: 0.5,
			Illinois: 18,
			Indiana: 2,
			Iowa: 2,
			Kansas: 0.5,
			Kentucky: 0.5,
			Louisiana: 0.5,
			Maine: 2,
			Maryland: 0.5,
			Massachusetts: 24,
			Michigan: 42,
			Minnesota: 55,
			Mississippi: 0.5,
			Missouri: 10,
			Montana: 0.5,
			Nebraska: 1,
			Nevada: 0.5,
			"New Hampshire": 2,
			"New Jersey": 16,
			"New Mexico": 0.5,
			"New York": 30,
			"North Carolina": 1,
			"North Dakota": 1,
			Ohio: 10,
			Oklahoma: 1,
			Oregon: 0.5,
			Pennsylvania: 5,
			"Rhode Island": 1,
			"South Carolina": 1,
			"South Dakota": 0.5,
			Tennessee: 0.5,
			Texas: 5,
			Utah: 1,
			Vermont: 0.5,
			Virginia: 1,
			Washington: 5,
			"West Virginia": 0.5,
			Wisconsin: 14,
			Wyoming: 0.5,
	  }
	: {
			Alabama: 4779736,
			Alaska: 710231,
			Arizona: 6392017,
			Arkansas: 2915918,
			California: 37254523,
			Colorado: 5029196,
			Connecticut: 3574097,
			Delaware: 897934,
			"District of Columbia": 601723,
			Florida: 18801310,
			Georgia: 9687653,
			Hawaii: 1360301,
			Idaho: 1567582,
			Illinois: 12830632,
			Indiana: 6483802,
			Iowa: 3046355,
			Kansas: 2853118,
			Kentucky: 4339367,
			Louisiana: 4533372,
			Maine: 1328361,
			Maryland: 5773552,
			Massachusetts: 6547629,
			Michigan: 9883640,
			Minnesota: 5303925,
			Mississippi: 2967297,
			Missouri: 5988927,
			Montana: 989415,
			Nebraska: 1826341,
			Nevada: 2700551,
			"New Hampshire": 1316470,
			"New Jersey": 8791894,
			"New Mexico": 2059179,
			"New York": 19378102,
			"North Carolina": 9535483,
			"North Dakota": 672591,
			Ohio: 11536504,
			Oklahoma: 3751351,
			Oregon: 3831074,
			Pennsylvania: 12702379,
			"Rhode Island": 1052567,
			"South Carolina": 4625364,
			"South Dakota": 814180,
			Tennessee: 6346105,
			Texas: 25145561,
			Utah: 2763885,
			Vermont: 625741,
			Virginia: 8001024,
			Washington: 6724540,
			"West Virginia": 1852994,
			Wisconsin: 5686986,
			Wyoming: 563626,
	  };

const withState = (country: string) => {
	if (country !== "USA") {
		return country;
	}

	const state = random.choice(
		Object.keys(usaStateFrequencies),
		Object.values(usaStateFrequencies),
	);
	return `${state}, USA`;
};

const name = async (
	countryOverride?: string,
): Promise<{
	college: string;
	country: string;
	firstName: string;
	lastName: string;
	race: Race;
}> => {
	// This makes it wait until g is loaded before calling loadNames, so user-defined playerBioInfo will be used if provided
	const playerBioInfo = local.playerBioInfo ?? (await loadNames());

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

	if (country === "Equador" && !playerBioInfo.countries[country]) {
		country = "Ecuador";
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

	return {
		college,
		country: withState(country),
		firstName,
		lastName,
		race,
	};
};

export default name;
