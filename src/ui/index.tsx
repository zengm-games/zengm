/* eslint-disable import/first */
import "./util/initBugsnag";
import "bbgm-polyfills"; // eslint-disable-line
import type { ReactNode } from "react";
import ReactDOM from "react-dom";
import api from "./api";
import { Controller, ErrorBoundary } from "./components";
import router from "./router";
import * as util from "./util";
import type { Env } from "../common/types";
import { EMAIL_ADDRESS, GAME_NAME, WEBSITE_ROOT } from "../common";
import Bugsnag from "@bugsnag/browser";
window.bbgm = { api, ...util };
const {
	compareVersions,
	confirm,
	genStaticPage,
	leagueNotFoundMessage,
	local,
	logEvent,
	promiseWorker,
	routes,
	safeLocalStorage,
	toWorker,
	unregisterServiceWorkers,
} = util;

const handleVersion = async () => {
	window.addEventListener("storage", e => {
		if (e.key === "bbgmVersionConflict") {
			const bbgmVersionStored = safeLocalStorage.getItem("bbgmVersion");

			if (
				bbgmVersionStored &&
				compareVersions(bbgmVersionStored, window.bbgmVersion) === 1
			) {
				logEvent({
					type: "error",
					text: `A newer version of ${GAME_NAME} was just opened in another tab. Please reload this tab to load the same version here.`,
					saveToDb: false,
					persistent: true,
				});
			}
		} else if (e.key === "theme") {
			if (window.themeCSSLink) {
				window.themeCSSLink.href = `/gen/${window.getTheme()}.css`;
			}
		}
	});
	api.bbgmPing("version");

	if (window.withGoodUI) {
		window.withGoodUI();
	}

	toWorker("main", "ping").then(() => {
		if (window.withGoodWorker) {
			window.withGoodWorker();
		}
	});

	// Check if there are other tabs open with a different version
	const bbgmVersionStored = safeLocalStorage.getItem("bbgmVersion");

	if (bbgmVersionStored) {
		const cmpResult = compareVersions(window.bbgmVersion, bbgmVersionStored);

		if (cmpResult === 1) {
			// This version is newer than another tab's - send a signal to the other tabs
			let conflictNum = parseInt(
				// @ts-ignore
				safeLocalStorage.getItem("bbgmVersionConflict"),
			);

			if (Number.isNaN(conflictNum)) {
				conflictNum = 1;
			} else {
				conflictNum += 1;
			}

			safeLocalStorage.setItem("bbgmVersion", window.bbgmVersion);
			safeLocalStorage.setItem("bbgmVersionConflict", String(conflictNum));
		} else if (cmpResult === -1) {
			// This version is older than another tab's
			console.log(window.bbgmVersion, bbgmVersionStored);
			console.log(
				`This version of ${GAME_NAME} (${window.bbgmVersion}) is older than one you already played (${bbgmVersionStored}). This should never happen, so please email ${EMAIL_ADDRESS} with any info about how this error occurred.`,
			);

			// Don't block
			(async () => {
				let registrations: readonly ServiceWorkerRegistration[] = [];

				if (window.navigator.serviceWorker) {
					registrations =
						await window.navigator.serviceWorker.getRegistrations();
				}

				const getSWVersion = () => {
					return new Promise(resolve => {
						setTimeout(() => {
							resolve("???");
						}, 2000);

						const messageChannel = new MessageChannel();
						messageChannel.port1.onmessage = event => {
							resolve(event.data);
						};
						if (navigator.serviceWorker.controller) {
							navigator.serviceWorker.controller.postMessage("getSWVersion", [
								messageChannel.port2,
							]);
						}
					});
				};

				const swVersion = await getSWVersion();
				console.log("swVersion", swVersion);

				Bugsnag.notify(new Error("Game version mismatch"), event => {
					event.addMetadata("custom", {
						bbgmVersion: window.bbgmVersion,
						bbgmVersionStored,
						hasNavigatorServiceWorker:
							window.navigator.serviceWorker !== undefined,
						registrationsLength: registrations.length,
						registrations: registrations.map(r => {
							return {
								scope: r.scope,
								active: r.active
									? {
											scriptURL: r.active.scriptURL,
											state: r.active.state,
									  }
									: null,
								installing: r.installing
									? {
											scriptURL: r.installing.scriptURL,
											state: r.installing.state,
									  }
									: null,
								waiting: r.waiting
									? {
											scriptURL: r.waiting.scriptURL,
											state: r.waiting.state,
									  }
									: null,
							};
						}),
						swVersion,
					});
				});

				unregisterServiceWorkers();
			})();
		}
	} else {
		// Initial load, store version for future comparisons
		safeLocalStorage.setItem("bbgmVersion", window.bbgmVersion);
	}
};

const setupEnv = async () => {
	// Heartbeat, used to keep only one tab open at a time for browsers where we have to use a Web
	// Worker due to lack of Shared Worker support (currently just Safari). Uses sessionStorage
	// rather than a global variable to persist over page reloads, otherwise it'd be a race
	// condition to distinguish between reloading the page and opening it in two tabs.
	let heartbeatID = sessionStorage.getItem("heartbeatID");

	if (heartbeatID === null || heartbeatID === undefined) {
		heartbeatID = Math.random().toString(16).slice(2);
		sessionStorage.setItem("heartbeatID", heartbeatID);
	}

	const env: Env = {
		enableLogging: window.enableLogging,
		heartbeatID,
		mobile: window.mobile,
		useSharedWorker: window.useSharedWorker,
	};
	await toWorker("main", "init", env);
};

const render = () => {
	const contentEl = document.getElementById("content");

	if (!contentEl) {
		throw new Error('Could not find element with id "content"');
	}

	ReactDOM.render(
		<ErrorBoundary>
			<Controller />
		</ErrorBoundary>,
		contentEl,
	);
};

const setupRoutes = () => {
	let initialLoad = true;
	router.start({
		routeMatched: async ({ context }) => {
			if (!context.state.backendRedirect) {
				if (
					window.location.pathname.includes("/live_game") &&
					!context.path.includes("/live_game")
				) {
					const liveGameInProgress = local.getState().liveGameInProgress;
					if (liveGameInProgress) {
						const proceed = await confirm(
							"If you navigate away from this page, you won't be able to see these play-by-play results again.",
							{
								okText: "Navigate Away",
								cancelText: "Stay Here",
							},
						);
						if (!proceed) {
							return false;
						}
					}
				}

				// Checks for Settings (includes because of league ID in URL) and DefaultSettings
				if (
					(window.location.pathname.includes("/settings") &&
						!context.path.includes("/settings")) ||
					(window.location.pathname === "/settings/default" &&
						context.path !== "/settings/default")
				) {
					const dirtySettings = local.getState().dirtySettings;
					if (dirtySettings) {
						const proceed = await confirm(
							"Are you sure you want to discard your unsaved settings changes?",
							{
								okText: "Discard",
								cancelText: "Stay Here",
							},
						);
						if (!proceed) {
							return false;
						}

						local.getState().actions.update({
							dirtySettings: false,
						});
					}
				}
			}

			if (!context.state.noTrack) {
				if (window.enableLogging) {
					if (!initialLoad) {
						if (window.gtag) {
							window.gtag("config", window.googleAnalyticsID, {
								// Normalize league URLs to all look the same
								page_path: context.path.replace(/^\/l\/[0-9]+/, "/l/0"),
							});
						}

						/*if (window._qevents) {
							window._qevents.push({
								qacct: "p-Ye5RY6xC03ZWz",
								event: "click",
							});
						}*/
					}
				}

				if (!initialLoad) {
					if (window.freestar.refreshAllSlots) {
						window.freestar.queue.push(() => {
							window.freestar.refreshAllSlots();
						});
					}
				} else {
					initialLoad = false;
				}
			}
		},
		navigationEnd: ({ context, error }) => {
			if (error) {
				let errMsg: ReactNode = error.message;

				if (errMsg === "Matching route not found") {
					errMsg = "Page not found.";
				} else if (errMsg === "League not found.") {
					errMsg = leagueNotFoundMessage;
				} else if (
					typeof errMsg !== "string" ||
					!errMsg.includes("A league can only be open in one tab at a time")
				) {
					Bugsnag.notify(error);

					console.error("Error from view:");
					console.error(error);

					// As of 2019-07-20, these cover all IndexedDB version error messages in Chrome, Firefox, and Safari
					if (
						typeof errMsg === "string" &&
						(errMsg.includes("requested version") ||
							errMsg.includes("existing version") ||
							errMsg.includes("higher version") ||
							errMsg.includes("version requested") ||
							errMsg.includes("lower version"))
					) {
						errMsg = (
							<>
								<p>{errMsg}</p>
								<p>
									Please{" "}
									<a
										href={`https://${WEBSITE_ROOT}/manual/faq/#latest-version`}
										rel="noopener noreferrer"
										target="_blank"
									>
										make sure you have the latest version of the game loaded
									</a>
									.
								</p>
							</>
						);

						unregisterServiceWorkers();
					}
				}

				const ErrorPage = (
					<>{typeof errMsg === "string" ? <p>{errMsg}</p> : errMsg}</>
				);
				const errorPage = genStaticPage("error", "Error", ErrorPage, false);
				errorPage(context);
			}
		},
		routes,
	});
};

(async () => {
	promiseWorker.register(([name, ...params]) => {
		if (!api.hasOwnProperty(name)) {
			throw new Error(
				`API call to nonexistant UI function "${name}" with params ${JSON.stringify(
					params,
				)}`,
			);
		}

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-ignore
		return api[name](...params);
	});
	await handleVersion();
	await setupEnv();
	render();
	await setupRoutes();

	await import("./util/initServiceWorker");
})();
