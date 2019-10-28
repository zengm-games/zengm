// @flow

import create from "zustand";
import shallow from "zustand/shallow";
import type { GameAttributes, LocalStateUI } from "../../common/types";

// These are variables that are needed to display parts of the UI not driven explicitly by worker/views/*.js files. Like
// the top navbar, the multi team menu, etc. They come from gameAttributes, the account system, and elsewhere.

const [useLocal, local] = create(set => ({
	gold: undefined,
	godMode: false,
	hasViewedALeague: !!localStorage.getItem("hasViewedALeague"),
	lid: undefined,
	leagueName: "",
	phase: 0,
	phaseText: "",
	playMenuOptions: [],
	popup: window.location.search === "?w=popup",
	season: 0,
	showNagModal: false,
	sidebarOpen: false,
	startingSeason: 0,
	statusText: "",
	teamAbbrevsCache: [],
	teamNamesCache: [],
	teamRegionsCache: [],
	userTid: 0,
	userTids: [],
	username: undefined,
	viewInfo: undefined,

	actions: {
		// Reset any values specific to a league
		resetLeague() {
			set(state => ({
				...state,
				godMode: false,
				lid: undefined,
				leagueName: "",
				phase: 0,
				phaseText: "",
				playMenuOptions: [],
				season: 0,
				startingSeason: 0,
				statusText: "",
				teamAbbrevsCache: [],
				teamNamesCache: [],
				teamRegionsCache: [],
				userTid: 0,
				userTids: [],
			}));
		},

		toggleSidebar() {
			set(state => ({
				...state,
				sidebarOpen: !state.sidebarOpen,
			}));
		},

		update(obj: $Shape<LocalStateUI>) {
			set(state => ({
				...state,
				...obj,
			}));
		},

		updateGameAttributes(gameAttributes: GameAttributes) {
			const updates = {};

			const keys = [
				"godMode",
				"lid",
				"leagueName",
				"phase",
				"season",
				"startingSeason",
				"teamAbbrevsCache",
				"teamNamesCache",
				"teamRegionsCache",
				"userTid",
				"userTids",
			];

			let update = false;
			for (const key of keys) {
				if (
					gameAttributes.hasOwnProperty(key) &&
					updates[key] !== gameAttributes[key]
				) {
					updates[key] = gameAttributes[key];
					update = true;
				}
			}

			if (update) {
				set(state => ({
					...state,
					...updates,
				}));
			}
		},
	},
}));

const useLocalShallow = (selector: LocalStateUI => any) =>
	useLocal(selector, shallow);

const useLocalActions = () => useLocal(state => state.actions);

// This assumes the actions object never changes!
const localActions = local.getState().actions;

export { local, localActions, useLocal, useLocalActions, useLocalShallow };
