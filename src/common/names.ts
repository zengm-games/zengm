import helpers from "./helpers";
import type { PlayerBioInfo } from "./types";

export type DefaultNames = Record<
	string,
	{
		first: Record<string, number>;
		last: Record<string, number>;
	}
>;

export const mergeCountries = (
	gPlayerBioInfo: PlayerBioInfo | undefined,
	defaultNamesCountries: DefaultNames,
	defaultNamesGroups: DefaultNames,
	groups: Record<string, string[]>,
) => {
	// If a country is specified in g.playerBioInfo.names, it overrides the built-in ones. But built-in ones still exists and could be used, depending on the value of "frequencies"

	const mergedCountries: PlayerBioInfo["countries"] = {
		...defaultNamesCountries,
	};

	for (const [group, info] of Object.entries(defaultNamesGroups)) {
		for (const country of groups[group]) {
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

	return mergedCountries;
};

export const getFrequencies = (
	gPlayerBioInfo: PlayerBioInfo | undefined,
	defaultCountries: Record<string, number>,
): Record<string, number> => {
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

	return frequenciesObject;
};
