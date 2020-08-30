import { PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type {
	ViewInput,
	MinimalPlayerRatings,
	Player,
} from "../../common/types";

const updateDraftTeamHistory = async (
	inputs: ViewInput<"draftTeamHistory">,
) => {
	let filter;
	if (inputs.tid >= 0) {
		filter = (p: Player<MinimalPlayerRatings>) => p.draft.tid === inputs.tid;
	} else {
		filter = (p: Player<MinimalPlayerRatings>) =>
			p.draft.tid === g.get("userTid", p.draft.year + 1);
	}

	const stats =
		process.env.SPORT === "basketball"
			? ["gp", "min", "pts", "trb", "ast", "per", "ewa"]
			: ["gp", "keyStats", "av"];
	const playersAll2 = await idb.getCopies.players({
		filter,
	});
	const playersAll = await idb.getCopies.playersPlus(playersAll2, {
		attrs: [
			"tid",
			"abbrev",
			"draft",
			"pid",
			"name",
			"age",
			"hof",
			"watch",
			"jerseyNumber",
		],
		ratings: ["ovr", "pot", "skills", "pos"],
		stats,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	const players = playersAll.map(p => {
		const currentPr = p.ratings[p.ratings.length - 1];
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
			jerseyNumber: p.jerseyNumber,

			// Ratings
			currentOvr: p.tid !== PLAYER.RETIRED ? currentPr.ovr : null,
			currentPot: p.tid !== PLAYER.RETIRED ? currentPr.pot : null,
			currentSkills: p.tid !== PLAYER.RETIRED ? currentPr.skills : [],
			pos: currentPr.pos,

			// Stats
			careerStats: p.careerStats,
		};
	});

	const abbrev = inputs.abbrev;
	const userAbbrev = g.get("teamInfoCache")[g.get("userTid")]?.abbrev;

	return {
		abbrev,
		challengeNoRatings: g.get("challengeNoRatings"),
		draftType: g.get("draftType"),
		players,
		stats,
		userAbbrev,
	};
};

export default updateDraftTeamHistory;
