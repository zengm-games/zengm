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

const MenuItem = ({ menuItem, pageID, root }) => {
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
        return (
            <>
                <h6 className="sidebar-heading px-3">{menuItem.long}</h6>
                <MenuGroup>
                    {menuItem.children.map((child, i) => (
                        <MenuItem
                            key={i}
                            menuItem={child}
                            pageID={pageID}
                            root={false}
                        />
                    ))}
                </MenuGroup>
            </>
        );
    }

    throw new Error(`Unknown menuItem.type "${menuItem.type}"`);
};

type Props = {
    lid: number | void,
    pageID: string,
};

class SideMenu extends React.Component<Props> {
    shouldComponentUpdate(nextProps) {
        return (
            this.props.pageID !== nextProps.pageID ||
            this.props.lid !== nextProps.lid
        );
    }

    render() {
        const pageID = this.props.pageID;

        return (
            <div className="bg-light sidebar">
                <div className="sidebar-sticky">
                    {menuItems.map((menuItem, i) => (
                        <MenuItem
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

SideMenu.propTypes = {
    lid: PropTypes.number,
    pageID: PropTypes.string.isRequired,
};

const LeagueWrapper = ({
    children,
    lid,
    pageId,
}: {
    children: React.Element<any>,
    lid: number | void,
    pageId: string,
}) => {
    return (
        <div>
            <SideMenu lid={lid} pageID={pageId} />
            <div className="league-content p402_premium" id="screenshot-league">
                {children}
            </div>
        </div>
    );
};

LeagueWrapper.propTypes = {
    children: PropTypes.any.isRequired,
    lid: PropTypes.number,
    pageId: PropTypes.string.isRequired,
};

export default LeagueWrapper;
