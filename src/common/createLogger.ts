import type {
	Conditions,
	EventBBGMWithoutKey,
	LogEventSaveOptions,
	LogEventShowOptions,
	LogEventType,
} from "./types";

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
	extraClass?: string;
	persistent?: boolean;
	saveToDb?: boolean;
	showNotification?: boolean;
} & Omit<EventBBGMWithoutKey, "season">;

function createLogger(
	saveEvent: (a: LogEventSaveOptions) => void,
	showEvent: (a: LogEventShowOptions, conditions?: Conditions) => void,
): (a: LogEventOptions, conditions?: Conditions) => void {
	const logEvent = (
		{
			extraClass,
			persistent = false,
			saveToDb = true,
			showNotification = true,
			...event
		}: LogEventOptions,
		conditions?: Conditions,
	) => {
		if (saveToDb) {
			if (event.pids === undefined && event.tids === undefined) {
				throw new Error("Saved event must include pids or tids");
			}

			saveEvent(event);
		}

		if (showNotification && event.text) {
			showEvent(
				{
					extraClass,
					persistent,
					text: event.text,
					type: event.type,
				},
				conditions,
			);
		}
	};

	return logEvent;
}

export default createLogger;
