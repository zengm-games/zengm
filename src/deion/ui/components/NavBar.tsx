import PropTypes from "prop-types";
import React from "react";
import Nav from "reactstrap/lib/Nav";
import NavItem from "reactstrap/lib/NavItem";
import NavLink from "reactstrap/lib/NavLink";
import Navbar from "reactstrap/lib/Navbar";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import PopoverHeader from "reactstrap/lib/PopoverHeader";
import { helpers, localActions, menuItems, useLocalShallow } from "../util";
import DropdownLinks from "./DropdownLinks";
import LogoAndText from "./LogoAndText";
import PlayMenu from "./PlayMenu";
const sport = helpers.upperCaseFirstLetter(process.env.SPORT);
type Props = {
	pageID?: string;
	updating: boolean;
};

const NavBar = ({ pageID, updating }: Props) => {
	const {
		lid,
		godMode,
		gold,
		hasViewedALeague,
		phaseText,
		playMenuOptions,
		popup,
		statusText,
		username,
	} = useLocalShallow(state => ({
		lid: state.lid,
		godMode: state.godMode,
		gold: state.gold,
		hasViewedALeague: state.hasViewedALeague,
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
		<NavLink href="/account">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">{username}</span>
		</NavLink>
	) : (
		<NavLink href="/account/login_or_register">
			<span className="glyphicon glyphicon-user" />{" "}
			<span className="d-none d-lg-inline">Login/Register</span>
		</NavLink>
	);

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals	// game. This is needed because game sim happens before the results are displayed in liveGame.

	const phaseStatusBlock =
		pageID === "liveGame" ? (
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
			color="light"
			light
			expand="sm"
			fixed="top"
			className="navbar-border"
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
			<Nav navbar>
				<div
					id="play-menu"
					onClick={() => {
						// Hack because otherwise the popover doesn't close when the Play button is clicked, for some reason
						if (!hasViewedALeague) {
							localActions.update({
								hasViewedALeague: true,
							});
						}
					}}
				>
					<PlayMenu lid={lid} options={playMenuOptions} />
				</div>
				<Popover
					placement="bottom"
					isOpen={!hasViewedALeague && lid === 1}
					target="play-menu"
					toggle={() => {
						// This will run when it closes, so next time it will be hidden
						localActions.update({
							hasViewedALeague: true,
						});
						localStorage.setItem("hasViewedALeague", "true");
					}}
					trigger="click"
				>
					<PopoverHeader className="text-primary font-weight-bold">
						Welcome to {sport} GM!
					</PopoverHeader>
					<PopoverBody>
						To advance through the game, use the Play button at the top. The
						options shown will change depending on the current state of the
						game.
					</PopoverBody>
				</Popover>
			</Nav>
			{lid !== undefined ? phaseStatusBlock : null}
			<div className="flex-grow-1" />
			<div className="d-none d-sm-flex">
				<DropdownLinks godMode={godMode} lid={lid} menuItems={menuItems} />
			</div>
			<Nav id="top-user-block" navbar>
				<NavItem>{userBlock}</NavItem>
			</Nav>
		</Navbar>
	);
};

NavBar.propTypes = {
	pageID: PropTypes.string,
	updating: PropTypes.bool.isRequired,
};
export default NavBar;
