import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import { bySport } from "../../common/sportFunctions.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { extraStats } from "./hallOfFame.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";
import { defineView } from "../util/defineView.ts";
import { player } from "../core/index.ts";

export default defineView({
	id: "tragicDeaths",
	load: async ({ updateEvents }) => {
		// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
		if (updateEvents.has("firstRun")) {
			const events = await idb.merged.events.getAll(undefined, {
				filter: (event) => event.type === "tragedy",
			});
			const eventsByPid = new Map<number, (typeof events)[number]>();

			for (const event of events) {
				// if would not be necessary if EventBBGM was typed better!
				if (event.pids) {
					for (const pid of event.pids) {
						eventsByPid.set(pid, event);
					}
				}
			}
			const pids = Array.from(eventsByPid.keys());

			const stats = bySport({
				baseball: ["gp", "keyStats", "war"],
				basketball: [
					"gp",
					"min",
					"pts",
					"trb",
					"ast",
					"per",
					"ewa",
					"ws",
					"ws48",
				],
				football: ["keyStats", "av"],
				hockey: ["keyStats", "ops", "dps", "ps"],
			} as const);
			const formatOptions = {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"draft",
					"diedYear",
					"ageAtDeath",
					"statsTids",
					"hof",
				],
				ratings: ["season", "ovr", "pos"],
				stats: ["season", "abbrev", "tid", ...stats, ...extraStats],
				fuzz: true,
			} as const;
			const abbrevs = await player.loadAbbrevs(formatOptions);
			const formatPlayer = player.createFormatter(formatOptions, abbrevs);

			const players = (
				await idb.merged.players.getAll({ pids }, { map: formatPlayer })
			).filter((p) => p !== undefined);

			const players2 = addFirstNameShort(processPlayersHallOfFame(players)).map(
				(p) => {
					const event = eventsByPid.get(p.pid);
					const details =
						event?.text !== undefined
							? helpers.correctLinkLid(g.get("lid"), event.text)
							: "";
					return {
						...p,
						details,
					};
				},
			);

			return {
				players: players2,
				stats,
			};
		}
	},
});
