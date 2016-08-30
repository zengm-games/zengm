const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const helpers = require('./helpers');
const viewHelpers = require('./viewHelpers');

function get(fnUpdate, args) {
    return async req => {
        const [updateEvents, cb, abort] = await (args.inLeague ? viewHelpers.beforeLeague(req) : viewHelpers.beforeNonLeague(req));

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

        fnUpdate(inputs, updateEvents, cb);
    };
}

function init(args) {
    args.inLeague = args.inLeague !== undefined ? args.inLeague : true;
    args.get = args.get !== undefined ? args.get : () => { return {}; };
    args.runBefore = args.runBefore !== undefined ? args.runBefore : [];
    args.runWhenever = args.runWhenever !== undefined ? args.runWhenever : [];

    if (args.InitViewModel) { throw new Error('Invalid arg InitViewModel'); }
    if (args.beforeReq) { throw new Error('Invalid arg beforeReq'); }
    if (args.uiFirst) { throw new Error('Invalid arg uiFirst'); }
    if (args.uiEvery) { throw new Error('Invalid arg uiEvery'); }
    if (args.runAfter) { throw new Error('Invalid arg runAfter'); }
    if (args.mapping) { throw new Error('Invalid arg mapping'); }

    if (!args.Component) { throw new Error('Missing arg Component'); }

    const output = {};
    output.update = (inputs, updateEvents, cb) => g.emitter.emit('updatePage', args, inputs, updateEvents, cb);
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
