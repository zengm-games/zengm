import { idb } from "../db/index.ts";
import { formatEventText } from "../util/formatEventText.ts";
import { defineView } from "../util/defineView.ts";
import { getWatchPids } from "./news.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { g } from "../util/index.ts";
import { validateAbbrev } from "../util/processInputs.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"transactions">) => {
	let abbrev;
	let tid: number | undefined;
	const [validatedTid, validatedAbbrev] = validateAbbrev(params.abbrev, true);
	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
		tid = validatedTid;
	} else if (params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	let season: number | "all";

	if (params.season && params.season !== "all") {
		season = validateSeason(params.season);
	} else if (params.season && params.season === "all") {
		season = "all";
	} else {
		season = g.get("season");
	}

	return {
		tid,
		abbrev,
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
			inputs.abbrev !== prevInputs?.abbrev ||
			inputs.eventType !== prevInputs?.eventType
		) {
			let events;

			if (inputs.season === "all") {
				events = await idb.getCopies.events(undefined, "noCopyCache");
			} else {
				events = await idb.getCopies.events(
					{
						season: inputs.season,
					},
					"noCopyCache",
				);
			}

			events.reverse(); // Newest first

			if (inputs.abbrev !== "all") {
				const watchPids =
					inputs.abbrev === "watch" ? await getWatchPids() : undefined;
				events = events.filter(
					(event) =>
						(inputs.tid === undefined || event.tids?.includes(inputs.tid)) &&
						(!watchPids || event.pids?.some((pid) => watchPids.has(pid))),
				);
			}

			if (inputs.eventType === "all") {
				events = events.filter(
					(event) =>
						event.type === "reSigned" ||
						event.type === "release" ||
						event.type === "trade" ||
						event.type === "freeAgent" ||
						event.type === "draft",
				);
			} else {
				events = events.filter((event) => event.type === inputs.eventType);
			}

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
				abbrev: inputs.abbrev,
				events: events2,
				season: inputs.season,
				eventType: inputs.eventType,
				tid: inputs.tid,
			};
		}
	},
});
