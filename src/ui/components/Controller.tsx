import { LazyMotion } from "framer-motion";
import { memo, useCallback, useEffect } from "react";
import { localActions, useLocalShallow } from "../util";
import CommandPalette from "./CommandPalette";
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
import { useViewData } from "../util/viewManager";

const loadFramerMotionFeatures = () =>
	import("../util/framerMotionFeatures").then(res => res.default);

const minHeight100 = {
	// Just using h-100 class here results in the sticky ad in the skyscraper becoming unstuck after scrolling down 100% of the viewport, for some reason
	minHeight: "100%",
};

const minWidth0 = {
	// Fix for responsive table not being triggered by flexbox limits, and skyscraper ad overflowing content https://stackoverflow.com/a/36247448/786644
	minWidth: 0,
};

type KeepPreviousRenderWhileUpdatingProps = {
	children: any;
	updating: boolean;
};
const KeepPreviousRenderWhileUpdating = memo(
	(props: KeepPreviousRenderWhileUpdatingProps) => {
		return props.children;
	},
	(
		prevProps: KeepPreviousRenderWhileUpdatingProps,
		nextProps: KeepPreviousRenderWhileUpdatingProps,
	) => {
		// No point in rendering while updating contents
		return nextProps.updating;
	},
);

const Controller = () => {
	const state = useViewData();

	const { popup, showNagModal } = useLocalShallow(state2 => ({
		popup: state2.popup,
		showNagModal: state2.showNagModal,
	}));

	const closeNagModal = useCallback(() => {
		localActions.update({
			showNagModal: false,
		});
	}, []);

	useEffect(() => {
		if (popup) {
			document.body.style.paddingTop = "0";
			const css = document.createElement("style");
			css.innerHTML = ".new_window { display: none }";
			document.body.appendChild(css);
		}
	}, [popup]);

	const {
		Component,
		data,
		idLoading,
		idLoaded,
		inLeague,
		loading: updating,
	} = state;

	// Optimistically use idLoading before it renders, for UI responsiveness in the sidebar
	const sidebarPageID = idLoading ?? idLoaded;

	return (
		<LazyMotion strict features={loadFramerMotionFeatures}>
			<NavBar updating={updating} />
			<LeagueTopBar />
			<TitleBar />
			<div className="bbgm-container position-relative mt-2 flex-grow-1 h-100">
				<SideBar pageID={sidebarPageID} />
				<div className="d-flex" style={minHeight100}>
					<div className="w-100 d-flex flex-column" style={minWidth0}>
						<Header />
						<main className="p402_premium" id="actual-content">
							<div id="actual-actual-content" className="clearfix">
								<ErrorBoundary key={idLoaded}>
									{Component ? (
										<KeepPreviousRenderWhileUpdating updating={updating}>
											<Component {...data} />
										</KeepPreviousRenderWhileUpdating>
									) : null}
									{inLeague ? <MultiTeamMenu /> : null}
								</ErrorBoundary>
							</div>
						</main>
						<Footer />
					</div>
					<Skyscraper />
				</div>
				<CommandPalette />
				<NagModal close={closeNagModal} show={showNagModal} />
			</div>
			<Notifications />
		</LazyMotion>
	);
};

export default Controller;
