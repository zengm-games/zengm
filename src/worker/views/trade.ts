import orderBy from "lodash/orderBy";
import { PHASE } from "../../common";
import { team, trade } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util"; // This relies on vars being populated, so it can't be called in parallel with updateTrade
import type { TradeTeams } from "../../common/types";

const getSummary = async (teams: TradeTeams) => {
	const summary = await trade.summary(teams);
	const summary2 = {
		enablePropose:
			!summary.warning &&
			(teams[0].pids.length > 0 ||
				teams[0].dpids.length > 0 ||
				teams[1].pids.length > 0 ||
				teams[1].dpids.length > 0),
		warning: summary.warning,
		teams: [0, 1].map(i => {
			return {
				name: summary.teams[i].name,
				payrollAfterTrade: summary.teams[i].payrollAfterTrade,
				total: summary.teams[i].total,
				trade: summary.teams[i].trade,
				picks: summary.teams[i].picks,
				other: i === 0 ? 1 : 0, // Index of other team
			};
		}),
	};
	return summary2;
};

// Validate that the stored player IDs correspond with the active team ID
const validateTeams = async () => {
	const { teams } = await trade.get();

	if (teams[0].tid !== g.get("userTid")) {
		teams[0] = {
			tid: g.get("userTid"),
			pids: [],
			pidsExcluded: [],
			dpids: [],
			dpidsExcluded: [],
		};
	}

	const allTeams = await idb.cache.teams.getAll();
	const t1 = allTeams.find(t => t.tid === teams[1].tid);
	if (!t1 || teams[1].tid === g.get("userTid") || t1.disabled) {
		// Invalid trading partner
		const newT1 = allTeams.find(t => t.tid !== g.get("userTid") && !t.disabled);
		if (newT1) {
			teams[1] = {
				tid: newT1.tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			};
		}
	}

	// This is just for debugging
	team
		.valueChange(
			teams[1].tid,
			teams[0].pids,
			teams[1].pids,
			teams[0].dpids,
			teams[1].dpids,
			undefined,
			g.get("userTid"),
		)
		.then(dv => {
			console.log(dv);
		});

	return trade.updatePlayers(teams);
};

const updateTrade = async () => {
	const teams = await validateTeams();
	const userRosterAll = await idb.cache.players.indexGetAll(
		"playersByTid",
		g.get("userTid"),
	);
	const userPicks = await idb.getCopies.draftPicks({
		tid: g.get("userTid"),
	});
	const attrs = [
		"pid",
		"name",
		"age",
		"contract",
		"injury",
		"watch",
		"untradable",
		"jerseyNumber",
	];
	const ratings = ["ovr", "pot", "skills", "pos"];
	const stats =
		process.env.SPORT === "basketball"
			? ["gp", "min", "pts", "trb", "ast", "per"]
			: ["gp", "keyStats", "av"];
	const userRoster = await idb.getCopies.playersPlus(userRosterAll, {
		attrs,
		ratings,
		stats,
		season: g.get("season"),
		tid: g.get("userTid"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});

	for (const p of userRoster) {
		p.included = teams[0].pids.includes(p.pid);
		p.excluded = teams[0].pidsExcluded.includes(p.pid);
	}

	const userPicks2 = userPicks.map(dp => {
		return {
			...dp,
			desc: helpers.pickDesc(dp),
			included: teams[0].dpids.includes(dp.dpid),
			excluded: teams[0].dpidsExcluded.includes(dp.dpid),
		};
	});

	const otherTid = teams[1].tid;
	const otherRosterAll = await idb.cache.players.indexGetAll(
		"playersByTid",
		otherTid,
	);
	const otherPicks = await idb.getCopies.draftPicks({
		tid: otherTid,
	});
	const t = await idb.getCopy.teamsPlus({
		tid: otherTid,
		season: g.get("season"),
		attrs: ["strategy"],
		seasonAttrs: ["won", "lost", "tied"],
		addDummySeason: true,
	});

	if (t === undefined) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: `Invalid team ID "${otherTid}".`,
		};
		return returnValue;
	}

	const otherRoster = await idb.getCopies.playersPlus(otherRosterAll, {
		attrs,
		ratings,
		stats,
		season: g.get("season"),
		tid: otherTid,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});

	for (const p of otherRoster) {
		p.included = teams[1].pids.includes(p.pid);
		p.excluded = teams[1].pidsExcluded.includes(p.pid);
	}

	const otherPicks2 = otherPicks.map(dp => {
		return {
			...dp,
			desc: helpers.pickDesc(dp),
			included: teams[1].dpids.includes(dp.dpid),
			excluded: teams[1].dpidsExcluded.includes(dp.dpid),
		};
	});

	const summary = await getSummary(teams); // Always run this, for multi team mode

	let teams2: {
		name: string;
		region: string;
		tid: number;
	}[] = (await idb.cache.teams.getAll())
		.filter(t => !t.disabled && t.tid !== g.get("userTid"))
		.map(t => ({
			name: t.name,
			region: t.region,
			tid: t.tid,
		}));

	teams2 = orderBy(teams2, ["region", "name", "tid"]);

	const userTeamName = `${g.get("teamInfoCache")[g.get("userTid")]?.region} ${
		g.get("teamInfoCache")[g.get("userTid")]?.name
	}`;

	// If the season is over, can't trade players whose contracts are expired
	const showResigningMsg =
		g.get("phase") > PHASE.PLAYOFFS && g.get("phase") < PHASE.FREE_AGENCY;

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		challengeNoTrades: g.get("challengeNoTrades"),
		salaryCap: g.get("salaryCap") / 1000,
		userDpids: teams[0].dpids,
		userDpidsExcluded: teams[0].dpidsExcluded,
		userPicks: userPicks2,
		userPids: teams[0].pids,
		userPidsExcluded: teams[0].pidsExcluded,
		userRoster,
		otherDpids: teams[1].dpids,
		otherDpidsExcluded: teams[1].dpidsExcluded,
		otherPicks: otherPicks2,
		otherPids: teams[1].pids,
		otherPidsExcluded: teams[1].pidsExcluded,
		otherRoster,
		otherTid,
		stats,
		strategy: t.strategy,
		summary,
		won: t.seasonAttrs.won,
		lost: t.seasonAttrs.lost,
		showResigningMsg,
		teams: teams2,
		tied: t.seasonAttrs.tied,
		userTeamName,
		gameOver: g.get("gameOver"),
		godMode: g.get("godMode"),
		forceTrade: false,
		numDraftRounds: g.get("numDraftRounds"),
		phase: g.get("phase"),
		userTid: g.get("userTid"),
		spectator: g.get("spectator"),
		multiTeamMode: g.get("userTids").length > 1,
	};
};

export default updateTrade;
