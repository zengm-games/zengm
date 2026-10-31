import { Workbox } from "workbox-window";
import { GAME_NAME } from "../../common/constants.ts";
import { showNotification } from "./showNotification.ts";
import { useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";

const ServiceWorkerNotification = ({ workbox }: { workbox: Workbox }) => {
	const [updating, setUpdating] = useState(false);

	return (
		<>
			<b>Update Available</b>
			<div className="my-2">
				A new version of {GAME_NAME} has been downloaded and is ready to play.
			</div>
			<ActionButton
				variant="primary"
				processing={updating}
				processingText="Updating"
				onClick={() => {
					workbox.messageSkipWaiting();
					setUpdating(true);
				}}
			>
				Update and refresh
			</ActionButton>
		</>
	);
};

export const initServiceWorker = async () => {
	// serviceWorker is undefined in an insecure context, like http://play.basketball-gm.test/
	if (!window.navigator.serviceWorker) {
		return;
	}

	if (window.releaseStage === "development") {
		if (window.navigator.serviceWorker.controller) {
			showNotification({
				type: "error",
				text: "Build loaded from service worker in dev",
				persistent: true,
			});
		}
	} else {
		const workbox = new Workbox("/sw.js");

		let updateAvailable = false;
		let updateAvailableNotificationShowing = false;

		const showUpdateAvailableNotification = () => {
			if (!updateAvailableNotificationShowing) {
				updateAvailableNotificationShowing = true;

				showNotification({
					extraClass: "",
					type: "info",
					text: <ServiceWorkerNotification workbox={workbox} />,
					persistent: true,
					onClose: () => {
						updateAvailableNotificationShowing = false;
					},
				});
			}
		};

		workbox.addEventListener("activated", (event) => {
			if (event.isExternal || updateAvailableNotificationShowing) {
				// Maybe another tab? Or (for reasons I don't understand) the first tab opened, if it was only opened once, even though clientsClaim is used in the sw and controlling event fires, and then an update happens
				window.location.reload();
			} else if (!event.isUpdate) {
				showNotification({
					extraClass: "",
					type: "info",
					text: `${GAME_NAME} is now fully loaded and will continue to work even if you are offline.`,
					persistent: true,
				});
			}
		});

		workbox.addEventListener("waiting", () => {
			updateAvailable = true;

			showUpdateAvailableNotification();
		});

		// Should only happen when a new service worker takes over for a previous one, which should only happen in response to clicking the refresh button in response to the "waiting" event
		workbox.addEventListener("controlling", (event) => {
			if (
				event.isUpdate ||
				event.isExternal ||
				updateAvailableNotificationShowing
			) {
				window.location.reload();
			}
		});

		try {
			await workbox.register();
		} catch (error) {
			// googlebot throws an error with the message "Rejected" on navigator.serviceWorker.register, IDK why, but this at least hides it from Bugsnag
			// https://stackoverflow.com/q/63301353/786644
			if (error.message === "Rejected") {
				return;
			}

			throw error;
		}

		// Check for updates in the background
		const watchForUpdates = () => {
			const ONE_HOUR = 60 * 60 * 1000;

			setTimeout(async () => {
				if (updateAvailable) {
					showUpdateAvailableNotification();
				} else {
					await workbox.update();
				}

				watchForUpdates();
			}, ONE_HOUR);
		};

		watchForUpdates();
	}
};
