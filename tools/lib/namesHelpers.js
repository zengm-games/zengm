const filterAndOutput = (fnsByCountry, lnsByCountry) => {
	// Minimum of (unique fns, unique lns) by country
	const countsByCountry = {};
	for (const country of Object.keys(fnsByCountry).sort()) {
		countsByCountry[country] = Math.min(
			Object.keys(fnsByCountry[country]).length,
			Object.keys(lnsByCountry[country]).length,
		);
	}

	// Restructure fns and lns so they are arrays of [name, cumsum] by country
	const namesByCountryCumsum = namesByCountry => {
		const obj = {};

		for (const country of Object.keys(namesByCountry).sort()) {
			let cumsum = 0;
			obj[country] = Object.keys(namesByCountry[country])
				.sort()
				.map(name => {
					cumsum += namesByCountry[country][name];
					return [name, cumsum];
				});

			if (cumsum < 5) {
				console.log(`Dropping ${country} (${cumsum} players)`);
				delete obj[country];
			}
		}

		return obj;
	};
	const fnsByCountryCumsum = namesByCountryCumsum(fnsByCountry);
	const lnsByCountryCumsum = namesByCountryCumsum(lnsByCountry);

	console.log(JSON.stringify(Object.keys(fnsByCountry).sort(), null, 4));
	console.log(
		JSON.stringify(
			{ first: fnsByCountryCumsum, last: lnsByCountryCumsum },
			null,
			4,
		),
	);
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
