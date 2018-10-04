// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers, menuItems, subscribeLocal } from "../util";

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
                        "sidebar-god-mode": menuItem.godMode,
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

// When swipe ends, if the sidebar has more than this many x-pixels displayed it is opened, otherwise closed
const OPEN_CLOSE_BOUNDARY = 76;

type Props = {
    godMode: boolean,
    lid: number | void,
    pageID: string,
};

class SideBar extends React.Component<Props> {
    handleTouchStart: Function;

    handleTouchMove: Function;

    handleTouchEnd: Function;

    ref: { current: null | React.ElementRef<"div"> };

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

        this.ref = React.createRef();

        this.currentCoords = undefined;
        this.currentSwipe = undefined;
        this.requestAnimationFrameID = undefined;
        this.requestAnimationFramePending = false;
        this.sidebarLeft = undefined;
        this.swipeStartCoords = undefined;
        this.touchStartCoords = undefined;
    }

    handleTouchStart(event: SyntheticTouchEvent<>) {
        console.log("handleTouchStart", event.target, event.currentTarget);
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
                                -150 + this.currentCoords[0],
                                -150,
                                0,
                            );
                        } else if (this.currentSwipe === "left") {
                            // Close sidebar based on difference between swipeStartX and current position
                            this.sidebarLeft = helpers.bound(
                                -(
                                    this.swipeStartCoords[0] -
                                    this.currentCoords[0]
                                ),
                                -150,
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

    handleTouchEnd(event: SyntheticTouchEvent<>) {
        if (event.touches && event.touches.length > 0) {
            return;
        }

        if (this.ref && this.ref.current && this.sidebarLeft !== undefined) {
            const elFade = document.getElementById("sidebar-fade");
            if (
                this.currentSwipe === "right" &&
                this.sidebarLeft >= -OPEN_CLOSE_BOUNDARY
            ) {
                this.ref.current.classList.add("sidebar-open");
                if (elFade) {
                    elFade.classList.add("sidebar-fade");
                }
            } else if (
                this.currentSwipe === "left" &&
                this.sidebarLeft <= -OPEN_CLOSE_BOUNDARY
            ) {
                this.ref.current.classList.remove("sidebar-open");
                if (elFade) {
                    elFade.classList.remove("sidebar-fade");
                }
            }
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

    shouldComponentUpdate(nextProps: Props) {
        return this.props.pageID !== nextProps.pageID;
    }

    componentDidMount() {
        document.addEventListener("touchstart", this.handleTouchStart);
        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);
        document.addEventListener("touchcancel", this.handleTouchEnd);
    }

    componentWillUnmount() {
        document.addEventListener("touchstart", this.handleTouchStart);
        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);
        document.addEventListener("touchcancel", this.handleTouchEnd);
    }

    render() {
        return subscribeLocal(local => {
            const { godMode, lid } = local.state;

            // This is done with a selector rather than by passing a prop down or using local.state because then
            // performance of the menu is independent of any other React performance issues - basically it's a hack to
            // make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.
            const onMenuItemClick = () => {
                if (this.ref && this.ref.current) {
                    this.ref.current.classList.remove("sidebar-open");
                    const elFade = document.getElementById("sidebar-fade");
                    if (elFade) {
                        elFade.classList.remove("sidebar-fade");
                    }
                }
            };

            return (
                <div className="bg-light sidebar" id="sidebar" ref={this.ref}>
                    <div className="sidebar-sticky">
                        {menuItems.map((menuItem, i) => (
                            <MenuItem
                                godMode={godMode}
                                key={i}
                                lid={lid}
                                menuItem={menuItem}
                                onMenuItemClick={onMenuItemClick}
                                pageID={this.props.pageID}
                                root
                            />
                        ))}
                    </div>
                </div>
            );
        });
    }
}

SideBar.propTypes = {
    pageID: PropTypes.string,
};

export default SideBar;
