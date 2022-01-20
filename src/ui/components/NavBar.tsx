import { Nav, Navbar, OverlayTrigger, Popover } from "react-bootstrap";
import { GAME_NAME, PHASE } from "../../common";
import {
	helpers,
	localActions,
	menuItems,
	safeLocalStorage,
	useLocalShallow,
} from "../util";
import { useViewData } from "../util/viewManager";
import DropdownLinks from "./DropdownLinks";
import LogoAndText from "./LogoAndText";
import PlayMenu from "./PlayMenu";

const PhaseStatusBlock = () => {
	const { liveGameInProgress, phase, phaseText, statusText } = useLocalShallow(
		state => ({
			liveGameInProgress: state.liveGameInProgress,
			phase: state.phase,
			phaseText: state.phaseText,
			statusText: state.statusText,
		}),
	);

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
	// game. This is needed because game sim happens before the results are displayed in liveGame.
	const text = (
		<>
			{liveGameInProgress ? "Live game" : phaseText}
			<br />
			{liveGameInProgress ? "in progress" : statusText}
		</>
	);

	const urls = {
		[PHASE.EXPANSION_DRAFT]: ["draft"],
		[PHASE.FANTASY_DRAFT]: ["draft"],
		[PHASE.PRESEASON]: ["roster"],
		[PHASE.REGULAR_SEASON]: ["roster"],
		[PHASE.AFTER_TRADE_DEADLINE]: ["roster"],
		[PHASE.PLAYOFFS]: ["playoffs"],
		// Hack because we don't know repeatSeason and draftType, see updatePhase
		[PHASE.DRAFT_LOTTERY]: phaseText.includes("after playoffs")
			? ["draft_scouting"]
			: ["draft_lottery"],
		[PHASE.DRAFT]: ["draft"],
		[PHASE.AFTER_DRAFT]: ["draft_history"],
		[PHASE.RESIGN_PLAYERS]: ["negotiation"],
		[PHASE.FREE_AGENCY]: ["free_agents"],
	};

	return (
		<div className="dropdown-links navbar-nav flex-shrink-1 overflow-hidden text-nowrap">
			<div className="nav-item">
				<a
					href={helpers.leagueUrl(urls[phase])}
					className="nav-link"
					style={{
						lineHeight: 1.35,
						padding: "9px 0 8px 16px",
					}}
				>
					{text}
				</a>
			</div>
		</div>
	);
};

const NavBar = ({ updating }: { updating: boolean }) => {
	const {
		lid,
		godMode,
		gold,
		hasViewedALeague,
		spectator,
		playMenuOptions,
		popup,
		username,
	} = useLocalShallow(state => ({
		lid: state.lid,
		godMode: state.godMode,
		gold: state.gold,
		hasViewedALeague: state.hasViewedALeague,
		spectator: state.spectator,
		playMenuOptions: state.playMenuOptions,
		popup: state.popup,
		username: state.username,
	}));
	const viewInfo = useViewData();

	// Checking lid too helps with some flicker
	const inLeague = viewInfo?.inLeague && lid !== undefined;

	if (popup) {
		return <div />;
	}

	const userBlock = username ? (
		<Nav.Link href="/account" aria-label="Account">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">{username}</span>
		</Nav.Link>
	) : (
		<Nav.Link href="/account/login_or_register" aria-label="Login/Register">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">Login/Register</span>
		</Nav.Link>
	);

	return (
		<Navbar
			bg="light"
			expand="sm"
			fixed="top"
			className="navbar-border flex-nowrap px-3"
		>
			<button
				className="navbar-toggler me-3"
				onClick={() => {
					localActions.toggleSidebar();
				}}
				type="button"
				aria-label="Toggle navigation"
			>
				<span className="navbar-toggler-icon" />
			</button>
			<LogoAndText gold={gold} inLeague={inLeague} updating={updating} />
			{inLeague ? (
				<Nav navbar>
					<OverlayTrigger
						placement="bottom"
						defaultShow={!hasViewedALeague && lid === 1}
						trigger="click"
						rootClose
						onExited={() => {
							localActions.update({
								hasViewedALeague: true,
							});
							safeLocalStorage.setItem("hasViewedALeague", "true");
						}}
						overlay={
							<Popover id="popover-welcome">
								<Popover.Header className="text-primary fw-bold">
									Welcome to {GAME_NAME}!
								</Popover.Header>
								<Popover.Body>
									To advance through the game, use the Play button at the top.
									The options shown will change depending on the current state
									of the game.
								</Popover.Body>
							</Popover>
						}
					>
						<PlayMenu
							lid={lid}
							spectator={spectator}
							options={playMenuOptions}
						/>
					</OverlayTrigger>
				</Nav>
			) : null}
			{inLeague ? <PhaseStatusBlock /> : null}
			<div className="flex-grow-1" />
			<div className="d-none d-sm-flex">
				<DropdownLinks
					godMode={godMode}
					inLeague={inLeague}
					lid={lid}
					menuItems={menuItems.filter(menuItem => !menuItem.commandPaletteOnly)}
				/>
			</div>
			<Nav id="top-user-block" navbar>
				<Nav.Item>{userBlock}</Nav.Item>
			</Nav>
		</Navbar>
	);
};

export default NavBar;
