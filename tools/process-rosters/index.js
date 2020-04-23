const fs = require("fs");
const path = require("path");
const input = require("./input.json");

// Copy pasted from ovr.ts because TypeScript
const calcOvr = ratings => {
	// See analysis/player-ovr-basketball
	const r =
		0.159 * (ratings.hgt - 47.5) +
		0.0777 * (ratings.stre - 50.2) +
		0.123 * (ratings.spd - 50.8) +
		0.051 * (ratings.jmp - 48.7) +
		0.0632 * (ratings.endu - 39.9) +
		0.0126 * (ratings.ins - 42.4) +
		0.0286 * (ratings.dnk - 49.5) +
		0.0202 * (ratings.ft - 47.0) +
		0.0726 * (ratings.tp - 47.1) +
		0.133 * (ratings.oiq - 46.8) +
		0.159 * (ratings.diq - 46.7) +
		0.059 * (ratings.drb - 54.8) +
		0.062 * (ratings.pss - 51.3) +
		0.01 * (ratings.fg - 47.0) +
		0.01 * (ratings.reb - 51.4) +
		48.5;

	// Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
	// +8 at 68
	// +4 at 50
	// -5 at 42
	// -10 at 31
	let fudgeFactor = 0;
	if (r >= 68) {
		fudgeFactor = 8;
	} else if (r >= 50) {
		fudgeFactor = 4 + (r - 50) * (4 / 18);
	} else if (r >= 42) {
		fudgeFactor = -5 + (r - 42) * (9 / 8);
	} else if (r >= 31) {
		fudgeFactor = -5 - (42 - r) * (5 / 11);
	} else {
		fudgeFactor = -10;
	}

	return Math.round(r + fudgeFactor);
};

const decreaseAmount = ratings => {
	const ovr = calcOvr(ratings);
	if (ovr <= 42) {
		return 9;
	}
	if (ovr <= 43) {
		return 8;
	}
	if (ovr <= 44) {
		return 7;
	}
	if (ovr <= 46) {
		return 6;
	}
	if (ovr <= 48) {
		return 5;
	}
	if (ovr <= 51) {
		return 4;
	}
	if (ovr <= 53) {
		return 3;
	}
	if (ovr <= 62) {
		return 2;
	}
	if (ovr <= 72) {
		return 1;
	}
	return 0;
};

const adjustRatings = (ratings, tid) => {
	const amount = decreaseAmount(ratings);
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

delete input.teams;
delete input.verison;

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
	path.join(
		__dirname,
		"../../src/deion/worker/data/league-real-2020.basketball.json",
	),
	JSON.stringify(input, undefined, 2),
);
