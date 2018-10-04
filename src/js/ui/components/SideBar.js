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

type Props = {
    godMode: boolean,
    lid: number | void,
    pageID: string,
};

class SideBar extends React.Component<Props> {
    handleTouchStart: Function;

    handleTouchMove: Function;

    handleTouchEnd: Function;

    handleTouchCancel: Function;

    // If this touch is deemed a swipe, this is the current x coordinate
    currentX: number | void;

    // If this touch is deemed a swipe, set "left" or "right" here
    currentSwipe: "left" | "right" | void;

    requestAnimationFramePending: boolean;

    // x coordinate when a swipe gesture was recognized (not exactly touchStartX, because some movement has to happen first)
    swipeStartX: number | void;

    // x coordinate of initial touch
    touchStartX: number | void;

    constructor(props: Props) {
        super(props);

        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchCancel = this.handleTouchCancel.bind(this);

        this.ref = React.createRef();

        this.currentX = undefined;
        this.currentSwipe = undefined;
        this.requestAnimationFramePending = false;
        this.swipeStartX = undefined;
        this.touchStartX = undefined;
    }

    handleTouchStart(event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        if (!event.targetTouches || event.targetTouches.length !== 1) {
            return;
        }
        const touch = event.targetTouches[0];
        this.touchStartX = touch.clientX;

        console.log("handleTouchStart", this.touchStartX, touch);
    }

    handleTouchMove(event) {
        if (event.touches && event.touches.length > 1) {
            return;
        }
        if (!event.targetTouches || event.targetTouches.length !== 1) {
            return;
        }
        if (this.touchStartX === undefined) {
            return;
        }
        const touch = event.targetTouches[0];
        const diff = touch.clientX - this.touchStartX;

        if (this.currentSwipe === undefined) {
            // Right swipe is possible when sidebar is closed
            if (
                this.ref &&
                this.ref.current &&
                !this.ref.current.classList.contains("sidebar-open") &&
                diff > 20
            ) {
                this.currentSwipe = "right";
                this.swipeStartX = touch.clientX;
                console.log("set currentSwipe", this.currentSwipe);
            }

            // Left swipe is possible when the sidebar is open
            if (
                this.ref &&
                this.ref.current &&
                this.ref.current.classList.contains("sidebar-open") &&
                diff < -20
            ) {
                this.currentSwipe = "left";
                this.swipeStartX = touch.clientX;
                console.log("set currentSwipe", this.currentSwipe);
            }
        }

        if (this.currentSwipe !== undefined) {
            this.currentX = touch.clientX;

            if (!this.requestAnimationFramePending) {
                this.requestAnimationFramePending = true;

                window.requestAnimationFrame(() => {
                    console.log(
                        "Update UI",
                        this.currentSwipe,
                        this.swipeStartX,
                        this.currentX,
                    );
                    this.requestAnimationFramePending = false;
                });
            }
        }

        console.log("handleTouchMove", diff, touch);
    }

    handleTouchEnd(event) {
        if (event.touches && event.touches.length > 0) {
            return;
        }
        console.log("handleTouchEnd");

        if (this.ref && this.ref.current) {
            if (this.currentSwipe === "right") {
                console.log("OPEN");
                this.ref.current.classList.add("sidebar-open");
            } else if (this.currentSwipe === "left") {
                console.log("CLOSE");
                this.ref.current.classList.remove("sidebar-open");
            }
        }

        this.currentX = undefined;
        this.currentSwipe = undefined;
        this.swipeStartX = undefined;
        this.touchStartX = undefined;
    }

    handleTouchCancel(event) {
        console.log("handleTouchCancel", event.targetTouches);
    }

    shouldComponentUpdate(nextProps: Props) {
        return this.props.pageID !== nextProps.pageID;
    }

    componentDidMount() {
        document.addEventListener("touchstart", this.handleTouchStart, true);
        document.addEventListener("touchmove", this.handleTouchMove, true);
        document.addEventListener("touchend", this.handleTouchEnd, true);
        document.addEventListener("touchcancel", this.handleTouchCancel, true);
    }

    componentWillUnmount() {
        document.addEventListener("touchstart", this.handleTouchStart, true);
        document.addEventListener("touchmove", this.handleTouchMove, true);
        document.addEventListener("touchend", this.handleTouchEnd, true);
        document.addEventListener("touchcancel", this.handleTouchCancel, true);
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
