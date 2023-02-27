import { LazyMotion } from "framer-motion";
import { memo, useCallback, useEffect } from "react";
import { localActions, useLocalPartial } from "../util";
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
import { isSport } from "../../common";
import api from "../api";

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

	const { popup, showNagModal } = useLocalPartial(["popup", "showNagModal"]);

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

	useEffect(() => {
		// Try to show ads on initial render
		api.initAds("uiRendered");
	}, []);

	const {
		Component,
		data,
		idLoading,
		idLoaded,
		inLeague,
		loading: updating,
		scrollToTop,
	} = state;

	// Optimistically use idLoading before it renders, for UI responsiveness in the sidebar
	const sidebarPageID = idLoading ?? idLoaded;

	const pathname = isSport("baseball") ? document.location.pathname : undefined;

	// Scroll to top if this load came from user clicking a link to a new page
	useEffect(() => {
		if (scrollToTop) {
			window.scrollTo(window.pageXOffset, 0);
		}
	}, [idLoaded, scrollToTop]);

	return (
		<LazyMotion strict features={loadFramerMotionFeatures}>
			<NavBar updating={updating} />
			<div className="h-100 d-flex">
				<SideBar pageID={sidebarPageID} pathname={pathname} />
				<div className="h-100 w-100 d-flex flex-column" style={minWidth0}>
					<LeagueTopBar />
					<TitleBar />
					<div className="container-fluid position-relative mt-2 flex-grow-1 h-100">
						<div className="d-flex" style={minHeight100}>
							<div className="w-100 d-flex flex-column" style={minWidth0}>
								<Header />
								<main className="p402_premium">
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
				</div>
			</div>
			<Notifications />
		</LazyMotion>
	);
};

export default Controller;
