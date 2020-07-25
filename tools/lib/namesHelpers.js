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

		countries[country] = {
			first: fns,
			last: lns,
		};
	}

	console.log(`const countries = ${JSON.stringify(countries, null, 2)};\n`);

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
	filterAndOutput,
	juniors,
	provinces,
	states,
};
