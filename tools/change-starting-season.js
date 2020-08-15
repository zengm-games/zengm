if (process.argv.length < 4) {
	console.error(
		"Error: requires a season and a league file as input, like:\n$ node tools/change-starting-season.js 2005 file.json",
	);
	process.exit(1);
}

const targetSeason = parseInt(process.argv[2], 10);

if (Number.isNaN(targetSeason)) {
	console.error(
		"Error: invalid season. This script requires a season and a league file as input, like:\n$ node tools/change-starting-season.js 2005 file.json",
	);
	process.exit(1);
}

const league = require(process.argv[3]);

let currentSeason;
if (league.hasOwnProperty("startingSeason")) {
	currentSeason = league.startingSeason;
} else if (league.gameAttributes) {
	for (const { key, value } of league.gameAttributes) {
		if (key === "startingSeason") {
			currentSeason = value;
		}
	}
}

if (typeof currentSeason !== "number" || Number.isNaN(targetSeason)) {
	console.error("Error: no startingSeason found in league file");
	process.exit(1);
}

const diff = targetSeason - currentSeason;

if (league.events) {
	for (const e of league.events) {
		if (typeof e.season === "number") {
			e.season += diff;
		}
	}
}

const gameAttributes = ["gracePeriodEnd", "season", "startingSeason"];
if (league.gameAttributes) {
	for (const ga of league.gameAttributes) {
		if (gameAttributes.includes(ga.key) && typeof ga.value === "number") {
			ga.value += diff;
		}
	}
}

if (league.meta && league.meta.phaseText) {
	league.meta.phaseText = league.meta.phaseText.replace(
		currentSeason,
		targetSeason,
	);
}

if (league.players) {
	for (const p of league.players) {
		if (p.born && typeof p.born.year === "number") {
			p.born.year += diff;
		}

		if (p.draft && typeof p.draft.year === "number") {
			p.draft.year += diff;
		}

		if (p.contract && typeof p.contract.exp === "number") {
			p.contract.exp += diff;
		}

		const keys = ["ratings", "salaries", "stats"];
		for (const key of keys) {
			if (p[key]) {
				for (const row of p[key]) {
					if (typeof row.season === "number") {
						row.season += diff;
					}
				}
			}
		}
	}
}

if (league.releasedPlayers) {
	for (const p of league.releasedPlayers) {
		if (p.contract && typeof p.contract.exp === "number") {
			p.contract.exp += diff;
		}
	}
}

if (league.teams) {
	for (const t of league.teams) {
		const keys = ["seasons", "stats"];
		for (const key of keys) {
			if (t[key]) {
				for (const row of t[key]) {
					if (typeof row.season === "number") {
						row.season += diff;
					}
				}
			}
		}
	}
}

if (league.draftPicks) {
	for (const dp of league.draftPicks) {
		if (typeof dp.season === "number") {
			dp.season += diff;
		}
	}
}

console.log(JSON.stringify(league, null, 2));
