import { bySport, PLAYER } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { ViewInput } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { groupByUnique, maxBy } from "../../common/utils.ts";

export const getDraftTeamsByTid = async (season: number) => {
	const teamsByTid = groupByUnique(
		(
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: ["abbrev", "imgURL", "imgURLSmall"],
				season,
			})
		).map((t) => {
			return {
				...t.seasonAttrs,
				tid: t.tid,
			};
		}),
		"tid",
	);

	// Make sure we have all teams, even if missing teamSeason
	for (const [tid, t] of g.get("teamInfoCache").entries()) {
		if (!teamsByTid[tid]) {
			teamsByTid[tid] = {
				tid,
				abbrev: t.abbrev,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
			};
		}
	}

	return teamsByTid;
};

const updateDraftHistory = async (inputs: ViewInput<"draftHistory">) => {
	// Update every time because anything could change this (unless all players from class are retired)

	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ws"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	const summaryStat = bySport({
		baseball: "war",
		basketball: "ws",
		football: "av",
		hockey: "ps",
	});

	let playersAll;

	if (g.get("season") === inputs.season) {
		// This is guaranteed to work (ignoring God Mode) because no player this season has had a chance to die or retire
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				draftYear: inputs.season,
			},
			"noCopyCache",
		);
	}

	playersAll = playersAll.filter((p) => {
		return p.draft.year === inputs.season;
	});
	playersAll = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"tid",
			"abbrev",
			"draft",
			"pid",
			"firstName",
			"lastName",
			"age",
			"ageAtDeath",
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
		.filter((p) => {
			return p.draft.round >= 1 || p.careerStats.gp > 0;
		})
		.map((p) => {
			const currentPr = p.ratings.at(-1);
			const peakPr: any = maxBy(p.ratings, "ovr");
			return {
				// Attributes
				pid: p.pid,
				firstName: p.firstName,
				lastName: p.lastName,
				draft: p.draft,
				currentAge: p.age,
				ageAtDeath: p.ageAtDeath,
				currentAbbrev: p.abbrev,
				currentTid: p.tid,
				hof: p.hof,
				watch: p.watch,
				awards: p.awards,
				awardCounts: {
					allStar: p.awards.filter((award: any) => award.type === "All-Star")
						.length,
					mvp: p.awards.filter(
						(award: any) => award.type === "Most Valuable Player",
					).length,
					roy: p.awards.filter((award: any) => {
						// "includes" to handle OROY and DROY in FBGM
						return award.type.includes("Rookie of the Year");
					}).length,
					champ: p.awards.filter(
						(award: any) => award.type === "Won Championship",
					).length,
					hof: p.awards.filter(
						(award: any) => award.type === "Inducted into the Hall of Fame",
					).length,
				},

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

	const teamsByTid = await getDraftTeamsByTid(inputs.season);

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		draftType: g.get("draftType"),
		players: addFirstNameShort(players),
		season: inputs.season,
		stats,
		summaryStat,
		teamsByTid,
		userTid: g.get("userTid"),
	};
};

export default updateDraftHistory;
