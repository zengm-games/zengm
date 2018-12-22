// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import Dropdown from "reactstrap/lib/Dropdown";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import Nav from "reactstrap/lib/Nav";
import NavItem from "reactstrap/lib/NavItem";
import NavLink from "reactstrap/lib/NavLink";
import Navbar from "reactstrap/lib/Navbar";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import PopoverHeader from "reactstrap/lib/PopoverHeader";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import {
    emitter,
    helpers,
    menuItems,
    realtimeUpdate,
    subscribeLocal,
    toWorker,
} from "../util";

const sport = helpers.upperCaseFirstLetter(process.env.SPORT);

type TopMenuToggleProps = {
    long: string,
    openId?: string,
    short: string,
    toggle?: (SyntheticEvent<>) => void,
};

class TopMenuToggle extends React.Component<TopMenuToggleProps> {
    handleMouseEnter: Function;

    constructor(props: TopMenuToggleProps, context) {
        super(props, context);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
    }

    handleMouseEnter(event) {
        if (
            this.props.openId !== undefined &&
            this.props.openId !== this.props.long &&
            this.props.toggle
        ) {
            this.props.toggle(event);
        }
    }

    render() {
        return (
            <DropdownToggle caret nav onMouseEnter={this.handleMouseEnter}>
                <span className="d-xs-inline d-sm-none d-md-inline">
                    {this.props.long}
                </span>
                <span
                    className="d-none d-sm-inline d-md-none"
                    title={this.props.long}
                >
                    {this.props.short}
                </span>
            </DropdownToggle>
        );
    }
}

TopMenuToggle.propTypes = {
    long: PropTypes.string.isRequired,
    openId: PropTypes.string,
    short: PropTypes.string.isRequired,
    toggle: PropTypes.func,
};

const TopMenuDropdown = ({ children, long, short, openId, onToggle }) => {
    const toggle = event => onToggle(long, event);
    return (
        <Dropdown isOpen={openId === long} nav inNavbar toggle={toggle}>
            <TopMenuToggle
                bsRole="toggle"
                long={long}
                short={short}
                openId={openId}
                toggle={toggle}
            />
            <DropdownMenu right>
                <DropdownItem className="d-none d-sm-block d-md-none" header>
                    {long}
                </DropdownItem>
                {children}
            </DropdownMenu>
        </Dropdown>
    );
};

TopMenuDropdown.propTypes = {
    children: PropTypes.any,
    long: PropTypes.string.isRequired,
    onToggle: PropTypes.func.isRequired,
    openId: PropTypes.string,
    short: PropTypes.string.isRequired,
};

const getText = (text): string | React.Element<any> => {
    if (text.hasOwnProperty("top")) {
        // $FlowFixMe
        return text.top;
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

const MenuItem = ({ godMode, lid, menuItem, openId, onToggle, root }) => {
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

        if (root) {
            return (
                <NavItem>
                    <NavLink {...anchorProps}>{getText(menuItem.text)}</NavLink>
                </NavItem>
            );
        }

        return (
            <DropdownItem
                {...anchorProps}
                className={classNames({
                    "god-mode": menuItem.godMode,
                })}
            >
                {getText(menuItem.text)}
            </DropdownItem>
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
                    openId={openId}
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
                long={menuItem.long}
                short={menuItem.short}
                openId={openId}
                onToggle={onToggle}
            >
                {children}
            </TopMenuDropdown>
        );
    }

    throw new Error(`Unknown menuItem.type "${menuItem.type}"`);
};

type DropdownLinksProps = {
    godMode: boolean,
    lid: number | void,
};

type DropdownLinksState = {
    openId?: string,
};

class DropdownLinks extends React.Component<
    DropdownLinksProps,
    DropdownLinksState,
> {
    handleTopMenuToggle: Function;

    constructor(props) {
        super(props);
        this.state = {
            openId: undefined,
        };
        this.handleTopMenuToggle = this.handleTopMenuToggle.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState: DropdownLinksState) {
        return (
            this.state.openId !== nextState.openId ||
            this.props.lid !== nextProps.lid ||
            this.props.godMode !== nextProps.godMode
        );
    }

    handleTopMenuToggle(
        id: string,
        event: SyntheticMouseEvent<HTMLAnchorElement>,
    ) {
        if (event.currentTarget && event.currentTarget.focus) {
            event.currentTarget.focus();
        }
        this.setState(prevState => ({
            openId: id === prevState.openId ? undefined : id,
        }));
    }

    render() {
        const { godMode, lid } = this.props;

        return (
            <Nav navbar id="top-dropdowns">
                {menuItems.map((menuItem, i) => (
                    <MenuItem
                        godMode={godMode}
                        lid={lid}
                        key={i}
                        menuItem={menuItem}
                        openId={this.state.openId}
                        onToggle={this.handleTopMenuToggle}
                        root
                    />
                ))}
            </Nav>
        );
    }
}

DropdownLinks.propTypes = {
    godMode: PropTypes.bool.isRequired,
    lid: PropTypes.number,
};

const logoImage =
    process.env.SPORT === "basketball"
        ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB9wIFRUXBgiS2qAAAAN8SURBVDjLbZRdTFtlGMd/b885PaXfYOk2vqHODWFsZIqySGLMdJsx2SQGdZk3uzIaL4war0282LUX3ng7WLLdSEzcZqJxKmXOSLbBBoJaoBDWQktLP0/POT1etHSV7E3e5D0neX75///P+7yCJ6zeVuW9Vwc9r4eCSo9TtgVspo1Mzty+fi+bWUro1/6Na1/vrRH1H8+F3P2vHHdcOjPkfi2eNBSbBacH3LhtNtAADcandvTx31Nzq1vWxQebubu7tdLuYeSo69SH53zjn5x/aqirTZH6QirPtNm5OZMDAQGPDMBAiyp1+pQDflWMysKa/yepL9VAve32/o/fbJq4cNrfjR2wAzLYJMHhNpX1LYNbD/L0taoIoMOvsJY0XIMHHCPRtPnLelrfkAAuvOy//NlY4DgyoFRBSlWqBft9MgGXxNXwDh1NCk7FxtaOwYl2py+a0HvCq4XL0vBB5xtfng9+GvBLMjao7SqEMmCCW7Ux2O5geqHAXFQjUyzz7f0MA/scndGUMS8/36W+3aRKju/CGewNAkkVIINVbUPQK9HZpOBXJIQNTh5xVYIvglwWnDvokW4vF0bl7Ux5aGapwMkBNw0e8dhWtQ3xpMFfyyVSaRMMKGvQ5lE40qzW+t7hV7rlYy0O6dQhd8VGsWrFqIIEBJ0ywZBc+acDJVjd0Pl+Nks4kqfTreCyi2bZJYmK1Lo8aopEXVZmFWRUuqa0CholCQm4s1Zwytm8FUcjVIOYdYr2hB7bNphayIMBkbjOR8NN2E1BX8ARlZc3SxGKDNcgZhVSBW3nTW7MZdF1aPHJnDnsoUEIvvopyfWHWc4+7WE1U1qUp9e0a5GYPtYdUORdNUXL4lYkx6OMQaNLYrTPiyqJivUybCQMjgYdbGdNFh5p2p1V7aoAeKffGx7t9Q5bgIGFqgpe6nGyzys/tgc10MSfad7t97EYK/HFz5vTV+bSJ2SASMp830JMjj3r6aJ+CovVwOtCv71SYLDZgTDgj/XCym8ruc9rs7a+o8eSudKsJWwjx/Y7Gvfe6t29ENNI5E2GWhqYmE0tfzOT+uB+XPvxf9MfSRuR+U3th8Wt0qGeRntrwCnJ9U/Mjb+zZEoWoUa7fmkqcfPKvdzF6fVc+Inv0e56ocV59sX2hrfavErXwpbWrpmW6PAp0UTBXPw1mp18GCtN7q35D5RXZnIkhyKSAAAAAElFTkSuQmCC"
        : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAB3RJTUUH4gwWAwQpA0IWWgAAA09JREFUOMuF1FtMm2Ucx/Hv+/b0lrftSrdurSxACwIOBTEjZB5iNBqIcWYX6jI3TEymNxix25V4mIm7EI2JzuBhicmSZZptmRKNixcaw+yIYWAMsEYUULcCBVoOhdLDe3i8aJZtiuO5fJ7k83/+/+eXR2LjJfk9jtY7whWH3GpJ1dLfMc3UC4ok0Jc1ljIGn/21zMe3BIIqkQa/PPLui3vzi8k5IYQQueWkGPywQ5xrRZxrRTxXSzrk5rBlPcFtp67CxfkDNezbVyXKvKnLlnj0S/z19+K+rZrAzjbU7XXMD31HtUtzRGcI/gfaovBQnZczrzRRX7lFtYX2vkZqYgSxNMXVH07iKA3irmygpKwWd7iJmehZBudN7Sao1Ml9jZv5/OW7KPcEKwnvfwshSazG+jALOYShk/j5a0y9gLf+ARz+crRCgQsX+9M3QoHaTfQebiTkCoYof/p1zMwCU9/2kF9M3HTrhdhFZEXFFb4HV+huzp74dMF67TDk4USkkRqbQyH0zJvkpieYPH0UIcx1X2L81BGU7fW4a1pQAmGLDOBz8OiDQZo3+3xUtx9FT6dI9J36XwRAGDqXjx8il1khUzASMoBftb7xWAU+LZNGVn1c6X2PzMzELcOlm1CYm+Sb493G9Nz8RxJQ2RXp+L2zfY/tUk8n+Xhsw4QKAXkTFAt0jypjA1O5O+WWHaFI+/Mdtq1Nj9DWM0hl28ENoZxRRMaW0KaWc2cA3eKVsl1P7vBUeGuasTpVAi27kRWV+V+/XxfJaOC0gSng/WFG/0yzHzAtIdXorJq7EJju/4qtjQ9jUUvZdHszktVOavjH6+0AOb2ISMAnMeKTqxzIasQBZLuMyxSwFv+NvsguFsd/wTAMyp/oZNv9TxUHKyCvg9NaRL4YZy6WpCu1xqVrhWTkYjUAbS3NwJHHWYmPYRgG4WffRrgDCAGKFTQTPhjhyk+zvDST4+SNLctZnaxDvr5RSCcZOXYQrZBHspcQ3tOJTYbBedZeHWBwKMnu2VVO/3t2FqeVnWEPDT4FuWAU28ikEjjcPrKuMs5Hh8xjvf3D/TPinaurvKAZzK775wCOkJser4NdNguKLLALiXQOe6ZkW8Xs6B/x7pVsNrpRJP4BZCZZqDI+o58AAAAASUVORK5CYII=";

type LogoAndTextProps = {
    lid: number | void,
    updating: boolean,
};

class LogoAndText extends React.Component<LogoAndTextProps> {
    shouldComponentUpdate(nextProps) {
        return (
            this.props.lid !== nextProps.lid ||
            this.props.updating !== nextProps.updating
        );
    }

    render() {
        const { lid, updating } = this.props;

        return (
            <a
                className={
                    lid !== undefined
                        ? "navbar-brand text-muted d-none d-md-inline"
                        : "navbar-brand text-muted"
                }
                href="/"
            >
                <img
                    alt=""
                    className="spin"
                    width="18"
                    height="18"
                    src={logoImage}
                    style={{
                        animationPlayState: updating ? "running" : "paused",
                        WebkitAnimationPlayState: updating
                            ? "running"
                            : "paused",
                    }}
                />
                <span className="d-none d-lg-inline">{sport} GM</span>
                {lid === undefined ? (
                    <span className="d-lg-none">{sport} GM</span>
                ) : null}
            </a>
        );
    }
}

LogoAndText.propTypes = {
    lid: PropTypes.number,
    updating: PropTypes.bool.isRequired,
};

const handleOptionClick = (option, e) => {
    if (!option.url) {
        e.preventDefault();
        toWorker(`actions.playMenu.${option.id}`);
    }
};

type PlayMenuProps = {
    lid: number | void,
    options: {
        id: string,
        label: string,
        url?: string,
    }[],
};

class PlayMenu extends React.Component<PlayMenuProps> {
    handleAltP: Function;

    constructor(props) {
        super(props);
        this.handleAltP = this.handleAltP.bind(this);
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleAltP);
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.handleAltP);
    }

    handleAltP(e: SyntheticKeyboardEvent<>) {
        // alt + p
        if (e.altKey && e.keyCode === 80) {
            const option = this.props.options[0];

            if (!option) {
                return;
            }

            if (option.url) {
                realtimeUpdate([], option.url);
            } else {
                toWorker(`actions.playMenu.${option.id}`);
            }
        }
    }

    render() {
        const { lid, options } = this.props;

        if (lid === undefined) {
            return <div />;
        }

        return (
            <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret className="play-button">
                    Play
                </DropdownToggle>
                <DropdownMenu>
                    {options.map((option, i) => {
                        return (
                            <DropdownItem
                                key={i}
                                href={option.url}
                                onClick={e => handleOptionClick(option, e)}
                                className="kbd-parent"
                            >
                                {option.label}
                                {i === 0 ? (
                                    <span className="text-muted kbd">
                                        Alt+P
                                    </span>
                                ) : null}
                            </DropdownItem>
                        );
                    })}
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

PlayMenu.propTypes = {
    lid: PropTypes.number,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            url: PropTypes.string,
        }),
    ).isRequired,
};

type Props = {
    pageID?: string,
    updating: boolean,
};

const NavBar = ({ pageID, updating }: Props) => {
    return subscribeLocal(local => {
        const {
            lid,
            godMode,
            hasViewedALeague,
            phaseText,
            playMenuOptions,
            popup,
            statusText,
            username,
        } = local.state;

        if (popup) {
            return <div />;
        }

        const userBlock = username ? (
            <NavLink href="/account">
                <span className="glyphicon glyphicon-user" />{" "}
                <span className="d-none d-lg-inline">{username}</span>
            </NavLink>
        ) : (
            <NavLink href="/account/login_or_register">
                <span className="glyphicon glyphicon-user" />{" "}
                <span className="d-none d-lg-inline">Login/Register</span>
            </NavLink>
        );

        // Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
        // game. This is needed because game sim happens before the results are displayed in liveGame.
        const phaseStatusBlock =
            pageID === "liveGame" ? (
                <span
                    className="navbar-text"
                    style={{ lineHeight: 1.35, marginLeft: 16, padding: 0 }}
                >
                    Live game
                    <br />
                    in progress
                </span>
            ) : (
                <span
                    className="navbar-text"
                    style={{ lineHeight: 1.35, marginLeft: 16, padding: 0 }}
                >
                    {phaseText}
                    <br />
                    {statusText}
                </span>
            );

        return (
            <Navbar
                color="light"
                light
                expand="sm"
                fixed="top"
                className="navbar-border"
            >
                <button
                    className="navbar-toggler mr-3"
                    onClick={() => {
                        emitter.emit("sidebar-toggle");
                    }}
                    type="button"
                >
                    <span className="navbar-toggler-icon" />
                </button>
                <LogoAndText lid={lid} updating={updating} />
                <Nav navbar>
                    <div
                        id="play-menu"
                        onClick={() => {
                            // Hack because otherwise the popover doesn't close when the Play button is clicked, for some reason
                            if (!hasViewedALeague) {
                                local.update({ hasViewedALeague: true });
                            }
                        }}
                    >
                        <PlayMenu lid={lid} options={playMenuOptions} />
                    </div>
                    <Popover
                        placement="right"
                        isOpen={!hasViewedALeague && lid === 1}
                        target="play-menu"
                        toggle={() => {
                            // This will run when it closes, so next time it will be hidden
                            local.update({ hasViewedALeague: true });
                            localStorage.setItem("hasViewedALeague", "true");
                        }}
                    >
                        <PopoverHeader className="text-primary font-weight-bold">
                            Welcome to {sport} GM!
                        </PopoverHeader>
                        <PopoverBody>
                            To advance through the game, use the Play button at
                            the top. The options shown will change depending on
                            the current state of the game.
                        </PopoverBody>
                    </Popover>
                </Nav>
                {lid !== undefined ? phaseStatusBlock : null}
                <div className="flex-grow-1" />
                <div className="d-none d-sm-flex">
                    <DropdownLinks godMode={godMode} lid={lid} />
                </div>
                <Nav id="top-user-block" navbar>
                    <NavItem>{userBlock}</NavItem>
                </Nav>
            </Navbar>
        );
    });
};

NavBar.propTypes = {
    pageID: PropTypes.string,
    updating: PropTypes.bool.isRequired,
};

export default NavBar;
