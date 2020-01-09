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
import { helpers } from "../util";
import { MenuItemLink, MenuItemHeader } from "../../common/types";
type TopMenuToggleProps = {
	long: string;
	openID?: string;
	short: string;
	toggle?: (a: SyntheticMouseEvent<HTMLAnchorElement>) => void;
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
	} // $FlowFixMe

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
	className?: string;
	godMode?: boolean;
	lid: number | void;
	menuItems: (MenuItemLink | MenuItemHeader)[];
}; // $FlowFixMe

const DropdownLinks = React.memo(
	({ className, godMode, lid, menuItems }: DropdownLinksProps) => {
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
			<Nav navbar className={classNames(className, "dropdown-links")}>
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
	},
); // $FlowFixMe

DropdownLinks.propTypes = {
	className: PropTypes.string,
	godMode: PropTypes.bool,
	lid: PropTypes.number,
	menuItems: PropTypes.array.isRequired,
};
export default DropdownLinks;
