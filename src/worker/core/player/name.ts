import { loadNames, local, random } from "../../util";

const getFromCumSumArray = (array: [string, number][]) => {
	const rand = random.uniform(0, array[array.length - 1][1]);
	const foundRow = array.find(row => row[1] >= rand);

	if (foundRow === undefined) {
		throw new Error(`Undefined foundRow (rand=${rand}`);
	}

	return foundRow[0];
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

	const countries = playerBioInfo.countries;
	if (!countries || countries.length === 0) {
		throw new Error("No countries in playerBioInfo");
	}
	const country = getFromCumSumArray(countries);

	if (!playerBioInfo.names[country]) {
		throw new Error(`Country "${country}" missing in playerBioInfo names`);
	}

	const firstCountry = playerBioInfo.names[country].first;
	if (!firstCountry || firstCountry.length === 0) {
		throw new Error(`No first names found for ${country}`);
	}
	const firstName = getFromCumSumArray(firstCountry);

	const lastCountry = playerBioInfo.names[country].first;
	if (!lastCountry || lastCountry.length === 0) {
		throw new Error(`No first names found for ${country}`);
	}
	const lastName = getFromCumSumArray(lastCountry);

	let college = "";
	const colleges =
		playerBioInfo.names[country].colleges || playerBioInfo.defaultColleges;
	if (colleges && colleges.length > 0) {
		const countryPercentSkipCollege =
			playerBioInfo.names[country].percentSkipCollege;

		// By default, 98% skip college (in default data, USA and Canada are specified and no other countries are)
		let percentSkipCollege;
		if (countryPercentSkipCollege === undefined) {
			if (country === "USA" || country === "Canada") {
				percentSkipCollege = 0.02;
			} else {
				percentSkipCollege = 0.98;
			}
		} else {
			percentSkipCollege = countryPercentSkipCollege;
		}

		if (Math.random() > percentSkipCollege) {
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
