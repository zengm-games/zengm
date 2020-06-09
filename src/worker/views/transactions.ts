import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput, EventBBGM } from "../../common/types";

export const fixSigningEvents = (events: EventBBGM[]) => {
	return Promise.all(
		events.map(async event => {
			if (
				(event.type === "reSigned" || event.type === "freeAgent") &&
				event.tids
			) {
				const tid = event.tids[0];
				if (tid >= 0) {
					const t = await idb.getCopy.teamsPlus({
						seasonAttrs: ["abbrev", "region", "name"],
						season: event.season,
						tid,
					});

					if (t) {
						const text = `The <a href="${helpers.leagueUrl([
							"roster",
							`${t.seasonAttrs.abbrev}_${tid}`,
							event.season,
						])}">${t.seasonAttrs.region} ${
							t.seasonAttrs.name
						}</a> ${event.text.charAt(0).toLowerCase()}${event.text.slice(1)}`;

						return {
							...event,
							text,
						};
					}
				}
			}

			return event;
		}),
	);
};

const updateEventLog = async (
	inputs: ViewInput<"transactions">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.length >= 0 ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev ||
		inputs.eventType !== state.eventType
	) {
		let events;

		if (inputs.season === "all") {
			events = await idb.getCopies.events();
		} else {
			events = await idb.getCopies.events({
				season: inputs.season,
			});
		}

		events.reverse(); // Newest first

		if (inputs.abbrev !== "all") {
			events = events.filter(
				event => event.tids !== undefined && event.tids.includes(inputs.tid),
			);
		}

		if (inputs.eventType === "all") {
			events = events.filter(
				event =>
					event.type === "reSigned" ||
					event.type === "release" ||
					event.type === "trade" ||
					event.type === "freeAgent" ||
					event.type === "draft",
			);
		} else {
			events = events.filter(event => event.type === inputs.eventType);
		}

		events = await fixSigningEvents(events);

		events.forEach(helpers.correctLinkLid.bind(null, g.get("lid")));

		return {
			abbrev: inputs.abbrev,
			events,
			season: inputs.season,
			eventType: inputs.eventType,
			tid: inputs.tid,
		};
	}
};

export default updateEventLog;
