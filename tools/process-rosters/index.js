const input = require("./input.json");

console.log(input);

for (const p of input.players) {
	p.imgURL = "/img/blank-face.png";
	p.real = true;
}

delete input.teams;

for (const dp of input.draftPicks) {
	delete dp.dpid;
}
