import { bySport, PHASE } from "../../../common";
import type { MinimalPlayerRatings } from "../../../common/types";
import { g, helpers } from "../../util";
import genRatingsBaseball from "./genRatings.baseball";
import genRatingsBasketball from "./genRatings.basketball";
import genRatingsFootball from "./genRatings.football";
import genRatingsHockey from "./genRatings.hockey";
import pos from "./pos";

const genRatings = (season: number, scoutingLevel: number) => {
	const { heightInInches, ratings } = bySport<{
		heightInInches: number;
		ratings: MinimalPlayerRatings;
	}>({
		baseball: genRatingsBaseball(season, scoutingLevel),
		basketball: genRatingsBasketball(season, scoutingLevel),
		football: genRatingsFootball(season, scoutingLevel),
		hockey: genRatingsHockey(season, scoutingLevel),
	});

	// Should correspond to defaultGameAttributes.draftAges[0], but maybe they will diverge in the future..
	const DEFAULT_AGE = bySport({
		baseball: 18,
		basketball: 19,
		football: 21,
		hockey: 18,
	});

	// Apply bonus/penalty based on age, to simulate extra/fewer years of development that a player should have gotten. For older players, this is bounded by an upper limit, because players stop developing eventually. You might think player.develop should be used here, at least for old players, but that would result in old players all being horrible, which is no fun.
	const age = helpers.bound(g.get("draftAges")[0], -Infinity, 30);
	const ageDiff = age - DEFAULT_AGE;
	if (ageDiff !== 0) {
		const exponent = bySport({
			baseball: 0.75,
			basketball: 0.8,
			football: 1,
			hockey: 0.75,
		});

		const scale = Math.round(
			3 * Math.sign(ageDiff) * Math.abs(ageDiff) ** exponent,
		);

		const rtgs = bySport({
			baseball: [
				"hpw",
				"con",
				"eye",
				"gnd",
				"fly",
				"thr",
				"cat",
				"ppw",
				"ctl",
				"mov",
				"endu",
			],
			basketball: [
				"stre",
				"endu",
				"ins",
				"dnk",
				"ft",
				"fg",
				"tp",
				"oiq",
				"diq",
			],
			football: [
				"stre",
				"endu",
				"thv",
				"thp",
				"tha",
				"bsc",
				"elu",
				"rtr",
				"hnd",
				"rbk",
				"pbk",
				"pcv",
				"tck",
				"prs",
				"rns",
				"kpw",
				"kac",
				"ppw",
				"pac",
			],
			hockey: [
				"stre",
				"endu",
				"pss",
				"wst",
				"sst",
				"stk",
				"oiq",
				"chk",
				"blk",
				"fcf",
				"diq",
				"glk",
			],
		});

		const rtgsDevelopSlow = bySport({
			baseball: ["spd"],
			basketball: ["spd", "jmp", "drb", "pss", "reb"],
			football: ["spd"],
			hockey: ["spd"],
		});

		for (const rtg of rtgs) {
			(ratings as any)[rtg] = helpers.bound(
				(ratings as any)[rtg] + scale,
				0,
				100,
			);
		}

		for (const rtg of rtgsDevelopSlow) {
			(ratings as any)[rtg] = helpers.bound(
				(ratings as any)[rtg] + Math.round(scale / 2),
				0,
				100,
			);
		}
	}

	// Higher fuzz for draft prospects
	let factor = 1;
	if (g.get("phase") >= PHASE.RESIGN_PLAYERS) {
		if (season === g.get("season") + 2) {
			factor = Math.sqrt(2);
		} else if (season >= g.get("season") + 3) {
			factor = 2;
		}
	} else {
		if (season === g.get("season") + 1) {
			factor = Math.sqrt(2);
		} else if (season >= g.get("season") + 2) {
			factor = 2;
		}
	}
	ratings.fuzz *= factor;

	ratings.pos = pos(ratings);

	return {
		heightInInches,
		ratings,
		// genPos,
	};
};

export default genRatings;
