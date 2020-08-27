import classNames from "classnames";
import PropTypes from "prop-types";
import React, { MouseEvent, useCallback, useState } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { helpers } from "../util";
import type {
	MenuItemLink,
	MenuItemHeader,
	MenuItemText,
} from "../../common/types";

type TopMenuToggleProps = {
	long: string;
	openID?: string;
	short: string;
	toggle?: (a: MouseEvent<HTMLAnchorElement>) => void;
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
		<Dropdown.Toggle
			as={Nav.Link}
			id="whatever"
			onMouseEnter={handleMouseEnter}
		>
			<span className="d-xs-inline d-sm-none d-md-inline">{long}</span>
			<span className="d-none d-sm-inline d-md-none" title={long}>
				{short}
			</span>
		</Dropdown.Toggle>
	);
};

TopMenuToggle.propTypes = {
	long: PropTypes.string.isRequired,
	openID: PropTypes.string,
	short: PropTypes.string.isRequired,
	toggle: PropTypes.func,
};

const TopMenuDropdown = ({
	children,
	hideTitle,
	long,
	short,
	openID,
	onToggle,
}: {
	children: React.ReactNode;
	hideTitle?: boolean;
	long: string;
	onToggle: (a: string, b: MouseEvent<HTMLAnchorElement>) => void;
	openID?: string;
	short: string;
}) => {
	const toggle = useCallback(event => onToggle(long, event), [long, onToggle]);
	return (
		<Dropdown show={openID === long} onToggle={toggle} as={Nav.Item}>
			<TopMenuToggle
				long={long}
				short={short}
				openID={openID}
				toggle={toggle}
			/>
			<Dropdown.Menu alignRight>
				{!hideTitle ? (
					<Dropdown.Header className="d-none d-sm-block d-md-none">
						{long}
					</Dropdown.Header>
				) : null}
				{children}
			</Dropdown.Menu>
		</Dropdown>
	);
};

TopMenuDropdown.propTypes = {
	children: PropTypes.any,
	long: PropTypes.string.isRequired,
	hideTitle: PropTypes.bool,
	onToggle: PropTypes.func.isRequired,
	openID: PropTypes.string,
	short: PropTypes.string.isRequired,
};

const getText = (text: MenuItemLink["text"]) => {
	if (text.hasOwnProperty("top")) {
		// @ts-ignore
		return text.top;
	}

	return text;
};

const makeAnchorProps = (menuItem: MenuItemLink) => {
	let href;
	let rel;
	let target;

	if (typeof menuItem.path === "string") {
		href = menuItem.path;

		if (menuItem.path.startsWith("http")) {
			rel = "noopener noreferrer";
			target = "_blank";
		}
	} else if (Array.isArray(menuItem.path)) {
		href = helpers.leagueUrl(menuItem.path);
	}

	const onClick = menuItem.onClick;

	return {
		onClick,
		href,
		rel,
		target,
	};
};

const MenuItem = ({
	godMode,
	hideTitle,
	lid,
	menuItem,
	openID,
	onToggle,
	root,
}: {
	godMode?: boolean;
	hideTitle?: boolean;
	lid?: number;
	menuItem: MenuItemLink | MenuItemHeader | MenuItemText;
	onToggle: (a: string, b: MouseEvent<HTMLAnchorElement>) => void;
	openID?: string;
	root: boolean;
}) => {
	if (menuItem.type === "text") {
		return <Dropdown.Header>{menuItem.text}</Dropdown.Header>;
	}

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

		const anchorProps = makeAnchorProps(menuItem);

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
				<Nav.Item>
					<Nav.Link {...anchorProps}>{getText(menuItem.text)}</Nav.Link>
				</Nav.Item>
			);
		}

		return (
			<Dropdown.Item
				{...anchorProps}
				className={classNames({
					"god-mode": menuItem.godMode,
				})}
			>
				{getText(menuItem.text)}
			</Dropdown.Item>
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
				hideTitle={hideTitle}
				long={menuItem.long}
				short={menuItem.short}
				openID={openID}
				onToggle={onToggle}
			>
				{children}
			</TopMenuDropdown>
		);
	}

	throw new Error(`Unknown menuItem.type "${(menuItem as any).type}"`);
};

type DropdownLinksProps = {
	className?: string;
	godMode?: boolean;
	hideTitle?: boolean;
	lid: number | undefined;
	menuItems: (MenuItemLink | MenuItemHeader)[];
};

const DropdownLinks = React.memo(
	({ className, godMode, hideTitle, lid, menuItems }: DropdownLinksProps) => {
		const [openID, setOpenID] = useState<string | undefined>();
		const handleTopMenuToggle = useCallback(
			(id: string, event: MouseEvent<HTMLAnchorElement>) => {
				if (event.currentTarget && event.currentTarget.focus) {
					event.currentTarget.focus();
				}

				setOpenID(id === openID ? undefined : id);
			},
			[openID],
		);
		return (
			<Nav
				navbar
				className={classNames(className, "dropdown-links navbar-nav")}
			>
				{menuItems.map((menuItem, i) => (
					<MenuItem
						godMode={godMode}
						lid={lid}
						hideTitle={hideTitle}
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
);

// @ts-ignore
DropdownLinks.propTypes = {
	className: PropTypes.string,
	godMode: PropTypes.bool,
	hideTitle: PropTypes.bool,
	lid: PropTypes.number,
	menuItems: PropTypes.array.isRequired,
};

export default DropdownLinks;
