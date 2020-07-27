const { csvParse } = require("d3-dsv");
const fs = require("fs");
const path = require("path");
const namesBasketball = require("./names-basketball");
const namesFootball = require("./names-football");
const { JSONstringifyOrder, filterAndOutput } = require("./lib/namesHelpers");

const countryFreqs = ({ fnsByCountry }) => {
	return Object.fromEntries(
		Object.keys(fnsByCountry)
			.sort()
			.map(country => {
				let sum = 0;
				const namesCountry = fnsByCountry[country];
				for (const count of Object.values(namesCountry)) {
					sum += count;
				}
				return [country, sum];
			}),
	);
};

const basketball = namesBasketball();
const football = namesFootball();

const countriesBasketball = countryFreqs(basketball);
const countriesFootball = countryFreqs(football);

const combineNames = namesArray => {
	const combined = {};
	for (const names of namesArray) {
		for (const [country, countryNames] of Object.entries(names)) {
			if (!combined[country]) {
				combined[country] = {};
			}

			for (const [name, count] of Object.entries(countryNames)) {
				if (!combined[country][name]) {
					combined[country][name] = 0;
				}
				combined[country][name] += count;
			}
		}
	}

	return combined;
};

const getOverrides = () => {
	const names = {
		first: {},
		last: {},
	};

	const filenames = fs.readdirSync(path.join(__dirname, "names-manual"));

	const getNames = filename => {
		const csv = fs.readFileSync(
			path.join(__dirname, "names-manual", filename),
			"utf8",
		);
		const rows = csvParse(csv);
		const object = {};
		for (const row of rows) {
			object[row.Name] = parseInt(row.Frequency);
		}
		return object;
	};

	const special = {
		Hispanic: [
			"Argentina",
			"Chile",
			"Colombia",
			"Costa Rica",
			"Cuba",
			"El Salvador",
			"Equador",
			"Guatemala",
			"Honduras",
			"Mexico",
			"Nicaragua",
			"Panama",
			"Dominican Republic",
			"Uruguay",
			"Venezuela",
			"Spain",
			"Bolivia",
			"Paraguay",
			"Peru",
			"Puerto Rico",
		],
		Portuguese: [
			"Angola",
			"Brazil",
			"Cape Verde",
			"Portugal",
			"Mozambique",
			"Equatorial Guinea",
			"East Timor",
			"Guinea-Bissau",
			"Macau",
		],
	};

	for (const filename of filenames) {
		if (!filename.endsWith(".csv")) {
			continue;
		}

		if (filename.startsWith("country-")) {
			const [, country, firstOrLast] = filename.replace(".csv", "").split("-");
			names[firstOrLast][country] = getNames(filename);
		} else if (filename.startsWith("special-")) {
			const [, type, firstOrLast] = filename.replace(".csv", "").split("-");
			const specialNames = getNames(filename);

			const countries = special[type];
			if (!countries) {
				throw new Error(
					`Not sure what to do with ${filename} - needs an entry in special?`,
				);
			}
			for (const country of countries) {
				names[firstOrLast][country] = specialNames;
			}
		} else {
			throw new Error(`Unexpected filename "${filename}"`);
		}
	}

	return names;
};

const overrides = getOverrides();

const fnsByCountry = combineNames([
	basketball.fnsByCountry,
	football.fnsByCountry,
	overrides.first,
]);
const lnsByCountry = combineNames([
	basketball.lnsByCountry,
	football.lnsByCountry,
	overrides.last,
]);

const dropped = filterAndOutput(fnsByCountry, lnsByCountry);

for (const freq of [countriesBasketball, countriesFootball]) {
	for (const country of dropped) {
		delete freq[country];
	}
}

console.log(
	`const countriesBasketball = ${JSONstringifyOrder(
		countriesBasketball,
		2,
	)};\n`,
);
console.log(
	`const countriesFootball = ${JSONstringifyOrder(countriesFootball, 2)};\n`,
);
