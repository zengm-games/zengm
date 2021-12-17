import { bySport, getDraftLotteryProbs, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type {
	ViewInput,
	MinimalPlayerRatings,
	Player,
} from "../../common/types";
import maxBy from "lodash-es/maxBy";

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

	const stats = bySport({
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ws"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});
	const playersAll2 = await idb.getCopies.players(
		{
			filter,
		},
		"noCopyCache",
	);
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
			"awards",
			"born",
		],
		ratings: ["ovr", "pot", "skills", "pos", "season"],
		stats,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	const players = [];
	for (const p of playersAll) {
		const currentPr = p.ratings.at(-1);
		const peakPr: any = maxBy(p.ratings, "ovr");

		let preLotteryRank: number | undefined;
		let lotteryChange: number | undefined;
		let lotteryProb: number | undefined;
		if (p.draft.round === 1) {
			const draftLottery = await idb.getCopy.draftLotteryResults(
				{
					season: p.draft.year,
				},
				"noCopyCache",
			);
			if (draftLottery) {
				const lotteryRowIndex = draftLottery.result.findIndex(
					row => row.pick === p.draft.pick,
				);
				if (lotteryRowIndex >= 0) {
					preLotteryRank = lotteryRowIndex + 1;
					lotteryChange = preLotteryRank - p.draft.pick;

					const probs = getDraftLotteryProbs(
						draftLottery.result,
						draftLottery.draftType,
					);
					if (probs) {
						lotteryProb = probs[lotteryRowIndex]?.[p.draft.pick - 1];
					}
				}
			}
		}

		players.push({
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

			// Draft lottery
			preLotteryRank,
			lotteryChange,
			lotteryProb,
		});
	}

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
