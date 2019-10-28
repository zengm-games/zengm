// @flow

import PropTypes from "prop-types";
import React, { useCallback, useEffect, useReducer, useRef } from "react";
import {
	emitter,
	localActions,
	realtimeUpdate,
	setTitle,
	toWorker,
	useLocalShallow,
} from "../util";
import ErrorBoundary from "./ErrorBoundary";
import Footer from "./Footer";
import Header from "./Header";
import MultiTeamMenu from "./MultiTeamMenu";
import NagModal from "./NagModal";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import type { GetOutput, RouterContext } from "../../common/types";

type Props = {
	children: any,
	updating: boolean,
};

class LeagueContent extends React.Component<Props> {
	// eslint-disable-next-line class-methods-use-this
	shouldComponentUpdate(nextProps) {
		return !nextProps.updating;
	}

	render() {
		return this.props.children;
	}
}

LeagueContent.propTypes = {
	updating: PropTypes.bool.isRequired,
};

const ErrorMessage = ({ errorMessage }: { errorMessage: string }) => {
	setTitle("Error");
	return (
		<>
			<h1>Error</h1>
			<h2>{errorMessage}</h2>
		</>
	);
};

type Args = {
	Component: any,
	id: string,
	inLeague: boolean,
	get: (ctx: RouterContext) => ?GetOutput,
};

type State = {
	Component: any,
	loading: boolean,
	inLeague: boolean,
	data: { [key: string]: any },
};

const reducer = (state: State, action: any) => {
	switch (action.type) {
		case "startLoading":
			return {
				...state,
				loading: true,
			};
		case "doneLoading":
			return {
				...state,
				loading: false,
			};
		case "reset":
			return action.vars;
		default:
			throw new Error(`Unknown action type "${action.type}"`);
	}
};

const Controller = () => {
	const [state, dispatch] = useReducer(reducer, {
		Component: undefined,
		loading: false,
		inLeague: false,
		data: {},
	});

	const idLoaded = useRef(undefined);
	const idLoading = useRef(undefined);

	const { lid, popup, showNagModal } = useLocalShallow(state2 => ({
		lid: state2.lid,
		popup: state2.popup,
		showNagModal: state2.showNagModal,
	}));

	const closeNagModal = useCallback(() => {
		localActions.update({ showNagModal: false });
	}, []);

	const updatePage = useCallback(
		async (args: Args, context: RouterContext) => {
			const updateEvents =
				context.state.updateEvents !== undefined
					? context.state.updateEvents
					: [];
			const newLidInt = parseInt(context.params.lid, 10);
			const newLid = Number.isNaN(newLidInt) ? undefined : newLidInt;

			// Reset league content and view model only if it's:
			// (1) if it's not loaded and not loading yet
			// (2) loaded, but loading something else
			let prevData;
			if (
				(idLoaded.current !== args.id && idLoading.current !== args.id) ||
				(idLoaded.current === args.id &&
					idLoading.current !== args.id &&
					idLoading.current !== undefined)
			) {
				if (!updateEvents.includes("firstRun")) {
					updateEvents.push("firstRun");
				}

				prevData = {};
			} else if (idLoading.current === args.id) {
				// If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
				return;
			} else {
				prevData = state.data;
			}

			dispatch({ type: "startLoading" });
			idLoading.current = args.id;

			if (args.inLeague) {
				if (newLid !== lid) {
					await toWorker("beforeViewLeague", newLid, lid);
				}
			} else {
				// eslint-disable-next-line no-lonely-if
				if (lid !== undefined) {
					await toWorker("beforeViewNonLeague");
					localActions.updateGameAttributes({
						lid: undefined,
					});
				}
			}

			// ctxBBGM is hacky!
			const ctxBBGM = { ...context.state };
			delete ctxBBGM.err; // Can't send error to worker

			// Resolve all the promises before updating the UI to minimize flicker
			const results = await toWorker(
				"runBefore",
				args.id,
				context.params,
				ctxBBGM,
				updateEvents,
				prevData,
			);

			// If results is undefined, it means the league wasn't loaded yet at the time of the request, likely because another league was opening in another tab at the same time. So stop now and wait until we get a signal that there is a new league.
			if (results === undefined) {
				dispatch({ type: "doneLoading" });
				idLoading.current = undefined;
				return;
			}

			// If there was an error before, still show it unless we've received some other data. Otherwise, noop refreshes (return undefined from view, for non-matching updateEvent) would clear the error. Clear it only when some data is returned... which still is not great, because maybe the data is from a runBefore function that's different than the one that produced the error. Ideally would either need to track which runBefore function produced the error, this is a hack.
			if (results && results.some(result => !!result)) {
				delete prevData.errorMessage;
			}
			let NewComponent = prevData.errorMessage ? ErrorMessage : args.Component;

			for (const result of results) {
				if (
					result &&
					Object.keys(result).length === 1 &&
					result.hasOwnProperty("errorMessage")
				) {
					NewComponent = ErrorMessage;
				}
			}

			const vars = {
				Component: NewComponent,
				data: Object.assign(prevData, ...results),
				loading: false,
				inLeague: args.inLeague,
			};

			if (vars.data && vars.data.redirectUrl !== undefined) {
				// Reset idLoading, otherwise it will think loading is already in progress on redirect
				dispatch({ type: "doneLoading" });
				idLoading.current = undefined;

				await realtimeUpdate([], vars.data.redirectUrl, {}, true);
				return;
			}

			// Make sure user didn't navigate to another page while async stuff was happening
			if (idLoading.current === args.id) {
				dispatch({ type: "reset", vars });

				idLoaded.current = args.id;
				idLoading.current = undefined;

				// Scroll to top if this load came from user clicking a link
				if (updateEvents.length === 1 && updateEvents[0] === "firstRun") {
					window.scrollTo(window.pageXOffset, 0);
				}
			}
		},
		[lid, state.data],
	);

	const get = useCallback(
		async (args: Args, context: RouterContext) => {
			await updatePage(args, context);
		},
		[updatePage],
	);

	useEffect(() => {
		emitter.on("get", get);

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

		return () => {
			emitter.removeListener("get", get);
		};
	}, [get, popup]);

	const { Component, data, inLeague, loading } = state;

	let contents;
	const pageID = idLoading.current || idLoaded.current; // idLoading, idLoaded, or undefined
	if (!Component) {
		contents = <h1 style={{ textAlign: "center" }}>Loading...</h1>; // Nice, aligned with splash screen
	} else if (!inLeague) {
		contents = <Component {...data} />;
	} else {
		contents = (
			<>
				<LeagueContent updating={loading}>
					<Component {...data} />
				</LeagueContent>
				<MultiTeamMenu />
			</>
		);
	}

	return (
		<>
			<NavBar pageID={pageID} updating={loading} />
			<div className="bbgm-container">
				<Header />
				<SideBar pageID={pageID} />
				<div className="p402_premium" id="actual-content">
					<div id="actual-actual-content">
						<ErrorBoundary key={pageID}>{contents}</ErrorBoundary>
					</div>
					<Footer />
				</div>
				<NagModal close={closeNagModal} show={showNagModal} />
			</div>
		</>
	);
};

export default Controller;
