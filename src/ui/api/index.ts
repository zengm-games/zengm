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

const initAds = (type: "accountChecked" | "uiRendered") => {
	ads.setLoadingDone(type);
};

const initGold = () => {
	ads.stop();
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

	if ((ads.adBlock() && r < 0.1) || r < 0.01) {
		localActions.update({
			showNagModal: true,
		});
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
