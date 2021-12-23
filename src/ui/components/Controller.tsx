import { LazyMotion } from "framer-motion";
import PropTypes from "prop-types";
import { memo, useCallback, useEffect, useReducer, useRef } from "react";
import useTitleBar from "../hooks/useTitleBar";
import {
	local,
	localActions,
	realtimeUpdate,
	toWorker,
	useLocalShallow,
} from "../util";
import ErrorBoundary from "./ErrorBoundary";
import Footer from "./Footer";
import Header from "./Header";
import LeagueTopBar from "./LeagueTopBar";
import MultiTeamMenu from "./MultiTeamMenu";
import NagModal from "./NagModal";
import NavBar from "./NavBar";
import Notifications from "./Notifications";
import SideBar from "./SideBar";
import Skyscraper from "./Skyscraper";
import TitleBar from "./TitleBar";
import type { LocalStateUI } from "../../common/types";
import type { Context } from "../router";

const loadFramerMotionFeatures = () =>
	import("../util/framerMotionFeatures").then(res => res.default);

type LeagueContentProps = {
	children: any;
	updating: boolean;
};
const LeagueContent = memo(
	(props: LeagueContentProps) => {
		return props.children;
	},
	(prevProps: LeagueContentProps, nextProps: LeagueContentProps) => {
		// No point in rendering while updating contents
		return nextProps.updating;
	},
);

// @ts-ignore
LeagueContent.propTypes = {
	updating: PropTypes.bool.isRequired,
};

const ErrorMessage = ({ errorMessage }: { errorMessage: string }) => {
	useTitleBar({
		title: "Error",
	});
	return <p>{errorMessage}</p>;
};

type State = {
	Component: any;
	loading: boolean;
	inLeague: boolean;
	data: Record<string, any>;
};

type Action =
	| {
			type: "startLoading";
	  }
	| {
			type: "doneLoading";
	  }
	| {
			type: "reset";
			vars: State;
	  };

const reducer = (state: State, action: Action) => {
	switch (action.type) {
		case "startLoading":
			return { ...state, loading: true };

		case "doneLoading":
			return { ...state, loading: false };

		case "reset":
			return action.vars;
	}
};

const minHeight100 = {
	// Just using h-100 class here results in the sticky ad in the skyscraper becoming unstuck after scrolling down 100% of the viewport, for some reason
	minHeight: "100%",
};

const minWidth0 = {
	// Fix for responsive table not being triggered by flexbox limits, and skyscraper ad overflowing content https://stackoverflow.com/a/36247448/786644
	minWidth: 0,
};

const Controller = () => {
	const [state, dispatch] = useReducer(reducer, {
		Component: undefined,
		loading: false,
		inLeague: false,
		data: {},
	});

	const prevData2 = useRef<Record<string, any>>({});
	const idLoaded = useRef<string | undefined>(undefined);
	const loading = useRef<
		| {
				id: string;
				promise: Promise<void>;
		  }
		| undefined
	>(undefined);

	const { lid, popup, showNagModal } = useLocalShallow(state2 => ({
		lid: state2.lid,
		popup: state2.popup,
		showNagModal: state2.showNagModal,
	}));

	const closeNagModal = useCallback(() => {
		localActions.update({
			showNagModal: false,
		});
	}, []);

	const updatePage = useCallback(
		async (Component: any, id: string, inLeague: boolean, context: Context) => {
			const updateEvents =
				context.state.updateEvents !== undefined
					? context.state.updateEvents
					: [];

			let newLid: number | undefined;
			if (typeof context.params.lid === "string") {
				const newLidInt = parseInt(context.params.lid);
				if (!Number.isNaN(newLidInt)) {
					newLid = newLidInt;
				}
			}

			// Reset league content and view model only if it's:
			// (1) if it's not loaded and not loading yet
			// (2) loaded, but loading something else
			let prevData;
			if (
				(idLoaded.current !== id && loading.current?.id !== id) ||
				(idLoaded.current === id &&
					loading.current !== undefined &&
					loading.current.id !== id)
			) {
				if (!updateEvents.includes("firstRun")) {
					updateEvents.push("firstRun");
				}

				prevData = {};
			} else {
				if (loading.current?.id === id) {
					if (updateEvents.length === 0) {
						// Nothing in updateEvents, so this isn't adding anything beyond the current in-progress render
						return;
					}

					// Something is in updateEvents, so wait for previous load to finish and then process this one, so we don't lose any updateEvent. This is what allows e.g. the enable/disable god mode button to consistently update its own page during game sim.
					await loading.current.promise;

					if (
						(loading.current !== undefined && loading.current.id !== id) ||
						idLoaded.current !== id
					) {
						// User must have navigated away. This will still lose some events, but only for other tabs which were expected to recieve it from the worker below, which is probably not that important.
						return;
					}
				}

				prevData = {
					...prevData2.current,
				};
			}

			dispatch({
				type: "startLoading",
			});

			// Need resolveLoadingPromise to handle situation where updatePage is called with an important updateEvent while a prior call is still running, so we need to wait for the prior call to finish and then run with this updateEvent.
			let resolveLoadingPromise: () => void;
			const loadingPromise = new Promise<void>(resolve => {
				resolveLoadingPromise = resolve;
			});
			if (loading.current) {
				loading.current = {
					id,
					promise: loading.current.promise.then(() => loadingPromise),
				};
			} else {
				loading.current = {
					id,
					promise: loadingPromise,
				};
			}

			if (inLeague) {
				if (newLid !== lid) {
					await toWorker("main", "beforeViewLeague", newLid, lid);
				}
			} else {
				// eslint-disable-next-line no-lonely-if
				if (lid !== undefined) {
					await toWorker("main", "beforeViewNonLeague");
					localActions.updateGameAttributes({
						lid: undefined,
					});
				}
			}

			if (loading.current?.id !== id) {
				// User must have navigated away
				resolveLoadingPromise!();
				return;
			}

			// ctxBBGM is hacky!
			const ctxBBGM = { ...context.state };
			delete ctxBBGM.err; // Can't send error to worker

			// Resolve all the promises before updating the UI to minimize flicker
			const results = await toWorker(
				"main",
				"runBefore",
				id,
				context.params,
				ctxBBGM,
				updateEvents,
				prevData,
			);

			if (loading.current?.id !== id) {
				// User must have navigated away
				resolveLoadingPromise!();
				return;
			}

			// If results is undefined, it means the league wasn't loaded yet at the time of the request, likely because another league was opening in another tab at the same time. So stop now and wait until we get a signal that there is a new league.
			if (results === undefined) {
				dispatch({
					type: "doneLoading",
				});
				loading.current = undefined;
				resolveLoadingPromise!();
				return;
			}

			// If there was an error before, still show it unless we've received some other data. Otherwise, noop refreshes (return undefined from view, for non-matching updateEvent) would clear the error. Clear it only when some data is returned... which still is not great, because maybe the data is from a runBefore function that's different than the one that produced the error. Ideally would either need to track which runBefore function produced the error, this is a hack. THIS MAY NO LONGER BE TRUE AFTER CONSOLIDATING RUNBEFORE INTO A SINGLE FUNCTION, ideally the worker/views function could then handle conflicts itself. But currently the only ones returning errorMessage have just one function so it's either all or nothing.
			if (results && Object.keys(results).length > 0) {
				delete prevData.errorMessage;
			}

			let NewComponent = Component;

			if (
				prevData.errorMessage ||
				(results && results.hasOwnProperty("errorMessage"))
			) {
				NewComponent = ErrorMessage;
			}

			const vars = {
				Component: NewComponent,
				data: Object.assign(prevData, results),
				loading: false,
				inLeague,
			};

			if (vars.data && vars.data.redirectUrl !== undefined) {
				// Reset idLoading, otherwise it will think loading is already in progress on redirect
				dispatch({
					type: "doneLoading",
				});
				loading.current = undefined;

				// Wait a tick, otherwise there is a race condition on new page loads (such as reloading live_game box score) where initView is called and updates viewInfo while the local.subscribe subscription below is unsubscribed due to updatePage changing.
				await new Promise<void>(resolve => {
					setTimeout(() => {
						resolve();
					}, 0);
				});

				await realtimeUpdate(
					[],
					vars.data.redirectUrl,
					{
						backendRedirect: true,
					},
					true,
				);

				resolveLoadingPromise!();
				return;
			}

			// Make sure user didn't navigate to another page while async stuff was happening
			if (loading.current?.id === id) {
				dispatch({
					type: "reset",
					vars,
				});
				idLoaded.current = id;
				loading.current = undefined;
				prevData2.current = vars.data;

				// Scroll to top if this load came from user clicking a link
				if (updateEvents.length === 1 && updateEvents[0] === "firstRun") {
					window.scrollTo(window.pageXOffset, 0);
				}
			}

			resolveLoadingPromise!();
		},
		[lid],
	);

	useEffect(() => {
		return local.subscribe(
			state2 => state2.viewInfo,
			async (viewInfo: LocalStateUI["viewInfo"] | null) => {
				if (viewInfo !== undefined && viewInfo !== null) {
					try {
						await updatePage(
							viewInfo.Component,
							viewInfo.id,
							viewInfo.inLeague,
							viewInfo.context,
						);
					} catch (error) {
						viewInfo.cb(error);
						return;
					}

					viewInfo.cb();
				}
			},
		);
	}, [updatePage]);

	useEffect(() => {
		if (popup && document.body) {
			if (document.body) {
				document.body.style.paddingTop = "0";
			}

			const css = document.createElement("style");
			css.type = "text/css";
			css.innerHTML = ".new_window { display: none }";

			if (document.body) {
				document.body.appendChild(css);
			}
		}
	}, [popup]);

	const { Component, data, inLeague, loading: updating } = state;
	let contents;
	const pageID = loading.current?.id ?? idLoaded.current; // idLoading, idLoaded, or undefined

	if (!Component) {
		contents = null;
	} else if (!inLeague) {
		contents = <Component {...data} />;
	} else {
		contents = (
			<>
				<LeagueContent updating={updating}>
					<Component {...data} />
				</LeagueContent>
				<MultiTeamMenu />
			</>
		);
	}

	return (
		<LazyMotion strict features={loadFramerMotionFeatures}>
			<NavBar updating={updating} />
			<LeagueTopBar />
			<TitleBar />
			<div className="bbgm-container position-relative mt-2 flex-grow-1 h-100">
				<SideBar pageID={pageID} />
				<div className="d-flex" style={minHeight100}>
					<div className="w-100 d-flex flex-column" style={minWidth0}>
						<Header />
						<main className="p402_premium" id="actual-content">
							<div id="actual-actual-content" className="clearfix">
								<ErrorBoundary key={pageID}>{contents}</ErrorBoundary>
							</div>
						</main>
						<Footer />
					</div>
					<Skyscraper />
				</div>
				<NagModal close={closeNagModal} show={showNagModal} />
			</div>
			<Notifications />
		</LazyMotion>
	);
};

export default Controller;
