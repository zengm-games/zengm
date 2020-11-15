import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { getTeamInfoBySeason } from "../util";
import { formatAssets } from "../util/formatEventText";

const updateTradeSummary = async (
	{ eid }: ViewInput<"tradeSummary">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		eid !== state.eid
	) {
		const event = await idb.getCopy.events({ eid });
		if (!event || event.type !== "trade" || !event.assets) {
			return {
				eid,
			};
		}

		const teams = [];

		const tids = Object.keys(event.assets)
			.reverse()
			.map(tid => parseInt(tid));

		for (let i = 0; i < tids.length; i++) {
			const tid = tids[i];
			const otherTid = tids[i === 0 ? 1 : 0];
			const teamInfo = await getTeamInfoBySeason(tid, event.season);
			if (!teamInfo) {
				throw new Error("teamInfo not found");
			}
			const assets = await formatAssets(
				event.assets[tid],
				otherTid,
				event.season,
			);
			teams.push({
				abbrev: teamInfo.abbrev,
				region: teamInfo.region,
				name: teamInfo.name,
				tid,
				assets,
			});
		}

		console.log("event", event);

		return {
			eid,
			teams,
			season: event.season,
			phase: event.phase,
		};
	}
};

export default updateTradeSummary;
