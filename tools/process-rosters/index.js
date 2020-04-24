const fs = require("fs");
const path = require("path");
const input = require("./input.json");

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
};

const replaceAbbrevs = {
	LAC: "LAE",
	GSW: "GS",
	NOP: "NOL",
	NYK: "NYC",
	PHX: "PHO",
	SAS: "SA",
};
input.teams = getTeamInfos(
	input.teams.map(t => {
		if (replaceAbbrevs[t.abbrev]) {
			t.abbrev = replaceAbbrevs[t.abbrev];
		}
		return {
			abbrev: t.abbrev,
			cid: t.cid,
			did: t.did,
			tid: t.tid,
		};
	}),
);

for (const p of input.players) {
	p.imgURL = "/img/blank-face.png";
	p.real = true;

	for (const ratings of p.ratings) {
		adjustRatings(ratings, p.tid);
	}
}

for (const dp of input.draftPicks) {
	delete dp.dpid;
}

fs.writeFileSync(
	path.join(__dirname, "../../public/basketball/leagues/2020.json"),
	JSON.stringify(input, undefined, 2),
);
