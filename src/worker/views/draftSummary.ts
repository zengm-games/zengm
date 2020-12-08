import { PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { ViewInput } from "../../common/types";
import maxBy from "lodash/maxBy";

const updateDraftSummary = async (inputs: ViewInput<"draftSummary">) => {
	const stats =
		process.env.SPORT === "basketball"
			? ["gp", "min", "pts", "trb", "ast", "per", "ws"]
			: ["gp", "keyStats", "av"]; // Update every time because anything could change this (unless all players from class are retired)

	let playersAll;

	if (g.get("season") === inputs.season) {
		// This is guaranteed to work (ignoring God Mode) because no player this season has had a chance to die or retire
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players({
			draftYear: inputs.season,
		});
	}

	playersAll = playersAll.filter(p => {
		return p.draft.year === inputs.season;
	});
	playersAll = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"tid",
			"abbrev",
			"draft",
			"pid",
			"name",
			"age",
			"hof",
			"watch",
			"awards",
			"born",
		],
		ratings: ["ovr", "pot", "skills", "pos", "season"],
		stats,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	const players = playersAll
		.filter(p => {
			return p.draft.round >= 1 || p.careerStats.gp > 0;
		})
		.map(p => {
			const currentPr = p.ratings[p.ratings.length - 1];
			const peakPr: any = maxBy(p.ratings, "ovr");
			return {
				// Attributes
				pid: p.pid,
				name: p.name,
				draft: p.draft,
				currentAge: p.age,
				currentAbbrev: p.abbrev,
				currentTid: p.tid,
				hof: p.hof,
				watch: p.watch,
				awards: p.awards,

				// Ratings
				currentOvr: p.tid !== PLAYER.RETIRED ? currentPr.ovr : null,
				currentPot: p.tid !== PLAYER.RETIRED ? currentPr.pot : null,
				currentSkills: p.tid !== PLAYER.RETIRED ? currentPr.skills : [],
				pos: currentPr.pos,

				peakAge: peakPr.season - p.born.year,
				peakOvr: peakPr.ovr,
				peakPot: peakPr.pot,
				peakSkills: peakPr.skills,

				// Stats
				careerStats: p.careerStats,
			};
		});
	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		draftType: g.get("draftType"),
		players,
		season: inputs.season,
		startingSeason: g.get("startingSeason"),
		stats,
		userTid: g.get("userTid"),
	};
};

export default updateDraftSummary;
