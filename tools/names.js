import { csvParse } from "d3-dsv";
import fs from "node:fs";
import path from "node:path";
import { JSONstringifyOrder, filterAndOutput } from "./lib/namesHelpers.js";

const countryFreqs = ({ fnsByCountry }) => {
	return Object.fromEntries(
		Object.keys(fnsByCountry)
			.sort()
			.map((country) => {
				let sum = 0;
				const namesCountry = fnsByCountry[country];
				for (const count of Object.values(namesCountry)) {
					sum += count;
				}
				return [country, sum];
			}),
	);
};

const basketball = JSON.parse(
	fs.readFileSync(
		path.join(import.meta.dirname, "names-manual/basketball.json"),
	),
);
const football = JSON.parse(
	fs.readFileSync(path.join(import.meta.dirname, "names-manual/football.json")),
);

const countriesBasketball = countryFreqs(basketball);
const countriesFootball = countryFreqs(football);

const combineNames = (namesArray) => {
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

	const femaleNames = {};

	const groups = {};

	const filenames = fs.readdirSync(
		path.join(import.meta.dirname, "names-manual"),
	);

	const getNames = (filename) => {
		const csv = fs.readFileSync(
			path.join(import.meta.dirname, "names-manual", filename),
			"utf8",
		);
		const rows = csvParse(csv);
		const object = {};
		for (const row of rows) {
			object[row.Name] = Number.parseInt(row.Frequency);
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

		if (filename.endsWith("-female.csv")) {
			const [, country] = filename.replace(".csv", "").split("-");
			femaleNames[country] = getNames(filename);
		} else if (filename.startsWith("country-")) {
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
		femaleNames,
		groups,
		overrides: names,
	};
};

const { femaleNames, groups, overrides } = getOverrides();

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

// Special case for Chinese names
groups.chinese = namesByCountry.China;
delete namesByCountry.China;
countriesBasketball.Taiwan = 3;

const filename = path.join(import.meta.dirname, "../data/names.json");
fs.writeFileSync(
	filename,
	JSONstringifyOrder({ countries: namesByCountry, groups }, "\t"),
);
console.log(`Wrote data to ${filename}`);

const filenameFemale = path.join(
	import.meta.dirname,
	"../data/names-female.json",
);
fs.writeFileSync(
	filenameFemale,
	JSONstringifyOrder({ countries: femaleNames }, "\t"),
);
console.log(`Wrote data to ${filenameFemale}`);

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
