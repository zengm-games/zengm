import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import type { LocalStateUI, GameAttributesLeague } from "../../common/types.ts";
import defaultGameAttributes from "../../common/defaultGameAttributes.ts";
import safeLocalStorage from "./safeLocalStorage.ts";
import { gameAttributesSyncedToUi } from "../../common/gameAttributesSyncedToUi.ts";

// These are variables that are needed to display parts of the UI not driven explicitly by worker/views/*.js files. Like
// the top navbar, the multi team menu, etc. They come from gameAttributes, the account system, and elsewhere.

type LocalActions = {
	deleteGames: (gids: number[]) => void;
	mergeGames: (games: LocalStateUI["games"]) => void;
	resetLeague: () => void;
	setShowLeagueTopBar: (showLeagueTopBar: boolean) => void;
	setSidebarOpen: (sidebarOpen: boolean) => void;
	update: (obj: Partial<LocalStateUI>) => void;
	updateGameAttributes: (
		gameAttributes: Partial<GameAttributesLeague>,
		flagOverrides?: LocalStateUI["flagOverrides"],
	) => void;
};

const defaultUnits: "metric" | "us" =
	window.navigator.language === "en-US" ? "us" : "metric";

type LocalStateWithActions = LocalStateUI & {
	actions: LocalActions;
};

let initialSidebarOpen: boolean;
if (window.innerWidth >= 1200) {
	// Large screen - default may be saved, if not default to open
	const saved = safeLocalStorage.getItem("sidebarOpen");
	initialSidebarOpen = saved !== "false";
} else {
	initialSidebarOpen = false;
}

let initialShowLeagueTopBar: boolean;
const showTemp = safeLocalStorage.getItem("bbgmShowLeagueTopBar");
if (showTemp === "true") {
	initialShowLeagueTopBar = true;
} else if (showTemp === "false") {
	initialShowLeagueTopBar = false;
} else {
	initialShowLeagueTopBar = true;
}

const useLocal = createWithEqualityFn<LocalStateWithActions>(
	(set) => ({
		alwaysShowCountry: false,
		challengeNoRatings: false,
		currencyFormat: defaultGameAttributes.currencyFormat,
		customMenu: undefined,
		email: undefined,
		fantasyPoints: undefined,
		flagOverrides: {},
		fullNames: false,
		gameSimInProgress: false,
		games: [],
		gender: defaultGameAttributes.gender,
		gold: undefined,
		godMode: false,
		hideDisabledTeams: false,
		homeCourtAdvantage: 1,
		lid: undefined,
		liveGameInProgress: false,
		neutralSite: defaultGameAttributes.neutralSite,
		numPeriods: defaultGameAttributes.numPeriods,
		numWatchColors: defaultGameAttributes.numWatchColors,
		phase: 0,
		phaseText: "",
		playMenuOptions: [],
		popup: window.location.search === "?w=popup",
		quarterLength: defaultGameAttributes.quarterLength,
		season: 0,
		showLeagueTopBar: initialShowLeagueTopBar,
		showNagModal: false,
		sidebarOpen: initialSidebarOpen,
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

		// Cloud sync properties
		cloudSyncStatus: undefined,
		cloudLeagueId: undefined,
		cloudLockHolder: null,
		cloudLockOperation: null,

		actions: {
			deleteGames(gids: number[]) {
				set((state) => {
					const newGames = state.games.filter(
						(game) => !gids.includes(game.gid),
					);

					return {
						games: newGames,
					};
				});
			},

			mergeGames(games: LocalStateUI["games"]) {
				set((state) => {
					const newGames = state.games.slice();

					for (const game of games) {
						const index = newGames.findIndex(
							(newGame) => newGame.gid === game.gid,
						);
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
					alwaysShowCountry: false,
					challengeNoRatings: false,
					games: [],
					godMode: false,
					hideDisabledTeams: false,
					homeCourtAdvantage: 1,

					// Controller.tsx relies on this being undefined (or at least different than the new lid) to trigger calling beforeView.league
					lid: undefined,
					liveGameInProgress: false,
					numPeriods: defaultGameAttributes.numPeriods,
					numWatchColors: defaultGameAttributes.numWatchColors,
					phase: 0,
					playMenuOptions: [],
					quarterLength: defaultGameAttributes.quarterLength,
					season: 0,
					startingSeason: 0,
					teamInfoCache: [],
					userTid: 0,
					userTids: [],
				});
			},

			setShowLeagueTopBar(showLeagueTopBar: boolean) {
				set({ showLeagueTopBar });
				safeLocalStorage.setItem(
					"bbgmShowLeagueTopBar",
					String(showLeagueTopBar),
				);
			},

			setSidebarOpen(sidebarOpen: boolean) {
				if (window.innerWidth >= 1200) {
					if (sidebarOpen) {
						// Don't save true, cause default is true
						safeLocalStorage.removeItem("sidebarOpen");
					} else {
						safeLocalStorage.setItem("sidebarOpen", "false");
					}
				}

				set({ sidebarOpen });
			},

			update(obj: Partial<LocalStateUI>) {
				if (Object.hasOwn(obj, "units") && obj.units === undefined) {
					obj.units = defaultUnits;
				}

				if (obj.email && !obj.gold) {
					window.freestar.queue.push(() => {
						window.freestar.identity.setIdentity({
							email: obj.email,
						});
					});
				}

				set(obj as any);
			},

			updateGameAttributes(
				gameAttributes: Partial<GameAttributesLeague>,
				flagOverrides?: LocalStateUI["flagOverrides"],
			) {
				let update = false;

				const updates: Partial<LocalStateUI> = {};

				for (const key of gameAttributesSyncedToUi) {
					if (
						Object.hasOwn(gameAttributes, key) &&
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
					set((state) => ({ ...state, ...updates }));
				}
			},
		},
	}),
	shallow,
);

const useLocalPartial = <Key extends keyof LocalStateUI>(keys: Key[]) => {
	const selector = (state: LocalStateUI) => {
		const obj = {} as Pick<LocalStateUI, Key>;
		for (const key of keys) {
			obj[key] = state[key];
		}
		return obj;
	};

	return useLocal(selector);
};

// This assumes the actions object never changes!
const useLocalActions = () => useLocal((state) => state.actions);

const local = useLocal;
const localActions = local.getState().actions;

export { local, localActions, useLocal, useLocalActions, useLocalPartial };
