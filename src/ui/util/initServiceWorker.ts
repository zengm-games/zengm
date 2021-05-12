import { Workbox } from "workbox-window";
import { GAME_NAME } from "../../common";
import logEvent from "./logEvent";

if ("serviceWorker" in navigator) {
	const wb = new Workbox("/sw.js");

	wb.addEventListener("activated", event => {
		if (!event.isUpdate) {
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
		(window as any)._wb_updateAndRefresh = (button: HTMLButtonElement) => {
			console.log(button);
			button.disabled = true;
			button.innerHTML =
				'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating';
			wb.messageSkipWaiting();
		};

		logEvent({
			extraClass: "",
			type: "info",
			htmlIsSafe: true,
			text: `<b>Update Available</b><div class="my-2">A new version of ${GAME_NAME} has been downloaded and is ready to play.</div><button class="btn btn-primary" onclick="window._wb_updateAndRefresh(this)">Update and refresh</button>`,
			saveToDb: false,
			persistent: true,
		});
	});

	// Should only happen when a new service worker takes over for a previous one, which should only happen in response to clicking the refresh button in response to the "waiting" event
	wb.addEventListener("controlling", event => {
		if (event.isUpdate) {
			window.location.reload();
		}
	});

	wb.register();
}
