import {
	ads,
	autoPlayDialog,
	confirm,
	confirmDeleteAllLeagues,
	local,
	localActions,
	realtimeUpdate,
	safeLocalStorage,
} from "../util";
import { showEvent } from "../util/logEvent";
import type {
	LocalStateUI,
	LogEventShowOptions,
	UpdateEvents,
	GameAttributesLeague,
} from "../../common/types";
import { GRACE_PERIOD } from "../../common";

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

	if (!hideAds) {
		window.freestar.queue.push(() => {
			// Add margin for skyscraper on right
			const container = document.getElementsByClassName("bbgm-container")[0];
			if (container instanceof HTMLElement) {
				container.classList.add("padding-for-skyscraper");
			}

			// Show hidden divs. skyscraper has its own code elsewhere to manage display.
			// const divsMobile = [`${process.env.SPORT}-gm_mobile_leaderboard`];
			const divsMobile: string[] = [];
			const showDivsDesktop = [
				`${process.env.SPORT}-gm_leaderboard_atf`,
				`${process.env.SPORT}-gm_mrec_btf_1`,
				`${process.env.SPORT}-gm_mrec_btf_2`,
				"skyscraper-wrapper",
			];
			const showDivs =
				window.screen && window.screen.width < 768
					? divsMobile
					: showDivsDesktop;

			for (const id of showDivs) {
				const div = document.getElementById(id);

				if (div) {
					div.style.removeProperty("display");
				}
			}

			const adDivsDesktop = [
				`${process.env.SPORT}-gm_leaderboard_atf`,
				`${process.env.SPORT}-gm_mrec_btf_1`,
				`${process.env.SPORT}-gm_mrec_btf_2`,
			];
			const adDivs =
				window.screen && window.screen.width < 768 ? divsMobile : adDivsDesktop;

			for (const adDiv of adDivs) {
				window.freestar.config.enabled_slots.push({
					placementName: adDiv,
					slotId: adDiv,
				});
				console.log("enabled_slots", adDiv);

				if (adDiv.endsWith("-gm_mobile_leaderboard")) {
					localActions.update({
						stickyFooterAd: true,
					});

					// Add margin to footer - do this manually rather than using stickyFooterAd so <Footer> does not have to re-render
					const footer = document.getElementById("main-footer");
					if (footer) {
						footer.style.marginBottom = "52px";
					}
				}
			}

			if (window.screen && window.screen.width >= 768) {
				// Show the logo too
				const logo = document.getElementById("bbgm-ads-logo");

				if (logo) {
					logo.style.display = "flex";
				}
			}
		});
	}
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

	if (parts[1] === "l" && parseInt(parts[2], 10) !== lid) {
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

const setGameAttributes = (gameAttributes: Partial<GameAttributesLeague>) => {
	localActions.updateGameAttributes(gameAttributes);
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

	const adBlock = !window.freestar.freestarReloadAdSlot;
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

	// Find upcoming game, it's the only one that needs updating
	const game = games.find(game => game.teams[0].pts === undefined);
	if (game) {
		const { teams } = game;
		if (
			teams[0].ovr !== ovrs[teams[0].tid] ||
			teams[1].ovr !== ovrs[teams[1].tid]
		) {
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
	mergeGames,
	newLid,
	realtimeUpdate: realtimeUpdate2,
	resetLeague,
	setGameAttributes,
	showEvent: showEvent2,
	showModal,
	updateLocal,
	updateTeamOvrs,
};
