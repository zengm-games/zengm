const $ = require('jquery');
const React = require('react');
const ui = require('../../ui');
const actions = require('../../util/actions');
const helpers = require('../../util/helpers');

const toggleDebugMode = () => {
    if (localStorage.debug === "debug") {
        localStorage.debug = "";
    } else {
        localStorage.debug = "debug";
    }
    window.location.reload();
};

class DropdownLinks extends React.Component {
    shouldComponentUpdate(nextProps) {
        return this.props.lid !== nextProps.lid || this.props.godMode !== nextProps.godMode;
    }

    componentDidMount() {
        // Bootstrap's collapsable nav doesn't play nice with single page apps
        // unless you manually close it when a link is clicked. However, I need
        // this to run only on real links, not "dropdown" links (#).
        const topMenuCollapse = $("#top-menu-collapse");
        topMenuCollapse.on("click", "a:not([href='#'])", () => {
            // Only run when collapsable is open
            if (topMenuCollapse.hasClass("in")) {
                topMenuCollapse.collapse("hide");
            }
        });

        // When a dropdown at the top is open, use hover to move between items,
        // like in a normal menubar.
        $("#nav-primary").on("mouseenter", ".dropdown-toggle", event => {
            if (!topMenuCollapse.hasClass("in")) {
                const liHover = event.target.parentNode;

                // Is any dropdown open?
                let foundOpen = false;
                const lis = document.getElementById("nav-primary").children;
                for (let i = 0; i < lis.length; i++) {
                    if (lis[i].classList.contains("open")) {
                        foundOpen = true;
                        if (lis[i] === liHover) {
                            // The hovered menu is already open
                            return;
                        }
                    }
                }

                // If no dropdown is open, do nothing
                if (!foundOpen) {
                    return;
                }

                // If a dropdown is open and another one is hovered over, open the hovered one and close the other
                $(liHover.children[0]).dropdown("toggle");
            }
        });
    }

    handleToolsClick(id, e) {
        e.preventDefault();
        actions.toolsMenu[id]();
    }

    render() {
        const {godMode, lid} = this.props;

        return <div className="collapse navbar-collapse navbar-right" id="top-menu-collapse">
            <ul className="nav navbar-nav" id="nav-primary">
                {lid !== undefined ? <li><a href={helpers.leagueUrl([])}><span className="glyphicon glyphicon-home"></span></a></li> : null}
                {lid !== undefined ? <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">League <b className="caret"></b></span><span className="visible-sm">L <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">League</li>
                        <li><a href={helpers.leagueUrl(['standings'])}>Standings</a></li>
                        <li><a href={helpers.leagueUrl(['playoffs'])}>Playoffs</a></li>
                        <li><a href={helpers.leagueUrl(['league_finances'])}>Finances</a></li>
                        <li><a href={helpers.leagueUrl(['history_all'])}>History</a></li>
                        <li><a href={helpers.leagueUrl(['power_rankings'])}>Power Rankings</a></li>
                        <li><a href={helpers.leagueUrl(['transactions', 'all'])}>Transactions</a></li>
                    </ul>
                </li> : null}
                {lid !== undefined ? <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">Team <b className="caret"></b></span><span className="visible-sm">T <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">Team</li>
                        <li><a href={helpers.leagueUrl(['roster'])}>Roster</a></li>
                        <li><a href={helpers.leagueUrl(['schedule'])}>Schedule</a></li>
                        <li><a href={helpers.leagueUrl(['team_finances'])}>Finances</a></li>
                        <li><a href={helpers.leagueUrl(['team_history'])}>History</a></li>
                        <li><a href={helpers.leagueUrl(['transactions'])}>Transactions</a></li>
                    </ul>
                </li> : null}
                {lid !== undefined ? <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">Players <b className="caret"></b></span><span className="visible-sm">P <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">Players</li>
                        <li><a href={helpers.leagueUrl(['free_agents'])}>Free Agents</a></li>
                        <li><a href={helpers.leagueUrl(['trade'])}>Trade</a></li>
                        <li><a href={helpers.leagueUrl(['trading_block'])}>Trading Block</a></li>
                        <li><a href={helpers.leagueUrl(['draft'])}>Draft</a></li>
                        <li><a href={helpers.leagueUrl(['watch_list'])}>Watch List</a></li>
                        <li><a href={helpers.leagueUrl(['hall_of_fame'])}>Hall of Fame</a></li>
                    </ul>
                </li> : null}
                {lid !== undefined ? <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">Stats <b className="caret"></b></span><span className="visible-sm">S <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">Stats</li>
                        <li><a href={helpers.leagueUrl(['game_log'])}>Game Log</a></li>
                        <li><a href={helpers.leagueUrl(['leaders'])}>League Leaders</a></li>
                        <li><a href={helpers.leagueUrl(['player_ratings'])}>Player Ratings</a></li>
                        <li><a href={helpers.leagueUrl(['player_stats'])}>Player Stats</a></li>
                        <li><a href={helpers.leagueUrl(['team_stats'])}>Team Stats</a></li>
                        <li><a href={helpers.leagueUrl(['player_feats'])}>Statistical Feats</a></li>
                    </ul>
                </li> : null}
                <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">Tools <b className="caret"></b></span><span className="visible-sm">X <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">Tools</li>
                        <li><a href="/account">Achievements</a></li>
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('autoPlaySeasons', e)} data-no-davis="true">Auto Play Seasons</a></li> : null}
                        {lid !== undefined && godMode ? <li><a href={helpers.leagueUrl(['customize_player'])} className="god-mode">Create A Player</a></li> : null}
                        {lid !== undefined && godMode ? <li><a href={helpers.leagueUrl(['edit_team_info'])} className="god-mode">Edit Team Info</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['event_log'])}>Event Log</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['export_league'])}>Export League</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['export_stats'])}>Export Stats</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['fantasy_draft'])}>Fantasy Draft</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['god_mode'])}>God Mode</a></li> : null}
                        {lid !== undefined ? <li><a href={helpers.leagueUrl(['delete_old_data'])}>Improve Performance</a></li> : null}
                        {lid !== undefined && godMode ? <li><a href={helpers.leagueUrl(['multi_team_mode'])} className="god-mode">Multi Team Mode</a></li> : null}
                        {lid !== undefined && godMode ? <li><a href={helpers.leagueUrl(['new_team'])} className="god-mode">Switch Team</a></li> : null}
                        <li><a href="" id="screenshot" data-no-davis="true"><span className="glyphicon glyphicon-camera"></span> Screenshot</a></li>
                        {lid !== undefined ? <li className="divider"></li> : null}
                        <li role="presentation" className="dropdown-header">Use at your own risk!</li>
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('skipToPlayoffs', e)} data-no-davis="true">Skip To Playoffs</a></li> : null}
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('skipToBeforeDraft', e)} data-no-davis="true">Skip To Before Draft</a></li> : null}
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('skipToAfterDraft', e)} data-no-davis="true">Skip To After Draft</a></li> : null}
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('skipToPreseason', e)} data-no-davis="true">Skip To Preseason</a></li> : null}
                        {lid !== undefined ? <li><a onClick={e => this.handleToolsClick('forceResumeDraft', e)} data-no-davis="true">Force Resume Draft</a></li> : null}
                        <li><a href="" onClick={toggleDebugMode} id="toggle-debug-mode">
                            {localStorage.debug === "debug" ? 'Disable Debug Mode' : 'Enable Debug Mode'}
                        </a></li>
                        <li><a onClick={e => this.handleToolsClick('resetDb', e)} data-no-davis="true">Reset DB</a></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown"><span className="hidden-sm">Help <b className="caret"></b></span><span className="visible-sm">? <b className="caret"></b></span></a>
                    <ul className="dropdown-menu">
                        <li className="dropdown-header visible-sm">Help</li>
                        <li><a href="https://basketball-gm.com/manual/" target="_blank">Overview</a></li>
                        <li><a href="/changes">Changes</a></li>
                        <li><a href="https://basketball-gm.com/manual/customization/" target="_blank">Custom Rosters</a></li>
                        <li><a href="https://basketball-gm.com/manual/debugging/" target="_blank">Debugging</a></li>
                    </ul>
                </li>
            </ul>
        </div>;
    }
}

class PlayMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleAltP = this.handleAltP.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keyup', this.handleAltP);
    }

    componentWillUnmount() {
        document.removeListener('keyup', this.handleAltP);
    }

    handleAltP(e) {
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

    handleClick(option, e) {
        if (!option.url) {
            e.preventDefault();
            actions.playMenu[option.id]();
        }
    }

    render() {
        const {lid, options} = this.props;

        if (lid === undefined) {
            return <div />;
        }

        return <ul className="nav navbar-nav-no-collapse" data-no-collapse="true">
            <li className="dropdown">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown" id="play-button">
                    <span className="hidden-xs">Play</span> <b className="caret"></b>
                </a>
                <ul className="dropdown-menu">
                    {options.map((option, i) => <li key={i}>
                        <a
                            href={option.url}
                            onClick={e => this.handleClick(option, e)}
                            data-no-davis={option.url ? null : 'true'}
                        >
                            {option.label}
                            {i === 0 ? <span className="text-muted kbd">Alt+P</span> : null}
                        </a>
                    </li>)}
                </ul>
            </li>
        </ul>;
    }
}

const NavBar = ({lid, godMode, options, phaseText, statusText, updating, username}) => {
    return <nav className="navbar navbar-default navbar-fixed-top" role="navigation" id="top-menu">
        <div className="container">
            <div className="pull-right">
                    {
                        username
                    ?
                        <a className="navbar-link user-menu" href="/account">
                            <span className="glyphicon glyphicon-user"></span>
                            <span className="visible-lg">{username}</span>
                        </a>
                    :
                        <a className="navbar-link user-menu" href="/account/login_or_register">
                            <span className="glyphicon glyphicon-user"></span>
                            <span className="visible-lg">Login/Register</span>
                        </a>
                    }
            </div>

            <div className="navbar-header">
                <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#top-menu-collapse">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
                <a className="navbar-brand" href="/">
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB9wIFRUXBgiS2qAAAAN8SURBVDjLbZRdTFtlGMd/b885PaXfYOk2vqHODWFsZIqySGLMdJsx2SQGdZk3uzIaL4war0282LUX3ng7WLLdSEzcZqJxKmXOSLbBBoJaoBDWQktLP0/POT1etHSV7E3e5D0neX75///P+7yCJ6zeVuW9Vwc9r4eCSo9TtgVspo1Mzty+fi+bWUro1/6Na1/vrRH1H8+F3P2vHHdcOjPkfi2eNBSbBacH3LhtNtAADcandvTx31Nzq1vWxQebubu7tdLuYeSo69SH53zjn5x/aqirTZH6QirPtNm5OZMDAQGPDMBAiyp1+pQDflWMysKa/yepL9VAve32/o/fbJq4cNrfjR2wAzLYJMHhNpX1LYNbD/L0taoIoMOvsJY0XIMHHCPRtPnLelrfkAAuvOy//NlY4DgyoFRBSlWqBft9MgGXxNXwDh1NCk7FxtaOwYl2py+a0HvCq4XL0vBB5xtfng9+GvBLMjao7SqEMmCCW7Ux2O5geqHAXFQjUyzz7f0MA/scndGUMS8/36W+3aRKju/CGewNAkkVIINVbUPQK9HZpOBXJIQNTh5xVYIvglwWnDvokW4vF0bl7Ux5aGapwMkBNw0e8dhWtQ3xpMFfyyVSaRMMKGvQ5lE40qzW+t7hV7rlYy0O6dQhd8VGsWrFqIIEBJ0ywZBc+acDJVjd0Pl+Nks4kqfTreCyi2bZJYmK1Lo8aopEXVZmFWRUuqa0CholCQm4s1Zwytm8FUcjVIOYdYr2hB7bNphayIMBkbjOR8NN2E1BX8ARlZc3SxGKDNcgZhVSBW3nTW7MZdF1aPHJnDnsoUEIvvopyfWHWc4+7WE1U1qUp9e0a5GYPtYdUORdNUXL4lYkx6OMQaNLYrTPiyqJivUybCQMjgYdbGdNFh5p2p1V7aoAeKffGx7t9Q5bgIGFqgpe6nGyzys/tgc10MSfad7t97EYK/HFz5vTV+bSJ2SASMp830JMjj3r6aJ+CovVwOtCv71SYLDZgTDgj/XCym8ruc9rs7a+o8eSudKsJWwjx/Y7Gvfe6t29ENNI5E2GWhqYmE0tfzOT+uB+XPvxf9MfSRuR+U3th8Wt0qGeRntrwCnJ9U/Mjb+zZEoWoUa7fmkqcfPKvdzF6fVc+Inv0e56ocV59sX2hrfavErXwpbWrpmW6PAp0UTBXPw1mp18GCtN7q35D5RXZnIkhyKSAAAAAElFTkSuQmCC" width="18" height="18" className='spin' style={{
                        animationPlayState: updating ? 'running' : 'paused',
                        WebkitAnimationPlayState: updating ? 'running' : 'paused',
                    }} />
                    <span className="hidden-md hidden-sm hidden-xs">Basketball GM</span>
                    {lid === undefined ? <span className="visible-md visible-sm visible-xs">Basketball GM</span> : null}
                </a>
                <PlayMenu lid={lid} options={options} />
                {lid !== undefined ? <p className="navbar-text-two-line-no-collapse" data-no-collapse="true">
                    {phaseText}<br />
                    {statusText}
                </p> : null}
            </div>

            <DropdownLinks godMode={godMode} lid={lid} />
        </div>
    </nav>;
};

module.exports = NavBar;
