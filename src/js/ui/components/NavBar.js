// @flow

/* eslint react/no-find-dom-node: "off" */

import html2canvas from "html2canvas";
import PropTypes from "prop-types";
import * as React from "react";
import Overlay from "react-bootstrap/lib/Overlay";
import Popover from "react-bootstrap/lib/Popover";
import {
    Collapse,
    Dropdown,
    Navbar,
    NavbarToggler,
    Nav,
    NavItem,
    NavLink,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from "reactstrap";
import ReactDOM from "react-dom";
import { fetchWrapper } from "../../common";
import {
    helpers,
    logEvent,
    realtimeUpdate,
    subscribeLocal,
    toWorker,
} from "../util";

type TopMenuToggleProps = {
    long: string,
    openId?: string,
    short: string,
    toggle?: (SyntheticEvent<>) => void, // From react-bootstrap Dropdown
};

class TopMenuToggle extends React.Component<TopMenuToggleProps> {
    handleMouseEnter: Function;

    constructor(props: TopMenuToggleProps, context) {
        super(props, context);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
    }

    handleMouseEnter(e) {
        if (
            this.props.openId !== undefined &&
            this.props.openId !== this.props.long &&
            this.props.toggle
        ) {
            this.props.toggle(e);
        }
    }

    render() {
        return (
            <DropdownToggle caret nav onMouseEnter={this.handleMouseEnter}>
                <span className="d-xs-inline d-sm-none d-md-inline">
                    {this.props.long}
                </span>
                <span className="d-none d-sm-inline d-md-none">
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
    toggle: PropTypes.func, // From react-bootstrap Dropdown
};

const TopMenuDropdown = ({ children, long, short, openId, onToggle }) => {
    const toggle = () => onToggle(long);
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

const handleScreenshotClick = async e => {
    e.preventDefault();

    let contentElTemp = document.getElementById("screenshot-league");
    if (!contentElTemp) {
        contentElTemp = document.getElementById("screenshot-nonleague");
    }
    if (!contentElTemp) {
        throw new Error(
            "Missing DOM element #screenshot-league or #screenshot-nonleague",
        );
    }
    const contentEl = contentElTemp;

    // Add watermark
    const watermark = document.createElement("div");
    const navbarBrands = document.getElementsByClassName("navbar-brand");
    if (navbarBrands.length === 0) {
        return;
    }
    const navbarBrandParent = navbarBrands[0].parentElement;
    if (!navbarBrandParent) {
        return;
    }
    watermark.innerHTML = `<nav class="navbar navbar-default"><div class="container-fluid"><div class="navbar-header">${String(
        navbarBrandParent.innerHTML,
    )}</div><p class="navbar-text navbar-right" style="color: #000; font-weight: bold">Play your own league free at basketball-gm.com</p></div></nav>`;
    contentEl.insertBefore(watermark, contentEl.firstChild);
    contentEl.style.padding = "8px";

    // Add notifications
    const notifications = document
        .getElementsByClassName("notification-container")[0]
        .cloneNode(true);
    notifications.classList.remove("notification-container");
    for (let i = 0; i < notifications.childNodes.length; i++) {
        // Otherwise screeenshot is taken before fade in is complete
        const el = notifications.children[0];
        if (el.classList && typeof el.classList.remove === "function") {
            el.classList.remove("notification-fadein");
        }
    }
    contentEl.appendChild(notifications);

    const canvas = await html2canvas(contentEl, {
        background: "#fff",
    });

    // Remove watermark
    contentEl.removeChild(watermark);
    contentEl.style.padding = "";

    // Remove notifications
    contentEl.removeChild(notifications);

    logEvent({
        type: "screenshot",
        text: `Uploading your screenshot to Imgur...`,
        saveToDb: false,
        showNotification: true,
        persistent: false,
        extraClass: "notification-primary",
    });

    try {
        const data = await fetchWrapper({
            url: "https://imgur-apiv3.p.mashape.com/3/image",
            method: "POST",
            headers: {
                Authorization: "Client-ID c2593243d3ea679",
                "X-Mashape-Key":
                    "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
            },
            data: {
                image: canvas.toDataURL().split(",")[1],
            },
        });

        if (data.data.error) {
            console.log(data.data.error);
            throw new Error(data.data.error.message);
        }

        const url = `http://imgur.com/${data.data.id}`;
        const encodedURL = window.encodeURIComponent(url);

        logEvent({
            type: "screenshot",
            text: `<p><a href="${url}" target="_blank">Click here to view your screenshot.</a></p>
<a href="https://www.reddit.com/r/BasketballGM/submit?url=${encodedURL}">Share on Reddit</a><br>
<a href="https://twitter.com/intent/tweet?url=${encodedURL}&via=basketball_gm">Share on Twitter</a>`,
            saveToDb: false,
            showNotification: true,
            persistent: true,
            extraClass: "notification-primary",
        });
    } catch (err) {
        console.log(err);
        let errorMsg;
        if (
            err &&
            err.responseJSON &&
            err.responseJSON.error &&
            err.responseJSON.error.message
        ) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${
                err.responseJSON.error.message
            }"`;
        } else if (err.message) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${
                err.message
            }"`;
        } else {
            errorMsg = "Error saving screenshot.";
        }
        logEvent({
            type: "error",
            text: errorMsg,
            saveToDb: false,
        });
    }
};

const handleToolsClick = async (id, e) => {
    e.preventDefault();
    const response = await toWorker(`actions.toolsMenu.${id}`);
    if (id === "resetDb" && response) {
        window.location.reload();
    }
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

    handleTopMenuToggle(id) {
        this.setState(prevState => ({
            openId: id === prevState.openId ? undefined : id,
        }));
    }

    render() {
        const { godMode, lid } = this.props;

        return (
            <Nav navbar>
                {window.inIframe && lid !== undefined ? (
                    <NavItem>
                        <NavLink href={helpers.leagueUrl([])}>
                            <span className="d-none d-md-inline">
                                <span className="glyphicon glyphicon-menu-left" />
                            </span>
                            <span className="d-inline d-md-none">
                                <span
                                    className="glyphicon glyphicon-menu-left"
                                    style={{ marginRight: "5px" }}
                                />
                                Switch League
                            </span>
                        </NavLink>
                    </NavItem>
                ) : null}
                {lid !== undefined ? (
                    <NavItem>
                        <NavLink href={helpers.leagueUrl([])}>
                            <span className="glyphicon glyphicon-home" />
                            <span className="d-inline d-sm-none ml-2">
                                League Dashboard
                            </span>
                        </NavLink>
                    </NavItem>
                ) : null}
                {lid !== undefined ? (
                    <TopMenuDropdown
                        long="League"
                        short="L"
                        openId={this.state.openId}
                        onToggle={this.handleTopMenuToggle}
                    >
                        <DropdownItem href={helpers.leagueUrl(["standings"])}>
                            Standings
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["playoffs"])}>
                            Playoffs
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["league_finances"])}
                        >
                            Finances
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["history_all"])}>
                            History
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["power_rankings"])}
                        >
                            Power Rankings
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["transactions", "all"])}
                        >
                            Transactions
                        </DropdownItem>
                    </TopMenuDropdown>
                ) : null}
                {lid !== undefined ? (
                    <TopMenuDropdown
                        long="Team"
                        short="T"
                        openId={this.state.openId}
                        onToggle={this.handleTopMenuToggle}
                    >
                        <DropdownItem href={helpers.leagueUrl(["roster"])}>
                            Roster
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["schedule"])}>
                            Schedule
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["team_finances"])}
                        >
                            Finances
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["team_history"])}
                        >
                            History
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["transactions"])}
                        >
                            Transactions
                        </DropdownItem>
                    </TopMenuDropdown>
                ) : null}
                {lid !== undefined ? (
                    <TopMenuDropdown
                        long="Players"
                        short="P"
                        openId={this.state.openId}
                        onToggle={this.handleTopMenuToggle}
                    >
                        <DropdownItem href={helpers.leagueUrl(["free_agents"])}>
                            Free Agents
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["trade"])}>
                            Trade
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["trading_block"])}
                        >
                            Trading Block
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["draft"])}>
                            Draft
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["watch_list"])}>
                            Watch List
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["hall_of_fame"])}
                        >
                            Hall of Fame
                        </DropdownItem>
                    </TopMenuDropdown>
                ) : null}
                {lid !== undefined ? (
                    <TopMenuDropdown
                        long="Stats"
                        short="S"
                        openId={this.state.openId}
                        onToggle={this.handleTopMenuToggle}
                    >
                        <DropdownItem href={helpers.leagueUrl(["game_log"])}>
                            Game Log
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["leaders"])}>
                            League Leaders
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["player_ratings"])}
                        >
                            Player Ratings
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["player_stats"])}
                        >
                            Player Stats
                        </DropdownItem>
                        <DropdownItem href={helpers.leagueUrl(["team_stats"])}>
                            Team Stats
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl(["player_feats"])}
                        >
                            Statistical Feats
                        </DropdownItem>
                    </TopMenuDropdown>
                ) : null}
                <TopMenuDropdown
                    long="Tools"
                    short="X"
                    openId={this.state.openId}
                    onToggle={this.handleTopMenuToggle}
                >
                    <DropdownItem href="/account">Achievements</DropdownItem>
                    {lid !== undefined ? (
                        <DropdownItem
                            onClick={e =>
                                handleToolsClick("autoPlaySeasons", e)
                            }
                        >
                            Auto Play Seasons
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined && godMode ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["customize_player"])}
                            className="god-mode-menu"
                        >
                            Create A Player
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["delete_old_data"])}
                        >
                            Delete Old Data
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined && godMode ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["edit_team_info"])}
                            className="god-mode-menu"
                        >
                            Edit Team Info
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem href={helpers.leagueUrl(["event_log"])}>
                            Event Log
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["export_league"])}
                        >
                            Export League
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["export_stats"])}
                        >
                            Export Stats
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["fantasy_draft"])}
                        >
                            Fantasy Draft
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem href={helpers.leagueUrl(["god_mode"])}>
                            God Mode
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined && godMode ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["multi_team_mode"])}
                            className="god-mode-menu"
                        >
                            Multi Team Mode
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined && godMode ? (
                        <DropdownItem
                            href={helpers.leagueUrl(["new_team"])}
                            className="god-mode-menu"
                        >
                            Switch Team
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem href={helpers.leagueUrl(["options"])}>
                            Options
                        </DropdownItem>
                    ) : null}
                    <DropdownItem onClick={handleScreenshotClick}>
                        <span className="glyphicon glyphicon-camera" />{" "}
                        Screenshot
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>Use at your own risk!</DropdownItem>
                    {lid !== undefined ? (
                        <DropdownItem
                            onClick={e => handleToolsClick("skipToPlayoffs", e)}
                        >
                            Skip To Playoffs
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            onClick={e =>
                                handleToolsClick("skipToBeforeDraft", e)
                            }
                        >
                            Skip To Draft Lottery
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            onClick={e =>
                                handleToolsClick("skipToAfterDraft", e)
                            }
                        >
                            Skip To After Draft
                        </DropdownItem>
                    ) : null}
                    {lid !== undefined ? (
                        <DropdownItem
                            onClick={e =>
                                handleToolsClick("skipToPreseason", e)
                            }
                        >
                            Skip To Preseason
                        </DropdownItem>
                    ) : null}
                    <DropdownItem onClick={e => handleToolsClick("resetDb", e)}>
                        Reset DB
                    </DropdownItem>
                </TopMenuDropdown>
                <TopMenuDropdown
                    long="Help"
                    short="?"
                    openId={this.state.openId}
                    onToggle={this.handleTopMenuToggle}
                >
                    <DropdownItem
                        href="https://basketball-gm.com/manual/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Overview
                    </DropdownItem>
                    <DropdownItem href="/changes">Changes</DropdownItem>
                    <DropdownItem
                        href="https://basketball-gm.com/manual/customization/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Custom Rosters
                    </DropdownItem>
                    <DropdownItem
                        href="https://basketball-gm.com/manual/debugging/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Debugging
                    </DropdownItem>
                </TopMenuDropdown>
            </Nav>
        );
    }
}

DropdownLinks.propTypes = {
    godMode: PropTypes.bool.isRequired,
    lid: PropTypes.number,
};

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
                    window.inIframe && lid !== undefined
                        ? "navbar-brand text-muted d-none d-lg-inline"
                        : "navbar-brand text-muted"
                }
                href="/"
            >
                <img
                    alt=""
                    className="spin"
                    width="18"
                    height="18"
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB9wIFRUXBgiS2qAAAAN8SURBVDjLbZRdTFtlGMd/b885PaXfYOk2vqHODWFsZIqySGLMdJsx2SQGdZk3uzIaL4war0282LUX3ng7WLLdSEzcZqJxKmXOSLbBBoJaoBDWQktLP0/POT1etHSV7E3e5D0neX75///P+7yCJ6zeVuW9Vwc9r4eCSo9TtgVspo1Mzty+fi+bWUro1/6Na1/vrRH1H8+F3P2vHHdcOjPkfi2eNBSbBacH3LhtNtAADcandvTx31Nzq1vWxQebubu7tdLuYeSo69SH53zjn5x/aqirTZH6QirPtNm5OZMDAQGPDMBAiyp1+pQDflWMysKa/yepL9VAve32/o/fbJq4cNrfjR2wAzLYJMHhNpX1LYNbD/L0taoIoMOvsJY0XIMHHCPRtPnLelrfkAAuvOy//NlY4DgyoFRBSlWqBft9MgGXxNXwDh1NCk7FxtaOwYl2py+a0HvCq4XL0vBB5xtfng9+GvBLMjao7SqEMmCCW7Ux2O5geqHAXFQjUyzz7f0MA/scndGUMS8/36W+3aRKju/CGewNAkkVIINVbUPQK9HZpOBXJIQNTh5xVYIvglwWnDvokW4vF0bl7Ux5aGapwMkBNw0e8dhWtQ3xpMFfyyVSaRMMKGvQ5lE40qzW+t7hV7rlYy0O6dQhd8VGsWrFqIIEBJ0ywZBc+acDJVjd0Pl+Nks4kqfTreCyi2bZJYmK1Lo8aopEXVZmFWRUuqa0CholCQm4s1Zwytm8FUcjVIOYdYr2hB7bNphayIMBkbjOR8NN2E1BX8ARlZc3SxGKDNcgZhVSBW3nTW7MZdF1aPHJnDnsoUEIvvopyfWHWc4+7WE1U1qUp9e0a5GYPtYdUORdNUXL4lYkx6OMQaNLYrTPiyqJivUybCQMjgYdbGdNFh5p2p1V7aoAeKffGx7t9Q5bgIGFqgpe6nGyzys/tgc10MSfad7t97EYK/HFz5vTV+bSJ2SASMp830JMjj3r6aJ+CovVwOtCv71SYLDZgTDgj/XCym8ruc9rs7a+o8eSudKsJWwjx/Y7Gvfe6t29ENNI5E2GWhqYmE0tfzOT+uB+XPvxf9MfSRuR+U3th8Wt0qGeRntrwCnJ9U/Mjb+zZEoWoUa7fmkqcfPKvdzF6fVc+Inv0e56ocV59sX2hrfavErXwpbWrpmW6PAp0UTBXPw1mp18GCtN7q35D5RXZnIkhyKSAAAAAElFTkSuQmCC"
                    style={{
                        animationPlayState: updating ? "running" : "paused",
                        WebkitAnimationPlayState: updating
                            ? "running"
                            : "paused",
                    }}
                />
                <span className="d-none d-lg-inline">Basketball GM</span>
                {lid === undefined ? (
                    <span className="d-lg-none">Basketball GM</span>
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
                    <span className="d-xs-inline d-sm-none d-md-inline">
                        Play
                    </span>
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
    pageId?: string,
    updating: boolean,
};

type State = {
    collapsed: boolean,
};

class NavBar extends React.Component<Props, State> {
    playMenu: ?PlayMenu;

    constructor(props: Props) {
        super(props);

        this.state = {
            collapsed: true,
        };

        this.toggleCollapsed = this.toggleCollapsed.bind(this);
    }

    toggleCollapsed() {
        this.setState(state => {
            return {
                collapsed: !state.collapsed,
            };
        });
    }

    // Workaround for https://github.com/react-bootstrap/react-bootstrap/issues/1301 based on https://github.com/react-bootstrap/react-router-bootstrap/issues/112#issuecomment-142599003
    componentDidMount() {
        const navBar = ReactDOM.findDOMNode(this);
        if (!navBar) {
            return;
        }
        // $FlowFixMe
        const collapsibleNav = navBar.querySelector("div.navbar-collapse");
        if (!collapsibleNav) {
            return;
        }
        // $FlowFixMe
        const btnToggle = navBar.querySelector("button.navbar-toggle");
        if (!btnToggle) {
            return;
        }

        navBar.addEventListener(
            "click",
            (evt: MouseEvent) => {
                const target = evt.target;
                if (!(target instanceof HTMLElement)) {
                    throw new Error("Invalid event target");
                }

                if (
                    target.classList.contains("dropdown-toggle") ||
                    !collapsibleNav.classList.contains("in")
                ) {
                    return;
                }

                if (
                    target.tagName === "A" ||
                    target.classList.contains("toggle-responsive-menu")
                ) {
                    btnToggle.click();
                }
            },
            false,
        );
    }

    render() {
        return subscribeLocal(local => {
            const { pageId, updating } = this.props;

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

            let userBlock = username ? (
                <NavLink href="/account">
                    <span className="glyphicon glyphicon-user" />{" "}
                    <span className="d-xs-inline d-sm-none d-lg-inline">
                        {username}
                    </span>
                </NavLink>
            ) : (
                <NavLink href="/account/login_or_register">
                    <span className="glyphicon glyphicon-user" />{" "}
                    <span className="d-xs-inline d-sm-none d-lg-inline">
                        Login/Register
                    </span>
                </NavLink>
            );

            if (window.inIframe) {
                userBlock = (
                    <a
                        className="navbar-link user-menu"
                        href={window.location.href}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <img
                            alt="Open In New Window"
                            title="Open In New Window"
                            height="16"
                            width="16"
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA0AAAANABeWPPlAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFOSURBVDiNlZS9isJAFIU/F6s0m0VYYiOrhVukWQsbK4t9CDtbexGs8xY+ghY+QRBsbKcTAjZaqKyGXX2Bs00S1AwBD1yYOXPvmXvv/CAJSQAuoGetzAPCMKRSqTzSOURRRK/Xo1wqldyEewXwfR/P8zLHIAhYr9fZ3BjDeDym1WoBUAZ+i3ZaLBYsl8s7zhiTCbwk3DfwaROYz+fsdjs6nU7GOY6TjVOBGPixCbiuy2g0YrVa0Ww2c+svlpg7DAYDptMp3W6XyWRi9RHwRXKMh8NBKYbDoQC1221dr1dtNhv1+33NZjMZY9KjtAsEQSBAvu/rfD7rEYUC2+1WjuOo0Whov9/ngm8FchcJoFarEYYhnudRrVYLe5QTOJ1OANTrdQCOx6M1MI5jexOftdsMLsBbYb7wDkTAR+KflWC9hRakr+wi6e+2hGfNTb+Bf9965Lxmndc1AAAAAElFTkSuQmCC"
                        />{" "}
                    </a>
                );
            }

            // Hide phase and status, to prevent revealing that the playoffs has ended, thus spoiling a 3-0/3-1/3-2 finals
            // game. This is needed because game sim happens before the results are displayed in liveGame.
            const phaseStatusBlock =
                pageId === "liveGame" ? (
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
                <Navbar color="light" light expand="sm" fixed="top">
                    <LogoAndText lid={lid} updating={updating} />
                    <Nav navbar>
                        <PlayMenu
                            lid={lid}
                            options={playMenuOptions}
                            ref={c => {
                                this.playMenu = c;
                            }}
                        />
                        <Overlay
                            onHide={() => {
                                local.update({ hasViewedALeague: true });
                                localStorage.setItem(
                                    "hasViewedALeague",
                                    "true",
                                );
                            }}
                            placement="bottom"
                            rootClose
                            show={!hasViewedALeague && lid === 1}
                            target={() => ReactDOM.findDOMNode(this.playMenu)}
                        >
                            <Popover
                                id="popover-welcome"
                                title="Welcome to Basketball GM!"
                            >
                                To advance through the game, use the Play button
                                at the top. The options shown will change
                                depending on the current state of the game.
                            </Popover>
                        </Overlay>
                    </Nav>
                    {lid !== undefined ? phaseStatusBlock : null}
                    <div className="flex-grow-1" />
                    <NavbarToggler onClick={this.toggleCollapsed} />
                    <Collapse
                        className="justify-content-end"
                        isOpen={!this.state.collapsed}
                        navbar
                    >
                        <DropdownLinks godMode={godMode} lid={lid} />
                        <Nav navbar>
                            <NavItem>{userBlock}</NavItem>
                        </Nav>
                    </Collapse>
                </Navbar>
            );
        });
    }
}

NavBar.propTypes = {
    pageId: PropTypes.string,
    updating: PropTypes.bool.isRequired,
};

export default NavBar;
