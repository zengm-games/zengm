const fs = require("fs");
const path = require("path");

// https://stackoverflow.com/a/53593328
const JSONstringifyOrder = (obj, space) => {
	var allKeys = [];
	JSON.stringify(obj, (key, value) => {
		allKeys.push(key);
		return value;
	});
	allKeys.sort();
	return JSON.stringify(obj, allKeys, space);
};

const filterAndOutput = (fnsByCountry, lnsByCountry) => {
	const dropped = [];

	const countryNames = Object.keys(fnsByCountry).sort();

	const countries = {};

	for (const country of countryNames) {
		const fns = fnsByCountry[country];
		const lns = lnsByCountry[country];

		let sum = 0;
		for (const count of Object.values(fns)) {
			sum += count;
		}

		if (sum < 5) {
			console.log(`Dropping ${country} (${sum} players)`);
			dropped.push(country);
			continue;
		}

		// USA has too many names, so ignore any that appear only once
		if (country === "USA") {
			for (const names of [fns, lns]) {
				for (const [name, count] of Object.entries(names)) {
					if (count <= 1) {
						delete names[name];
					}
				}
			}
		}

		countries[country] = {
			first: fns,
			last: lns,
		};
	}

	const filename = path.join(__dirname, "../../src/worker/data/names.json");
	fs.writeFileSync(filename, JSONstringifyOrder(countries, "\t"));
	console.log(`Wrote data to ${filename}`);

	return dropped;
};

const juniors = [
	"II",
	"III",
	"IV",
	"V",
	"Jr",
	"Jr.",
	"Junior",
	"Sr",
	"Sr.",
	"Senior",
];

const provinces = ["AB", "BC", "MB", "NL", "NS", "ON", "QC", "QLD", "SK"];

const states = [
	"AL",
	"AK",
	"AS",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"DC",
	"FM",
	"FL",
	"GA",
	"GU",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MH",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"MP",
	"OH",
	"OK",
	"OR",
	"PW",
	"PA",
	"PR",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VI",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
];

module.exports = {
	JSONstringifyOrder,
	filterAndOutput,
	juniors,
	provinces,
	states,
};
