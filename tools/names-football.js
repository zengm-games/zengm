const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { juniors, provinces, states } = require("./lib/namesHelpers");

const namesFootball = () => {
	// Run this on the output of something like:
	// $ wget --mirror --convert-links --adjust-extension --no-parent https://www.footballdb.com/college-football/players/index.html -A '*index.html*'
	const folder =
		"/media/external/BBGM/www.footballdb.com/college-football/players";

	const players = [];

	// Get player info from files
	for (const filename of fs.readdirSync(folder)) {
		const file = path.join(folder, filename);
		const contents = fs.readFileSync(file, "utf8");

		const $ = cheerio.load(contents);

		$("table tbody tr").each((i, element) => {
			const children = $(element).children();
			const rawName = $(children[0]).text();
			const rawCountry = $(children[3]).text();
			players.push({
				rawName,
				rawCountry,
			});
		});
	}

	const countryFixes = {
		Al: "USA",
		"Australia /": "Australia",
		"CA ": "USA",
		"Calif. /": "USA",
		Fla: "USA",
		"Haw.": "USA",
		"Huber Hts. Ohio": "USA",
		Idaho: "USA",
		"Las Cruces": "USA",
		"MS ": "USA",
		"Miss. /": "USA",
		N: "USA",
		"Ohio /": "USA",
		"Ont.": "Canada",
		"Ore.": "USA",
		Oregon: "USA",
		Pa: "USA",
		"Pa. /": "USA",
		"Penn.": "USA",
		Quebec: "Canada",
		"Rancho Cucamonga Calif.": "USA",
		"South Australia": "Australia",
		"South Carolina": "USA",
		"TX ": "USA",
		"TX /": "USA",
		"Tenn.": "USA",
		"W.Va.": "USA",
		Y: "USA",
	};

	const fnsByCountry = {};
	const lnsByCountry = {};

	for (const p of players) {
		// Parse country
		let country;
		if (p.rawCountry === "--") {
			country = "USA";
		} else {
			const matches = p.rawCountry.match(/(.+?) \(.*/);
			const hometown =
				matches && matches.length === 2 ? matches[1] : p.rawCountry;
			const parts2 = hometown.split(", ");
			const countryOrState = parts2[parts2.length - 1];
			if (states.includes(countryOrState)) {
				country = "USA";
			} else if (provinces.includes(countryOrState)) {
				country = "Canada";
			} else {
				country = countryOrState;
			}

			if (countryFixes[country]) {
				country = countryFixes[country];
				if (country === "???") {
					console.log("Weird country:", p.rawCountry);
				}
			}
		}

		if (!fnsByCountry.hasOwnProperty(country)) {
			fnsByCountry[country] = {};
			lnsByCountry[country] = {};
		}

		// Parse name
		const parts = p.rawName.split(", ");
		if (parts.length !== 2) {
			console.log("Weird name:", p.rawName);
		}
		const fn = parts[1];
		let ln = parts[0];

		for (const junior of juniors) {
			if (ln.endsWith(` ${junior}`)) {
				ln = ln.replace(` ${junior}`, "");
			}
		}

		const skipFN = [];
		if (!skipFN.includes(fn)) {
			if (!fnsByCountry[country].hasOwnProperty(fn)) {
				fnsByCountry[country][fn] = 0;
			}
			fnsByCountry[country][fn] += 1;
		}

		const skipLN = [];
		if (!skipLN.includes(ln)) {
			if (!lnsByCountry[country].hasOwnProperty(ln)) {
				lnsByCountry[country][ln] = 0;
			}
			lnsByCountry[country][ln] += 1;
		}

		/*if (Math.random() < 0.01) {
			break;
		}*/
	}

	return { fnsByCountry, lnsByCountry };
};

module.exports = namesFootball;
