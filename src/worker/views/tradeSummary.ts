import type {
	PlayerContract,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import { idb } from "../db";
import { getTeamInfoBySeason } from "../util";
import { assetIsPlayer } from "../util/formatEventText";

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
		if (!event || event.type !== "trade" || !event.teams) {
			return {
				eid,
			};
		}

		const teams = [];

		const tids = [...event.tids];

		for (let i = 0; i < tids.length; i++) {
			const tid = tids[i];
			const otherTid = tids[i === 0 ? 1 : 0];
			const teamInfo = await getTeamInfoBySeason(tid, event.season);
			if (!teamInfo) {
				throw new Error("teamInfo not found");
			}
			const assets: (
				| {
						type: "player";
						pid: number;
						name: string;
						contract: PlayerContract;
				  }
				| {
						type: "deletedPlayer";
						pid: number;
						name: string;
						contract: PlayerContract;
				  }
				| {
						type: "realizedPick";
				  }
				| {
						type: "unrealizedPick";
				  }
			)[] = [];

			for (const asset of event.teams[i].assets) {
				if (assetIsPlayer(asset)) {
					const p = await idb.getCopy.players({ pid: asset.pid });
					if (p) {
						assets.push({
							type: "player",
							pid: asset.pid,
							name: `${p.firstName} ${p.lastName}`,
							contract: asset.contract,
						});
					} else {
						assets.push({
							type: "deletedPlayer",
							pid: asset.pid,
							name: asset.name,
							contract: asset.contract,
						});
					}
				} else {
					// Has the pick been made yet or not?
				}
			}

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
