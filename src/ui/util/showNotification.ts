import type { ReactNode } from "react";
import { local } from "./local.ts";
import { notify } from "./notify.ts";
import { toWorker } from "./toWorker.ts";

export type ShowNotificationOptions = {
	extraClass?: string;
	hideInLiveGame?: boolean;
	onClose?: () => void;
	persistent?: boolean;
	text: ReactNode;
	type: string;
};

export const showNotification = ({
	extraClass,
	hideInLiveGame,
	onClose,
	persistent,
	text,
	type,
}: ShowNotificationOptions) => {
	let title;

	if (type === "gameWon" || type === "gameLost" || type === "gameTied") {
		if (local.getState().showLeagueTopBar) {
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
	if (
		(hideInLiveGame || !persistent) &&
		window.location.pathname.includes("/live_game")
	) {
		const liveGameInProgress = local.getState().liveGameInProgress;
		if (liveGameInProgress) {
			showNotification = false;
		}
	}

	if (showNotification) {
		notify(text, title, {
			extraClass,
			onClose,
			persistent,
		});

		// Persistent notifications are very rare and should stop game sim when displayed. Run async for performance
		if (persistent) {
			toWorker("main", "getLocal", "autoPlayUntil").then((autoPlayUntil) => {
				if (!autoPlayUntil) {
					toWorker("main", "lockSet", ["stopGameSim", true]);
				}
			});
		}
	}
};
