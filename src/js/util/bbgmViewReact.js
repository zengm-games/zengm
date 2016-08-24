const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const EventEmitter = require('events');
const ko = require('knockout');
const React = require('react');
const ReactDOM = require('react-dom');
const helpers = require('./helpers');
const viewHelpers = require('./viewHelpers');

const emitter = new EventEmitter();

function controllerFactory(Component) {
    return class Controller extends React.Component {
        constructor(props) {
            super(props);
            this.state = {};
        }

        componentDidMount() {
            this.updateListener = this.update.bind(this);
            emitter.on('update', this.updateListener);
        }

        componentWillUnmount() {
            emitter.removeListener('update', this.updateListener);
        }

        async update(args, inputs, updateEvents, cb) {
            const container = g.lid !== null ? "league_content" : "content";
            const containerEl = document.getElementById(container);

            // Reset league content and view model only if it's:
            // (1) if it's not loaded and not loading yet
            // (2) loaded, but loading something else
            // (3) god these are just hacks, kill it all when we're React only
            if ((containerEl.dataset.idLoaded !== args.id && containerEl.dataset.idLoading !== args.id) || (containerEl.dataset.idLoaded === args.id && containerEl.dataset.idLoading !== args.id && containerEl.dataset.idLoading !== '') || (containerEl.dataset.idLoaded === args.id && containerEl.dataset.idLoading === '' && containerEl.dataset.reactFirstRun === 'false')) {
                containerEl.dataset.idLoading = args.id;
                containerEl.dataset.reactFirstRun = 'true';
                g.vm.topMenu.template(args.id); // For left menu

                updateEvents.push("firstRun");

//                vm = new args.InitViewModel(inputs);
            } else if (containerEl.dataset.idLoading === args.id) {
                // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
                cb();
                return;
            }

            // Resolve all the promises before updating the UI to minimize flicker
            const promisesBefore = args.runBefore.map(fn => fn(inputs, updateEvents, this.state));

            // Run promises in parallel, update when each one is ready
            // This runs no matter what
            const promisesWhenever = args.runWhenever.map(async fn => {
                const vars = await Promise.resolve(fn(inputs, updateEvents, this.state, this.setState.bind(this)));
                if (vars !== undefined) {
                    this.setState(vars);
                }
            });

            const results = await Promise.all(promisesBefore);

            let vars;
            if (results.length > 1) {
                vars = Object.assign({}, ...results);
            } else {
                vars = results[0];
            }

            if (vars !== undefined) {
                // Check for errors/redirects
                if (vars.errorMessage !== undefined) {
                    throw new Error('Handle errorMessage!');
//                return helpers.error(vars.errorMessage, cb);
                }
                if (vars.redirectUrl !== undefined) {
                    return ui.realtimeUpdate([], vars.redirectUrl, cb);
                }

                this.setState(vars);
            }

            // Actually should only render here, but worry about that later

            await Promise.all(promisesWhenever);

            if (containerEl.dataset.idLoading === containerEl.dataset.idLoaded) {
                containerEl.dataset.idLoading = ''; // Done loading
            }

            // Scroll to top
            if (updateEvents.length === 1 && updateEvents[0] === "firstRun") {
                window.scrollTo(window.pageXOffset, 0);
            }

            cb();
        }

        render() {
            return <Component {...this.state} />;
        }
    };
}

function get(fnUpdate, args) {
    return async req => {
        const [updateEvents, cb, abort] = await args.beforeReq(req);

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

        const container = g.lid !== null ? "league_content" : "content";
        const containerEl = document.getElementById(container);

        if (containerEl.dataset.idLoaded !== args.id && containerEl.dataset.idLoading !== args.id) {
            ui.update({
                container,
                template: args.id,
            }, true);
            ko.cleanNode(containerEl);
            ReactDOM.unmountComponentAtNode(containerEl);

            const WrappedComponent = controllerFactory(args.Component);
            ReactDOM.render(<WrappedComponent />, containerEl);
        }

        fnUpdate(inputs, updateEvents, cb);
    };
}

function init(args) {
    args.beforeReq = args.beforeReq !== undefined ? args.beforeReq : viewHelpers.beforeLeague;
    args.get = args.get !== undefined ? args.get : () => { return {}; };
    args.runBefore = args.runBefore !== undefined ? args.runBefore : [];
    args.runWhenever = args.runWhenever !== undefined ? args.runWhenever : [];

    if (args.InitViewModel) { throw new Error('Invalid arg InitViewModel'); }
    if (args.uiFirst) { throw new Error('Invalid arg uiFirst'); }
    if (args.uiEvery) { throw new Error('Invalid arg uiEvery'); }
    if (args.runAfter) { throw new Error('Invalid arg runAfter'); }
    if (args.mapping) { throw new Error('Invalid arg mapping'); }

    if (!args.Component) { throw new Error('Missing arg Component'); }

    const output = {};
    output.update = (inputs, updateEvents, cb) => emitter.emit('update', args, inputs, updateEvents, cb);
    output.get = get(output.update, args);

    return output;
}

let currentTitle = 'Basketball GM';
function title(newTitle) {
    if (g.lid !== null) {
        newTitle += ` - ${g.leagueName}`;
    }
    newTitle = `${newTitle} - Basketball GM`;
    if (newTitle !== currentTitle) {
        currentTitle = newTitle;
        document.title = newTitle;
    }
}

module.exports = {
    init,
    title,
};
