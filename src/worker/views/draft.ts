import { PHASE, PLAYER } from "../../common/constants.ts";
import type { Player, PlayerStatAttr } from "../../common/types.ts";
import { draft } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers, local } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { minBy } from "../../common/utils.ts";
import { getDraftTeamsByTid } from "./draftHistory.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { defineView } from "../util/defineView.ts";

const getUserNextPickYear = async () => {
	const userTids = g.get("userTids");

	const draftPicks = (await idb.cache.draftPicks.getAll()).filter(
		(dp) => userTids.includes(dp.tid) && typeof dp.season === "number",
	);

	// This could be the current season, but that's fine because the UI handles that case
	let nextPickYear = minBy(draftPicks, "season")?.season as number | undefined;

	// No picks at all in future drafts, so find what the next one to be generated is
	nextPickYear ??= g.get("season") + g.get("numSeasonsFutureDraftPicks");

	return nextPickYear;
};

export default defineView("draft", async ({ updateEvents }) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const fantasyDraft = g.get("phase") === PHASE.FANTASY_DRAFT;
		const expansionDraft = g.get("expansionDraft");
		let expansionDraftFilteredTeamsMessage: string | undefined;

		let draftPicks = await draft.getOrder();

		// DIRTY QUICK FIX FOR sometimes there are twice as many draft picks as needed, and one set has all pick 0
		if (
			!fantasyDraft &&
			g.get("phase") !== PHASE.EXPANSION_DRAFT &&
			draftPicks.length > 2 * g.get("numActiveTeams")
		) {
			const draftPicks2 = draftPicks.filter((dp) => dp.pick > 0);

			if (draftPicks2.length === 2 * g.get("numActiveTeams")) {
				const toDelete = draftPicks.filter((dp) => dp.pick === 0);

				for (const dp of toDelete) {
					await idb.cache.draftPicks.delete(dp.dpid);
				}

				draftPicks = draftPicks2;
			}
		}

		// DIRTY QUICK FIX FOR https://github.com/zengm-games/zengm/issues/246
		// Not sure why this is needed! Maybe related to lottery running before the phase change?
		if (
			draftPicks.some((dp) => dp.pick === 0) &&
			g.get("draftType") !== "freeAgents"
		) {
			await draft.genOrder(false);
			draftPicks = await draft.getOrder();
		}

		const isFantasyOrExpansionDraft =
			fantasyDraft ||
			(g.get("phase") === PHASE.EXPANSION_DRAFT &&
				expansionDraft.phase === "draft");

		// Stats are only shown for fantasy/expansion drafts
		const stats: PlayerStatAttr[] = isFantasyOrExpansionDraft
			? bySport({
					baseball: ["gp", "keyStats", "war"],
					basketball: ["per", "ewa"],
					football: ["gp", "keyStats", "av"],
					hockey: ["gp", "keyStats", "ops", "dps", "ps"],
				})
			: [];

		let draftedRaw: Player[];

		// For fantasy/expansion drafts, the team each player was on before the draft
		const prevByPid = new Map<
			number,
			{ prevAbbrev: string | undefined; prevTid: number }
		>();

		if (isFantasyOrExpansionDraft) {
			draftedRaw = local.fantasyDraftResults;
			for (const p of local.fantasyDraftResults) {
				prevByPid.set(p.pid, {
					prevAbbrev: p.prevAbbrev,
					prevTid: p.prevTid,
				});
			}
		} else {
			draftedRaw = (
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
			).filter((p) => p.draft.year === g.get("season"));
			draftedRaw.sort(
				(a, b) =>
					100 * a.draft.round +
					a.draft.pick -
					(100 * b.draft.round + b.draft.pick),
			);
		}

		const draftedPlayers = addFirstNameShort(
			await idb.getCopies.playersPlus(draftedRaw, {
				attrs: [
					"pid",
					"tid",
					"firstName",
					"lastName",
					"age",
					"draft",
					"injury",
					"contract",
					"watch",
				],
				ratings: ["ovr", "pot", "skills", "pos"],
				stats,
				season: g.get("season"),
				showRookies: true,
				fuzz: true,
			}),
		).map((p) => {
			const prev = prevByPid.get(p.pid);
			return {
				...p,
				prevAbbrev: prev?.prevAbbrev,
				prevTid: prev?.prevTid,
			};
		});

		let undraftedRaw: Player[];

		if (fantasyDraft) {
			// After fantasy draft, tids are reset, so actually the remaining undrafted players are free agents
			const undraftedTID =
				draftPicks.length > 0 ? PLAYER.UNDRAFTED : PLAYER.FREE_AGENT;

			undraftedRaw = await idb.cache.players.indexGetAll(
				"playersByTid",
				undraftedTID,
			);
		} else if (
			g.get("phase") === PHASE.EXPANSION_DRAFT &&
			expansionDraft.phase === "draft"
		) {
			undraftedRaw = (
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
			).filter((p) => expansionDraft.availablePids.includes(p.pid));

			if (expansionDraft.numPerTeam !== undefined) {
				// Keep logic in sync with runPicks.ts
				const tidsOverLimit: number[] = [];
				for (const [tidString, numPerTeam] of Object.entries(
					expansionDraft.numPerTeamDrafted,
				)) {
					if (numPerTeam >= expansionDraft.numPerTeam) {
						const tid = Number.parseInt(tidString);
						tidsOverLimit.push(tid);
					}
				}

				if (tidsOverLimit.length > 0) {
					const numPlayersBefore = undraftedRaw.length;
					undraftedRaw = undraftedRaw.filter(
						(p) => !tidsOverLimit.includes(p.tid),
					);
					if (undraftedRaw.length !== numPlayersBefore) {
						const abbrevs = tidsOverLimit
							.map((tid) => helpers.getAbbrev(tid))
							.sort();
						expansionDraftFilteredTeamsMessage = `Players from some teams (${abbrevs.join(
							", ",
						)}) are no longer available to be selected because they have already reached the limit of ${
							expansionDraft.numPerTeam
						} drafted ${helpers.plural("player", expansionDraft.numPerTeam)}.`;
					}
				}
			}
		} else {
			undraftedRaw = (
				await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
					[g.get("season")],
					[g.get("season"), Infinity],
				])
			).filter((p) => p.tid === PLAYER.UNDRAFTED);

			// DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
			// This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
			for (const p of undraftedRaw) {
				const season = p.ratings[0].season;

				if (season !== g.get("season") && g.get("phase") === PHASE.DRAFT) {
					console.log("FIXING MESSED UP DRAFT CLASS");
					console.log(season);
					p.ratings[0].season = g.get("season");
					await idb.cache.players.put(p);
				}
			}
		}

		undraftedRaw.sort((a, b) => b.valueFuzz - a.valueFuzz);
		const undraftedPlayers = addFirstNameShort(
			await idb.getCopies.playersPlus(undraftedRaw, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"injury",
					"contract",
					"watch",
					"abbrev",
					"tid",
					"valueFuzz",
					"draft",
				],
				ratings: ["ovr", "pot", "skills", "pos"],
				stats,
				season: g.get("season"),
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);
		undraftedPlayers.sort((a, b) => b.valueFuzz - a.valueFuzz);
		const undrafted = undraftedPlayers.map((p, i) => ({
			...p,
			rank: i + 1,
		}));

		// Placeholders for remaining picks
		const drafted = [
			...draftedPlayers,
			...draftPicks.map((dp) => ({
				draft: dp,
				pid: -1 as const,
			})),
		];

		const userPlayersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		const userPlayers = await idb.getCopies.playersPlus(userPlayersAll, {
			attrs: [],
			ratings: ["pos"],
			stats: [],
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
		});

		const userNextPickYear = await getUserNextPickYear();

		const teamsByTid = await getDraftTeamsByTid(g.get("season"));

		return {
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			drafted,
			expansionDraftFilteredTeamsMessage,
			fantasyDraft,
			stats,
			teamsByTid,
			undrafted,
			userNextPickYear,
			userPlayers,
		};
	}
});
