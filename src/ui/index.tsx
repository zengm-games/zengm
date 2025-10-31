import "./util/initBugsnag.ts";
import "../common/polyfills.ts";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import api from "./api/index.ts";
import { Controller, ErrorBoundary } from "./components/index.tsx";
import router from "./router/index.ts";
import * as util from "./util/index.ts";
import type { Env } from "../common/types.ts";
import { EMAIL_ADDRESS, GAME_NAME, WEBSITE_ROOT } from "../common/index.ts";
import Bugsnag from "@bugsnag/browser";
window.bbgm = { api, ...util };
const {
	analyticsEvent,
	compareVersions,
	genStaticPage,
	leagueNotFoundMessage,
	logEvent,
	promiseWorker,
	routes,
	safeLocalStorage,
	toWorker,
	unregisterServiceWorkers,
} = util;

const handleVersion = async () => {
	window.addEventListener("storage", (e) => {
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
				window.themeCSSLink.href = window.getThemeFilename(window.getTheme());
			}
		}
	});
	analyticsEvent("app_version", {
		app_version: window.bbgmVersion,
	});

	window.withGoodUI?.();

	toWorker("main", "ping", undefined).then(() => {
		window.withGoodWorker?.();
	});

	// Check if there are other tabs open with a different version
	const bbgmVersionStored = safeLocalStorage.getItem("bbgmVersion");

	if (bbgmVersionStored) {
		const cmpResult = compareVersions(window.bbgmVersion, bbgmVersionStored);

		if (cmpResult === 1) {
			// This version is newer than another tab's - send a signal to the other tabs
			let conflictNum = Number.parseInt(
				// @ts-expect-error
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
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve("???");
						}, 2000);

						const messageChannel = new MessageChannel();
						messageChannel.port1.onmessage = (event) => {
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

				Bugsnag.notify(new Error("Game version mismatch"), (event) => {
					event.addMetadata("custom", {
						bbgmVersion: window.bbgmVersion,
						bbgmVersionStored,
						hasNavigatorServiceWorker:
							window.navigator.serviceWorker !== undefined,
						registrationsLength: registrations.length,
						registrations: registrations.map((r) => {
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
	const container = document.getElementById("content");
	const root = createRoot(container!);
	root.render(
		<ErrorBoundary>
			<Controller />
		</ErrorBoundary>,
	);
};

const getUrlForAnalytics = (path: string) => {
	// Track page_view here rather than in routeMatched so logged title is correct
	const pagePath = path.replace(/^\/l\/\d+/, "/l/0");

	return `${location.origin}${pagePath}`;
};

const setupRoutes = () => {
	let initialLoad = true;
	router.start({
		routeMatched: async ({ context }) => {
			if (!context.state.noTrack) {
				if (initialLoad) {
					initialLoad = false;
				} else {
					// This will only do something if ads are already initialized, so it's (mostly) safe to call here even though this could be an error page, since at least it won't show on an error page for the initial pageview
					util.ads.refreshAll();

					// There is no way to fix the URL for initial pageviews, according to the current docs, but I guess that's not a big deal for me, we'll see
					util.ads.trackPageview(getUrlForAnalytics(context.path));
				}
			}
		},
		navigationEnd: ({ context, error }) => {
			if (error) {
				let errorMessage: ReactNode = error.message;

				if (errorMessage === "Matching route not found") {
					errorMessage = "Page not found.";
				} else if (errorMessage === "League not found.") {
					errorMessage = leagueNotFoundMessage;
				} else if (
					typeof errorMessage !== "string" ||
					!errorMessage.includes(
						"A league can only be open in one tab at a time",
					)
				) {
					Bugsnag.notify(error);

					console.error("Error from view:");
					console.error(error);

					// As of 2019-07-20, these cover all IndexedDB version error messages in Chrome, Firefox, and Safari
					if (
						typeof errorMessage === "string" &&
						(errorMessage.includes("requested version") ||
							errorMessage.includes("existing version") ||
							errorMessage.includes("higher version") ||
							errorMessage.includes("version requested") ||
							errorMessage.includes("lower version"))
					) {
						errorMessage = (
							<>
								<p>{errorMessage}</p>
								<p>
									Please{" "}
									<a
										href={`https://${WEBSITE_ROOT}/manual/faq/#latest-version`}
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
					<>
						{typeof errorMessage === "string" ? (
							<p>{errorMessage}</p>
						) : (
							errorMessage
						)}
					</>
				);
				const errorPage = genStaticPage("error", "Error", ErrorPage, false);
				errorPage(context);
			} else if (!context.state.noTrack) {
				// If this is not an error page, initialize ads. init() will do nothing if it's already initialized
				util.ads.init();
			}

			if (!context.state.noTrack && window.enableLogging) {
				// https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag
				analyticsEvent("page_view", {
					page_location: getUrlForAnalytics(context.path),
				});
			}
		},
		routes,
	});
};

(async () => {
	promiseWorker.register(([name, ...params]) => {
		if (!Object.hasOwn(api, name)) {
			throw new Error(
				`API call to nonexistant UI function "${name}" with params ${JSON.stringify(
					params,
				)}`,
			);
		}

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		return api[name](...params);
	});
	await handleVersion();
	await setupEnv();
	render();
	await setupRoutes();

	await import("./util/initServiceWorker.ts");
})();
