import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import type { LocalStateUI, GameAttributesLeague } from "../../common/types.ts";
import { defaultGameAttributes } from "../../common/defaultGameAttributes.ts";
import { safeLocalStorage } from "./safeLocalStorage.ts";
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

// State specific to a league, reset when switching leagues. statusText and phaseText are not included because they will be set later, no need to reset them and cause UI flicker
const getLeagueState = (): Pick<
	LocalStateUI,
	| (typeof gameAttributesSyncedToUi)[number]
	| "games"
	| "liveGameInProgress"
	| "playMenuOptions"
> => ({
	alwaysShowCountry: false,
	pomymarket: false,
	budget: defaultGameAttributes.budget,
	challengeNoRatings: false,
	challengeNoTrades: false,
	currencyFormat: defaultGameAttributes.currencyFormat,
	draftType: defaultGameAttributes.draftType,
	fantasyPoints: undefined,
	gameOver: false,
	gender: defaultGameAttributes.gender,
	godMode: false,
	hideDisabledTeams: false,
	homeCourtAdvantage: defaultGameAttributes.homeCourtAdvantage,
	luxuryPayroll: defaultGameAttributes.luxuryPayroll,
	luxuryTax: defaultGameAttributes.luxuryTax,
	maxContract: defaultGameAttributes.maxContract,
	minContract: defaultGameAttributes.minContract,
	minPayroll: defaultGameAttributes.minPayroll,
	neutralSite: defaultGameAttributes.neutralSite,
	nextPhase: undefined,
	numGames: defaultGameAttributes.numGames[0].value,
	numPeriods: defaultGameAttributes.numPeriods,
	numWatchColors: defaultGameAttributes.numWatchColors,
	otherTeamsWantToHire: false,
	phase: 0,
	quarterLength: defaultGameAttributes.quarterLength,
	salaryCap: defaultGameAttributes.salaryCap,
	salaryCapType: defaultGameAttributes.salaryCapType,
	season: 0,
	spectator: false,
	startingSeason: 0,
	teamInfoCache: [],
	userTid: 0,
	userTids: [],
	games: [],
	liveGameInProgress: false,
	playMenuOptions: [],

	// Controller.tsx relies on this being undefined (or at least different than the new lid) to trigger calling beforeView.league
	lid: undefined,
});

const useLocalRaw = createWithEqualityFn<LocalStateWithActions>(
	(set, get) => ({
		...getLeagueState(),
		customMenu: undefined,
		email: undefined,
		flagOverrides: {},
		fullNames: false,
		gameSimInProgress: false,
		gold: undefined,
		keyboardShortcuts: undefined,
		phaseText: "",
		popup: window.location.search === "?w=popup",
		showLeagueTopBar: initialShowLeagueTopBar,
		showNagModal: false,
		sidebarOpen: initialSidebarOpen,
		statusText: "Idle",
		units: defaultUnits,
		username: undefined,
		workerBusy: false,
		title: undefined,
		hideNewWindow: false,
		jumpTo: false,
		jumpToSeason: undefined,
		dropdown: undefined,
		moreInfoSeason: undefined,
		moreInfoTid: undefined,
		stickyFooterAd: false,
		stickyFormButtons: false,

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

			resetLeague() {
				set(getLeagueState());
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

				const email = obj.email;
				if (email && !obj.gold) {
					window.freestar.queue.push(async () => {
						// https://freestarhelp.zendesk.com/hc/en-us/articles/34498258990868-Hashed-Email-Passthrough
						const freestarNormalizeEmail = (email: string) => {
							const EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
							if (!EMAIL_REGEX.test(email)) {
								return;
							}

							email = email.trim().toLowerCase();

							const parts = email.split("@");
							let username = parts[0];
							const domain = parts[1];

							if (username !== undefined && domain === "gmail.com") {
								// Remove + and everything after
								const plusIndex = username.indexOf("+");
								if (plusIndex !== -1) {
									username = username.slice(0, plusIndex);
								}

								// Remove periods
								username = username.replace(/\./g, "");

								return `${username}@${domain}`;
							}

							return email;
						};

						const normalizedEmail = freestarNormalizeEmail(email);
						if (normalizedEmail !== undefined) {
							async function hash(
								algorithm: AlgorithmIdentifier,
								data: BufferSource,
							) {
								const buffer = await crypto.subtle.digest(algorithm, data);
								const bytes = new Uint8Array(buffer);

								// Chrome 140, Firefox 133, Safari 18.2 - switch to `bytes.toHex()`
								return [...bytes]
									.map((b) => b.toString(16).padStart(2, "0"))
									.join("");
							}

							const encoder = new TextEncoder();
							const data = encoder.encode(normalizedEmail);
							const sha1 = await hash("SHA-1", data);
							const sha256 = await hash("SHA-256", data);
							window.freestar?.identity?.setIdentity?.({
								hashes: {
									sha1,
									sha256,
								},
							});
						}
					});
				}

				set(obj);
			},

			updateGameAttributes(
				gameAttributes: Partial<GameAttributesLeague>,
				flagOverrides?: LocalStateUI["flagOverrides"],
			) {
				let update = false;

				const updates: Partial<LocalStateUI> = {};

				const state = get();
				for (const key of gameAttributesSyncedToUi) {
					if (
						Object.hasOwn(gameAttributes, key) &&
						state[key] !== gameAttributes[key]
					) {
						// @ts-expect-error
						updates[key] = gameAttributes[key];
						update = true;
					}
				}

				if (flagOverrides) {
					updates.flagOverrides = flagOverrides;
					update = true;
				}

				if (update) {
					set((state) => ({ ...state, ...updates }));
				}
			},
		},
	}),
	shallow,
);

const useLocal = <Key extends keyof LocalStateUI>(keys: Key[]) => {
	const selector = (state: LocalStateUI) => {
		const obj = {} as Pick<LocalStateUI, Key>;
		for (const key of keys) {
			obj[key] = state[key];
		}
		return obj;
	};

	return useLocalRaw(selector);
};

const local = useLocalRaw;

// This assumes the actions object never changes!
const localActions = local.getState().actions;

export { local, localActions, useLocal };
