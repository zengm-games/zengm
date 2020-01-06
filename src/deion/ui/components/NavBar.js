// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import Dropdown from "reactstrap/lib/Dropdown";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import Nav from "reactstrap/lib/Nav";
import NavItem from "reactstrap/lib/NavItem";
import NavLink from "reactstrap/lib/NavLink";
import Navbar from "reactstrap/lib/Navbar";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import PopoverHeader from "reactstrap/lib/PopoverHeader";
import { helpers, localActions, menuItems, useLocalShallow } from "../util";
import LogoAndText from "./LogoAndText";
import PlayMenu from "./PlayMenu";

const sport = helpers.upperCaseFirstLetter(process.env.SPORT);

type TopMenuToggleProps = {
	long: string,
	openID?: string,
	short: string,
	toggle?: (SyntheticMouseEvent<HTMLAnchorElement>) => void,
};

const TopMenuToggle = ({ long, openID, short, toggle }: TopMenuToggleProps) => {
	const handleMouseEnter = useCallback(
		event => {
			if (openID !== undefined && openID !== long && toggle) {
				toggle(event);
			}
		},
		[long, openID, toggle],
	);

	return (
		<DropdownToggle caret nav onMouseEnter={handleMouseEnter}>
			<span className="d-xs-inline d-sm-none d-md-inline">{long}</span>
			<span className="d-none d-sm-inline d-md-none" title={long}>
				{short}
			</span>
		</DropdownToggle>
	);
};

TopMenuToggle.propTypes = {
	long: PropTypes.string.isRequired,
	openID: PropTypes.string,
	short: PropTypes.string.isRequired,
	toggle: PropTypes.func,
};

const TopMenuDropdown = ({ children, long, short, openID, onToggle }) => {
	const toggle = useCallback(event => onToggle(long, event), [long, onToggle]);
	return (
		<Dropdown isOpen={openID === long} nav inNavbar toggle={toggle}>
			<TopMenuToggle
				bsRole="toggle"
				long={long}
				short={short}
				openID={openID}
				toggle={toggle}
			/>
			<DropdownMenu right>
				<DropdownItem className="d-none d-sm-block d-md-none" header>
					{long}
				</DropdownItem>
				{children}
			</DropdownMenu>
		</Dropdown>
	);
};

TopMenuDropdown.propTypes = {
	children: PropTypes.any,
	long: PropTypes.string.isRequired,
	onToggle: PropTypes.func.isRequired,
	openID: PropTypes.string,
	short: PropTypes.string.isRequired,
};

const getText = (text): string | any => {
	if (text.hasOwnProperty("top")) {
		// $FlowFixMe
		return text.top;
	}

	// $FlowFixMe
	return text;
};

const MenuItem = ({ godMode, lid, menuItem, openID, onToggle, root }) => {
	if (!menuItem.league && lid !== undefined) {
		return null;
	}
	if (!menuItem.nonLeague && lid === undefined) {
		return null;
	}

	if (menuItem.type === "link") {
		if (menuItem.godMode && !godMode) {
			return null;
		}

		if (menuItem.text === "Switch League") {
			return null;
		}

		const anchorProps = {};
		if (typeof menuItem.path === "string") {
			anchorProps.href = menuItem.path;
			if (menuItem.path.startsWith("http")) {
				anchorProps.rel = "noopener noreferrer";
				anchorProps.target = "_blank";
			}
		} else if (Array.isArray(menuItem.path)) {
			anchorProps.href = helpers.leagueUrl(menuItem.path);
		}
		if (menuItem.onClick) {
			anchorProps.onClick = menuItem.onClick;
		}

		if (root) {
			return (
				<NavItem>
					<NavLink {...anchorProps}>{getText(menuItem.text)}</NavLink>
				</NavItem>
			);
		}

		return (
			<DropdownItem
				{...anchorProps}
				className={classNames({
					"god-mode": menuItem.godMode,
				})}
			>
				{getText(menuItem.text)}
			</DropdownItem>
		);
	}

	if (menuItem.type === "header") {
		const children = menuItem.children
			.map((child, i) => (
				<MenuItem
					godMode={godMode}
					lid={lid}
					key={i}
					menuItem={child}
					openID={openID}
					onToggle={onToggle}
					root={false}
				/>
			))
			.filter(element => element !== null);
		if (children.length === 0) {
			return null;
		}

		return (
			<TopMenuDropdown
				long={menuItem.long}
				short={menuItem.short}
				openID={openID}
				onToggle={onToggle}
			>
				{children}
			</TopMenuDropdown>
		);
	}

	throw new Error(`Unknown menuItem.type "${menuItem.type}"`);
};

type DropdownLinksProps = {
	godMode: boolean,
	lid: number | void,
};

const DropdownLinks = React.memo(({ godMode, lid }: DropdownLinksProps) => {
	const [openID, setOpenID] = useState();

	const handleTopMenuToggle = useCallback(
		(id: string, event: SyntheticMouseEvent<HTMLAnchorElement>) => {
			if (event.currentTarget && event.currentTarget.focus) {
				event.currentTarget.focus();
			}
			setOpenID(id === openID ? undefined : id);
		},
		[openID],
	);

	return (
		<Nav navbar id="top-dropdowns">
			{menuItems.map((menuItem, i) => (
				<MenuItem
					godMode={godMode}
					lid={lid}
					key={i}
					menuItem={menuItem}
					openID={openID}
					onToggle={handleTopMenuToggle}
					root
				/>
			))}
		</Nav>
	);
});

// $FlowFixMe
DropdownLinks.propTypes = {
	godMode: PropTypes.bool.isRequired,
	lid: PropTypes.number,
};

type Props = {
	pageID?: string,
	updating: boolean,
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

	// Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
	// game. This is needed because game sim happens before the results are displayed in liveGame.
	const phaseStatusBlock =
		pageID === "liveGame" ? (
			<span
				className="navbar-text"
				style={{ lineHeight: 1.35, marginLeft: 16, padding: 0 }}
			>
				Live game
				<br />
				in progress
			</span>
		) : (
			<span
				className="navbar-text"
				style={{ lineHeight: 1.35, marginLeft: 16, padding: 0 }}
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
							localActions.update({ hasViewedALeague: true });
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
						localActions.update({ hasViewedALeague: true });
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
				<DropdownLinks godMode={godMode} lid={lid} />
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
