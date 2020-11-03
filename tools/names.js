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

	const groups = {};

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
			if (Number.isNaN(object[row.Name])) {
				console.log(filename, row);
				throw new Error("NaN found in row");
			}
		}
		return object;
	};

	for (const filename of filenames) {
		if (!filename.endsWith(".csv")) {
			continue;
		}

		if (filename.startsWith("country-")) {
			const [, country, firstOrLast] = filename.replace(".csv", "").split("-");
			names[firstOrLast][country] = getNames(filename);
		} else if (filename.startsWith("group-")) {
			const [, group, firstOrLast] = filename.replace(".csv", "").split("-");
			const groupNames = getNames(filename);
			if (!groups[group]) {
				groups[group] = {};
			}
			groups[group][firstOrLast] = groupNames;
		} else {
			throw new Error(`Unexpected filename "${filename}"`);
		}
	}

	for (const key of Object.keys(groups)) {
		if (!groups[key].first || !groups[key].last) {
			throw new Error(`Missing first or last names file for "${key}"`);
		}
	}

	const filename = path.join(__dirname, "../src/worker/data/names-groups.json");
	fs.writeFileSync(filename, JSONstringifyOrder(groups, "\t"));
	console.log(`Wrote data to ${filename}`);

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
	`defaultCountries = process.env.SPORT === "basketball" ? ${JSONstringifyOrder(
		countriesBasketball,
		"\t",
	)} : ${JSONstringifyOrder(countriesFootball, "\t")};\n`,
);
