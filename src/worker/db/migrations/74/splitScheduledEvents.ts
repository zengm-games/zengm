import type {
	GameAttributesLeague,
	ScheduledEventWithoutKey,
} from "../../../../common/types.ts";
import { orderBy } from "../../../../common/utils.ts";

type ScheduledEventMaybeId = ScheduledEventWithoutKey & { id?: number };

/**
 * Before version 74, changes to confs, divs, and awards were in "gameAttributes" scheduled events along with any other settings. Now confs and divs are in a "confsDivs" event, and awards are in an "awards" event.
 *
 * A confsDivs event always has both confs and divs, but the old events could have only one of them. In that case the other one is whatever it would be at that time, which is why `confs` and `divs` (the current values in the league) are needed and why events are handled in the order they will be processed.
 *
 * `teams` is empty in the new confsDivs events, meaning no team changes division. That is what the old events did - teams were moved by "teamInfo" events with a did, which still work, so those are not changed.
 *
 * Only the events to save are returned, and events that don't need to change are not included. One part of each old event keeps its id, and the other parts have no id so they are new events that get processed after any existing event in the same season and phase. The confsDivs event is the one that keeps the id when there is one, because it has to stay in the same place relative to teamInfo events that move teams to new divisions.
 *
 * This is frozen in time, rather than using similar code from elsewhere, so future changes to scheduled events don't have to worry about this migration.
 */
export const splitScheduledEvents = ({
	confs: initialConfs,
	divs: initialDivs,
	events,
}: {
	confs: GameAttributesLeague["confs"] | undefined;
	divs: GameAttributesLeague["divs"] | undefined;
	events: ScheduledEventMaybeId[];
}): ScheduledEventMaybeId[] => {
	let confs = initialConfs;
	let divs = initialDivs;

	// Order that scheduled events are processed in
	const sorted = orderBy(events, [
		"season",
		"phase",
		(event) => (event.type === "expansionDraft" ? 1 : 0),
		(event) => event.id ?? Infinity,
	]);

	const output: ScheduledEventMaybeId[] = [];

	for (const { id, ...event } of sorted) {
		if (event.type !== "gameAttributes") {
			continue;
		}

		const { awards, confs: newConfs, divs: newDivs, ...otherInfo } = event.info;

		const hasConfsDivs = newConfs !== undefined || newDivs !== undefined;
		if (hasConfsDivs) {
			confs = newConfs ?? confs;
			divs = newDivs ?? divs;
		}

		// If one of these is somehow not known, leave it in the old format, which still works
		const splitConfsDivs =
			hasConfsDivs && confs !== undefined && divs !== undefined;

		if (awards === undefined && !splitConfsDivs) {
			continue;
		}

		const remainingInfo: typeof event.info = otherInfo;
		if (hasConfsDivs && !splitConfsDivs) {
			if (newConfs !== undefined) {
				remainingInfo.confs = newConfs;
			}
			if (newDivs !== undefined) {
				remainingInfo.divs = newDivs;
			}
		}

		const parts: ScheduledEventWithoutKey[] = [];

		if (splitConfsDivs && confs !== undefined && divs !== undefined) {
			parts.push({
				type: "confsDivs",
				season: event.season,
				phase: event.phase,
				info: {
					confs,
					divs,
					teams: [],
				},
			});
		}

		if (Object.keys(remainingInfo).length > 0) {
			parts.push({
				...event,
				info: remainingInfo,
			});
		}

		if (awards !== undefined) {
			parts.push({
				type: "awards",
				season: event.season,
				phase: event.phase,
				info: {
					awards,
				},
			});
		}

		for (const [i, part] of parts.entries()) {
			output.push(i === 0 && id !== undefined ? { ...part, id } : part);
		}
	}

	return output;
};
