import { PlayerNames } from "../../common/types";
import g from "./g";
import overrides from "./overrides";

const genCumSums = (names: {
	[key: string]: [string, number][];
}): [string, number][] => {
	let cumsum = 0;
	return Object.keys(names)
		.sort()
		.map(country => {
			cumsum += names[country][names[country].length - 1][1];
			return [country, cumsum];
		});
};

const loadNames = (): PlayerNames => {
	let { first, last } = overrides.names;

	const gNames = g.get("names");
	if (gNames) {
		if (gNames.first) {
			if (Array.isArray(gNames.first)) {
				first = {
					USA: gNames.first,
				};
			} else {
				first = gNames.first;
			}
		}

		if (gNames.last) {
			if (Array.isArray(gNames.last)) {
				last = {
					USA: gNames.last,
				};
			} else {
				last = gNames.last;
			}
		}
	}

	const countries = genCumSums(first);
	/*const max = countries[countries.length - 1][1];
     let prev = 0;
     for (const row of countries) {
         console.log(`${row[0]} ${(100 * (row[1] - prev) / max).toFixed(3)}%`);
         prev = row[1];
     }*/

	return {
		countries,
		first,
		last,
	};
};

export default loadNames;
