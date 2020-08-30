import classNames from "classnames";
import PropTypes from "prop-types";
import React, {
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
	MouseEvent,
} from "react";
import { helpers, localActions, menuItems, useLocalShallow } from "../util";
import type {
	MenuItemLink,
	MenuItemHeader,
	MenuItemText,
} from "../../common/types";

const getText = (text: MenuItemLink["text"]) => {
	if (text.hasOwnProperty("side")) {
		// @ts-ignore
		return text.side;
	}

	return text;
};

const MenuGroup = ({ children }: { children: ReactNode }) => (
	<ul className="nav flex-column">{children}</ul>
);

MenuGroup.propTypes = {
	children: PropTypes.any.isRequired,
};

const makeAnchorProps = (
	menuItem: MenuItemLink,
	onMenuItemClick: () => void,
) => {
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

	const onClick = async (event: MouseEvent) => {
		if (menuItem.onClick) {
			// Don't close menu if response is false
			const response = await menuItem.onClick(event);

			if (response !== false) {
				onMenuItemClick();
			}
		} else {
			onMenuItemClick();
		}
	};

	return {
		onClick,
		href,
		rel,
		target,
	};
};

const MenuItem = ({
	godMode,
	lid,
	menuItem,
	onMenuItemClick,
	pageID,
	root,
}: {
	godMode: boolean;
	lid?: number;
	menuItem: MenuItemHeader | MenuItemLink | MenuItemText;
	onMenuItemClick: () => void;
	pageID?: string;
	root: boolean;
}) => {
	if (menuItem.type === "text") {
		return null;
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

		const anchorProps = makeAnchorProps(menuItem, onMenuItemClick);

		const item = (
			<li className="nav-item">
				<a
					className={classNames("nav-link", {
						active: menuItem.active ? menuItem.active(pageID) : false,
						"god-mode": menuItem.godMode,
					})}
					{...anchorProps}
				>
					{getText(menuItem.text)}
				</a>
			</li>
		);
		return root ? <MenuGroup>{item}</MenuGroup> : item;
	}

	if (menuItem.type === "header") {
		const children = menuItem.children
			.map((child, i) => (
				<MenuItem
					godMode={godMode}
					key={i}
					lid={lid}
					menuItem={child}
					onMenuItemClick={onMenuItemClick}
					pageID={pageID}
					root={false}
				/>
			))
			.filter(element => element !== null);

		if (children.length === 0) {
			return null;
		}

		return (
			<>
				<h2 className="sidebar-heading px-3">{menuItem.long}</h2>
				<MenuGroup>{children}</MenuGroup>
			</>
		);
	}

	throw new Error(`Unknown menuItem.type "${(menuItem as any).type}"`);
};

type Props = {
	pageID?: string;
};

// Sidebar open/close state is done with the DOM directly rather than by passing a prop down or using local.getState()
// because then performance of the menu is independent of any other React performance issues - basically it's a hack to
// make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.
const SideBar = React.memo(({ pageID }: Props) => {
	const [node, setNode] = useState<null | HTMLDivElement>(null);
	const [nodeFade, setNodeFade] = useState<null | HTMLDivElement>(null);
	const topUserBlockRef = useRef<HTMLElement | null>(null);

	const { godMode, lid, sidebarOpen } = useLocalShallow(state => ({
		godMode: state.godMode,
		lid: state.lid,
		sidebarOpen: state.sidebarOpen,
	}));

	const getNode = useCallback(node2 => {
		if (node2 !== null) {
			setNode(node2);
		}
	}, []);

	const getNodeFade = useCallback(node2 => {
		if (node2 !== null) {
			setNodeFade(node2);
		}
	}, []);

	const close = useCallback(() => {
		// These are flat conditions while open is nested, by design - clean up everything!
		if (node) {
			node.classList.remove("sidebar-open");
		}

		if (nodeFade) {
			nodeFade.classList.add("sidebar-fade-closing");
		}

		setTimeout(() => {
			if (nodeFade) {
				nodeFade.classList.remove("sidebar-fade-open");
			}

			if (nodeFade) {
				nodeFade.classList.remove("sidebar-fade-closing");
			}

			if (document.body) {
				document.body.classList.remove("modal-open");
			}

			if (document.body) {
				document.body.style.paddingRight = "";

				if (topUserBlockRef.current) {
					topUserBlockRef.current.style.paddingRight = "";
				}
			}
		}, 300); // Keep time in sync with .sidebar-fade
	}, [node, nodeFade]);

	const open = useCallback(() => {
		if (node) {
			node.classList.add("sidebar-open");

			if (nodeFade) {
				nodeFade.classList.add("sidebar-fade-open");

				if (document.body) {
					const scrollbarWidth = window.innerWidth - document.body.offsetWidth;

					if (document.body) {
						document.body.classList.add("modal-open");
					}

					if (document.body) {
						document.body.style.paddingRight = `${scrollbarWidth}px`;

						if (topUserBlockRef.current) {
							topUserBlockRef.current.style.paddingRight = `${scrollbarWidth}px`;
						}
					}
				}
			}
		}
	}, [node, nodeFade]);

	useEffect(() => {
		if (node) {
			const opening = node.classList.contains("sidebar-open");

			if (!sidebarOpen && opening) {
				close();
			} else if (sidebarOpen && !opening) {
				open();
			}
		}
	}, [close, node, open, sidebarOpen]);

	const closeHandler = useCallback(() => {
		localActions.update({
			sidebarOpen: false,
		});
	}, []);

	useEffect(() => {
		if (nodeFade) {
			nodeFade.addEventListener("click", closeHandler);
		}

		return () => {
			if (nodeFade) {
				nodeFade.removeEventListener("click", closeHandler);
			}
		};
	}, [closeHandler, nodeFade]);

	useEffect(() => {
		topUserBlockRef.current = document.getElementById("top-user-block");
	}, []);

	return (
		<>
			<div ref={getNodeFade} className="sidebar-fade" />
			<nav
				className="bg-light sidebar"
				id="sidebar"
				ref={getNode}
				aria-label="side navigation"
			>
				<div className="sidebar-sticky">
					{menuItems.map((menuItem, i) => (
						<MenuItem
							godMode={godMode}
							key={i}
							lid={lid}
							menuItem={menuItem}
							onMenuItemClick={closeHandler}
							pageID={pageID}
							root
						/>
					))}
				</div>
			</nav>
		</>
	);
});

// @ts-ignore
SideBar.propTypes = {
	pageID: PropTypes.string,
};

export default SideBar;
