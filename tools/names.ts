import { csvParse } from "d3-dsv";
import fs from "fs";
import path from "path";
import type { NamesByCountry, NamesFirstLast } from "./lib/namesHelpers";
import { JSONstringifyOrder, filterAndOutput } from "./lib/namesHelpers";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const countryFreqs = ({ fnsByCountry }: { fnsByCountry: NamesByCountry }) => {
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

const basketball = JSON.parse(
	fs.readFileSync(path.join(__dirname, "names-manual/basketball.json"), "utf8"),
);
const football = JSON.parse(
	fs.readFileSync(path.join(__dirname, "names-manual/football.json"), "utf8"),
);

const countriesBasketball = countryFreqs(basketball);
const countriesFootball = countryFreqs(football);

const combineNames = (namesArray: NamesByCountry[]) => {
	const combined: NamesByCountry = {};
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
	const names: {
		first: Record<string, Record<string, number>>;
		last: Record<string, Record<string, number>>;
	} = {
		first: {},
		last: {},
	};

	const groups: Record<string, Partial<NamesFirstLast>> = {};

	const filenames = fs.readdirSync(path.join(__dirname, "names-manual"));

	const getNames = (filename: string) => {
		const csv = fs.readFileSync(
			path.join(__dirname, "names-manual", filename),
			"utf8",
		);
		const rows = csvParse(csv) as {
			Name: string;
			Frequency: string;
		}[];
		const object: Record<string, number> = {};
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

		const [, countryOrGroup, firstOrLast] = filename
			.replace(".csv", "")
			.split("-");
		if (firstOrLast !== "first" && firstOrLast !== "last") {
			throw new Error(`Unexpected filename "${filename}"`);
		}
		if (filename.startsWith("country-")) {
			names[firstOrLast][countryOrGroup] = getNames(filename);
		} else if (filename.startsWith("group-")) {
			const groupNames = getNames(filename);
			if (!groups[countryOrGroup]) {
				groups[countryOrGroup] = {};
			}
			groups[countryOrGroup][firstOrLast] = groupNames;
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
fs.writeFileSync(
	filename,
	JSONstringifyOrder({ countries: namesByCountry, groups }, "\t"),
);
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
