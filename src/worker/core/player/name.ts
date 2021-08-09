import { isSport } from "../../../common";
import type { Race } from "../../../common/types";
import { loadNames, local, random } from "../../util";

const getFromCumSumArray = <T extends string>(array: [T, number][]) => {
	const rand = random.uniform(0, array.at(-1)[1]);
	const foundRow = array.find(row => row[1] >= rand);

	if (foundRow === undefined) {
		throw new Error(`Undefined foundRow (rand=${rand}`);
	}

	return foundRow[0];
};

// https://slapshot.blogs.nytimes.com/2011/02/20/hockeys-heartland-state-by-state/ for hockey, 2020 census populations for other sports
const usaStateFrequencies = isSport("hockey")
	? {
			Alabama: 1114,
			Alaska: 8477,
			Arizona: 3339,
			Arkansas: 216,
			California: 20404,
			Colorado: 13437,
			Connecticut: 12088,
			Delaware: 1049,
			"District of Columbia": 742,
			Florida: 10856,
			Georgia: 2142,
			Hawaii: 11,
			Idaho: 2958,
			Illinois: 24018,
			Indiana: 4927,
			Iowa: 2549,
			Kansas: 1574,
			Kentucky: 1619,
			Louisiana: 466,
			Maine: 6180,
			Maryland: 7326,
			Massachusetts: 43445,
			Michigan: 51404,
			Minnesota: 53450,
			Mississippi: 259,
			Missouri: 6295,
			Montana: 3568,
			Nebraska: 1459,
			Nevada: 940,
			"New Hampshire": 6120,
			"New Jersey": 16041,
			"New Mexico": 1207,
			"New York": 46389,
			"North Carolina": 5598,
			"North Dakota": 4547,
			Ohio: 13579,
			Oklahoma: 1051,
			Oregon: 804,
			Pennsylvania: 27549,
			"Rhode Island": 4641,
			"South Carolina": 1407,
			"South Dakota": 2151,
			Tennessee: 2430,
			Texas: 10909,
			Utah: 3981,
			Vermont: 4443,
			Virginia: 7251,
			Washington: 7615,
			"West Virginia": 1060,
			Wisconsin: 17697,
			Wyoming: 1810,
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

// 2016 census populations
const canadaProvinceFrequencies = {
	Alberta: 4067175,
	"British Columbia": 4648055,
	Manitoba: 1278365,
	"New Brunswick": 747101,
	"Newfoundland and Labrador": 519716,
	"Northwest Territories": 41786,
	"Nova Scotia": 923598,
	Nunavut: 35944,
	Ontario: 13448494,
	"Prince Edward Island": 142907,
	Quebec: 8164361,
	Saskatchewan: 1098352,
	Yukon: 35874,
};

export const withState = (country: string) => {
	let state;
	if (country === "USA") {
		state = random.choice(
			Object.keys(usaStateFrequencies),
			Object.values(usaStateFrequencies),
		);
	} else if (country === "Canada") {
		state = random.choice(
			Object.keys(canadaProvinceFrequencies),
			Object.values(canadaProvinceFrequencies),
		);
	}

	if (state) {
		return `${state}, ${country}`;
	}

	return country;
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
