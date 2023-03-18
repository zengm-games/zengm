import defaultGameAttributes from "../../common/defaultGameAttributes";
import {
	type DefaultNames,
	getFrequencies,
	mergeCountries,
} from "../../common/names";
import type {
	PlayerBioInfoProcessed,
	NamesLegacy,
	GameAttributesLeague,
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

let cache:
	| {
			colleges: typeof defaultColleges;
			countries: typeof defaultCountries;
			gender: GameAttributesLeague["gender"];
			groups: typeof groups;
			races: typeof defaultRaces;
			namesCountries: DefaultNames;
			namesGroups: DefaultNames;
	  }
	| undefined;

export const initDefaults = async (
	options: {
		gender?: GameAttributesLeague["gender"];
		force?: boolean;
	} = {},
) => {
	const gender =
		options.gender ??
		(Object.hasOwn(g, "gender")
			? g.get("gender")
			: defaultGameAttributes.gender);

	let myDefaultCountries = defaultCountries;

	if (!cache || options.force || cache.gender !== gender) {
		let defaultNamesCountries: DefaultNames;
		let defaultNamesGroups: DefaultNames;

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
				chinese: dummyNames,
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

		myDefaultCountries = helpers.deepCopy(defaultCountries);

		const possiblyMissingCountries = Object.keys(defaultNamesCountries);
		for (const countries of Object.values(groups)) {
			possiblyMissingCountries.push(...countries);
		}
		for (const country of possiblyMissingCountries) {
			if (myDefaultCountries[country] === undefined) {
				myDefaultCountries[country] = 0.2;
			}
		}

		// Handle female names
		if (gender === "female") {
			const response = await fetch("/gen/names-female.json");
			const parsed = await response.json();
			const femaleNames = parsed.countries as Record<
				string,
				Record<string, number>
			>;

			// Delete countries with no female first names, and replace male first names with female first names that exist
			for (const [country, names] of Object.entries(defaultNamesCountries)) {
				if (!femaleNames[country]) {
					delete defaultNamesCountries[country];
				} else {
					names.first = femaleNames[country];
				}
			}

			// Handle countries where there are female first names specified, but male names all come from groups (like China)
			for (const [country, first] of Object.entries(femaleNames)) {
				if (!defaultNamesCountries[country]) {
					defaultNamesCountries[country] = {
						first,
						last: {},
					};
				}
			}

			// Delete any straggling group-only countries with no female first names from myDefaultCountries
			for (const country of Object.keys(myDefaultCountries)) {
				if (!femaleNames[country]) {
					delete myDefaultCountries[country];
				}
			}

			// Currently groups only have male first names, so delete them. This is noticed downstream when groups are being added.
			for (const names of Object.values(defaultNamesGroups)) {
				names.first = {};
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
		console.log(JSONstringifyOrder(myDefaultCountries, 4));*/

		cache = {
			colleges: defaultColleges,
			countries: myDefaultCountries,
			gender,
			groups,
			races: defaultRaces,
			namesCountries: defaultNamesCountries,
			namesGroups: defaultNamesGroups,
		};
	}

	// For TypeScript and for worker/api
	return cache;
};

const loadNames = async (): Promise<PlayerBioInfoProcessed> => {
	cache = await initDefaults();

	let gPlayerBioInfo = Object.hasOwn(g, "playerBioInfo")
		? g.get("playerBioInfo")
		: undefined;
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

	const mergedCountries = mergeCountries(
		gPlayerBioInfo,
		cache.namesCountries,
		cache.namesGroups,
		cache.groups,
	);

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

	const frequenciesObject = getFrequencies(gPlayerBioInfo, cache.countries);

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
