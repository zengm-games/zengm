const fs = require("fs");
const path = require("path");
const input = require("./input.json");
const readCSV = require("../../../bbgm-rosters/src/4-output/lib/readCSV");

require("ts-node").register();
const ovr = require("../../src/basketball/worker/core/player/ovr.ts").default;
const getTeamInfos = require("../../src/deion/common/getTeamInfos.ts").default;

const decreaseAmount = ovr2 => {
	if (ovr2 <= 42) {
		return 9;
	}
	if (ovr2 <= 43) {
		return 8;
	}
	if (ovr2 <= 44) {
		return 7;
	}
	if (ovr2 <= 46) {
		return 6;
	}
	if (ovr2 <= 48) {
		return 5;
	}
	if (ovr2 <= 51) {
		return 4;
	}
	if (ovr2 <= 53) {
		return 3;
	}
	if (ovr2 <= 62) {
		return 2;
	}
	if (ovr2 <= 72) {
		return 1;
	}
	return 0;
};

const adjustRatings = (ratings, tid) => {
	const ovr2 = ovr(ratings);
	const amount = decreaseAmount(ovr2);

	const keys = [
		"stre",
		"spd",
		"jmp",
		"endu",
		"ins",
		"dnk",
		"ft",
		"tp",
		"oiq",
		"diq",
		"drb",
		"pss",
		"fg",
		"reb",
	];

	for (const key of keys) {
		ratings[key] -= amount;

		// Penalty for FAs, who seem overrated
		if (tid === -1) {
			ratings[key] -= 4;
		}

		if (ratings[key] < 0) {
			ratings[key] = 0;
		}
	}

	ratings.fuzz = 0;
};

// BBGM has more aggressive development of young players than reality, which requires some young players to be nerfed a bit
const nerfYoungPlayers = () => {
	for (const p of input.players) {
		const ratings = p.ratings[p.ratings.length - 1];
		if (p.name === "Luka Doncic") {
			ratings.tp -= 12;
			ratings.diq -= 17;
		} else if (p.name === "Tyler Herro") {
			ratings.spd -= 5;
			ratings.oiq -= 9;
			ratings.diq -= 9;
		} else if (p.name === "Trae Young") {
			ratings.fg -= 5;
			ratings.oiq -= 5;
			ratings.diq -= 5;
		}
	}
};

const replaceAbbrevs = {
	GSW: "GS",
	NOP: "NOL",
	NYK: "NYC",
	PHX: "PHO",
	SAS: "SA",
};
input.teams = getTeamInfos(
	input.teams.map(t => {
		const srID = t.abbrev;
		if (replaceAbbrevs[t.abbrev]) {
			t.abbrev = replaceAbbrevs[t.abbrev];
		}
		return {
			abbrev: t.abbrev,
			cid: t.cid,
			did: t.did,
			tid: t.tid,
			srID,
		};
	}),
);

const normalizeName = name => {
	name = name.toLowerCase().replace(/\./g, "");

	// https://stackoverflow.com/a/37511463/786644
	return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const bios = readCSV("player-bios.csv").reverse();
for (const bio of bios) {
	bio.name = normalizeName(bio.name);
}

const nameOverrides = {
	"Marvin Bagley": "Marvin Bagley III",
	"Mohamed Bamba": "Mo Bamba",
	"Wendell Carter": "Wendell Carter Jr.",
	"Kelly Oubre": "Kelly Oubre Jr.",
	"Dennis Smith": "Dennis Smith Jr.",
};

for (const p of input.players) {
	p.imgURL = "/img/blank-face.png";
	p.real = true;

	for (const ratings of p.ratings) {
		adjustRatings(ratings, p.tid);
	}

	if (p.stats) {
		for (const stats of p.stats) {
			if (typeof stats.tid === "string") {
				stats.tid = parseInt(stats.tid);
				if (Number.isNaN(stats.tid)) {
					throw new Error("WTF");
				}
			}
		}
	}

	let rawName = p.name ? p.name : `${p.firstName} ${p.lastName}`.trim();

	if (nameOverrides[rawName]) {
		rawName = nameOverrides[rawName];
	}

	const name = normalizeName(rawName);
	const bio = bios.find(bio => name === bio.name);

	let srID;
	if (bio) {
		srID = bio.slug;
	} else {
		if (p.draft.year < 2020) {
			console.log(`No player-bios.csv entry found for ${rawName}`);
		}
		srID = `dp_${p.draft.year}_${name.replace(/ /g, "_")}`;
	}

	p.srID = srID;
}

nerfYoungPlayers(input.players);

for (const dp of input.draftPicks) {
	delete dp.dpid;
}

fs.writeFileSync(
	path.join(__dirname, "../../public/basketball/leagues/2020.json"),
	JSON.stringify(input, undefined, 2),
);
