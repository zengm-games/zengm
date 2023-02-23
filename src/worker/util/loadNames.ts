import defaultGameAttributes from "../../common/defaultGameAttributes";
import {
	DefaultNames,
	getFrequencies,
	mergeCountries,
} from "../../common/names";
import type { PlayerBioInfoProcessed, NamesLegacy } from "../../common/types";
import defaultColleges from "../data/defaultColleges";
import { defaultCountries, groups } from "../data/defaultCountries";
import defaultRaces from "../data/defaultRaces";
import g from "./g";

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

let defaultNamesCountries: DefaultNames;

let defaultNamesGroups: DefaultNames;

let defaultFemaleNamesCountries: Record<string, Record<string, number>>;

export const initDefaults = async (force?: boolean) => {
	if (!defaultNamesCountries || !defaultNamesGroups || force) {
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

		const possiblyMissingCountries = Object.keys(defaultNamesCountries);
		for (const countries of Object.values(groups)) {
			possiblyMissingCountries.push(...countries);
		}
		for (const country of possiblyMissingCountries) {
			if (defaultCountries[country] === undefined) {
				defaultCountries[country] = 0.2;
			}
		}

		// @ts-ignore
		defaultFemaleNamesCountries = undefined;

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
};

const initDefaultsFemale = async () => {
	if (!defaultFemaleNamesCountries) {
		const response = await fetch("/gen/names-female.json");
		const names = await response.json();
		defaultFemaleNamesCountries = names.countries;
	}
};

const loadNames = async (): Promise<PlayerBioInfoProcessed> => {
	await initDefaults();

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

	const gender = Object.hasOwn(g, "gender")
		? g.get("gender")
		: defaultGameAttributes.gender;
	const genderOverride = gender === "female" && gPlayerBioInfo === undefined;

	const mergedCountries = mergeCountries(
		gPlayerBioInfo,
		defaultNamesCountries,
		defaultNamesGroups,
		groups,
	);

	const countries: PlayerBioInfoProcessed["countries"] = {};
	for (const [
		country,
		{ first, last, colleges, fractionSkipCollege, races },
	] of Object.entries(mergedCountries)) {
		if (first && last) {
			let actualFirst;
			if (genderOverride) {
				await initDefaultsFemale();

				actualFirst = defaultFemaleNamesCountries[country];
				if (!actualFirst) {
					continue;
				}
			} else {
				actualFirst = first;
			}

			countries[country] = {
				first: toCumSumArray(actualFirst),
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

	const frequenciesObject = getFrequencies(gPlayerBioInfo, defaultCountries);

	// For documentation, getting the default list of country frequencies
	// console.log(JSON.stringify(frequenciesObject, Object.keys(frequenciesObject).sort(), "\t"));

	let frequencies = toCumSumArray(frequenciesObject);

	if (genderOverride) {
		await initDefaultsFemale();

		frequencies = frequencies.filter(
			row => defaultFemaleNamesCountries[row[0]],
		);
	}

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
