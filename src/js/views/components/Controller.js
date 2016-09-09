const Promise = require('bluebird');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const Footer = require('./Footer');
const Header = require('./Header');
const LeagueWrapper = require('./LeagueWrapper');
const MultiTeamMenu = require('./MultiTeamMenu');
const NagModal = require('./NagModal');
const NavBar = require('./NavBar');

class LeagueContent extends React.Component {
    shouldComponentUpdate(nextProps) {
        return !nextProps.updating;
    }

    render() {
        const {Component, data, topMenu} = this.props;

        return <Component {...data} topMenu={topMenu} />;
    }
}

class Controller extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Component: undefined,
            idLoaded: undefined,
            idLoading: undefined,
            inLeague: false,
            data: {},
            multiTeam: {
                userTid: g.userTid,
                userTids: g.userTids,
            },
            showNagModal: true,
            topMenu: {
                email: null,
                godMode: g.godMode,
                goldUntil: 0,
                goldCancelled: 0,
                hasViewedALeague: !!localStorage.hasViewedALeague,
                lid: undefined,
                options: [],
                phaseText: undefined,
                popup: window.location.search === '?w=popup',
                statusText: undefined,
                username: null,
            },
        };
        this.get = this.get.bind(this);
        this.updatePage = this.updatePage.bind(this);
        this.updateMultiTeam = this.updateMultiTeam.bind(this);
        this.updateTopMenu = this.updateTopMenu.bind(this);
        this.setStateData = this.setStateData.bind(this);
    }

    componentDidMount() {
        g.emitter.on('get', this.get);
        g.emitter.on('updatePage', this.updatePage);
        g.emitter.on('updateMultiTeam', this.updateMultiTeam);
        g.emitter.on('updateTopMenu', this.updateTopMenu);

        if (this.state.topMenu.popup) {
            document.body.style.paddingTop = 0;

            const css = document.createElement("style");
            css.type = "text/css";
            css.innerHTML = ".new_window { display: none }";
            document.body.appendChild(css);
        }
    }

    componentWillUnmount() {
        g.emitter.removeListener('get', this.get);
        g.emitter.removeListener('updatePage', this.updatePage);
        g.emitter.removeListener('updateMultiTeam', this.updateMultiTeam);
        g.emitter.removeListener('updateTopMenu', this.updateTopMenu);
    }

    async get(fnUpdate, args, req) {
        const viewHelpers = require('../../util/viewHelpers');
        const [updateEvents, cb, abort] = await (args.inLeague ? viewHelpers.beforeLeague(req, this.state.topMenu.lid) : viewHelpers.beforeNonLeague(req));

        if (abort === 'abort') {
            return;
        }

        let inputs = args.get(req);
        if (inputs === undefined) {
            inputs = {};
        }

        if (inputs.redirectUrl !== undefined) {
            return ui.realtimeUpdate([], inputs.redirectUrl, cb);
        }

        this.updatePage(args, inputs, updateEvents, cb);
    }

    setStateData(data) {
        this.setState({
            data: Object.assign(this.state.data, data),
        });
    }

    async updatePage(args, inputs, updateEvents, cb) {
        let prevData;

        // Reset league content and view model only if it's:
        // (1) if it's not loaded and not loading yet
        // (2) loaded, but loading something else
        if (
            (this.state.idLoaded !== args.id && this.state.idLoading !== args.id) ||
            (this.state.idLoaded === args.id && this.state.idLoading !== args.id && this.state.idLoading !== undefined)
        ) {
            updateEvents.push("firstRun");

            prevData = {};
        } else if (this.state.idLoading === args.id) {
            // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
            cb();
            return;
        } else {
            prevData = this.state.data;
        }

        this.setState({
            idLoading: args.id,
        });

        // Resolve all the promises before updating the UI to minimize flicker
        const promisesBefore = args.runBefore.map(fn => fn(inputs, updateEvents, prevData, this.setStateData, this.state.topMenu));

        // Run promises in parallel, update when each one is ready
        // This runs no matter what
        const promisesWhenever = args.runWhenever.map(async fn => {
            // This is a race condition - it assumes this.state.data has been updated by promisesBefore, which will only happen when promisesWhenever are much slower than promisesBefore
            const vars = await Promise.resolve(fn(inputs, updateEvents, this.state.data, this.setStateData, this.state.topMenu));
            if (vars !== undefined) {
                this.setStateData(vars);
            }
        });

        const results = await Promise.all(promisesBefore);

        const vars = {
            Component: args.Component,
            inLeague: args.inLeague,
            data: Object.assign(prevData, ...results),
        };

        if (vars !== undefined) {
            if (vars.redirectUrl !== undefined) {
                return ui.realtimeUpdate([], vars.redirectUrl, cb);
            }

            this.setState(vars);
        }

        await Promise.all(promisesWhenever);

        if (this.state.idLoading === args.id) {
            this.setState({
                idLoaded: args.id,
                idLoading: undefined,
            });

            // Scroll to top
            if (updateEvents.length === 1 && updateEvents[0] === "firstRun") {
                window.scrollTo(window.pageXOffset, 0);
            }
        }

        cb();
    }

    updateMultiTeam() {
        this.setState({
            multiTeam: {
                userTid: g.userTid,
                userTids: g.userTids,
            },
        });
    }

    updateTopMenu(obj) {
        this.setState({
            topMenu: Object.assign(this.state.topMenu, obj),
        });
    }

    render() {
        const {Component, data, idLoaded, idLoading, inLeague, multiTeam, topMenu} = this.state;

        const updating = idLoading !== undefined;

        let contents;
        if (!Component) {
            contents = null;
        } else if (!inLeague) {
            contents = <Component {...data} topMenu={topMenu} />;
        } else {
            const pageId = idLoading !== undefined ? idLoading : idLoaded;

            contents = <div>
                <LeagueWrapper pageId={pageId}>
                    <LeagueContent
                        Component={Component}
                        data={data}
                        topMenu={topMenu}
                        updating={updating}
                    />
                </LeagueWrapper>
                <MultiTeamMenu {...multiTeam} />
            </div>;
        }

        return <div className="container">
            <NavBar {...topMenu} updating={updating} />
            <Header />
            <div id="screenshot-nonleague">
                {contents}
            </div>
            <Footer />
            <NagModal close={() => {
                this.setState({
                    showNagModal: false,
                });
            }} show={this.state.showNagModal} />
        </div>;
    }
}

module.exports = Controller;
