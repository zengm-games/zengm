const _ = require("lodash");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { provinces, states } = require("./lib/namesHelpers");

// Run this on the output of something like:
// $ wget --mirror --convert-links --adjust-extension --no-parent https://www.footballdb.com/college-football/players/index.html -A '*index.html*'
const folder = "/media/external/www.footballdb.com/college-football/players";

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

for (const p of players) {
	// Parse name
	const parts = p.rawName.split(", ");
	if (parts.length !== 2) {
		console.log("Weird name:", p.rawName);
	}
	p.firstName = parts[1];
	p.lastName = parts[0];

	// Parse country
	if (p.rawCountry === "--") {
		p.country = "USA";
	} else {
		const matches = p.rawCountry.match(/(.+?) \(.*/);
		const hometown =
			matches && matches.length === 2 ? matches[1] : p.rawCountry;
		const parts2 = hometown.split(", ");
		const countryOrState = parts2[parts2.length - 1];
		if (states.includes(countryOrState)) {
			p.country = "USA";
		} else if (provinces.includes(countryOrState)) {
			p.country = "Canada";
		} else {
			p.country = countryOrState;
		}

		if (countryFixes[p.country]) {
			p.country = countryFixes[p.country];
			if (p.country === "???") {
				console.log("Weird country:", p.rawCountry);
			}
		}
	}
}

console.log(
	Object.entries(_.countBy(players, "country")).filter(entry => entry[1] >= 5),
);
