import { PHASE, PLAYER } from "../../common";
import { freeAgents } from "../core";
import { idb } from "../db";
import { face, g, getTeamColors, helpers, overrides } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayer = async (
	inputs: ViewInput<"player">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.retired ||
		state.pid !== inputs.pid
	) {
		if (inputs.pid === undefined) {
			return {
				errorMessage: "Player not found.",
			};
		}

		const ratings = overrides.common.constants.RATINGS;
		const statTables = Object.values(
			overrides.common.constants.PLAYER_STATS_TABLES,
		);
		let stats = Array.from(
			new Set(
				statTables.reduce<string[]>((allStats, currentStats) => {
					return allStats.concat(currentStats.stats);
				}, []),
			),
		);

		// Needed because shot locations tables are "special" for now, unfortunately
		if (process.env.SPORT === "basketball") {
			stats = stats.concat([
				"fgAtRim",
				"fgaAtRim",
				"fgpAtRim",
				"fgLowPost",
				"fgaLowPost",
				"fgpLowPost",
				"fgMidRange",
				"fgaMidRange",
				"fgpMidRange",
				"tp",
				"tpa",
				"tpp",
			]);
		}

		let p = await idb.getCopy.players({
			pid: inputs.pid,
		});

		if (!p) {
			return {
				errorMessage: "Player not found.",
			};
		}

		await face.upgrade(p);
		p = await idb.getCopy.playersPlus(p, {
			attrs: [
				"pid",
				"name",
				"tid",
				"abbrev",
				"teamRegion",
				"teamName",
				"age",
				"hgtFt",
				"hgtIn",
				"weight",
				"born",
				"diedYear",
				"contract",
				"draft",
				"face",
				"mood",
				"injury",
				"injuries",
				"salaries",
				"salariesTotal",
				"awardsGrouped",
				"freeAgentMood",
				"imgURL",
				"watch",
				"college",
				"relatives",
				"untradable",
			],
			ratings: [
				"season",
				"abbrev",
				"age",
				"ovr",
				"pot",
				...ratings,
				"skills",
				"pos",
				"injuryIndex",
			],
			stats: ["season", "tid", "abbrev", "age", ...stats],
			playoffs: true,
			showRookies: true,
			fuzz: true,
		});

		if (!p) {
			return {
				errorMessage: "Player not found.",
			};
		}

		// Account for extra free agent demands
		if (p.tid === PLAYER.FREE_AGENT) {
			p.contract.amount = freeAgents.amountWithMood(
				p.contract.amount,
				p.freeAgentMood[g.get("userTid")],
			);
		}

		const teamColors = await getTeamColors(p.tid);
		let events = await idb.getCopies.events({
			pid: inputs.pid,
		});
		const feats = events
			.filter(event => event.type === "playerFeat")
			.map(event => {
				return {
					eid: event.eid,
					season: event.season,
					text: event.text,
				};
			});
		events = events
			.filter(event => {
				// undefined is a temporary workaround for bug from commit 999b9342d9a3dc0e8f337696e0e6e664e7b496a4
				return !(
					event.type === "award" ||
					event.type === "injured" ||
					event.type === "healed" ||
					event.type === "hallOfFame" ||
					event.type === "playerFeat" ||
					event.type === "tragedy" ||
					event.type === undefined
				);
			})
			.map(event => {
				return {
					eid: event.eid,
					season: event.season,
					text: event.text,
				};
			});
		events.forEach(helpers.correctLinkLid.bind(null, g.get("lid")));
		feats.forEach(helpers.correctLinkLid.bind(null, g.get("lid")));
		const willingToSign = !helpers.refuseToNegotiate(
			p.contract.amount * 1000,
			p.freeAgentMood[g.get("userTid")],
			g.get("playersRefuseToNegotiate"),
			g.get("phase") === PHASE.RESIGN_PLAYERS
				? p.draft.year === g.get("season")
				: false,
		);
		return {
			player: p,
			showTradeFor: p.tid !== g.get("userTid") && p.tid >= 0,
			freeAgent: p.tid === PLAYER.FREE_AGENT,
			retired: p.tid === PLAYER.RETIRED,
			showContract:
				p.tid !== PLAYER.UNDRAFTED &&
				p.tid !== PLAYER.UNDRAFTED_FANTASY_TEMP &&
				p.tid !== PLAYER.RETIRED,
			injured: p.injury.type !== "Healthy",
			godMode: g.get("godMode"),
			events,
			feats,
			ratings,
			statTables,
			teamColors,
			willingToSign,
		};
	}
};

export default updatePlayer;
