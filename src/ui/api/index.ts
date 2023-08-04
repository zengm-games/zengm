import {
	ads,
	analyticsEvent,
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
import { AD_DIVS, MOBILE_AD_BOTTOM_MARGIN } from "../../common";
import { updateSkyscraperDisplay } from "../components/Skyscraper";

let accountChecked = false;
let uiRendered = false;
const initAds = (type: "accountChecked" | "uiRendered") => {
	// Prevent race condition by assuring we run this only after the account has been checked and the UI has been rendered, otherwise (especially when opening a 2nd tab) this was sometimes running before the UI was rendered, which resulted in no ads being displayed
	if (accountChecked && uiRendered) {
		// Must have already ran somehow?
		return;
	}
	if (type === "accountChecked") {
		accountChecked = true;
	} else if (type === "uiRendered") {
		uiRendered = true;
	}
	if (!accountChecked || !uiRendered) {
		return;
	}

	const gold = local.getState().gold;

	if (!gold) {
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
			const divs = window.mobile ? divsMobile : divsDesktop;

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
				updateSkyscraperDisplay(true);
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
					footer.style.paddingBottom = `${MOBILE_AD_BOTTOM_MARGIN}px`;
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

			if (!window.mobile) {
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
			updateSkyscraperDisplay(false);
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
	if (adBlock && r < 0.1) {
		ads.showModal();
		return;
	}

	if (r < 0.01) {
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
	analyticsEvent,
	autoPlayDialog,
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
