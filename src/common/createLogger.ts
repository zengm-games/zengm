import type {
	Conditions,
	EventBBGMWithoutKey,
	LogEventSaveOptions,
	LogEventShowOptions,
	DistributiveOmit,
} from "./types";

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
	extraClass?: string;
	hideInLiveGame?: boolean;
	htmlIsSafe?: boolean;
	onClose?: () => void;
	persistent?: boolean;
	saveToDb?: boolean;
	showNotification?: boolean;
} & DistributiveOmit<EventBBGMWithoutKey, "season">;

function createLogger(
	saveEvent: (a: LogEventSaveOptions) => Promise<number | undefined>,
	showEvent: (a: LogEventShowOptions, conditions?: Conditions) => void,
) {
	const logEvent = async (
		{
			extraClass,
			hideInLiveGame,
			htmlIsSafe,
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
					htmlIsSafe,
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
}

export default createLogger;
