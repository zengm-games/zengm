import type { UpdateEvent, UpdateEvents } from "../../common/types.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { type Context, router } from "../router/index.ts";
import { local, localActions } from "./local.ts";
import { realtimeUpdate } from "./realtimeUpdate.ts";
import { toWorker } from "./toWorker.ts";
import { create } from "zustand";

/**
 * Things that might be nice, to improve this:
 *
 * - remove tight coupling with router
 * - automatically push updateEvents to other tabs, if there are any updateEvents
 * - good way to handle navigation+updateEvents, where navigation is only one tab but updateEvents go to other tabs
 * - tests
 */

type Action = {
	url?: string;
	refresh: boolean;
	replace?: boolean;
	updateEvents: UpdateEvents;
	raw?: Record<string, unknown>;
};

type State = {
	Component: any;
	loading: boolean;
	idLoaded: string | undefined;
	idLoading: string | undefined;
	inLeague: boolean;
	data: Record<string, any>;
	scrollToTop: boolean;
};

type ViewInfo = {
	Component: any;
	id: string;
	inLeague: boolean;
	context: Context;
};

export const useViewData = create<
	State & {
		actions: {
			startLoading: (idLoading: string) => void;
			doneLoading: (idLoaded: string) => void;
			reset: (state: State) => void;
		};
	}
>((set) => ({
	Component: undefined,
	loading: false,
	idLoaded: undefined,
	idLoading: undefined,
	inLeague: false,
	data: {},
	actions: {
		startLoading: (id: string) => set({ idLoading: id, loading: true }),
		doneLoading: (id: string) =>
			set({ idLoaded: id, idLoading: undefined, loading: false }),
		reset: (state: State) => {
			set(state);
		},
	},
	scrollToTop: false,
}));

const actions = useViewData.getState().actions;

const ErrorMessage = ({ errorMessage }: { errorMessage: string }) => {
	useTitleBar({
		title: "Error",
	});
	return <p>{errorMessage}</p>;
};

// There are two ways a page gets loaded:
//
// - Navigation: going to a URL, either from the router (like clicking a link) or from realtimeUpdate with a url. The latest navigation wins, and any load that started before it is discarded when it finishes.
// - Refresh: realtimeUpdate without a url, to update the current page. If a load is already running, this just marks that another load is needed when it finishes. So any number of refreshes that happen during a load result in one more load, which handles all of their updateEvents.
class ViewManager {
	viewData: Record<string, unknown>;
	viewInputs: unknown;
	viewKeepPrevOutputKeys: string[] | undefined;
	idLoaded: string | undefined;

	// updateEvents for a page that have not been handled by a load whose result was shown yet. Every update adds its events here when it is requested, every load sends all of them, and a load whose result is shown removes the ones it sent. So if a load is discarded (because a newer navigation started), its events are still here for the next load of the same page. Otherwise the page could show stale data.
	unhandledUpdateEvents:
		| {
				id: string;
				updateEvents: Set<UpdateEvent>;
		  }
		| undefined;

	// Incremented on every navigation. A load that finishes after a newer navigation started is discarded.
	navigationId: number;

	// navigationId of a navigation whose load is running or about to start. Refreshes wait for it to finish.
	loadingNavigationId: number | undefined;

	// True while refresh is running
	refreshing: boolean;

	// Callers of refreshes that are waiting for a load that handles their updateEvents
	refreshResolves: (() => void)[];

	constructor() {
		this.viewData = {};
		this.navigationId = 0;
		this.refreshing = false;
		this.refreshResolves = [];
	}

	private addUnhandledUpdateEvents(id: string, updateEvents: UpdateEvents) {
		// Events for a different page don't matter, because going back to that page will be a firstRun
		if (this.unhandledUpdateEvents?.id !== id) {
			this.unhandledUpdateEvents = {
				id,
				updateEvents: new Set(updateEvents),
			};
		} else {
			for (const updateEvent of updateEvents) {
				this.unhandledUpdateEvents.updateEvents.add(updateEvent);
			}
		}
	}

	private startNavigation() {
		this.navigationId += 1;
		this.loadingNavigationId = this.navigationId;

		// Any refreshes waiting are superseded by this navigation. Their updateEvents are still in unhandledUpdateEvents, so if this navigation is to the same page, it will handle them.
		const refreshResolves = this.refreshResolves;
		this.refreshResolves = [];
		for (const resolve of refreshResolves) {
			resolve();
		}
	}

	// Called when a navigation's load is done, or when it turns out there will be no load (like if the router blocked the navigation)
	private navigationFinished(navigationId: number) {
		if (this.loadingNavigationId === navigationId) {
			this.loadingNavigationId = undefined;
		}

		if (
			this.loadingNavigationId === undefined &&
			!this.refreshing &&
			this.refreshResolves.length > 0
		) {
			void this.refresh();
		}
	}

	async fromRouter(viewInfo: ViewInfo) {
		// If coming from fromRealtimeUpdate or refresh, state will contain navigationId
		if (viewInfo.context.state.navigationId === undefined) {
			// Coming only from router (like user clicked a link)
			this.startNavigation();
		} else if (viewInfo.context.state.navigationId !== this.navigationId) {
			// Must have been another navigation before this one processed
			return;
		}

		const navigationId = this.navigationId;
		try {
			await this.processUpdate(viewInfo, navigationId);
		} finally {
			this.navigationFinished(navigationId);
		}
	}

	async fromRealtimeUpdate(action: Action) {
		// Track these now, so they are handled by the next load of this page even if this update's own load gets discarded or never starts
		if (this.idLoaded !== undefined) {
			this.addUnhandledUpdateEvents(this.idLoaded, action.updateEvents);
		}

		const currentURL = window.location.pathname + window.location.search;
		const sameURL =
			action.url === undefined ||
			action.url === currentURL ||
			action.url === window.location.pathname;

		// raw is passed to the page through the navigation, so that needs a navigation even for the same URL
		if (sameURL && !action.raw) {
			// Return a promise because sometimes we want to wait for an update to process before continuing. For example, when simming multiple games, we want to update the UI between each day.
			const { promise, resolve } = Promise.withResolvers<void>();
			this.refreshResolves.push(resolve);
			if (this.loadingNavigationId === undefined && !this.refreshing) {
				void this.refresh();
			}
			await promise;
			return;
		}

		this.startNavigation();
		const navigationId = this.navigationId;

		try {
			await router.navigate(action.url ?? currentURL, {
				state: {
					noTrack: action.refresh || action.replace,
					updateEvents: action.updateEvents,
					navigationId,
					...action.raw,
				},
				refresh: action.refresh,

				// Would like to make this `replace: replace || url === undefined,` so it doesn't add a history entry on refreshes, but then Safari errors "Attempt to use history.replaceState() more than 100 times per 30 seconds"
				replace: action.replace,
			});
		} finally {
			this.navigationFinished(navigationId);
		}
	}

	// Load the current page again, handling all unhandledUpdateEvents. Any refreshes requested while that load is running are handled by one more load after it.
	private async refresh() {
		this.refreshing = true;
		try {
			while (
				this.refreshResolves.length > 0 &&
				this.loadingNavigationId === undefined
			) {
				const refreshResolves = this.refreshResolves;
				this.refreshResolves = [];

				await router.navigate(
					window.location.pathname + window.location.search,
					{
						state: {
							noTrack: true,
							updateEvents: [],
							navigationId: this.navigationId,
						},
						refresh: true,
					},
				);

				for (const resolve of refreshResolves) {
					resolve();
				}
			}
		} finally {
			this.refreshing = false;
		}
	}

	async processUpdate(
		{ Component, context, id, inLeague }: ViewInfo,
		navigationId: number,
	) {
		actions.startLoading(id);

		const updateEvents = context.state.updateEvents ?? [];

		let lidUrl: number | undefined;
		if (typeof context.params.lid === "string") {
			const newLidInt = Number.parseInt(context.params.lid);
			if (!Number.isNaN(newLidInt)) {
				lidUrl = newLidInt;
			}
		}

		let prevData: Record<string, unknown>;
		let prevInputs;

		// Worker views say which properties of their previous data they need, to avoid sending everything back every time
		let keepPrevOutputKeys: string[] | undefined;
		if (this.idLoaded !== id) {
			// This is the initial load of a page, so reset viewData and add firstRun update event
			if (!updateEvents.includes("firstRun")) {
				updateEvents.push("firstRun");
			}
			prevData = {};
		} else {
			prevData = {
				...this.viewData,
			};
			prevInputs = this.viewInputs;
			keepPrevOutputKeys = this.viewKeepPrevOutputKeys;
		}

		// Also include any events from previous loads of this page that were never shown
		this.addUnhandledUpdateEvents(id, updateEvents);

		// Copy, because unhandledUpdateEvents can change before this load finishes
		const updateEventsToSend = new Set(
			this.unhandledUpdateEvents!.updateEvents,
		);

		const lidCurrent = local.getState().lid;

		// Previously this was only called if necessary (switching to a new league, or leaving a league) but sometimes Safari seems to kill/restart the worker and then league state (g, idb) needs to be reset. And that can happen at any time!
		await toWorker("main", "beforeView", {
			inLeague,
			lidCurrent,
			lidUrl,
		});

		if (!inLeague && lidCurrent !== undefined) {
			localActions.updateGameAttributes({
				lid: undefined,
			});
		}

		if (navigationId !== this.navigationId) {
			return;
		}

		// ctxBBGM is hacky!
		const ctxBBGM = { ...context.state };
		delete ctxBBGM.err; // Can't send Error to worker

		// Resolve all the promises before updating the UI to minimize flicker
		const resultsAndInputs = await toWorker("main", "runBefore", {
			viewId: id,
			params: context.params,
			ctxBBGM,
			updateEvents: updateEventsToSend,
			prevOutput: Object.fromEntries(
				(keepPrevOutputKeys ?? [])
					.filter((key) => Object.hasOwn(prevData, key))
					.map((key) => [key, prevData[key]]),
			),
			prevInputs,
		});

		if (navigationId !== this.navigationId) {
			return;
		}

		// If results is undefined, it means the league wasn't loaded yet at the time of the request, likely because another league was opening in another tab at the same time. So stop now and wait until we get a signal that there is a new league.
		if (resultsAndInputs?.data === undefined) {
			actions.doneLoading(id);
			return;
		}

		const results = resultsAndInputs?.data;

		// If there was an error before, still show it unless we've received some other data. Otherwise, noop refreshes (return undefined from view, for non-matching updateEvent) would clear the error. Clear it only when some data is returned... which still is not great, because maybe the data is from a runBefore function that's different than the one that produced the error. Ideally would either need to track which runBefore function produced the error, this is a hack. THIS MAY NO LONGER BE TRUE AFTER CONSOLIDATING RUNBEFORE INTO A SINGLE FUNCTION, ideally the worker/views function could then handle conflicts itself. But currently the only ones returning errorMessage have just one function so it's either all or nothing.
		if (results && Object.keys(results).length > 0) {
			delete prevData.errorMessage;
		}

		let NewComponent = Component;

		if (
			prevData.errorMessage ||
			(results && Object.hasOwn(results, "errorMessage"))
		) {
			NewComponent = ErrorMessage;
		}

		const vars = {
			Component: NewComponent,
			data: Object.assign(prevData, results),
			loading: false,
			idLoaded: id,
			idLoading: undefined,
			inLeague,
			scrollToTop: updateEvents.length === 1 && updateEvents[0] === "firstRun",
		};

		if (vars.data && vars.data.redirectUrl !== undefined) {
			// Wait a tick, otherwise there is a race condition on new page loads (such as reloading live_game box score) where initView is called and updates viewInfo while the local.subscribe subscription below is unsubscribed due to updatePage changing.
			await new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 0);
			});

			realtimeUpdate(
				[],
				vars.data.redirectUrl,
				{
					backendRedirect: true,
				},
				true,
			);

			return;
		}

		actions.reset(vars);
		this.idLoaded = id;
		this.viewData = vars.data;
		this.viewInputs = resultsAndInputs.inputs;
		this.viewKeepPrevOutputKeys = resultsAndInputs.keepPrevOutputKeys;
		if (this.unhandledUpdateEvents?.id === id) {
			for (const updateEvent of updateEventsToSend) {
				this.unhandledUpdateEvents.updateEvents.delete(updateEvent);
			}
		}
	}
}

export const viewManager = new ViewManager();
