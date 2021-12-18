import { bySport, PHASE, PLAYER } from "../../common";
import type { UpdateEvents } from "../../common/types";
import { draft } from "../core";
import { idb } from "../db";
import { g, local } from "../util";

const updateDraft = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("customizeTable") ||
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
			const draftPicks2 = draftPicks.filter(dp => dp.pick > 0);

			if (draftPicks2.length === 2 * g.get("numActiveTeams")) {
				const toDelete = draftPicks.filter(dp => dp.pick === 0);

				for (const dp of toDelete) {
					await idb.cache.draftPicks.delete(dp.dpid);
				}

				draftPicks = draftPicks2;
			}
		}

		// DIRTY QUICK FIX FOR https://github.com/zengm-games/zengm/issues/246
		// Not sure why this is needed! Maybe related to lottery running before the phase change?
		if (
			draftPicks.some(dp => dp.pick === 0) &&
			g.get("draftType") !== "freeAgents"
		) {
			await draft.genOrder();
			draftPicks = await draft.getOrder();
		}

		let drafted: any[];

		if (
			fantasyDraft ||
			(g.get("phase") === PHASE.EXPANSION_DRAFT &&
				expansionDraft.phase === "draft")
		) {
			drafted = local.fantasyDraftResults;
		} else {
			drafted = await idb.cache.players.indexGetAll("playersByTid", [
				0,
				Infinity,
			]);
			drafted = drafted.filter(p => p.draft.year === g.get("season"));
			drafted.sort(
				(a, b) =>
					100 * a.draft.round +
					a.draft.pick -
					(100 * b.draft.round + b.draft.pick),
			);
		}

		drafted = await idb.getCopies.playersPlus(drafted, {
			attrs: [
				"pid",
				"tid",
				"name",
				"age",
				"draft",
				"injury",
				"contract",
				"watch",
				"prevTid",
				"prevAbbrev",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats: ["per", "ewa"],
			season: g.get("season"),
			showRookies: true,
			fuzz: true,
		});

		let stats: string[];
		let undrafted: any[];

		if (fantasyDraft) {
			stats = bySport({
				basketball: ["per", "ewa"],
				football: ["gp", "keyStats", "av"],
				hockey: ["gp", "keyStats", "ops", "dps", "ps"],
			});

			// After fantasy draft, tids are reset, so actually the remaining undrafted players are free agents
			const undraftedTID =
				draftPicks.length > 0 ? PLAYER.UNDRAFTED : PLAYER.FREE_AGENT;

			undrafted = await idb.cache.players.indexGetAll(
				"playersByTid",
				undraftedTID,
			);
		} else if (
			g.get("phase") === PHASE.EXPANSION_DRAFT &&
			expansionDraft.phase === "draft"
		) {
			stats = bySport({
				basketball: ["per", "ewa"],
				football: ["gp", "keyStats", "av"],
				hockey: ["gp", "keyStats", "ops", "dps", "ps"],
			});
			undrafted = (
				await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
			).filter(p => expansionDraft.availablePids.includes(p.pid));

			if (expansionDraft.numPerTeam !== undefined) {
				// Keep logic in sync with runPicks.ts
				const tidsOverLimit: number[] = [];
				for (const [tidString, numPerTeam] of Object.entries(
					expansionDraft.numPerTeamDrafted,
				)) {
					if (numPerTeam >= expansionDraft.numPerTeam) {
						const tid = parseInt(tidString);
						tidsOverLimit.push(tid);
					}
				}

				if (tidsOverLimit.length > 0) {
					const numPlayersBefore = undrafted.length;
					undrafted = undrafted.filter(p => !tidsOverLimit.includes(p.tid));
					if (undrafted.length !== numPlayersBefore) {
						const teamInfoCache = g.get("teamInfoCache");
						const abbrevs = tidsOverLimit
							.map(tid => teamInfoCache[tid].abbrev)
							.sort();
						expansionDraftFilteredTeamsMessage = `Players from some teams (${abbrevs.join(
							", ",
						)}) are no longer available to be selected because they have already reached the limit of ${
							expansionDraft.numPerTeam
						} drafted player${expansionDraft.numPerTeam === 1 ? "" : "s"}.`;
					}
				}
			}
		} else {
			stats = [];
			undrafted = (
				await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
					[g.get("season")],
					[g.get("season"), Infinity],
				])
			).filter(p => p.tid === PLAYER.UNDRAFTED);

			// DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
			// This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
			for (const p of undrafted) {
				const season = p.ratings[0].season;

				if (season !== g.get("season") && g.get("phase") === PHASE.DRAFT) {
					console.log("FIXING MESSED UP DRAFT CLASS");
					console.log(season);
					p.ratings[0].season = g.get("season");
					await idb.cache.players.put(p);
				}
			}
		}

		undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
		undrafted = await idb.getCopies.playersPlus(undrafted, {
			attrs: [
				"pid",
				"name",
				"age",
				"injury",
				"contract",
				"watch",
				"abbrev",
				"tid",
				"valueFuzz",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});
		undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
		undrafted = undrafted.map((p, i) => ({
			...p,
			rank: i + 1,
		}));

		for (const dp of draftPicks) {
			drafted.push({
				draft: dp,
				pid: -1,
			});
		}

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

		return {
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoRatings: g.get("challengeNoRatings"),
			draftType: g.get("draftType"),
			drafted,
			expansionDraft: g.get("phase") === PHASE.EXPANSION_DRAFT,
			expansionDraftFilteredTeamsMessage,
			fantasyDraft,
			spectator: g.get("spectator"),
			stats,
			undrafted,
			userPlayers,
			userTids: g.get("userTids"),
		};
	}
};

export default updateDraft;
