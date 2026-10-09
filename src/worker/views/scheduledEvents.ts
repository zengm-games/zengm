import { last } from "../../common/utils.ts";
import { sortScheduledEvents } from "../../common/scheduledEvents.ts";
import { getScheduledEventsCurrent } from "../api/scheduledEvents.ts";
import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";
import { g } from "../util/index.ts";
import { getInitialSettings } from "./settings.ts";

export default defineView({
	id: "scheduledEvents",
	load: async ({ updateEvents }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("newPhase") ||
			updateEvents.has("scheduledEvents") ||
			updateEvents.has("gameAttributes") ||
			updateEvents.has("team")
		) {
			const scheduledEvents = sortScheduledEvents(
				await idb.getCopies.scheduledEvents(undefined, "noCopyCache"),
			);

			const augmented = [];
			for (const event of scheduledEvents) {
				if (event.type === "unretirePlayer") {
					const p = await idb.getCopy.players(
						{ pid: event.info.pid },
						"noCopyCache",
					);
					if (p) {
						augmented.push({
							...event,
							info: {
								pid: event.info.pid,
								name: `${p.firstName} ${p.lastName}`,
								skills: last(p.ratings).skills,
							},
						});
					}
				} else {
					augmented.push(event);
				}
			}

			const teams = (await idb.cache.teams.getAll()).map((t) => ({
				tid: t.tid,
				disabled: t.disabled,
				abbrev: t.abbrev,
				colors: t.colors,
				did: t.did,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				jersey: t.jersey,
				name: t.name,
				pop: t.pop,
				region: t.region,
				stadiumCapacity: t.stadiumCapacity,
			}));

			return {
				confs: g.get("confs"),
				current: getScheduledEventsCurrent(),
				defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
				divs: g.get("divs"),
				initialSettings: getInitialSettings(),
				scheduledEvents: augmented,
				teams,
			};
		}
	},
});
