// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers, local, menuItems } from "../util";

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

const MenuItem = ({ lid, menuItem, pageID, root }) => {
    if (!menuItem.league && lid !== undefined) {
        return null;
    }
    if (!menuItem.nonLeague && lid === undefined) {
        return null;
    }

    if (menuItem.type === "link") {
        if (menuItem.godMode && !local.state.godMode) {
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
                    lid={lid}
                    key={i}
                    menuItem={child}
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
    lid: number | void,
    pageID: string,
};

class SideBar extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return (
            this.props.pageID !== nextProps.pageID ||
            this.props.lid !== nextProps.lid
        );
    }

    render() {
        const { lid, pageID } = this.props;

        return (
            <div className="bg-light sidebar">
                <div className="sidebar-sticky">
                    {menuItems.map((menuItem, i) => (
                        <MenuItem
                            lid={lid}
                            key={i}
                            menuItem={menuItem}
                            pageID={pageID}
                            root
                        />
                    ))}
                </div>
            </div>
        );
    }
}

SideBar.propTypes = {
    lid: PropTypes.number,
    pageID: PropTypes.string,
};

export default SideBar;
