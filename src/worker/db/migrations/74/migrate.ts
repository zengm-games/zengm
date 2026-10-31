import type { IDBPObjectStore } from "@dumbmatter/idb";
import type { GameAttributesLeague } from "../../../../common/types.ts";
import type {
	LeagueDB,
	VersionChangeTransaction,
} from "../../connectLeague.ts";
import { gameAttributesArrayToObject } from "../../../../common/gameAttributesArrayToObject.ts";
import { unwrapGameAttribute } from "../../../../common/unwrapGameAttribute.ts";
import { splitScheduledEvents } from "./splitScheduledEvents.ts";

// See splitScheduledEvents
export const migrateScheduledEvents74 = async ({
	confs,
	divs,
	scheduledEventsStore,
}: {
	// Most recent values in the league
	confs: GameAttributesLeague["confs"] | undefined;
	divs: GameAttributesLeague["divs"] | undefined;

	scheduledEventsStore: IDBPObjectStore<
		LeagueDB,
		["scheduledEvents"],
		"scheduledEvents",
		"readwrite" | "versionchange"
	>;
}) => {
	const events = splitScheduledEvents({
		confs,
		divs,
		events: await scheduledEventsStore.getAll(),
	});

	for (const event of events) {
		// An event with an id replaces the old event, and an event with no id is a new one. Type is wrong because in that case the id is created by the database.
		await scheduledEventsStore.put(event as any);
	}
};

export const migrate74 = async (transaction: VersionChangeTransaction) => {
	const gameAttributes = gameAttributesArrayToObject(
		await transaction.objectStore("gameAttributes").getAll(),
	);

	await migrateScheduledEvents74({
		confs: unwrapGameAttribute(gameAttributes, "confs"),
		divs: unwrapGameAttribute(gameAttributes, "divs"),
		scheduledEventsStore: transaction.objectStore("scheduledEvents") as any,
	});
};
