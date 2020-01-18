import { PLAYER } from "../../common";
import { finances, player } from "../core";
import { idb } from "../db";
import { face, g } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const updateCustomizePlayer = async (
	inputs: ViewInput<"customizePlayer">,
	updateEvents: UpdateEvents,
) => {
	if (!g.get("godMode")) {
		return {
			godMode: g.get("godMode"),
		};
	}

	if (updateEvents.includes("firstRun")) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "region", "name"],
		});

		for (const t of teams) {
			t.text = `${t.region} ${t.name}`;
		}

		teams.unshift({
			tid: PLAYER.RETIRED,
			text: "Retired",
		});
		teams.unshift({
			tid: PLAYER.UNDRAFTED,
			text: "Draft Prospect",
		});
		teams.unshift({
			tid: PLAYER.FREE_AGENT,
			text: "Free Agent",
		});
		let appearanceOption;
		let originalTid;
		let p;

		if (inputs.pid === null) {
			// Generate new player as basis
			const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
				"teamSeasonsByTidSeason",
				[
					[g.get("userTid"), g.get("season") - 2],
					[g.get("userTid"), g.get("season")],
				],
			);
			const scoutingRank = finances.getRankLastThree(
				teamSeasons,
				"expenses",
				"scouting",
			);
			p = player.generate(
				PLAYER.FREE_AGENT,
				20,
				g.get("season"),
				false,
				scoutingRank,
			);
			appearanceOption = "Cartoon Face";
			p.imgURL = "http://";
		} else if (typeof inputs.pid === "number") {
			// Load a player to edit
			p = await idb.getCopy.players({
				pid: inputs.pid,
			});

			if (!p) {
				return {
					errorMessage: "Player not found.",
				};
			}

			await face.upgrade(p);

			if (p.imgURL.length > 0) {
				appearanceOption = "Image URL";
			} else {
				appearanceOption = "Cartoon Face";
				p.imgURL = "http://";
			}

			originalTid = p.tid;
		}

		return {
			appearanceOption,
			godMode: g.get("godMode"),
			minContract: g.get("minContract"),
			originalTid,
			p,
			phase: g.get("phase"),
			season: g.get("season"),
			teams,
		};
	}
};

export default updateCustomizePlayer;
