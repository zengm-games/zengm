import create from "zustand";
import shallow from "zustand/shallow";
import { GameAttributesLeague, LocalStateUI } from "../../common/types";

// These are variables that are needed to display parts of the UI not driven explicitly by worker/views/*.js files. Like
// the top navbar, the multi team menu, etc. They come from gameAttributes, the account system, and elsewhere.

type LocalActions = {
	mergeGames: (games: LocalStateUI["games"]) => void;
	resetLeague: () => void;
	toggleSidebar: () => void;
	update: (obj: Partial<LocalStateUI>) => void;
	updateGameAttributes: (gameAttributes: Partial<GameAttributesLeague>) => void;
};

const defaultUnits: "metric" | "us" =
	window.navigator.language === "en-US" ? "us" : "metric";

const [useLocal, local] = create<
	LocalStateUI & {
		actions: LocalActions;
	}
>(set => ({
	games: [],
	gold: undefined,
	godMode: false,
	hasViewedALeague: !!localStorage.getItem("hasViewedALeague"),
	homeCourtAdvantage: 1,
	leagueName: "",
	lid: undefined,
	liveGameInProgress: false,
	phase: 0,
	phaseText: "",
	playMenuOptions: [],
	popup: window.location.search === "?w=popup",
	season: 0,
	showNagModal: false,
	sidebarOpen: false,
	startingSeason: 0,
	statusText: "Idle",
	teamAbbrevsCache: [],
	teamImgURLsCache: [],
	teamNamesCache: [],
	teamRegionsCache: [],
	units: defaultUnits,
	userTid: 0,
	userTids: [],
	username: undefined,
	viewInfo: undefined,
	title: undefined,
	hideNewWindow: false,
	jumpTo: false,
	jumpToSeason: undefined,
	dropdownExtraParam: undefined,
	dropdownView: undefined,
	dropdownFields: {},
	moreInfoAbbrev: undefined,
	moreInfoSeason: undefined,

	actions: {
		mergeGames(games: LocalStateUI["games"]) {
			set(state => {
				const newGames = state.games.slice();

				for (const game of games) {
					const index = newGames.findIndex(newGame => newGame.gid === game.gid);
					if (index >= 0) {
						newGames[index] = game;
					} else {
						newGames.push(game);
					}
				}

				return {
					games: newGames,
				};
			});
		},

		// Reset any values specific to a league
		resetLeague() {
			set({
				games: [],
				godMode: false,
				leagueName: "",
				lid: undefined,
				liveGameInProgress: false,
				phase: 0,
				phaseText: "",
				playMenuOptions: [],
				season: 0,
				startingSeason: 0,
				statusText: "Idle",
				teamAbbrevsCache: [],
				teamImgURLsCache: [],
				teamNamesCache: [],
				teamRegionsCache: [],
				userTid: 0,
				userTids: [],
			});
		},

		toggleSidebar() {
			set(state => ({ sidebarOpen: !state.sidebarOpen }));
		},

		update(obj: Partial<LocalStateUI>) {
			if (obj.hasOwnProperty("units") && obj.units === undefined) {
				obj.units = defaultUnits;
			}

			set(obj);
		},

		updateGameAttributes(gameAttributes: Partial<GameAttributesLeague>) {
			const keys = [
				"godMode",
				"homeCourtAdvantage",
				"lid",
				"leagueName",
				"phase",
				"season",
				"startingSeason",
				"teamAbbrevsCache",
				"teamImgURLsCache",
				"teamNamesCache",
				"teamRegionsCache",
				"userTid",
				"userTids",
			] as const;

			let update = false;

			const updates: Partial<GameAttributesLeague> = {};

			for (const key of keys) {
				if (
					gameAttributes.hasOwnProperty(key) &&
					updates[key] !== gameAttributes[key]
				) {
					// @ts-ignore
					updates[key] = gameAttributes[key];
					update = true;
				}
			}

			if (update) {
				set(state => ({ ...state, ...updates }));
			}
		},
	},
}));

const useLocalShallow = <T>(selector: (a: LocalStateUI) => T) =>
	useLocal<T>(selector, shallow);

// This assumes the actions object never changes!
const useLocalActions = () => useLocal(state => state.actions);

const localActions = local.getState().actions;

export { local, localActions, useLocal, useLocalActions, useLocalShallow };
