import { PHASE } from "../../common";
import type { DraftPick, EventBBGM } from "../../common/types";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";

type PlayerAsset = {
	pid: number;
	tid: number;
	name: string;
};
const assetIsPlayer = (
	asset: PlayerAsset | DraftPick,
): asset is PlayerAsset => {
	// https://github.com/microsoft/TypeScript/issues/21732
	return (asset as any).pid !== undefined;
};

const formatPick = async (dp: DraftPick, season: number) => {
	// Has the draft already happened? If so, fill in the player
	let playerInfo = "";
	if (
		season < g.get("season") ||
		(season === g.get("season") && g.get("phase") >= PHASE.DRAFT)
	) {
		const draftClass = await idb.getCopies.players({
			draftYear: season,
		});
		for (const p of draftClass) {
			if (p.draft.dpid === dp.dpid) {
				playerInfo = `, became <a href="${helpers.leagueUrl([
					"player",
					p.pid,
				])}">${p.firstName} ${p.lastName}</a>`;
				break;
			}
		}
	}

	const pickAbbrev = g.get("teamInfoCache")[dp.originalTid]?.abbrev;

	return `a ${dp.season} ${helpers.ordinal(
		dp.round,
	)} round pick (<a href="${helpers.leagueUrl([
		"roster",
		`${pickAbbrev}_${dp.originalTid}`,
		season,
	])}">${pickAbbrev}</a>${playerInfo})`;
};

const formatEventText = async (event: EventBBGM) => {
	if (event.type === "trade" && event.assets) {
		let text = "";

		for (const [tidString, assets] of Object.entries(event.assets)) {
			const tid = parseInt(tidString);

			const teamName = `<a href="${helpers.leagueUrl([
				"roster",
				`${g.get("teamInfoCache")[tid]?.abbrev}_${tid}`,
				event.season,
			])}">${g.get("teamInfoCache")[tid]?.name}</a>`;

			if (text === "") {
				text += `The ${teamName} traded `;
			} else {
				text += ` to the ${teamName} for `;
			}

			const strings: string[] = [];
			for (const asset of assets) {
				if (assetIsPlayer(asset)) {
					strings.push(
						`<a href="${helpers.leagueUrl(["player", asset.pid])}">${
							asset.name
						}</a>`,
					);
				} else {
					strings.push(await formatPick(asset, event.season));
				}
			}

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

		text += ".";
		return text;
	}

	if (event.text) {
		return helpers.correctLinkLid(g.get("lid"), event.text);
	}

	return "";
};

export default formatEventText;
