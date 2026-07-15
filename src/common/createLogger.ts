import type { ShowNotificationOptions } from "../ui/util/showNotification.ts";
import type {
	Conditions,
	EventBBGMWithoutKey,
	LogEventSaveOptions,
	DistributiveOmit,
} from "./types.ts";

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
	extraClass?: string;
	hideInLiveGame?: boolean;
	onClose?: () => void;
	persistent?: boolean;
	saveToDb?: boolean;
	showNotification?: boolean;
} & DistributiveOmit<EventBBGMWithoutKey, "season">;

export const createLogger = (
	saveEvent: (a: LogEventSaveOptions) => Promise<number | undefined>,
	showEvent: (a: ShowNotificationOptions, conditions?: Conditions) => void,
) => {
	const logEvent = async (
		{
			extraClass,
			hideInLiveGame,
			onClose,
			persistent = false,
			saveToDb = true,
			showNotification = true,
			...event
		}: LogEventOptions,
		conditions?: Conditions,
	) => {
		let result;
		if (saveToDb) {
			if (event.pids === undefined && event.tids === undefined) {
				throw new Error("Saved event must include pids or tids");
			}

			result = await saveEvent(event);
		}

		if (showNotification && event.text) {
			showEvent(
				{
					extraClass,
					hideInLiveGame,
					onClose,
					persistent,
					text: event.text,
					type: event.type,
				},
				conditions,
			);
		}

		return result;
	};

	return logEvent;
};
