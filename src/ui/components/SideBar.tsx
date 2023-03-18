import classNames from "classnames";
import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useState,
	type MouseEvent,
} from "react";
import {
	helpers,
	localActions,
	menuItems,
	safeLocalStorage,
	useLocalPartial,
} from "../util";
import type {
	MenuItemLink,
	MenuItemHeader,
	MenuItemText,
} from "../../common/types";
import CollapseArrow from "./CollapseArrow";
import { AnimatePresence, m } from "framer-motion";

export const getText = (
	text: MenuItemLink["text"],
): Exclude<ReactNode, null | undefined | number | boolean> => {
	if (Object.hasOwn(text as any, "side")) {
		// @ts-expect-error
		return text.side;
	}

	// @ts-expect-error
	return text;
};

const MenuGroup = ({
	children,
	title,
}: {
	children: ReactNode;
	title?: string;
}) => {
	const [open, setOpen] = useState(true);

	return (
		<>
			{title ? (
				<a
					className="sidebar-heading"
					onClick={event => {
						event.preventDefault();
						setOpen(prev => !prev);
					}}
				>
					<CollapseArrow open={open} /> {title}
				</a>
			) : null}
			<AnimatePresence initial={false}>
				{open ? (
					<m.ul
						className="nav flex-column flex-nowrap overflow-hidden"
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
					>
						{children}
					</m.ul>
				) : null}
			</AnimatePresence>
		</>
	);
};

export const makeAnchorProps = (
	menuItem: MenuItemLink,
	onMenuItemClick: () => void,
	closeBeforeOnClickResolves?: boolean,
): {
	onClick: (event: MouseEvent) => void;
	href?: string;
	rel?: string;
	target?: string;
} => {
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
			if (closeBeforeOnClickResolves) {
				onMenuItemClick();
			}

			// Don't close menu if response is false
			const response = await menuItem.onClick(event);

			if (response !== false && !closeBeforeOnClickResolves) {
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
	pathname,
	root,
}: {
	godMode: boolean;
	lid?: number;
	menuItem: MenuItemHeader | MenuItemLink | MenuItemText;
	onMenuItemClick: () => void;
	pageID?: string;
	pathname?: string;
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
		if (menuItem.commandPaletteOnly) {
			return null;
		}

		if (menuItem.godMode && !godMode) {
			return null;
		}

		const anchorProps = makeAnchorProps(menuItem, onMenuItemClick);

		const item = (
			<li className="nav-item">
				<a
					className={classNames("nav-link", {
						active: menuItem.active ? menuItem.active(pageID, pathname) : false,
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
		if (menuItem.commandPaletteOnly) {
			return null;
		}

		const children = menuItem.children
			.map((child, i) => (
				<MenuItem
					godMode={godMode}
					key={i}
					lid={lid}
					menuItem={child}
					onMenuItemClick={onMenuItemClick}
					pageID={pageID}
					pathname={pathname}
					root={false}
				/>
			))
			.filter(element => element !== null);

		if (children.length === 0) {
			return null;
		}

		return <MenuGroup title={menuItem.long}>{children}</MenuGroup>;
	}

	throw new Error(`Unknown menuItem.type "${(menuItem as any).type}"`);
};

type Props = {
	pageID?: string;
	pathname?: string;
};

// Sidebar open/close state is done with the DOM directly rather than by passing a prop down or using local.getState()
// because then performance of the menu is independent of any other React performance issues - basically it's a hack to
// make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.
const SideBar = memo(({ pageID, pathname }: Props) => {
	const [node, setNode] = useState<null | HTMLDivElement>(null);
	const [nodeFade, setNodeFade] = useState<null | HTMLDivElement>(null);

	const { godMode, lid, sidebarOpen } = useLocalPartial([
		"godMode",
		"lid",
		"sidebarOpen",
	]);

	const getNode = useCallback((node2: HTMLDivElement) => {
		if (node2 !== null) {
			setNode(node2);
		}
	}, []);

	const getNodeFade = useCallback((node2: HTMLDivElement) => {
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
		}, 300); // Keep time in sync with .sidebar-fade
	}, [node, nodeFade]);

	const open = useCallback(() => {
		if (node) {
			node.classList.add("sidebar-open");

			if (nodeFade) {
				nodeFade.classList.add("sidebar-fade-open");

				if (document.body) {
					if (document.body) {
						document.body.classList.add("modal-open");
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

	useEffect(() => {
		// Use one media query per cutoff. At the time of writing, there is only ever one, at 768px. This is more efficient than listening for the window resize event and updating every time it changes.
		const mediaQueryList = window.matchMedia("(min-width: 1200px)");

		const handle = (event: MediaQueryListEvent) => {
			// Call open/close even if sidebarOpen says it's open, cause sidebarOpen is not actually the source of truth!
			if (event.matches) {
				// Now we're xl or larger - open unless closed is saved value
				const saved = safeLocalStorage.getItem("sidebarOpen");
				if (saved === "false") {
					localActions.setSidebarOpen(false);
				} else {
					localActions.setSidebarOpen(true);
				}
			} else {
				// Now we're smaller than xl - hide the sidebar
				localActions.setSidebarOpen(false);
			}
		};

		// Rather than addEventListener for Safari <14
		mediaQueryList.addListener(handle);

		return () => {
			mediaQueryList.removeListener(handle);
		};
	}, [close, open]);

	useEffect(() => {
		const closeHandler = () => {
			localActions.setSidebarOpen(false);
		};

		if (nodeFade) {
			nodeFade.addEventListener("click", closeHandler);
		}

		return () => {
			if (nodeFade) {
				nodeFade.removeEventListener("click", closeHandler);
			}
		};
	}, [nodeFade]);

	return (
		<>
			<div ref={getNodeFade} className="sidebar-fade" />
			<nav
				className="bg-light sidebar flex-shrink-0"
				id="sidebar"
				ref={getNode}
				aria-label="side navigation"
			>
				<div className="bg-light sidebar-inner small-scrollbar">
					{menuItems.map((menuItem, i) => (
						<MenuItem
							godMode={godMode}
							key={i}
							lid={lid}
							menuItem={menuItem}
							onMenuItemClick={() => {
								// Only on mobile, close menu on click
								if (window.innerWidth < 1200) {
									localActions.setSidebarOpen(false);
								}
							}}
							pageID={pageID}
							pathname={pathname}
							root
						/>
					))}
				</div>
			</nav>
		</>
	);
});

export default SideBar;
