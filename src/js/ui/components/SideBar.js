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

type Props = {
    pageID?: string,
};

// Sidebar open/close state is done with the DOM directly rather than by passing a prop down or using local.state
// because then performance of the menu is independent of any other React performance issues - basically it's a hack to
// make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.

class SideBar extends React.Component<Props> {
    close: Function;

    open: Function;

    toggle: Function;

    ref: { current: null | React.ElementRef<"div"> };

    refFade: { current: null | React.ElementRef<"div"> };

    topUserBlockEl: HTMLElement | null;

    constructor(props: Props) {
        super(props);

        this.close = this.close.bind(this);
        this.open = this.open.bind(this);
        this.toggle = this.toggle.bind(this);

        this.ref = React.createRef();
        this.refFade = React.createRef();
    }

    close() {
        // These are flat conditions while open is nested, by design - clean up everything!
        if (this.ref && this.ref.current) {
            this.ref.current.classList.remove("sidebar-open");
        }
        if (this.refFade && this.refFade.current) {
            this.refFade.current.classList.add("sidebar-fade-closing");
        }
        setTimeout(() => {
            if (this.refFade && this.refFade.current) {
                this.refFade.current.classList.remove("sidebar-fade-open");
            }
            if (this.refFade && this.refFade.current) {
                this.refFade.current.classList.remove("sidebar-fade-closing");
            }
            if (document.body) {
                document.body.classList.remove("modal-open");
            }
            if (document.body) {
                document.body.style.paddingRight = "";
                if (this.topUserBlockEl) {
                    this.topUserBlockEl.style.paddingRight = "";
                }
            }
        }, 300); // Keep time in sync with .sidebar-fade
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

    shouldComponentUpdate(nextProps: Props) {
        return this.props.pageID !== nextProps.pageID;
    }

    componentDidMount() {
        if (this.refFade && this.refFade.current) {
            this.refFade.current.addEventListener("click", this.close);
        }

        emitter.on("sidebar-toggle", this.toggle);

        this.topUserBlockEl = document.getElementById("top-user-block");
    }

    componentWillUnmount() {
        if (this.refFade && this.refFade.current) {
            this.refFade.current.removeEventListener("click", this.close);
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
