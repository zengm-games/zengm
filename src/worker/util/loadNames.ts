import type {
	PlayerBioInfoProcessed,
	PlayerBioInfo,
	NamesLegacy,
} from "../../common/types";
import defaultColleges from "../data/defaultColleges";
import { defaultCountries, groups } from "../data/defaultCountries";
import defaultRaces from "../data/defaultRaces";
import g from "./g";
import helpers from "./helpers";

const toCumSumArray = <T extends string>(
	obj: Record<T, number>,
): [T, number][] => {
	let cumsum = 0;
	return Object.entries(obj).map(([key, value]) => {
		cumsum += value as number;
		return [key as T, cumsum];
	});
};

const legacyConvert = (array: [string, number][]) => {
	const obj: Record<string, number> = {};
	let prev = 0;
	for (const row of array) {
		obj[row[0]] = row[1] - prev;
		prev = row[1];
	}
	return obj;
};

let defaultNamesCountries: Record<
	string,
	{
		first: Record<string, number>;
		last: Record<string, number>;
	}
>;

let defaultNamesGroups: Record<
	string,
	{
		first: Record<string, number>;
		last: Record<string, number>;
	}
>;

const loadNames = async (): Promise<PlayerBioInfoProcessed> => {
	if (!defaultNamesCountries || !defaultNamesGroups) {
		if (process.env.NODE_ENV === "test") {
			const dummyNames = {
				first: { FirstName: 1 },
				last: { LastName: 1 },
			};

			// Keep in sync with defaultCountries.ts
			defaultNamesCountries = {
				Angola: dummyNames,
				Argentina: dummyNames,
				Australia: dummyNames,
				Austria: dummyNames,
			};
			defaultNamesGroups = {
				hispanic: dummyNames,
				korean: dummyNames,
				portuguese: dummyNames,
			};
		} else {
			const response = await fetch("/gen/names.json");
			const names = await response.json();
			defaultNamesCountries = names.countries;
			defaultNamesGroups = names.groups;
		}

		const possiblyMissingCountries = Object.keys(defaultNamesCountries);
		for (const countries of Object.values(groups)) {
			possiblyMissingCountries.push(...countries);
		}
		for (const country of possiblyMissingCountries) {
			if (defaultCountries[country] === undefined) {
				defaultCountries[country] = 0.2;
			}
		}

		/*// https://stackoverflow.com/a/53593328
		const JSONstringifyOrder = (obj, space) => {
			var allKeys = [];
			JSON.stringify(obj, (key, value) => {
				allKeys.push(key);
				return value;
			});
			allKeys.sort();
			return JSON.stringify(obj, allKeys, space);
		};
		console.log(JSONstringifyOrder(defaultCountries, 4));*/
	}

	let gPlayerBioInfo = g.get("playerBioInfo");
	const gNames: NamesLegacy | undefined = (g as any).names;
	if (!gPlayerBioInfo && gNames) {
		const countryNames = Object.keys(gNames.first);

		const countries: Record<
			string,
			{
				first: Record<string, number>;
				last: Record<string, number>;
			}
		> = {};

		if (Array.isArray(gNames.first) && Array.isArray(gNames.last)) {
			// Double legacy!
			countries.USA = {
				first: legacyConvert(gNames.first),
				last: legacyConvert(gNames.last),
			};
		} else {
			for (const countryName of countryNames) {
				countries[countryName] = {
					first: legacyConvert(gNames.first[countryName]),
					last: legacyConvert(gNames.last[countryName]),
				};
			}
		}

		gPlayerBioInfo = {
			countries,
		};
	}

	// If a country is specified in g.playerBioInfo.names, it overrides the built-in ones. But built-in ones still exists and could be used, depending on the value of "frequencies"

	const mergedCountries: PlayerBioInfo["countries"] = {
		...defaultNamesCountries,
	};

	for (const [group, info] of Object.entries(defaultNamesGroups)) {
		for (const country of (groups as any)[group]) {
			if (!mergedCountries[country]) {
				mergedCountries[country] = info;
			} else {
				mergedCountries[country] = helpers.deepCopy(mergedCountries[country]);
				for (const firstOrLast of ["first", "last"] as const) {
					if (!mergedCountries[country][firstOrLast]) {
						mergedCountries[country][firstOrLast] = {};
					}
					for (const [name, count] of Object.entries(info[firstOrLast])) {
						if (mergedCountries[country][firstOrLast]![name] === undefined) {
							mergedCountries[country][firstOrLast]![name] = count;
						} else {
							mergedCountries[country][firstOrLast]![name] += count;
						}
					}
				}
			}
		}
	}

	if (gPlayerBioInfo && gPlayerBioInfo.countries) {
		for (const [country, info] of Object.entries(gPlayerBioInfo.countries)) {
			if (!mergedCountries[country]) {
				mergedCountries[country] = info;
			} else {
				mergedCountries[country] = {
					...mergedCountries[country],
					...info,
				};
			}
		}
	}

	const countries: PlayerBioInfoProcessed["countries"] = {};
	for (const [
		country,
		{ first, last, colleges, fractionSkipCollege, races },
	] of Object.entries(mergedCountries)) {
		if (first && last) {
			countries[country] = {
				first: toCumSumArray(first),
				last: toCumSumArray(last),
			};
			if (colleges) {
				countries[country].colleges = toCumSumArray(colleges);
			}
			if (races) {
				countries[country].races = toCumSumArray(races);
			} else if (defaultRaces[country]) {
				countries[country].races = toCumSumArray(defaultRaces[country]);
			}
			if (fractionSkipCollege === undefined) {
				if (country === "USA" || country === "Canada") {
					countries[country].fractionSkipCollege = 0.02;
				}
			} else {
				countries[country].fractionSkipCollege = fractionSkipCollege;
			}
		}
	}

	let fractionSkipCollege = 0.98;
	if (gPlayerBioInfo?.default?.fractionSkipCollege !== undefined) {
		fractionSkipCollege = gPlayerBioInfo.default.fractionSkipCollege;
	}

	let colleges;
	if (gPlayerBioInfo?.default?.colleges) {
		colleges = toCumSumArray(gPlayerBioInfo.default.colleges);
	} else {
		colleges = toCumSumArray(defaultColleges);
	}

	let races;
	if (gPlayerBioInfo?.default?.races) {
		races = toCumSumArray(gPlayerBioInfo.default.races);
	} else {
		races = toCumSumArray(defaultRaces.USA);
	}

	let frequenciesObject: Record<string, number> | undefined;
	if (gPlayerBioInfo?.frequencies) {
		// Manually specified frequencies
		frequenciesObject = gPlayerBioInfo.frequencies;
	} else if (gPlayerBioInfo?.countries) {
		// Frequencies inferred from manually specified countries
		frequenciesObject = {};
		for (const [country, { first }] of Object.entries(
			gPlayerBioInfo.countries,
		)) {
			if (first) {
				frequenciesObject[country] = 0;
				for (const count of Object.values(first)) {
					frequenciesObject[country] += count;
				}
			}
		}
	}
	if (!frequenciesObject || Object.keys(frequenciesObject).length === 0) {
		// Default frequencies
		frequenciesObject = defaultCountries;
	}

	// For documentation, getting the default list of country frequencies
	// console.log(JSON.stringify(frequenciesObject, Object.keys(frequenciesObject).sort(), "\t"));

	const frequencies = toCumSumArray(frequenciesObject);

	return {
		countries,
		default: {
			colleges,
			fractionSkipCollege,
			races,
		},
		frequencies,
	};
};

export default loadNames;
