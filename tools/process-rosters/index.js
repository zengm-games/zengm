const input = require("./input.json");

console.log(input);

for (const p of input.players) {
	p.imgURL = "/img/blank-face.png";
	p.real = true;
}

for (const t of input.teams) {
	delete t.colors;
	// fix names and logos
}

for (const dp of input.draftPicks) {
	delete dp.dpid;
}
