import { bySport } from "../../common/sportFunctions.ts";
import { player, team, trade } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { TradeSummary, TradeTeams } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";
import isUntradable from "../core/trade/isUntradable.ts";
import { ValueChangeCalculator } from "../core/team/ValueChangeCalculator.ts";
import { defineView } from "../util/defineView.ts";

const getSummaryTeam = (summary: TradeSummary, i: 0 | 1) => {
	return {
		name: summary.teams[i].name,
		ovrAfter: summary.teams[i].ovrAfter,
		ovrBefore: summary.teams[i].ovrBefore,
		payrollAfterTrade: summary.teams[i].payrollAfterTrade,
		total: summary.teams[i].total,
		trade: summary.teams[i].trade,
		picks: summary.teams[i].picks,
		other: i === 0 ? (1 as const) : (0 as const), // Index of other team
	};
};

// Stats shown for players in trades
export const TRADE_STATS = bySport({
	baseball: ["gp", "keyStats", "war"],
	basketball: ["gp", "min", "pts", "trb", "ast", "per"],
	football: ["gp", "keyStats", "av"],
	hockey: ["gp", "keyStats", "ops", "dps", "ps"],
} as const);

// This relies on vars being populated, so it can't be called in parallel with updateTrade
export const getSummary = async (teams: TradeTeams) => {
	const summary = await trade.summary(teams);
	const summary2 = {
		enablePropose:
			!summary.warning &&
			(teams[0].pids.length > 0 ||
				teams[0].dpids.length > 0 ||
				teams[1].pids.length > 0 ||
				teams[1].dpids.length > 0),
		warning: summary.warning,
		warningAmount: summary.warningAmount,
		teams: [getSummaryTeam(summary, 0), getSummaryTeam(summary, 1)] as const,
	};
	return summary2;
};

// Validate that the stored player IDs correspond with the active team ID
const validateTeams = async () => {
	const { teams } = helpers.deepCopy(await trade.get());

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
	const t1 = allTeams.find((t) => t.tid === teams[1].tid);
	if (!t1 || teams[1].tid === g.get("userTid") || t1.disabled) {
		// Invalid trading partner
		const newT1 = allTeams.find(
			(t) => t.tid !== g.get("userTid") && !t.disabled,
		);
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
	void new ValueChangeCalculator()
		.evaluate({
			tid: teams[1].tid,
			pidsAdd: teams[0].pids,
			pidsRemove: teams[1].pids,
			dpidsAdd: teams[0].dpids,
			dpidsRemove: teams[1].dpids,
			tradingPartnerTid: g.get("userTid"),
		})
		.then((dv) => {
			console.log(dv);
		});

	return trade.updatePlayers(teams);
};

export const augmentOffers = async (offers: TradeTeams[]) => {
	if (offers.length === 0) {
		return [];
	}

	const teams = await team.getFormattedAll({
		attrs: ["abbrev", "region", "name", "strategy", "tid"],
		seasonAttrs: ["won", "lost", "tied", "otl"],
		season: g.get("season"),
		addDummySeason: true,
	});
	const teamsByTid = groupByUnique(teams, "tid");

	// Take the pids and dpids in each offer and get the info needed to display the offer
	return Promise.all(
		offers.map(async (offerRaw) => {
			const tid = offerRaw[1].tid;
			const t = teamsByTid[tid];
			if (!t) {
				throw new Error("No team found");
			}

			const formatPicks = async (tid: number, dpids: number[]) => {
				let picks = await idb.merged.draftPicks.getAll({ tid });
				picks = picks.filter((dp) => dpids.includes(dp.dpid));

				return await Promise.all(
					picks.map(async (dp) => {
						return {
							...dp,
							desc: await helpers.pickDesc(dp, "short"),
						};
					}),
				);
			};

			const formatPlayers = async (tid: number, pids: number[]) => {
				let playersAll = await idb.cache.players.indexGetAll(
					"playersByTid",
					tid,
				);
				playersAll = playersAll.filter(
					(p) => pids.includes(p.pid) && !isUntradable(p).untradable,
				);
				return addFirstNameShort(
					await player.formatAll(playersAll, {
						attrs: [
							"pid",
							"firstName",
							"lastName",
							"age",
							"contract",
							"injury",
							"jerseyNumber",
							"draft",
						],
						ratings: ["ovr", "pot", "skills", "pos"],
						stats: TRADE_STATS,
						season: g.get("season"),
						tid,
						showNoStats: true,
						showRookies: true,
						fuzz: true,
					}),
				);
			};

			const payroll = await team.getPayroll(tid);
			return {
				tid,
				strategy: t.strategy,
				won: t.seasonAttrs.won,
				lost: t.seasonAttrs.lost,
				tied: t.seasonAttrs.tied,
				otl: t.seasonAttrs.otl,
				pids: offerRaw[1].pids,
				dpids: offerRaw[1].dpids,
				pidsUser: offerRaw[0].pids,
				dpidsUser: offerRaw[0].dpids,
				payroll,
				picks: await formatPicks(tid, offerRaw[1].dpids),
				players: await formatPlayers(tid, offerRaw[1].pids),
				picksUser: await formatPicks(g.get("userTid"), offerRaw[0].dpids),
				playersUser: await formatPlayers(g.get("userTid"), offerRaw[0].pids),
				summary: await getSummary(offerRaw),
			};
		}),
	);
};

export default defineView({
	id: "trade",
	load: async ({ updateEvents }) => {
		const teams = await validateTeams();
		const userRosterAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		const userPicks = await idb.merged.draftPicks.getAll({
			tid: g.get("userTid"),
		});
		const attrs = [
			"pid",
			"firstName",
			"lastName",
			"age",
			"contract",
			"draft",
			"injury",
			"watch",
			"untradable",
			"jerseyNumber",
		] as const;
		const ratings = ["ovr", "pot", "skills", "pos"] as const;
		const stats = TRADE_STATS;
		const userRoster = addFirstNameShort(
			await player.formatAll(userRosterAll, {
				attrs,
				ratings,
				stats,
				season: g.get("season"),
				tid: g.get("userTid"),
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);

		const userRosterWithIncluded = userRoster.map((p) => ({
			...p,
			included: teams[0].pids.includes(p.pid),
			excluded: teams[0].pidsExcluded.includes(p.pid),
		}));

		const userPicks2 = await Promise.all(
			userPicks.map(async (dp) => {
				return {
					...dp,
					desc: await helpers.pickDesc(dp, "short"),
					included: teams[0].dpids.includes(dp.dpid),
					excluded: teams[0].dpidsExcluded.includes(dp.dpid),
				};
			}),
		);

		const otherTid = teams[1].tid;
		const otherRosterAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			otherTid,
		);
		const otherPicks = await idb.merged.draftPicks.getAll({ tid: otherTid });
		const t = await team.getFormatted({
			tid: otherTid,
			season: g.get("season"),
			attrs: ["strategy"],
			seasonAttrs: ["won", "lost", "tied", "otl"],
			addDummySeason: true,
		});

		if (t === undefined) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: `Invalid team ID "${otherTid}".`,
			};
			return returnValue;
		}

		const otherRoster = addFirstNameShort(
			await player.formatAll(otherRosterAll, {
				attrs,
				ratings,
				stats,
				season: g.get("season"),
				tid: otherTid,
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);

		const otherRosterWithIncluded = otherRoster.map((p) => ({
			...p,
			included: teams[1].pids.includes(p.pid),
			excluded: teams[1].pidsExcluded.includes(p.pid),
		}));

		const otherPicks2 = await Promise.all(
			otherPicks.map(async (dp) => {
				return {
					...dp,
					desc: await helpers.pickDesc(dp, "short"),
					included: teams[1].dpids.includes(dp.dpid),
					excluded: teams[1].dpidsExcluded.includes(dp.dpid),
				};
			}),
		);

		const summary = await getSummary(teams); // Always run this, for multi team mode

		let teams2: {
			name: string;
			region: string;
			tid: number;
		}[] = (await idb.cache.teams.getAll())
			.filter((t) => !t.disabled && t.tid !== g.get("userTid"))
			.map((t) => ({
				name: t.name,
				region: t.region,
				tid: t.tid,
			}));

		teams2 = orderBy(teams2, ["region", "name", "tid"]);

		const userTeamName = `${
			g.get("teamInfoCache")[g.get("userTid")]?.region
		} ${g.get("teamInfoCache")[g.get("userTid")]?.name}`;

		return {
			userDpids: teams[0].dpids,
			userDpidsExcluded: teams[0].dpidsExcluded,
			userPicks: userPicks2,
			userPids: teams[0].pids,
			userPidsExcluded: teams[0].pidsExcluded,
			userRoster: userRosterWithIncluded,
			otherDpids: teams[1].dpids,
			otherDpidsExcluded: teams[1].dpidsExcluded,
			otherPicks: otherPicks2,
			otherPids: teams[1].pids,
			otherPidsExcluded: teams[1].pidsExcluded,
			otherRoster: otherRosterWithIncluded,
			otherTid,
			stats,
			strategy: t.strategy,
			summary,
			won: t.seasonAttrs.won,
			lost: t.seasonAttrs.lost,
			teams: teams2,
			tied: t.seasonAttrs.tied,
			otl: t.seasonAttrs.otl,
			userTeamName,
			forceTrade: false,
			numDraftRounds: g.get("numDraftRounds"),
			multiTeamMode: g.get("userTids").length > 1,
			resetMessage: updateEvents.has("undoTrade"),
		};
	},
});
