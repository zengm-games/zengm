import { createLogger } from "../../common";
import { local, notify, toWorker, safeLocalStorage } from ".";
import type { LogEventShowOptions } from "../../common/types";

const saveEvent = () => {
	throw new Error("UI events should not be saved to DB");
};

const showEvent = ({
	extraClass,
	persistent,
	text,
	type,
}: LogEventShowOptions) => {
	let title;

	if (type === "gameWon" || type === "gameLost" || type === "gameTied") {
		if (safeLocalStorage.getItem("bbgmShowLeagueTopBar") !== "false") {
			return;
		}
	}

	if (type === "error") {
		title = "Error!";
	} else if (type === "changes") {
		title = "Changes since your last visit";
	} else if (type === "healedList") {
		title = "Recovered from injury";
	} else if (type === "injuredList") {
		title = "Injured this game";
	}

	if (persistent && extraClass === undefined) {
		extraClass = "notification-danger";
	}

	let showNotification = true;

	// Don't show non-critical notification if we're viewing a live game now. The additional liveGameInProgress check handles the case when an error occurs before the live game starts (such as roster size) and that should still be displayed
	if (!persistent && window.location.pathname.includes("/live_game")) {
		const liveGameInProgress = local.getState().liveGameInProgress;
		if (liveGameInProgress) {
			showNotification = false;
		}
	}

	if (showNotification) {
		notify(text, title, {
			extraClass,
			persistent,
		});

		// Persistent notifications are very rare and should stop game sim when displayed. Run async for performance
		if (persistent) {
			toWorker("main", "getLocal", "autoPlayUntil").then(autoPlayUntil => {
				if (!autoPlayUntil) {
					toWorker("main", "lockSet", "stopGameSim", true);
				}
			});
		}
	}
};

const logEvent = createLogger(saveEvent, showEvent);

export { logEvent as default, showEvent };
