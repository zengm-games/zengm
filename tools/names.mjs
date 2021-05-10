import { csvParse } from "d3-dsv";
import fs from "fs";
import path from "path";
import { JSONstringifyOrder, filterAndOutput } from "./lib/namesHelpers.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

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

const basketball = JSON.parse(fs.readFileSync(path.join(__dirname, "names-manual/basketball.json")));
const football = JSON.parse(fs.readFileSync(path.join(__dirname, "names-manual/football.json")));

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

	return {
		overrides: names,
		groups,
	};
};

const { groups, overrides } = getOverrides();

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

const { dropped, namesByCountry } = filterAndOutput(fnsByCountry, lnsByCountry);

const filename = path.join(__dirname, "../data/names.json");
fs.writeFileSync(filename, JSONstringifyOrder({ countries: namesByCountry, groups}, "\t"));
console.log(`Wrote data to ${filename}`);

for (const freq of [countriesBasketball, countriesFootball]) {
	for (const country of dropped) {
		delete freq[country];
	}
}

console.log(
	`defaultCountries = bySport<Record<string, number>>({basketball: ${JSONstringifyOrder(
		countriesBasketball,
		"\t",
	)}, football: ${JSONstringifyOrder(countriesFootball, "\t")}});\n`,
);
