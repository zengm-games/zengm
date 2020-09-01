import PropTypes from "prop-types";
import React from "react";
import { Nav, Navbar, OverlayTrigger, Popover } from "react-bootstrap";
import {
	helpers,
	localActions,
	menuItems,
	safeLocalStorage,
	useLocalShallow,
} from "../util";
import DropdownLinks from "./DropdownLinks";
import LogoAndText from "./LogoAndText";
import PlayMenu from "./PlayMenu";

const sport = helpers.upperCaseFirstLetter(process.env.SPORT);

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
	}));

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
	const phaseStatusBlock = liveGameInProgress ? (
		<span
			className="navbar-text"
			style={{
				lineHeight: 1.35,
				marginLeft: 16,
				padding: 0,
			}}
		>
			Live game
			<br />
			in progress
		</span>
	) : (
		<span
			className="navbar-text"
			style={{
				lineHeight: 1.35,
				marginLeft: 16,
				padding: 0,
			}}
		>
			{phaseText}
			<br />
			{statusText}
		</span>
	);

	return (
		<Navbar
			bg="light"
			expand="sm"
			fixed="top"
			className="navbar-border"
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
			<LogoAndText gold={gold} lid={lid} updating={updating} />
			{lid !== undefined ? (
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
									Welcome to {sport} GM!
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
			{lid !== undefined ? phaseStatusBlock : null}
			<div className="flex-grow-1" />
			<div className="d-none d-sm-flex">
				<DropdownLinks godMode={godMode} lid={lid} menuItems={menuItems} />
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
