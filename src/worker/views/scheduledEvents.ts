import { last } from "../../common/utils.ts";
import { sortScheduledEvents } from "../../common/scheduledEvents.ts";
import { getScheduledEventsCurrent } from "../api/scheduledEvents.ts";
import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";
import { g } from "../util/index.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";
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
				await idb.merged.scheduledEvents.getAll(),
			);

			const augmented = [];
			for (const event of scheduledEvents) {
				if (event.type === "retirePlayer" || event.type === "unretirePlayer") {
					const p = await idb.merged.players.get(event.info.pid);
					if (p) {
						augmented.push({
							id: event.id,
							type: event.type,
							season: event.season,
							phase: event.phase,
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
				awards: g.get("awards"),
				confs: g.get("confs"),
				current: getScheduledEventsCurrent(),
				defaultStadiumCapacity: g.get("defaultStadiumCapacity"),
				divs: g.get("divs"),
				initialSettings: getInitialSettings(),
				numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"),

				// This is the current value. It could change before a scheduled event happens, but it is only used for the names of playoff rounds.
				playoffsByConf: await getPlayoffsByConf(g.get("season")),
				scheduledEvents: augmented,
				teams,
			};
		}
	},
});
