import { PHASE } from "../../../common";
import { player, league, team } from "..";
import getRookieSalaries from "./getRookieSalaries";
import { idb } from "../../db";
import { g, helpers, local, logEvent } from "../../util";
import type { DraftPick } from "../../../common/types";
import getRookieContractLength from "./getRookieContractLength";

/**
 * Select a player for the current drafting team.
 *
 * This can be called in response to the user clicking the "draft" button for a player, or by some other function like untilUserOrEnd.
 *
 * @memberOf core.draft
 * @param {object} dp Pick object, like from getOrder, that contains information like the team, round, etc.
 * @param {number} pid Integer player ID for the player to be drafted.
 * @return {Promise}
 */
const selectPlayer = async (dp: DraftPick, pid: number) => {
	if (dp.pick <= 0) {
		console.log(dp);
		throw new Error(`Invalid draft pick number "${dp.pick}"`);
	}

	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("Invalid pid");
	}
	const prevTid = p.tid;
	p.tid = dp.tid;

	const expansionDraft = g.get("expansionDraft");

	const fantasyOrExpansionDraft =
		g.get("phase") === PHASE.FANTASY_DRAFT || expansionDraft.phase === "draft";

	if (fantasyOrExpansionDraft) {
		const fakeP = {
			...helpers.deepCopy(p),

			// These are only used for expansion draft UI, not fantasy draft
			prevTid,
			prevAbbrev: g.get("teamInfoCache")[prevTid]?.abbrev,
		};
		fakeP.draft = {
			round: dp.round,
			pick: dp.pick,
			tid: dp.tid,
			year: g.get("season"),
			originalTid: dp.originalTid,
			pot: p.ratings.at(-1).pot,
			ovr: p.ratings.at(-1).ovr,
			skills: p.ratings.at(-1).skills,
			dpid: dp.dpid,
		};
		local.fantasyDraftResults.push(fakeP);
	} else {
		p.draft = {
			round: dp.round,
			pick: dp.pick,
			tid: dp.tid,
			year: g.get("season"),
			originalTid: dp.originalTid,
			pot: p.ratings[0].pot,
			ovr: p.ratings[0].ovr,
			skills: p.ratings[0].skills,
			dpid: dp.dpid,
		};
	}

	// Contract
	if (!fantasyOrExpansionDraft) {
		if (g.get("hardCap")) {
			// Make it an expiring contract, so player immediately becomes a free agent
			player.setContract(
				p,
				{
					amount: g.get("minContract"),
					exp: g.get("season"),
				},
				true,
			);
		} else {
			const rookieSalaries = getRookieSalaries();
			const i = dp.pick - 1 + g.get("numActiveTeams") * (dp.round - 1);

			const years = getRookieContractLength(dp.round);

			player.setContract(
				p,
				{
					amount: rookieSalaries[i],
					exp: g.get("season") + years,
					rookie: true,
				},
				true,
			);
		}
	}

	// Add stats row if necessary (fantasy draft in ongoing season)
	const nextPhase = g.get("nextPhase");
	if (
		g.get("phase") === PHASE.FANTASY_DRAFT &&
		nextPhase !== undefined &&
		nextPhase <= PHASE.PLAYOFFS
	) {
		await player.addStatsRow(p, g.get("nextPhase") === PHASE.PLAYOFFS);
	}

	const pickNum =
		dp.pick +
		(dp.round - 1) *
			(g.get("phase") === PHASE.EXPANSION_DRAFT &&
			expansionDraft.phase === "draft"
				? expansionDraft.expansionTids.length
				: g.get("numActiveTeams"));
	const draftName =
		g.get("phase") === PHASE.FANTASY_DRAFT
			? `${g.get("season")} fantasy draft`
			: g.get("phase") === PHASE.EXPANSION_DRAFT
			? `${g.get("season")} expansion draft`
			: `<a href="${helpers.leagueUrl([
					"draft_history",
					g.get("season"),
			  ])}">${g.get("season")} draft</a>`;

	if (!p.transactions) {
		p.transactions = [];
	}
	p.transactions.push({
		season: g.get("season"),
		phase: g.get("phase"),
		tid: p.tid,
		type: "draft",
		pickNum,
	});

	await idb.cache.players.put(p);
	await idb.cache.draftPicks.delete(dp.dpid);

	let score = 0;
	if (pickNum === 1) {
		score = 20;
	} else if (pickNum <= 5) {
		score = 10;
	}

	const eventTids = [p.tid];

	if (
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "draft"
	) {
		const numDraftedByThisTeam =
			expansionDraft.numPerTeamDrafted?.[prevTid] !== undefined
				? expansionDraft.numPerTeamDrafted[prevTid] + 1
				: 1;

		await league.setGameAttributes({
			expansionDraft: {
				...expansionDraft,
				numPerTeamDrafted: {
					...expansionDraft.numPerTeamDrafted,
					[prevTid]: numDraftedByThisTeam,
				},
				availablePids: expansionDraft.availablePids.filter(
					pid2 => pid !== pid2,
				),
			},
		});

		eventTids.push(prevTid);
	}

	logEvent({
		type: "draft",
		text: `The <a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[dp.tid]?.abbrev}_${dp.tid}`,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[dp.tid]?.name
		}</a> selected <a href="${helpers.leagueUrl(["player", p.pid])}">${
			p.firstName
		} ${p.lastName}</a> with the ${helpers.ordinal(
			pickNum,
		)} pick in the ${draftName}.`,
		showNotification: false,
		pids: [p.pid],
		tids: eventTids,
		score,
	});

	if (g.get("userTids").includes(dp.tid)) {
		const t = await idb.cache.teams.get(dp.tid);
		const onlyNewPlayers = t ? !t.keepRosterSorted : false;
		await team.rosterAutoSort(dp.tid, onlyNewPlayers);
	}
};

export default selectPlayer;
