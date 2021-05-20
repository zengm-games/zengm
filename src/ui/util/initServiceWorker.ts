import { Workbox } from "workbox-window";
import { GAME_NAME } from "../../common";
import logEvent from "./logEvent";

const ONE_HOUR = 60 * 60 * 1000;

if ("serviceWorker" in navigator) {
	const wb = new Workbox("/sw.js");

	let updateAvailable = false;
	let updateAvailableNotificationShowing = false;

	const showUpdateAvailableNotification = () => {
		if (!updateAvailableNotificationShowing) {
			(window as any)._wb_updateAndRefresh = (button: HTMLButtonElement) => {
				button.disabled = true;
				button.innerHTML =
					'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating';
				wb.messageSkipWaiting();
			};

			updateAvailableNotificationShowing = true;

			logEvent({
				extraClass: "",
				type: "info",
				htmlIsSafe: true,
				text: `<b>Update Available</b><div class="my-2">A new version of ${GAME_NAME} has been downloaded and is ready to play.</div><button class="btn btn-primary" onclick="window._wb_updateAndRefresh(this)">Update and refresh</button>`,
				saveToDb: false,
				persistent: true,
				onClose: () => {
					updateAvailableNotificationShowing = false;
				},
			});
		}
	};

	wb.addEventListener("activated", event => {
		if (event.isExternal || updateAvailableNotificationShowing) {
			// Maybe another tab? Or (for reasons I don't understand) the first tab opened, if it was only opened once, even though clientsClaim is used in the sw and controlling event fires, and then an update happens
			window.location.reload();
		} else if (!event.isUpdate) {
			logEvent({
				extraClass: "",
				type: "info",
				text: `${GAME_NAME} is now fully loaded and will continue to work even if you are offline.`,
				saveToDb: false,
				persistent: true,
			});
		}
	});

	wb.addEventListener("waiting", () => {
		updateAvailable = true;

		showUpdateAvailableNotification();
	});

	// Should only happen when a new service worker takes over for a previous one, which should only happen in response to clicking the refresh button in response to the "waiting" event
	wb.addEventListener("controlling", event => {
		if (
			event.isUpdate ||
			event.isExternal ||
			updateAvailableNotificationShowing
		) {
			window.location.reload();
		}
	});

	wb.register();

	// Check for updates in the background
	const watchForUpdates = () => {
		setTimeout(async () => {
			if (updateAvailable) {
				showUpdateAvailableNotification();
			} else {
				await wb.update();
			}

			watchForUpdates();
		}, ONE_HOUR);
	};

	watchForUpdates();
}
