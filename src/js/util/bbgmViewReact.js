import g from '../globals';

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
    output.get = (ctx, next) => {
        if (ctx.bbgm === undefined) {
            ctx.bbgm = {};
        }
        if (ctx.bbgm.cb === undefined) {
            ctx.bbgm.cb = next;
        } else {
            const prevCb = ctx.bbgm.cb;
            ctx.bbgm.cb = () => {
                prevCb();
                next();
            };
        }
        ctx.bbgm.handled = true;
        g.emitter.emit('get', output.update, args, ctx);
    };

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

export default {
    init,
    title,
};
