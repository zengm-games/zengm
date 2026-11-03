import { idb } from "../db/index.ts";
import type { EventBBGM } from "../../common/types.ts";
import { formatEventText } from "../util/formatEventText.ts";
import { defineView } from "../util/defineView.ts";
import { getWatchPids } from "./news.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { g } from "../util/index.ts";
import { validateTeam } from "../util/processInputs.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"transactions">) => {
	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else if (params.season && params.season === "all") {
		season = "all";
	} else {
		season = g.get("season");
	}

	return {
		team: validateTeam(params.team, ["all", "watch"]),
		season,
		eventType: params.eventType ?? "all",
	};
};

export default defineView({
	id: "transactions",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.size >= 1 ||
			inputs.season !== prevInputs?.season ||
			inputs.team !== prevInputs?.team ||
			inputs.eventType !== prevInputs?.eventType
		) {
			const watchPids =
				inputs.team === "watch" ? await getWatchPids() : undefined;

			const filter = (event: EventBBGM) => {
				if (
					typeof inputs.team === "number" &&
					!event.tids?.includes(inputs.team)
				) {
					return false;
				}

				if (
					watchPids !== undefined &&
					!event.pids?.some((pid) => watchPids.has(pid))
				) {
					return false;
				}

				if (inputs.eventType === "all") {
					return (
						event.type === "reSigned" ||
						event.type === "release" ||
						event.type === "trade" ||
						event.type === "freeAgent" ||
						event.type === "draft"
					);
				}

				return event.type === inputs.eventType;
			};

			const events = await idb.merged.events.getAll(
				inputs.season === "all" ? undefined : { season: inputs.season },
				{ filter },
			);

			events.reverse(); // Newest first

			const events2 = [];
			for (const event of events) {
				events2.push({
					eid: event.eid,
					type: event.type,
					text: await formatEventText(event),
					pids: event.pids,
					tids: event.tids,
					season: event.season,
					score: event.score,
				});
			}

			return {
				events: events2,
				season: inputs.season,
				eventType: inputs.eventType,
				team: inputs.team,
			};
		}
	},
});
