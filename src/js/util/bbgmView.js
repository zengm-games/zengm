const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const komapping = require('knockout.mapping');
const ReactDOM = require('react-dom');
const _ = require('underscore');
const helpers = require('./helpers');
const viewHelpers = require('./viewHelpers');

let vm;

function display(args, updateEvents) {
    const container = g.lid !== null ? "league_content" : "content";
    const containerEl = document.getElementById(container);

    if (containerEl.dataset.idLoaded !== args.id && containerEl.dataset.idLoading === args.id) {
        ui.update({
            container,
            template: args.id,
        });
        ko.applyBindings(vm, containerEl);
        if (args.uiFirst !== undefined) {
            args.uiFirst(vm);
        }
    }
    if (args.uiEvery !== undefined) {
        args.uiEvery(updateEvents, vm);
    }
}

function update(args) {
    return async (inputs, updateEvents, cb) => {
        const container = g.lid !== null ? "league_content" : "content";
        const containerEl = document.getElementById(container);

        // Reset league content and view model only if it's:
        // (1) if it's not loaded and not loading yet
        // (2) loaded, but loading something else
        if ((containerEl.dataset.idLoaded !== args.id && containerEl.dataset.idLoading !== args.id) || (containerEl.dataset.idLoaded === args.id && containerEl.dataset.idLoading !== args.id && containerEl.dataset.idLoading !== "")) {
            ko.cleanNode(containerEl);

            containerEl.dataset.idLoading = args.id;
            g.vm.topMenu.template(args.id);

            updateEvents.push("firstRun");

            // View model
            vm = new args.InitViewModel(inputs);
        } else if (containerEl.dataset.idLoading === args.id) {
            // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
            cb();
            return;
        }

        // Resolve all the promises before updating the UI to minimize flicker
        const promisesBefore = args.runBefore.map(fn => fn(inputs, updateEvents, vm));

        // Run promises in parallel, update when each one is ready
        // This runs no matter what
        const promisesWhenever = args.runWhenever.map(async fn => {
            const vars = await Promise.resolve(fn(inputs, updateEvents, vm));
            if (vars !== undefined) {
                komapping.fromJS(vars, args.mapping, vm);
            }
        });

        const results = await Promise.all(promisesBefore);

        let vars;
        if (results.length > 1) {
            vars = $.extend.apply(null, results);
        } else {
            vars = results[0];
        }

        if (vars !== undefined) {
            // Check for errors/redirects
            if (vars.errorMessage !== undefined) {
                return helpers.error(vars.errorMessage, cb);
            }
            if (vars.redirectUrl !== undefined) {
                return ui.realtimeUpdate([], vars.redirectUrl, cb);
            }

            // This might not do the update all at once, so in cases where you have things like if (x) { y } in the UI, changing x might casue y to get read before y is set. So be careful to set things earlier. See js/views/roster.js filterUntradable stuff.
            komapping.fromJS(vars, args.mapping, vm);
        }

        display(args, updateEvents);

        // Run promises in parallel, update when each one is ready
        // This only runs if it hasn't been short-circuited yet
        const promisesAfter = args.runAfter.map(async fn => {
            const vars = await Promise.resolve(fn(inputs, updateEvents, vm));
            if (vars !== undefined) {
                komapping.fromJS(vars, args.mapping, vm);
            }
        });

        await Promise.all([
            Promise.all(promisesAfter),
            Promise.all(promisesWhenever),
        ]);

        if (containerEl.dataset.idLoading === containerEl.dataset.idLoaded) {
            containerEl.dataset.idLoading = ""; // Done loading
        }

        // Scroll to top
        if (_.isEqual(updateEvents, ["firstRun"])) {
            window.scrollTo(window.pageXOffset, 0);
        }

        cb();
    };
}

function get(fnBeforeReq, fnGet, fnUpdate) {
    return async req => {
        const [updateEvents, cb] = await fnBeforeReq(req);

        let inputs = fnGet(req);
        if (inputs === undefined) {
            inputs = {};
        }

        const containerEl = document.getElementById('content');
        const otherContainerEl = document.getElementById('league_content');
        if (containerEl) { ReactDOM.unmountComponentAtNode(containerEl); }
        if (otherContainerEl) { ReactDOM.unmountComponentAtNode(otherContainerEl); }

        // Check for errors/redirects
        if (inputs.errorMessage !== undefined) {
            return helpers.error(inputs.errorMessage, cb);
        }
        if (inputs.redirectUrl !== undefined) {
            return ui.realtimeUpdate([], inputs.redirectUrl, cb);
        }

        fnUpdate(inputs, updateEvents, cb);
    };
}

function post(fnBeforeReq, fnPost) {
    return async req => {
        await fnBeforeReq(req);
        fnPost(req);
    };
}

/**
 * Initialize a view module.
 *
 * The output of this function should be returned by each view module to expose the public properties get (respond to GET requests) post (respond to POST requests) and update (typically just called by get, but it's convenient for testing to expose this too).
 *
 * The general flow of a GET request is: call args.get to parse input, use args.InitViewModel to initialize Knockout view model, run functions in args.runBefore to generate the required data (everything on a new page load, or only updated data on an update), run the Knockout mapping plugin on the results with args.mapping, display the template if it's not already loaded (i.e. first run only, not updates), call args.uiFirst if this is a new page load to do some one-time DOM manipulation, call args.uiEvery every page load for DOM manipulation, and map the results of the args.runWhenever functions to the view model whenever they are available (before or after display of template).
 *
 * @memberOf util.bbgmView
 * @param {Object} args Arguments, as described below.
 * @param {string} args.id Contains the unique id/name of the view. This should also be the name of the JavaScript file in ./js/views, as well as the name of the template file in ./templates.
 * @param {function(Object, function(Array.<strong>, function()))=} args.beforeReq Optional function which takes a Davis.js request object, extracts the updateEvents  and callback function (setting them to default values if undefined), and then passes them to a callback. This is called before args.get and args.post. If undefined, then util.viewHelpers.beforeLeague is used.
 * @param {function(Object)=: Object=} args.get Optional function which takes a Davis.js request object, validates any inputs, and returns them in a usable object like {season: 2014, abbrev: "CHI"}. This function is called by Davis.js when a page is originally loaded (i.e. in response to a clicked link) or when some data is updated and ui.realtimeUpdate is called. So the same entry point is used for generating all the HTML from scratch and just updating it.
 * To display a full-screen error message, include an "errorMessage" property with string contents in the return object. To redirect to another URL, include a "redirectUrl" property containing the URL in the return object. Either displaying an error message or redirecting this way will short-circuit the rest of the loading of the view.
 * @param {function(Object)=} args.post Optional function which takes a Davis.js request object, validates any inputs, takes appropriate action to update the database if necessary, and ends by making a GET request for whatever page should be shown to the user. This GET request can contain some data (like an error/success message) to be displayed.
 * To display a full-screen error message, call helpers.error directly. To redirect to another URL, call ui.realtimeUpdate directly. No fancy short circuiting is needed like in args.get because nothing is run after args.post completes anyway.
 * @param {function(Object)=} args.InitViewModel Optional constructor function defining the initial Knockout view model structure created immediately after a GET request. This should only be used when absolutely necessary, and in those cases should be as minimal as possible. The only valid uses are (1) to create properties on the view model that are needed by other functions (in args.runBefore and args.runWhenever) to check if updates are needed, and (2) to define computed observables and the observables they directly depend on. As this is a constructor function, view model properites should be attached to this.
 * @param {Object=} args.mapping Optional object defining the structure of the mapping (via the Knockout mappping plugin) between the output of all args.runBefore and runWhenever functions. "All" means that this single mapping object is used in multiple different places with multiple different subsets of data, so it should be able to handle everything. Specifically, all the results of the args.runBefore functions are run through the mapping plugin together, while each result from a runWhenever function is run through separately. If undefined, then the default for the Knockout mappping plugin will be used.
 * @param {Array.<function(Object, Array.<string>, Object): Object=>=} args.runBefore Array of functions run before the template is displayed/updated. Arguments of each function are inputs (return value of get), updateEvents (containing information about what changed this load/update, such as "gameSim" or "playerMovement", and also "firstRun" if this is the first load of a page and not a refresh), and vm (the current Knockout view model). If there is something to update, the function returns a jQuery promise that resolves when the updated data has been retrieved.
 * There are two ways that a args.runBefore function can update the view model: (1) send some data when it resolves, which is then applied (with the Knockout mapping plugin and args.mapping) after all args.runBefore functions have finished, or (2) update the view model directly. (1) is preferred to (2) unless there is some very compelling reason otherwise, because (1) means that all fast updates will happen together rather than having some parts of the UI update at different times. Normally, the view model should just be used to read values, and even then it should be done as minimally as possible.
* To display a full-screen error message, include an "errorMessage" property with string contents in the object passed to the resolved promise. To redirect to another URL, include a "redirectUrl" property containing the URL in the object passed to the resolved promise. Either displaying an error message or redirecting this way will short-circuit the rest of the loading of the view (but only after all runBefore functions are complete).
 * @param {Array.<function(Object, Array.<string>, Object): Object=>=} args.runWhenever Similar to args.runBefore, except the template can be displayed before it finishes. Therefore, this is optional and should only be used for slow functions, which should be uncommon. The only other difference from args.runBefore is that the view model is updated after each one of these functions finishes, rather than waiting for all of them. Thus, it's somewhat less bad to update the view model directly here.
 * @param {function(Object)=} args.uiFirst Optional function run immediately after the template is displayed, and then never again regardless of how the page is updated. The argument is the current view model, which contains the results of args.runBefore. This function mainly exists for doing things like one-time DOM manipulation or setting up events. No asynchronous work or view model writing should be done here without a very good reason.
 * @param {function(Array.<string>, Object)=} args.uiEvery Optional function run immediately after args.uiFirst, and then again every time the UI is updated right after args.runBefore. The arguments are updateEvents (containing information about what changed this load/update, such as "gameSim" or "playerMovement", and also "firstRun" if this is the first load of a page and not a refresh) and the current view model, which contains the results of args.runBefore. This function mainly exists for doing repeated DOM manipulation (such as setting a dynamic title for the page, or updating dropdown menus from views.components.dropdown). No asynchronous work or view model writing should be done here without a very good reason.
 * @return {Object} Object with module's exposed properties: get, post, and update.
 */
function init(args) {
    args.InitViewModel = args.InitViewModel !== undefined ? args.InitViewModel : function () {};
    args.beforeReq = args.beforeReq !== undefined ? args.beforeReq : viewHelpers.beforeLeague;
    args.get = args.get !== undefined ? args.get : () => { return {}; };
    args.runBefore = args.runBefore !== undefined ? args.runBefore : [];
    args.runAfter = args.runAfter !== undefined ? args.runAfter : [];
    args.runWhenever = args.runWhenever !== undefined ? args.runWhenever : [];
    args.mapping = args.mapping !== undefined ? args.mapping : {};

    if (args.Component) { throw new Error('Use bbgmViewReact, dumbass'); }

    const output = {};
    output.update = update(args);
    output.get = get(args.beforeReq, args.get, output.update);
    if (args.post !== undefined) {
        output.post = post(args.beforeReq, args.post);
    }

    return output;
}

module.exports = {
    init,
};
