const fs = require("fs");
const path = require("path");
const input = require("./input.json");

delete input.teams;
delete input.verison;

for (const p of input.players) {
	p.imgURL = "/img/blank-face.png";
	p.real = true;
}

for (const dp of input.draftPicks) {
	delete dp.dpid;
}

fs.writeFileSync(
	path.join(
		__dirname,
		"../../src/deion/worker/data/league-real-2020.basketball.json",
	),
	JSON.stringify(input, undefined, 2),
);
