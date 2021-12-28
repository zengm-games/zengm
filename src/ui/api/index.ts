import {
	ads,
	autoPlayDialog,
	confirm,
	confirmDeleteAllLeagues,
	local,
	localActions,
	realtimeUpdate,
	requestPersistentStorage,
	safeLocalStorage,
} from "../util";
import { showEvent } from "../util/logEvent";
import type {
	LocalStateUI,
	LogEventShowOptions,
	UpdateEvents,
	GameAttributesLeague,
} from "../../common/types";
import { AD_DIVS, GRACE_PERIOD } from "../../common";
import { updateSkyscraperDisplay } from "../components/Skyscraper";

/**
 * Ping a counter at basketball-gm.com.
 *
 * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
 */
const bbgmPing = (
	type: "customizePlayers" | "league" | "season" | "version",
	arg?: any,
) => {
	if (window.enableLogging && window.gtag) {
		if (type === "league") {
			window.gtag("event", "New league", {
				event_category: arg[1],
				event_label: String(arg[0]),
			});
		} else if (type === "season") {
			window.gtag("event", "Completed season", {
				event_category: "BBGM",
				event_label: String(arg),
			});
		} else if (type === "version") {
			window.gtag("event", "Version", {
				event_category: "BBGM",
				event_label: window.bbgmVersion,
			});
		}
	}
};

// Read from goldUntil rather than local because this is called before local is updated
const initAds = (goldUntil: number | undefined) => {
	let hideAds = false; // No ads for Gold members

	const currentTimestamp = Math.floor(Date.now() / 1000) - GRACE_PERIOD;

	if (goldUntil === undefined || currentTimestamp < goldUntil) {
		hideAds = true;
	}

	const mobile = window.screen.width < 768;

	if (!hideAds) {
		// _disabled names are to hide from Blockthrough, so it doesn't leak through for Gold subscribers. Run this regardless of window.freestar, so Blockthrough can still work for some users.
		const divsAll = [
			AD_DIVS.mobile,
			AD_DIVS.leaderboard,
			AD_DIVS.rectangle1,
			AD_DIVS.rectangle2,
			AD_DIVS.rail,
		];
		for (const id of divsAll) {
			const div = document.getElementById(`${id}_disabled`);
			if (div) {
				div.id = id;
			}
		}

		window.freestar.queue.push(() => {
			// Show hidden divs. skyscraper has its own code elsewhere to manage display.
			const divsMobile = [AD_DIVS.mobile];
			const divsDesktop = [
				AD_DIVS.leaderboard,
				AD_DIVS.rectangle1,
				AD_DIVS.rectangle2,
			];
			const divs = mobile ? divsMobile : divsDesktop;

			for (const id of divs) {
				const div = document.getElementById(id);

				if (div) {
					div.style.removeProperty("display");
				}
			}

			// Special case for rail, to tell it there is no gold
			const rail = document.getElementById(AD_DIVS.rail);
			if (rail) {
				delete rail.dataset.gold;
				updateSkyscraperDisplay();
			}

			for (const id of divs) {
				window.freestar.config.enabled_slots.push({
					placementName: id,
					slotId: id,
				});
			}

			if (divs.includes(AD_DIVS.mobile)) {
				localActions.update({
					stickyFooterAd: true,
				});

				// Add margin to footer - do this manually rather than using stickyFooterAd so <Footer> does not have to re-render
				const footer = document.getElementById("main-footer");
				if (footer) {
					footer.style.paddingBottom = "52px";
				}

				// Hack to hopefully stop the Microsoft ad from breaking everything
				// Maybe this is breaking country tracking in Freestar, and maybe for direct ads too?
				window.googletag = window.googletag || {};
				window.googletag.cmd = window.googletag.cmd || [];
				window.googletag.cmd.push(() => {
					window.googletag.pubads().setForceSafeFrame(true);
					window.googletag.pubads().setSafeFrameConfig({
						allowOverlayExpansion: false,
						allowPushExpansion: false,
						sandbox: true,
					});
				});
			}

			if (!mobile) {
				// Show the logo too
				const logo = document.getElementById("bbgm-ads-logo");

				if (logo) {
					logo.style.display = "flex";
				}
			}
		});
	}
};

// This does the opposite of initAds. To be called when a user subscribes to gold or logs in to an account with an active subscription
const initGold = () => {
	window.freestar.queue.push(() => {
		const divsAll = [
			AD_DIVS.mobile,
			AD_DIVS.leaderboard,
			AD_DIVS.rectangle1,
			AD_DIVS.rectangle2,
		];

		for (const id of divsAll) {
			const div = document.getElementById(id);

			if (div) {
				div.style.display = "none";
			}

			window.freestar.deleteAdSlots(id);
		}

		// Special case for rail, to tell it there is no BBGM gold
		const rail = document.getElementById(AD_DIVS.rail);
		if (rail) {
			rail.dataset.gold = "true";
			updateSkyscraperDisplay();
		}

		localActions.update({
			stickyFooterAd: false,
		});

		// Add margin to footer - do this manually rather than using stickyFooterAd so <Footer> does not have to re-render
		const footer = document.getElementById("main-footer");
		if (footer) {
			footer.style.marginBottom = "";
		}

		const logo = document.getElementById("bbgm-ads-logo");
		if (logo) {
			logo.style.display = "none";
		}

		// Rename to hide from Blockthrough
		for (const id of [...divsAll, AD_DIVS.rail]) {
			const div = document.getElementById(id);

			if (div) {
				div.id = `${id}_disabled`;
			}
		}
		console.log(
			"initGold end",
			"display",
			document.getElementById("basketball-gm_mobile_leaderboard")?.style
				.display,
		);
	});
};

const deleteGames = (gids: number[]) => {
	localActions.deleteGames(gids);
};

const mergeGames = (games: LocalStateUI["games"]) => {
	localActions.mergeGames(games);
};

// Should only be called from Shared Worker, to move other tabs to new league because only one can be open at a time
const newLid = async (lid: number) => {
	const parts = window.location.pathname.split("/");

	if (parts[1] === "l" && parseInt(parts[2]) !== lid) {
		parts[2] = String(lid);
		const newPathname = parts.join("/");
		await realtimeUpdate(["firstRun"], newPathname);
		localActions.update({
			lid,
		});
	}
};

async function realtimeUpdate2(
	updateEvents: UpdateEvents = [],
	url?: string,
	raw?: Record<string, unknown>,
) {
	await realtimeUpdate(updateEvents, url, raw);
}

const resetLeague = () => {
	localActions.resetLeague();
};

const setGameAttributes = (
	gameAttributes: Partial<GameAttributesLeague>,
	flagOverrides: LocalStateUI["flagOverrides"] | undefined,
) => {
	localActions.updateGameAttributes(gameAttributes, flagOverrides);
};

const showEvent2 = (options: LogEventShowOptions) => {
	showEvent(options);
};

const showModal = () => {
	if (!window.enableLogging) {
		return;
	}

	// No ads for Gold members
	if (local.getState().gold !== false) {
		return;
	}

	// Max once/hour
	const date = new Date().toISOString().slice(0, 13);
	const lastDate = safeLocalStorage.getItem("lastDateShowModal");
	if (date === lastDate) {
		return;
	}
	safeLocalStorage.setItem("lastDateShowModal", date);

	const r = Math.random();

	const adBlock =
		!window.freestar.refreshAllSlots ||
		!window.googletag ||
		!window.googletag.pubads;
	if (adBlock && r < 0.11) {
		ads.showModal();
		return;
	}

	if (r < 0.1) {
		ads.showGcs();
	} else if (r < 0.11) {
		ads.showModal();
	}
};

const updateLocal = (obj: Partial<LocalStateUI>) => {
	localActions.update(obj);
};

const updateTeamOvrs = (ovrs: number[]) => {
	const games = local.getState().games;

	// Find upcoming game, it's the only one that needs updating because it's the only one displayed in a ScoreBox in LeagueTopBar
	const gameIndex = games.findIndex(game => game.teams[0].pts === undefined);
	if (gameIndex >= 0) {
		const { teams } = games[gameIndex];
		if (
			teams[0].ovr !== ovrs[teams[0].tid] ||
			teams[1].ovr !== ovrs[teams[1].tid]
		) {
			games[gameIndex] = {
				...games[gameIndex],
			};
			teams[0].ovr = ovrs[teams[0].tid];
			teams[1].ovr = ovrs[teams[1].tid];

			localActions.update({
				games: games.slice(),
			});
		}
	}
};

export default {
	autoPlayDialog,
	bbgmPing,
	confirm,
	confirmDeleteAllLeagues,
	deleteGames,
	initAds,
	initGold,
	mergeGames,
	newLid,
	realtimeUpdate: realtimeUpdate2,
	requestPersistentStorage,
	resetLeague,
	setGameAttributes,
	showEvent: showEvent2,
	showModal,
	updateLocal,
	updateTeamOvrs,
};
