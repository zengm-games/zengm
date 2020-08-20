import type {
	Conditions,
	LogEventSaveOptions,
	LogEventShowOptions,
	LogEventType,
} from "./types";

// Really, pids, tids, and type should not be optional if saveToDb is true
type LogEventOptions = {
	extraClass?: string;
	persistent?: boolean;
	pids?: number[];
	saveToDb?: boolean;
	score?: number;
	showNotification?: boolean;
	text: string;
	tids?: number[];
	type: LogEventType;
};

function createLogger(
	saveEvent: (a: LogEventSaveOptions) => void,
	showEvent: (a: LogEventShowOptions, conditions?: Conditions) => void,
): (a: LogEventOptions, conditions?: Conditions) => void {
	const logEvent = (
		{
			extraClass,
			persistent = false,
			pids,
			saveToDb = true,
			score,
			showNotification = true,
			text,
			tids,
			type,
		}: LogEventOptions,
		conditions?: Conditions,
	) => {
		if (saveToDb) {
			if (pids === undefined && tids === undefined) {
				throw new Error("Saved event must include pids or tids");
			}

			saveEvent({
				type,
				text,
				pids,
				tids,
				score,
			});
		}

		if (showNotification) {
			showEvent(
				{
					extraClass,
					persistent,
					text,
					type,
				},
				conditions,
			);
		}
	};

	return logEvent;
}

export default createLogger;
