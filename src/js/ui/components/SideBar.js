// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { emitter, helpers, menuItems, subscribeLocal } from "../util";

const getText = (text): string | React.Element<any> => {
    if (text.hasOwnProperty("side")) {
        // $FlowFixMe
        return text.side;
    }

    // $FlowFixMe
    return text;
};

const MenuGroup = ({ children }) => (
    <ul className="nav flex-column">{children}</ul>
);
MenuGroup.propTypes = {
    children: PropTypes.any.isRequired,
};

const MenuItem = ({
    godMode,
    lid,
    menuItem,
    onMenuItemClick,
    pageID,
    root,
}) => {
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
        anchorProps.onClick = async e => {
            if (menuItem.onClick) {
                // Don't close menu if response is false
                const response = await menuItem.onClick(e);
                if (response !== false) {
                    onMenuItemClick();
                }
            } else {
                onMenuItemClick();
            }
        };

        const item = (
            <li className="nav-item">
                <a
                    className={classNames("nav-link", {
                        active: menuItem.active
                            ? menuItem.active(pageID)
                            : false,
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
                <h6 className="sidebar-heading px-3">{menuItem.long}</h6>
                <MenuGroup>{children}</MenuGroup>
            </>
        );
    }

    throw new Error(`Unknown menuItem.type "${menuItem.type}"`);
};

// A touch motion must go at least this far before it is recognized as a swipe gesture
const SWIPE_START_DIFF = 25;

// Sync with .sidebar (small screens) in sidebar.scss
const SIDEBAR_WIDTH = 190;

// When swipe ends, if the sidebar has more than this many x-pixels displayed it is opened, otherwise closed
const OPEN_CLOSE_BOUNDARY = SIDEBAR_WIDTH / 2;

type Props = {
    godMode: boolean,
    lid: number | void,
    pageID: string,
};

// Sidebar open/close state is done with the DOM directly rather than by passing a prop down or using local.state
// because then performance of the menu is independent of any other React performance issues - basically it's a hack to
// make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.

class SideBar extends React.Component<Props> {
    handleTouchStart: Function;

    handleTouchMove: Function;

    handleTouchEnd: Function;

    handleFadeClick: Function;

    close: Function;

    open: Function;

    toggle: Function;

    ref: { current: null | React.ElementRef<"div"> };

    refFade: { current: null | React.ElementRef<"div"> };

    topUserBlockEl: HTMLElement | null;

    // If this touch is deemed a swipe, these are the current coordinates
    currentCoords: [number, number] | void;

    // If this touch is deemed a swipe, set "left" or "right" here
    currentSwipe: "left" | "right" | void;

    requestAnimationFrameID: number | void;

    requestAnimationFramePending: boolean;

    sidebarLeft: number | void;

    // Coordinates when a swipe gesture was recognized (not exactly touchStartX, because some movement has to happen first)
    swipeStartCoords: [number, number] | void;

    // Coordinates of initial touch
    touchStartCoords: [number, number] | void;

    constructor(props: Props) {
        super(props);

        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleFadeClick = this.handleFadeClick.bind(this);
        this.close = this.close.bind(this);
        this.open = this.open.bind(this);
        this.toggle = this.toggle.bind(this);

        this.ref = React.createRef();
        this.refFade = React.createRef();

        this.currentCoords = undefined;
        this.currentSwipe = undefined;
        this.requestAnimationFrameID = undefined;
        this.requestAnimationFramePending = false;
        this.sidebarLeft = undefined;
        this.swipeStartCoords = undefined;
        this.touchStartCoords = undefined;
    }

    handleTouchStart(event: SyntheticTouchEvent<>) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        if (!event.targetTouches || event.targetTouches.length !== 1) {
            return;
        }
        const touch = event.targetTouches[0];
        this.touchStartCoords = [touch.clientX, touch.clientY];
    }

    handleTouchMove(event: SyntheticTouchEvent<>) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        if (!event.targetTouches || event.targetTouches.length !== 1) {
            return;
        }
        if (this.touchStartCoords === undefined) {
            return;
        }
        const touch = event.targetTouches[0];
        const diffX = touch.clientX - this.touchStartCoords[0];
        const diffY = touch.clientY - this.touchStartCoords[1];

        if (this.currentSwipe === undefined) {
            // Right swipe is possible when sidebar is closed
            if (
                this.ref &&
                this.ref.current &&
                !this.ref.current.classList.contains("sidebar-open") &&
                diffX >= SWIPE_START_DIFF &&
                Math.abs(diffX) > Math.abs(diffY) // Scrolling or swiping menu?
            ) {
                this.currentSwipe = "right";
                this.swipeStartCoords = [touch.clientX, touch.clientY];
            }

            // Left swipe is possible when the sidebar is open
            if (
                this.ref &&
                this.ref.current &&
                this.ref.current.classList.contains("sidebar-open") &&
                diffX <= -SWIPE_START_DIFF &&
                Math.abs(diffX) > Math.abs(diffY) // Scrolling or swiping menu?
            ) {
                this.currentSwipe = "left";
                this.swipeStartCoords = [touch.clientX, touch.clientY];
            }
        }

        if (this.currentSwipe !== undefined) {
            this.currentCoords = [touch.clientX, touch.clientY];

            if (!this.requestAnimationFramePending) {
                this.requestAnimationFramePending = true;

                this.requestAnimationFrameID = window.requestAnimationFrame(
                    () => {
                        if (
                            this.currentCoords === undefined ||
                            this.swipeStartCoords === undefined
                        ) {
                            return;
                        }

                        if (this.currentSwipe === "right") {
                            // Move x-position of right side of sidebar to finger
                            this.sidebarLeft = helpers.bound(
                                -SIDEBAR_WIDTH + this.currentCoords[0],
                                -SIDEBAR_WIDTH,
                                0,
                            );
                        } else if (this.currentSwipe === "left") {
                            // Close sidebar based on difference between swipeStartX and current position
                            this.sidebarLeft = helpers.bound(
                                -(
                                    this.swipeStartCoords[0] -
                                    this.currentCoords[0]
                                ),
                                -SIDEBAR_WIDTH,
                                0,
                            );
                        }

                        if (
                            this.sidebarLeft !== undefined &&
                            this.ref &&
                            this.ref.current
                        ) {
                            this.ref.current.style.left = `${
                                this.sidebarLeft
                            }px`;
                        }

                        this.requestAnimationFramePending = false;
                    },
                );
            }
        }
    }

    cleanupTouch() {
        if (this.ref && this.ref.current) {
            this.ref.current.style.left = "";
        }

        window.cancelAnimationFrame(this.requestAnimationFrameID);
        this.currentCoords = undefined;
        this.currentSwipe = undefined;
        this.requestAnimationFrameID = undefined;
        this.requestAnimationFramePending = false;
        this.sidebarLeft = undefined;
        this.swipeStartCoords = undefined;
        this.touchStartCoords = undefined;
    }

    close() {
        if (this.ref && this.ref.current) {
            this.ref.current.classList.remove("sidebar-open");
            if (this.refFade && this.refFade.current) {
                this.refFade.current.classList.remove("sidebar-fade-open");

                if (document.body) {
                    document.body.classList.remove("modal-open");
                    if (document.body) {
                        document.body.style.paddingRight = "";
                        if (this.topUserBlockEl) {
                            this.topUserBlockEl.style.paddingRight = "";
                        }
                    }
                }
            }
        }
    }

    open() {
        if (this.ref && this.ref.current) {
            this.ref.current.classList.add("sidebar-open");
            if (this.refFade && this.refFade.current) {
                this.refFade.current.classList.add("sidebar-fade-open");

                if (document.body) {
                    const scrollbarWidth =
                        window.innerWidth - document.body.offsetWidth;
                    if (document.body) {
                        document.body.classList.add("modal-open");
                    }
                    if (document.body) {
                        document.body.style.paddingRight = `${scrollbarWidth}px`;
                        if (this.topUserBlockEl) {
                            this.topUserBlockEl.style.paddingRight = `${scrollbarWidth}px`;
                        }
                    }
                }
            }
        }
    }

    toggle() {
        if (this.ref && this.ref.current) {
            if (this.ref.current.classList.contains("sidebar-open")) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    handleTouchEnd(event: SyntheticTouchEvent<>) {
        if (event.touches && event.touches.length > 0) {
            return;
        }

        if (this.sidebarLeft !== undefined) {
            if (
                this.currentSwipe === "right" &&
                this.sidebarLeft >= -OPEN_CLOSE_BOUNDARY
            ) {
                this.open();
            } else if (
                this.currentSwipe === "left" &&
                this.sidebarLeft <= -OPEN_CLOSE_BOUNDARY
            ) {
                this.close();
            }
        }

        this.cleanupTouch();
    }

    handleFadeClick() {
        this.close();
        this.cleanupTouch();
    }

    shouldComponentUpdate(nextProps: Props) {
        return this.props.pageID !== nextProps.pageID;
    }

    componentDidMount() {
        document.addEventListener("touchstart", this.handleTouchStart);
        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);
        document.addEventListener("touchcancel", this.handleTouchEnd);

        if (this.refFade && this.refFade.current) {
            this.refFade.current.addEventListener(
                "click",
                this.handleFadeClick,
            );
        }

        emitter.on("sidebar-toggle", this.toggle);

        this.topUserBlockEl = document.getElementById("top-user-block");
    }

    componentWillUnmount() {
        document.removeEventListener("touchstart", this.handleTouchStart);
        document.removeEventListener("touchmove", this.handleTouchMove);
        document.removeEventListener("touchend", this.handleTouchEnd);
        document.removeEventListener("touchcancel", this.handleTouchEnd);

        if (this.refFade && this.refFade.current) {
            this.refFade.current.removeEventListener(
                "click",
                this.handleFadeClick,
            );
        }

        emitter.removeListener("sidebar-toggle", this.toggle);
    }

    render() {
        return subscribeLocal(local => {
            const { godMode, lid } = local.state;

            return (
                <>
                    <div ref={this.refFade} className="sidebar-fade" />
                    <div
                        className="bg-light sidebar"
                        id="sidebar"
                        ref={this.ref}
                    >
                        <div className="sidebar-sticky">
                            {menuItems.map((menuItem, i) => (
                                <MenuItem
                                    godMode={godMode}
                                    key={i}
                                    lid={lid}
                                    menuItem={menuItem}
                                    onMenuItemClick={this.close}
                                    pageID={this.props.pageID}
                                    root
                                />
                            ))}
                        </div>
                    </div>
                </>
            );
        });
    }
}

SideBar.propTypes = {
    pageID: PropTypes.string,
};

export default SideBar;
