// @flow

/* eslint react/no-find-dom-node: "off" */

import Promise from 'bluebird';
import $ from 'jquery';
import React from 'react';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Navbar from 'react-bootstrap/lib/Navbar';
import Overlay from 'react-bootstrap/lib/Overlay';
import Popover from 'react-bootstrap/lib/Popover';
import ReactDOM from 'react-dom';
import * as ui from '../../ui';
import html2canvas from '../../lib/html2canvas';
import * as actions from '../../util/actions';
import * as helpers from '../../util/helpers';
import logEvent from '../../util/logEvent';
import type {Option} from '../../util/types';

const toggleDebugMode = () => {
    if (localStorage.getItem('debug') === 'debug') {
        localStorage.setItem('debug', '');
    } else {
        localStorage.setItem('debug', 'debug');
    }
    window.location.reload();
};

type TopMenuToggleProps = {
    long: string,
    onClick?: (SyntheticEvent) => void, // From react-bootstrap Dropdown
    openId?: string,
    short: string,
};

class TopMenuToggle extends React.Component {
    props: TopMenuToggleProps;
    handleClick: Function;
    handleMouseEnter: Function;

    constructor(props: TopMenuToggleProps, context) {
        super(props, context);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
    }

    handleClick(e) {
        e.preventDefault();
        if (this.props.onClick) {
            this.props.onClick(e);
        }
    }

    handleMouseEnter(e) {
        if (this.props.openId !== undefined && this.props.openId !== this.props.long && this.props.onClick) {
            this.props.onClick(e);
        }
    }

    render() {
        return <a
            className="dropdown-toggle"
            onClick={this.handleClick}
            onMouseEnter={this.handleMouseEnter}
        >
            <span className="hidden-sm">{this.props.long} <b className="caret" /></span>
            <span className="visible-sm">{this.props.short} <b className="caret" /></span>
        </a>;
    }
}

TopMenuToggle.propTypes = {
    long: React.PropTypes.string.isRequired,
    onClick: React.PropTypes.func, // From react-bootstrap Dropdown
    openId: React.PropTypes.string,
    short: React.PropTypes.string.isRequired,
};

const TopMenuDropdown = ({children, long, short, openId, onToggle}) => {
    return <Dropdown
        componentClass="li"
        id={`top-menu-${long.toLowerCase()}`}
        open={openId === long}
        onToggle={() => onToggle(long)}
    >
        <TopMenuToggle bsRole="toggle" long={long} short={short} openId={openId} />
        <Dropdown.Menu>
            <MenuItem className="visible-sm" header>{long}</MenuItem>
            {children}
        </Dropdown.Menu>
    </Dropdown>;
};

TopMenuDropdown.propTypes = {
    children: React.PropTypes.any,
    long: React.PropTypes.string.isRequired,
    onToggle: React.PropTypes.func.isRequired,
    openId: React.PropTypes.string,
    short: React.PropTypes.string.isRequired,
};

const handleScreenshotClick = e => {
    e.preventDefault();

    let contentElTemp = document.getElementById("screenshot-league");
    if (!contentElTemp) { contentElTemp = document.getElementById("screenshot-nonleague"); }
    if (!contentElTemp) {
        throw new Error('Missing DOM element #screenshot-league or #screenshot-nonleague');
    }
    const contentEl = contentElTemp;

    // Add watermark
    const watermark = document.createElement("div");
    const navbarBrands = document.getElementsByClassName("navbar-brand");
    if (navbarBrands.length === 0 || !navbarBrands[0].parentNode || !navbarBrands[0].parentNode.innerHTML) {
        return;
    }
    watermark.innerHTML = `<nav class="navbar navbar-default"><div class="container-fluid"><div class="navbar-header">${String(navbarBrands[0].parentNode.innerHTML)}</div><p class="navbar-text navbar-right" style="color: #000; font-weight: bold">Play your own league free at basketball-gm.com</p></div></nav>`;
    contentEl.insertBefore(watermark, contentEl.firstChild);
    contentEl.style.padding = "8px";

    // Add notifications
    const notifications = document.getElementsByClassName('notification-container')[0].cloneNode(true);
    notifications.classList.remove('notification-container');
    for (let i = 0; i < notifications.childNodes.length; i++) {
        // Otherwise screeenshot is taken before fade in is complete
        const el = notifications.childNodes[0];
        if (el.classList && typeof el.classList.remove === 'function') {
            el.classList.remove('notification-fadein');
        }
    }
    contentEl.appendChild(notifications);

    html2canvas(contentEl, {
        background: "#fff",
        async onrendered(canvas) {
            // Remove watermark
            contentEl.removeChild(watermark);
            contentEl.style.padding = "";

            // Remove notifications
            contentEl.removeChild(notifications);

            logEvent(null, {
                type: 'screenshot',
                text: `Uploading your screenshot to Imgur...`,
                saveToDb: false,
                showNotification: true,
                persistent: false,
                extraClass: 'notification-primary',
            });

            try {
                const data = await Promise.resolve($.ajax({
                    url: "https://imgur-apiv3.p.mashape.com/3/image",
                    type: "post",
                    headers: {
                        Authorization: "Client-ID c2593243d3ea679",
                        "X-Mashape-Key": "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
                    },
                    data: {
                        image: canvas.toDataURL().split(',')[1],
                    },
                    dataType: "json",
                }));
                logEvent(null, {
                    type: 'screenshot',
                    text: `<a href="http://imgur.com/${data.data.id}" target="_blank">Click here to view your screenshot.</a>`,
                    saveToDb: false,
                    showNotification: true,
                    persistent: true,
                    extraClass: 'notification-primary',
                });
            } catch (err) {
                console.log(err);
                if (err && err.responseJSON && err.responseJSON.error && err.responseJSON.error.message) {
                    helpers.errorNotify(`Error saving screenshot. Error message from Imgur: "${err.responseJSON.error.message}"`);
                } else {
                    helpers.errorNotify("Error saving screenshot.");
                }
            }
        },
    });
};

const handleToolsClick = (id, e) => {
    e.preventDefault();
    actions.toolsMenu[id]();
};

type DropdownLinksState = {
    openId?: string,
};

class DropdownLinks extends React.Component {
    state: DropdownLinksState;
    handleTopMenuToggle: Function;

    constructor(props) {
        super(props);
        this.state = {
            openId: undefined,
        };
        this.handleTopMenuToggle = this.handleTopMenuToggle.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState: DropdownLinksState) {
        return this.state.openId !== nextState.openId || this.props.lid !== nextProps.lid || this.props.godMode !== nextProps.godMode;
    }

    handleTopMenuToggle(id) {
        this.setState({
            openId: id === this.state.openId ? undefined : id,
        });
    }

    render() {
        const {godMode, lid} = this.props;

        return <Nav pullRight style={{marginRight: '0px'}}>
            {lid !== undefined ? <NavItem href={helpers.leagueUrl([])}>
                <span className="hidden-xs"><span className="glyphicon glyphicon-home" /></span>
                <span className="visible-xs toggle-responsive-menu"><span className="glyphicon glyphicon-home" style={{marginRight: '5px'}} />League Dashboard</span>
            </NavItem> : null}
            {lid !== undefined ? <TopMenuDropdown long="League" short="L" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href={helpers.leagueUrl(['standings'])}>Standings</MenuItem>
                <MenuItem href={helpers.leagueUrl(['playoffs'])}>Playoffs</MenuItem>
                <MenuItem href={helpers.leagueUrl(['league_finances'])}>Finances</MenuItem>
                <MenuItem href={helpers.leagueUrl(['history_all'])}>History</MenuItem>
                <MenuItem href={helpers.leagueUrl(['power_rankings'])}>Power Rankings</MenuItem>
                <MenuItem href={helpers.leagueUrl(['transactions', 'all'])}>Transactions</MenuItem>
            </TopMenuDropdown> : null}
            {lid !== undefined ? <TopMenuDropdown long="Team" short="T" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href={helpers.leagueUrl(['roster'])}>Roster</MenuItem>
                <MenuItem href={helpers.leagueUrl(['schedule'])}>Schedule</MenuItem>
                <MenuItem href={helpers.leagueUrl(['team_finances'])}>Finances</MenuItem>
                <MenuItem href={helpers.leagueUrl(['team_history'])}>History</MenuItem>
                <MenuItem href={helpers.leagueUrl(['transactions'])}>Transactions</MenuItem>
            </TopMenuDropdown> : null}
            {lid !== undefined ? <TopMenuDropdown long="Players" short="P" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href={helpers.leagueUrl(['free_agents'])}>Free Agents</MenuItem>
                <MenuItem href={helpers.leagueUrl(['trade'])}>Trade</MenuItem>
                <MenuItem href={helpers.leagueUrl(['trading_block'])}>Trading Block</MenuItem>
                <MenuItem href={helpers.leagueUrl(['draft'])}>Draft</MenuItem>
                <MenuItem href={helpers.leagueUrl(['watch_list'])}>Watch List</MenuItem>
                <MenuItem href={helpers.leagueUrl(['hall_of_fame'])}>Hall of Fame</MenuItem>
            </TopMenuDropdown> : null}
            {lid !== undefined ? <TopMenuDropdown long="Stats" short="S" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href={helpers.leagueUrl(['game_log'])}>Game Log</MenuItem>
                <MenuItem href={helpers.leagueUrl(['leaders'])}>League Leaders</MenuItem>
                <MenuItem href={helpers.leagueUrl(['player_ratings'])}>Player Ratings</MenuItem>
                <MenuItem href={helpers.leagueUrl(['player_stats'])}>Player Stats</MenuItem>
                <MenuItem href={helpers.leagueUrl(['team_stats'])}>Team Stats</MenuItem>
                <MenuItem href={helpers.leagueUrl(['player_feats'])}>Statistical Feats</MenuItem>
            </TopMenuDropdown> : null}
            <TopMenuDropdown long="Tools" short="X" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href="/account">Achievements</MenuItem>
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('autoPlaySeasons', e)}>Auto Play Seasons</MenuItem> : null}
                {lid !== undefined && godMode ? <MenuItem href={helpers.leagueUrl(['customize_player'])} className="god-mode-menu">Create A Player</MenuItem> : null}
                {lid !== undefined && godMode ? <MenuItem href={helpers.leagueUrl(['edit_team_info'])} className="god-mode-menu">Edit Team Info</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['event_log'])}>Event Log</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['export_league'])}>Export League</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['export_stats'])}>Export Stats</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['fantasy_draft'])}>Fantasy Draft</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['god_mode'])}>God Mode</MenuItem> : null}
                {lid !== undefined ? <MenuItem href={helpers.leagueUrl(['delete_old_data'])}>Improve Performance</MenuItem> : null}
                {lid !== undefined && godMode ? <MenuItem href={helpers.leagueUrl(['multi_team_mode'])} className="god-mode-menu">Multi Team Mode</MenuItem> : null}
                {lid !== undefined && godMode ? <MenuItem href={helpers.leagueUrl(['new_team'])} className="god-mode-menu">Switch Team</MenuItem> : null}
                <MenuItem onClick={handleScreenshotClick}><span className="glyphicon glyphicon-camera" /> Screenshot</MenuItem>
                {lid !== undefined ? <li className="divider" /> : null}
                <li role="presentation" className="dropdown-header">Use at your own risk!</li>
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('skipToPlayoffs', e)}>Skip To Playoffs</MenuItem> : null}
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('skipToBeforeDraft', e)}>Skip To Before Draft</MenuItem> : null}
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('skipToAfterDraft', e)}>Skip To After Draft</MenuItem> : null}
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('skipToPreseason', e)}>Skip To Preseason</MenuItem> : null}
                {lid !== undefined ? <MenuItem onClick={e => handleToolsClick('forceResumeDraft', e)}>Force Resume Draft</MenuItem> : null}
                <MenuItem href="" onClick={toggleDebugMode} id="toggle-debug-mode">
                    {localStorage.getItem('debug') === 'debug' ? 'Disable Debug Mode' : 'Enable Debug Mode'}
                </MenuItem>
                <MenuItem onClick={e => handleToolsClick('resetDb', e)}>Reset DB</MenuItem>
            </TopMenuDropdown>
            <TopMenuDropdown long="Help" short="?" openId={this.state.openId} onToggle={this.handleTopMenuToggle}>
                <MenuItem href="https://basketball-gm.com/manual/" rel="noopener noreferrer" target="_blank">Overview</MenuItem>
                <MenuItem href="/changes">Changes</MenuItem>
                <MenuItem href="https://basketball-gm.com/manual/customization/" rel="noopener noreferrer" target="_blank">Custom Rosters</MenuItem>
                <MenuItem href="https://basketball-gm.com/manual/debugging/" rel="noopener noreferrer" target="_blank">Debugging</MenuItem>
            </TopMenuDropdown>
        </Nav>;
    }
}

DropdownLinks.propTypes = {
    godMode: React.PropTypes.bool.isRequired,
    lid: React.PropTypes.number,
};

class LogoAndText extends React.Component {
    shouldComponentUpdate(nextProps) {
        return this.props.lid !== nextProps.lid || this.props.updating !== nextProps.updating;
    }

    render() {
        const {lid, updating} = this.props;

        return <a className="navbar-brand" href="/">
            <img
                alt=""
                className="spin"
                width="18"
                height="18"
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB9wIFRUXBgiS2qAAAAN8SURBVDjLbZRdTFtlGMd/b885PaXfYOk2vqHODWFsZIqySGLMdJsx2SQGdZk3uzIaL4war0282LUX3ng7WLLdSEzcZqJxKmXOSLbBBoJaoBDWQktLP0/POT1etHSV7E3e5D0neX75///P+7yCJ6zeVuW9Vwc9r4eCSo9TtgVspo1Mzty+fi+bWUro1/6Na1/vrRH1H8+F3P2vHHdcOjPkfi2eNBSbBacH3LhtNtAADcandvTx31Nzq1vWxQebubu7tdLuYeSo69SH53zjn5x/aqirTZH6QirPtNm5OZMDAQGPDMBAiyp1+pQDflWMysKa/yepL9VAve32/o/fbJq4cNrfjR2wAzLYJMHhNpX1LYNbD/L0taoIoMOvsJY0XIMHHCPRtPnLelrfkAAuvOy//NlY4DgyoFRBSlWqBft9MgGXxNXwDh1NCk7FxtaOwYl2py+a0HvCq4XL0vBB5xtfng9+GvBLMjao7SqEMmCCW7Ux2O5geqHAXFQjUyzz7f0MA/scndGUMS8/36W+3aRKju/CGewNAkkVIINVbUPQK9HZpOBXJIQNTh5xVYIvglwWnDvokW4vF0bl7Ux5aGapwMkBNw0e8dhWtQ3xpMFfyyVSaRMMKGvQ5lE40qzW+t7hV7rlYy0O6dQhd8VGsWrFqIIEBJ0ywZBc+acDJVjd0Pl+Nks4kqfTreCyi2bZJYmK1Lo8aopEXVZmFWRUuqa0CholCQm4s1Zwytm8FUcjVIOYdYr2hB7bNphayIMBkbjOR8NN2E1BX8ARlZc3SxGKDNcgZhVSBW3nTW7MZdF1aPHJnDnsoUEIvvopyfWHWc4+7WE1U1qUp9e0a5GYPtYdUORdNUXL4lYkx6OMQaNLYrTPiyqJivUybCQMjgYdbGdNFh5p2p1V7aoAeKffGx7t9Q5bgIGFqgpe6nGyzys/tgc10MSfad7t97EYK/HFz5vTV+bSJ2SASMp830JMjj3r6aJ+CovVwOtCv71SYLDZgTDgj/XCym8ruc9rs7a+o8eSudKsJWwjx/Y7Gvfe6t29ENNI5E2GWhqYmE0tfzOT+uB+XPvxf9MfSRuR+U3th8Wt0qGeRntrwCnJ9U/Mjb+zZEoWoUa7fmkqcfPKvdzF6fVc+Inv0e56ocV59sX2hrfavErXwpbWrpmW6PAp0UTBXPw1mp18GCtN7q35D5RXZnIkhyKSAAAAAElFTkSuQmCC"
                style={{
                    animationPlayState: updating ? 'running' : 'paused',
                    WebkitAnimationPlayState: updating ? 'running' : 'paused',
                }}
            />
            <span className="hidden-md hidden-sm hidden-xs">Basketball GM</span>
            {lid === undefined ? <span className="visible-md visible-sm visible-xs">Basketball GM</span> : null}
        </a>;
    }
}

LogoAndText.propTypes = {
    lid: React.PropTypes.number,
    updating: React.PropTypes.bool.isRequired,
};

const handleOptionClick = (option, e) => {
    if (!option.url) {
        e.preventDefault();
        actions.playMenu[option.id]();
    }
};

class PlayMenu extends React.Component {
    handleAltP: Function;

    constructor(props) {
        super(props);
        this.handleAltP = this.handleAltP.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keyup', this.handleAltP);
    }

    componentWillUnmount() {
        document.removeEventListener('keyup', this.handleAltP);
    }

    handleAltP(e: SyntheticKeyboardEvent) {
        // alt + p
        if (e.altKey && e.keyCode === 80) {
            const option = this.props.options[0];

            if (!option) {
                return;
            }

            if (option.url) {
                ui.realtimeUpdate([], option.url);
            } else {
                actions.playMenu[option.id]();
            }
        }
    }

    render() {
        const {lid, options} = this.props;

        if (lid === undefined) {
            return <div />;
        }

        return <ul className="nav navbar-nav-no-collapse">
            <Dropdown componentClass="li" id="play-menu">
                <Dropdown.Toggle className="play-button" useAnchor>
                    <span className="hidden-xs">Play</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {options.map((option, i) => {
                        return <MenuItem
                            key={i}
                            href={option.url}
                            onClick={e => handleOptionClick(option, e)}
                        >
                            {option.label}
                            {i === 0 ? <span className="text-muted kbd">Alt+P</span> : null}
                        </MenuItem>;
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </ul>;
    }
}

PlayMenu.propTypes = {
    lid: React.PropTypes.number,
    options: React.PropTypes.arrayOf(React.PropTypes.shape({
        id: React.PropTypes.string.isRequired,
        label: React.PropTypes.string.isRequired,
        url: React.PropTypes.string,
    })).isRequired,
};

type Props = {
    hasViewedALeague: boolean,
    lid?: number,
    godMode: boolean,
    options: Option[],
    phaseText: string,
    popup: boolean,
    statusText: string,
    updating: boolean,
    username?: string,
};

type State = {
    hasViewedALeague: boolean,
};

class NavBar extends React.Component {
    props: Props;
    state: State;
    playMenu: PlayMenu;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasViewedALeague: props.hasViewedALeague,
        };
    }

    // Workaround for https://github.com/react-bootstrap/react-bootstrap/issues/1301 based on https://github.com/react-bootstrap/react-router-bootstrap/issues/112#issuecomment-142599003
    componentDidMount() {
        const navBar = ReactDOM.findDOMNode(this);
        if (!navBar) { return; }
        const collapsibleNav = navBar.querySelector('div.navbar-collapse');
        if (!collapsibleNav) { return; }
        const btnToggle = navBar.querySelector('button.navbar-toggle');
        if (!btnToggle) { return; }

        navBar.addEventListener('click', (evt) => {
            if (evt.target.classList.contains('dropdown-toggle') || !collapsibleNav.classList.contains('in')) {
                return;
            }

            if (evt.target.tagName === 'A' || evt.target.classList.contains('toggle-responsive-menu')) {
                btnToggle.click();
            }
        }, false);
    }

    render() {
        const {lid, godMode, options, phaseText, popup, statusText, updating, username} = this.props;
        if (popup) {
            return <div />;
        }

        return <Navbar fixedTop>
            <div className="pull-right">
                {username ? <a className="navbar-link user-menu" href="/account">
                    <span className="glyphicon glyphicon-user" />{' '}
                    <span className="visible-lg">{username}</span>
                </a> : <a className="navbar-link user-menu" href="/account/login_or_register">
                    <span className="glyphicon glyphicon-user" />{' '}
                    <span className="visible-lg">Login/Register</span>
                </a>}
            </div>
            <Navbar.Header>
                <LogoAndText lid={lid} updating={updating} />
                <PlayMenu
                    lid={lid}
                    options={options}
                    ref={c => {
                        this.playMenu = c;
                    }}
                />
                <Overlay
                    onHide={() => {
                        this.setState({hasViewedALeague: true});
                        localStorage.setItem('hasViewedALeague', 'true');
                    }}
                    placement="bottom"
                    rootClose
                    show={!this.state.hasViewedALeague && lid === 1}
                    target={() => ReactDOM.findDOMNode(this.playMenu)}
                >
                    <Popover id="popover-welcome" title="Welcome to Basketball GM!">
                        To advance through the game, use the Play button at the top. The options shown will change depending on the current state of the game.
                    </Popover>
                </Overlay>
                {lid !== undefined ? <p className="navbar-text-two-line-no-collapse">
                    {phaseText}<br />
                    {statusText}
                </p> : null}
                <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
                <DropdownLinks godMode={godMode} lid={lid} />
            </Navbar.Collapse>
        </Navbar>;
    }
}

NavBar.propTypes = {
    hasViewedALeague: React.PropTypes.bool.isRequired,
    lid: React.PropTypes.number,
    godMode: React.PropTypes.bool.isRequired,
    options: React.PropTypes.array.isRequired,
    phaseText: React.PropTypes.string.isRequired,
    popup: React.PropTypes.bool.isRequired,
    statusText: React.PropTypes.string.isRequired,
    updating: React.PropTypes.bool.isRequired,
    username: React.PropTypes.string,
};

export default NavBar;
