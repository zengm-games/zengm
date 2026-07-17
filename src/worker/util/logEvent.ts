import { idb } from "../db/index.ts";
import g from "./g.ts";
import toUI from "./toUI.ts";
import type {
	Conditions,
	DistributiveOmit,
	EventBBGMWithoutKey,
} from "../../common/types.ts";

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions<SaveToDb> = {
	extraClass?: string;
	hideInLiveGame?: boolean;
	onClose?: () => void;
	persistent?: boolean;
	saveToDb?: SaveToDb;
	showNotification?: boolean;
} & DistributiveOmit<EventBBGMWithoutKey, "season">;

// conditions only needed when showNotification is true, otherwise this is never called
const logEvent = async <SaveToDb extends boolean = true>(
	{
		extraClass,
		hideInLiveGame,
		onClose,
		persistent = false,
		saveToDb = true as SaveToDb,
		showNotification = true,
		...event
	}: LogEventOptions<SaveToDb>,
	conditions?: Conditions,
): Promise<SaveToDb extends true ? number : undefined> => {
	let result;
	if (saveToDb) {
		if (event.pids === undefined && event.tids === undefined) {
			throw new Error("Saved event must include pids or tids");
		}

		result = await idb.cache.events.add({ ...event, season: g.get("season") });
	}

	if (showNotification && event.text) {
		void toUI(
			"showNotification",
			[
				{
					extraClass,
					hideInLiveGame,
					onClose,
					persistent,
					text: event.text,
					type: event.type,
				},
			],
			conditions,
		);
	}

	return result as SaveToDb extends true ? number : undefined;
};

export default logEvent;
