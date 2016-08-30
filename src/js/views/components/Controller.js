const Promise = require('bluebird');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const helpers = require('../../util/helpers');
const Footer = require('./Footer');
const Header = require('./Header');
const LeagueWrapper = require('./LeagueWrapper');
const MultiTeamMenu = require('./MultiTeamMenu');
const NavBar = require('./NavBar');

class LeagueContent extends React.Component {
    shouldComponentUpdate(nextProps) {
        // Until this is true, it's still loading or updating
        return nextProps.args.pageId === nextProps.controller.idLoaded && !nextProps.controller.updating;
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
            args: undefined,
            controller: {
                idLoaded: undefined,
                idLoading: undefined,
            },
            data: {},
            multiTeam: {
                userTid: g.userTid,
                userTids: g.userTids,
            },
            topMenu: {
                email: null,
                godMode: g.godMode,
                goldUntil: 0,
                goldCancelled: 0,
                lid: undefined,
                options: [],
                phaseText: undefined,
                statusText: undefined,
                template: undefined,
                username: null,
            },
        };
        this.get = this.get.bind(this);
        this.updatePage = this.updatePage.bind(this);
        this.updateMultiTeam = this.updateMultiTeam.bind(this);
        this.updateTopMenu = this.updateTopMenu.bind(this);
    }

    componentDidMount() {
        g.emitter.on('get', this.get);
        g.emitter.on('updatePage', this.updatePage);
        g.emitter.on('updateMultiTeam', this.updateMultiTeam);
        g.emitter.on('updateTopMenu', this.updateTopMenu);
    }

    componentWillUnmount() {
        g.emitter.on('get', this.get);
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

        // Check for errors/redirects
        if (inputs.errorMessage !== undefined) {
            return helpers.error(inputs.errorMessage, cb);
        }
        if (inputs.redirectUrl !== undefined) {
            return ui.realtimeUpdate([], inputs.redirectUrl, cb);
        }

        this.updatePage(args, inputs, updateEvents, cb);
    }

    async updatePage(args, inputs, updateEvents, cb) {
        let prevData;

        // Reset league content and view model only if it's:
        // (1) if it's not loaded and not loading yet
        // (2) loaded, but loading something else
        if (
            (this.state.controller.idLoaded !== args.id && this.state.controller.idLoading !== args.id) ||
            (this.state.controller.idLoaded === args.id && this.state.controller.idLoading !== args.id && this.state.controller.idLoading !== null)
        ) {
            this.setState({
                controller: {
                    idLoaded: this.state.controller.idLoaded,
                    idLoading: args.id,
                },
            });

            updateEvents.push("firstRun");

            prevData = {};
        } else if (this.state.controller.idLoading === args.id) {
            // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
            cb();
            return;
        } else {
            this.setState({
                controller: {
                    idLoaded: this.state.controller.idLoaded,
                    idLoading: this.state.controller.idLoading,
                },
            });
            prevData = this.state.data;
        }

        // Resolve all the promises before updating the UI to minimize flicker
        const promisesBefore = args.runBefore.map(fn => fn(inputs, updateEvents, this.state));

        // Run promises in parallel, update when each one is ready
        // This runs no matter what
        const promisesWhenever = args.runWhenever.map(async fn => {
            const vars = await Promise.resolve(fn(inputs, updateEvents, this.state, this.setState.bind(this)));
            if (vars !== undefined) {
                this.setState({
                    data: Object.assign(this.state.data, ...vars),
                });
            }
        });

        const results = await Promise.all(promisesBefore);

        const vars = {
            args: {
                Component: args.Component,
                pageId: args.id,
                inLeague: args.inLeague,
            },
            data: Object.assign(prevData, ...results),
        };

        if (vars !== undefined) {
            // Check for errors/redirects
            if (vars.errorMessage !== undefined) {
                throw new Error('Handle errorMessage!');
            }
            if (vars.redirectUrl !== undefined) {
                return ui.realtimeUpdate([], vars.redirectUrl, cb);
            }

            this.setState(vars);
        }

        await Promise.all(promisesWhenever);

        if (this.state.controller.idLoading === args.id) {
            this.setState({
                controller: {
                    idLoaded: args.id,
                    idLoading: undefined,
                },
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
            topMenu: {
                ...this.state.topMenu,
                ...obj,
            },
        });
    }

    render() {
        const {args, data, controller, multiTeam, topMenu} = this.state;

        let contents;
        if (!args) {
            contents = null;
        } else if (!args.inLeague) {
            contents = <args.Component {...data} topMenu={topMenu} />;
        } else {
            contents = <div>
                <LeagueWrapper pageId={args.pageId}>
                    <LeagueContent args={args} controller={controller} data={data} topMenu={topMenu} Component={args.Component} />
                </LeagueWrapper>
                <MultiTeamMenu {...multiTeam} />
            </div>;
        }

        return <div className="container">
            <NavBar {...topMenu} updating={controller.idLoading !== undefined} />
            <Header />
            {contents}
            <Footer />
        </div>;
    }
}

module.exports = Controller;
