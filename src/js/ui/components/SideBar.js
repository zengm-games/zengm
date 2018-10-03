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
    shouldComponentUpdate(nextProps: Props) {
        return this.props.pageID !== nextProps.pageID;
    }

    render() {
        return subscribeLocal(local => {
            const { godMode, lid } = local.state;

            // This is done with a selector rather than by passing a prop down or using local.state because then
            // performance of the menu is independent of any other React performance issues - basically it's a hack to
            // make menu performance consistent even if there are other problems. Like on the Fantasy Draft page.
            const onMenuItemClick = () => {
                document
                    .getElementById("sidebar")
                    .classList.remove("sidebar-open");
            };

            return (
                <div className="bg-light sidebar" id="sidebar">
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
