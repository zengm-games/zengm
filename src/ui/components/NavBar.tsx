import PropTypes from "prop-types";
import { Nav, Navbar, OverlayTrigger, Popover } from "react-bootstrap";
import { GAME_NAME } from "../../common";
import {
	localActions,
	menuItems,
	safeLocalStorage,
	useLocalShallow,
} from "../util";
import DropdownLinks from "./DropdownLinks";
import LogoAndText from "./LogoAndText";
import PlayMenu from "./PlayMenu";

type Props = {
	updating: boolean;
};

const NavBar = ({ updating }: Props) => {
	const {
		lid,
		liveGameInProgress,
		godMode,
		gold,
		hasViewedALeague,
		spectator,
		phaseText,
		playMenuOptions,
		popup,
		statusText,
		username,
		viewInfo,
	} = useLocalShallow(state => ({
		lid: state.lid,
		liveGameInProgress: state.liveGameInProgress,
		godMode: state.godMode,
		gold: state.gold,
		hasViewedALeague: state.hasViewedALeague,
		spectator: state.spectator,
		phaseText: state.phaseText,
		playMenuOptions: state.playMenuOptions,
		popup: state.popup,
		statusText: state.statusText,
		username: state.username,
		viewInfo: state.viewInfo,
	}));

	// Checking lid too helps with some flicker
	const inLeague = viewInfo?.inLeague && lid !== undefined;

	if (popup) {
		return <div />;
	}

	const userBlock = username ? (
		<Nav.Link href="/account">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">{username}</span>
		</Nav.Link>
	) : (
		<Nav.Link href="/account/login_or_register">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">Login/Register</span>
		</Nav.Link>
	);

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals	// game. This is needed because game sim happens before the results are displayed in liveGame.
	const phaseStatusBlock = (
		<div
			className="navbar-text flex-shrink-1 overflow-hidden text-nowrap"
			style={{
				lineHeight: 1.35,
				marginLeft: 16,
				padding: 0,
			}}
		>
			{liveGameInProgress ? "Live game" : phaseText}
			<br />
			{liveGameInProgress ? "in progress" : statusText}
		</div>
	);

	return (
		<Navbar
			bg="light"
			expand="sm"
			fixed="top"
			className="navbar-border flex-nowrap"
			role="banner"
		>
			<button
				className="navbar-toggler mr-3"
				onClick={() => {
					localActions.toggleSidebar();
				}}
				type="button"
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
								<Popover.Title className="text-primary font-weight-bold">
									Welcome to {GAME_NAME}!
								</Popover.Title>
								<Popover.Content>
									To advance through the game, use the Play button at the top.
									The options shown will change depending on the current state
									of the game.
								</Popover.Content>
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
			{inLeague ? phaseStatusBlock : null}
			<div className="flex-grow-1" />
			<div className="d-none d-sm-flex">
				<DropdownLinks
					godMode={godMode}
					inLeague={inLeague}
					lid={lid}
					menuItems={menuItems}
				/>
			</div>
			<Nav id="top-user-block" navbar>
				<Nav.Item>{userBlock}</Nav.Item>
			</Nav>
		</Navbar>
	);
};

NavBar.propTypes = {
	updating: PropTypes.bool.isRequired,
};

export default NavBar;
