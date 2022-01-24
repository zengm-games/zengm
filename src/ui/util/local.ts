import create from "zustand";
import shallow from "zustand/shallow";
import type { LocalStateUI, GameAttributesLeague } from "../../common/types";
import defaultGameAttributes from "../../common/defaultGameAttributes";
import safeLocalStorage from "./safeLocalStorage";

// These are variables that are needed to display parts of the UI not driven explicitly by worker/views/*.js files. Like
// the top navbar, the multi team menu, etc. They come from gameAttributes, the account system, and elsewhere.

type LocalActions = {
	deleteGames: (gids: number[]) => void;
	mergeGames: (games: LocalStateUI["games"]) => void;
	resetLeague: () => void;
	toggleSidebar: () => void;
	update: (obj: Partial<LocalStateUI>) => void;
	updateGameAttributes: (
		gameAttributes: Partial<GameAttributesLeague>,
		flagOverrides?: LocalStateUI["flagOverrides"],
	) => void;
};

const defaultUnits: "metric" | "us" =
	window.navigator.language === "en-US" ? "us" : "metric";

// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
const blockCloseTab = (e: BeforeUnloadEvent) => {
	// Cancel the event
	e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
	// Chrome requires returnValue to be set
	e.returnValue = "";
};

type LocalStateWithActions = LocalStateUI & {
	actions: LocalActions;
};

const useLocal = create<LocalStateWithActions>(set => ({
	challengeNoRatings: false,
	customMenu: undefined,
	dirtySettings: false,
	fantasyPoints: undefined,
	flagOverrides: {},
	gameSimInProgress: false,
	games: [],
	gold: undefined,
	godMode: false,
	hasViewedALeague: !!safeLocalStorage.getItem("hasViewedALeague"),
	hideDisabledTeams: false,
	homeCourtAdvantage: 1,
	lid: undefined,
	liveGameInProgress: false,
	numPeriods: defaultGameAttributes.numPeriods,
	phase: 0,
	phaseText: "",
	playMenuOptions: [],
	popup: window.location.search === "?w=popup",
	quarterLength: defaultGameAttributes.quarterLength,
	season: 0,
	showNagModal: false,
	sidebarOpen: false,
	spectator: false,
	startingSeason: 0,
	statusText: "Idle",
	teamInfoCache: [],
	units: defaultUnits,
	userTid: 0,
	userTids: [],
	username: undefined,
	title: undefined,
	hideNewWindow: false,
	jumpTo: false,
	jumpToSeason: undefined,
	dropdownCustomOptions: undefined,
	dropdownCustomURL: undefined,
	dropdownView: undefined,
	dropdownFields: {},
	moreInfoAbbrev: undefined,
	moreInfoSeason: undefined,
	moreInfoTid: undefined,
	stickyFooterAd: false,
	stickyFormButtons: false,

	actions: {
		deleteGames(gids: number[]) {
			set(state => {
				const newGames = state.games.filter(game => !gids.includes(game.gid));

				return {
					games: newGames,
				};
			});
		},

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

		// Reset any values specific to a league. statusText and phaseText will be set later, no need to override here and cause UI flicker
		resetLeague() {
			set({
				challengeNoRatings: false,
				games: [],
				godMode: false,
				hideDisabledTeams: false,
				homeCourtAdvantage: 1,

				// Controller.tsx relies on this being undefined (or at least different than the new lid) to trigger calling beforeView.league
				lid: undefined,
				liveGameInProgress: false,
				numPeriods: defaultGameAttributes.numPeriods,
				phase: 0,
				playMenuOptions: [],
				quarterLength: defaultGameAttributes.quarterLength,
				season: 0,
				startingSeason: 0,
				teamInfoCache: [],
				userTid: 0,
				userTids: [],
			});
			window.removeEventListener("beforeunload", blockCloseTab);
		},

		toggleSidebar() {
			set(state => ({ sidebarOpen: !state.sidebarOpen }));
		},

		update(obj: Partial<LocalStateUI>) {
			if (obj.hasOwnProperty("units") && obj.units === undefined) {
				obj.units = defaultUnits;
			}

			if (obj.hasOwnProperty("liveGameInProgress")) {
				if (obj.liveGameInProgress) {
					window.addEventListener("beforeunload", blockCloseTab);
				} else {
					window.removeEventListener("beforeunload", blockCloseTab);
				}
			}

			set(obj as any);
		},

		updateGameAttributes(
			gameAttributes: Partial<GameAttributesLeague>,
			flagOverrides?: LocalStateUI["flagOverrides"],
		) {
			// Keep in sync with gameAttributesToUI - this is just for TypeScript
			const keys = [
				"challengeNoRatings",
				"fantasyPoints",
				"godMode",
				"hideDisabledTeams",
				"homeCourtAdvantage",
				"lid",
				"numPeriods",
				"phase",
				"quarterLength",
				"season",
				"spectator",
				"startingSeason",
				"teamInfoCache",
				"userTid",
				"userTids",
			] as const;

			let update = false;

			const updates: Partial<LocalStateUI> = {};

			for (const key of keys) {
				if (
					gameAttributes.hasOwnProperty(key) &&
					updates[key] !== gameAttributes[key]
				) {
					// @ts-expect-error
					updates[key] = gameAttributes[key];
					update = true;
				}
			}

			if (flagOverrides) {
				updates.flagOverrides = flagOverrides;
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

const local = useLocal;
const localActions = local.getState().actions;

export { local, localActions, useLocal, useLocalActions, useLocalShallow };
