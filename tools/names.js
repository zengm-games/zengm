const namesBasketball = require("./names-basketball");
const namesFootball = require("./names-football");
const { JSONstringifyOrder, filterAndOutput } = require("./lib/namesHelpers");

const countryFreqs = ({ fnsByCountry }) => {
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

const basketball = namesBasketball();
const football = namesFootball();

const countriesBasketball = countryFreqs(basketball);
const countriesFootball = countryFreqs(football);

const combineNames = namesArray => {
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

const fnsByCountry = combineNames([
	basketball.fnsByCountry,
	football.fnsByCountry,
]);
const lnsByCountry = combineNames([
	basketball.lnsByCountry,
	football.lnsByCountry,
]);

const dropped = filterAndOutput(fnsByCountry, lnsByCountry);

for (const freq of [countriesBasketball, countriesFootball]) {
	for (const country of dropped) {
		delete freq[country];
	}
}

console.log(
	`const countriesBasketball = ${JSONstringifyOrder(
		countriesBasketball,
		2,
	)};\n`,
);
console.log(
	`const countriesFootball = ${JSONstringifyOrder(countriesFootball, 2)};\n`,
);
