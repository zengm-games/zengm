import { PHASE } from "../../common";
import type {
	DraftPickSeason,
	EventBBGM,
	Player,
	TradeEventTeams,
} from "../../common/types";
import { idb, iterate } from "../db";
import g from "./g";
import getTeamInfoBySeason from "./getTeamInfoBySeason";
import helpers from "./helpers";

type PlayerAsset = {
	pid: number;
	name: string;
};
type PickAsset = {
	dpid: number;
	season: DraftPickSeason;
	round: number;
	originalTid: number;
};

export const assetIsPlayer = (
	asset: PlayerAsset | PickAsset,
): asset is PlayerAsset => {
	// https://github.com/microsoft/TypeScript/issues/21732
	return (asset as any).pid !== undefined;
};

export const getPlayerFromPick = async (dp: PickAsset) => {
	let p: Player | undefined;

	if (
		typeof dp.season === "number" &&
		(dp.season < g.get("season") ||
			(dp.season === g.get("season") && g.get("phase") >= PHASE.DRAFT))
	) {
		await iterate(
			idb.league.transaction("players").store.index("draft.year, retiredYear"),
			IDBKeyRange.bound([dp.season], [dp.season, Infinity]),
			"prev",
			(p2, shortCircuit) => {
				if (p2.draft.dpid === dp.dpid) {
					p = p2;
					shortCircuit();
				}
			},
		);
	}

	return p;
};

const formatPick = async (
	dp: PickAsset,
	tidTradedAway: number,
	tradeSeason: number,
) => {
	const details = [];

	// Show abbrev only if it's another team's pick
	if (tidTradedAway !== dp.originalTid) {
		const season = typeof dp.season === "number" ? dp.season : tradeSeason;
		const teamInfo = await getTeamInfoBySeason(dp.originalTid, season);
		if (teamInfo) {
			const pickAbbrev = teamInfo.abbrev;
			details.push(
				`<a href="${helpers.leagueUrl([
					"roster",
					`${pickAbbrev}_${dp.originalTid}`,
					season,
				])}">${pickAbbrev}</a>`,
			);
		} else {
			details.push("???");
		}
	}

	// Has the draft already happened? If so, fill in the player
	const p = await getPlayerFromPick(dp);
	if (p) {
		details.push(
			`became <a href="${helpers.leagueUrl(["player", p.pid])}">${
				p.firstName
			} ${p.lastName}</a>`,
		);
	}

	let seasonDescription;
	if (dp.season === "fantasy") {
		seasonDescription = `${tradeSeason} fantasy draft`;
	} else if (dp.season === "expansion") {
		seasonDescription = `${tradeSeason} expansion draft`;
	} else {
		seasonDescription = dp.season;
	}
	return `a ${seasonDescription} ${helpers.ordinal(dp.round)} round pick${
		details.length > 0 ? ` (${details.join(", ")})` : ""
	}`;
};

const formatAssets = async (
	assets: TradeEventTeams[number]["assets"],
	tidTradedAway: number,
	tradeSeason: number,
) => {
	const strings: string[] = [];
	for (const asset of assets) {
		if (assetIsPlayer(asset)) {
			strings.push(
				`<a href="${helpers.leagueUrl(["player", asset.pid])}">${
					asset.name
				}</a>`,
			);
		} else {
			strings.push(await formatPick(asset, tidTradedAway, tradeSeason));
		}
	}

	return strings;
};

const formatEventText = async (event: EventBBGM) => {
	if (event.type === "trade" && event.teams) {
		let text = "";

		// assets is indexed on the receiving teams, so swap indexes when making text about the former teams
		const tids = [...event.tids].reverse();

		for (let i = 0; i < 2; i++) {
			const tid = tids[i];
			const teamInfo = await getTeamInfoBySeason(tid, event.season);
			const assets = event.teams[i].assets;
			const teamName = teamInfo
				? `<a href="${helpers.leagueUrl([
						"roster",
						`${teamInfo.abbrev}_${tid}`,
						event.season,
				  ])}">${teamInfo.name}</a>`
				: "???";

			if (text === "") {
				text += `The ${teamName} traded `;
			} else {
				text += ` to the ${teamName} for `;
			}

			const strings = await formatAssets(assets, tid, event.season);
			if (strings.length === 0) {
				text += "nothing";
			} else if (strings.length === 1) {
				text += strings[0];
			} else if (strings.length === 2) {
				text += `${strings[0]} and ${strings[1]}`;
			} else {
				text += strings[0];

				for (let i = 1; i < strings.length; i++) {
					if (i === strings.length - 1) {
						text += `, and ${strings[i]}`;
					} else {
						text += `, ${strings[i]}`;
					}
				}
			}
		}

		text += `. <a href="${helpers.leagueUrl([
			"trade_summary",
			event.eid,
		])}">(Details)</a>`;

		return text;
	}

	if (event.text) {
		return helpers.correctLinkLid(g.get("lid"), event.text);
	}

	return "";
};

export default formatEventText;
