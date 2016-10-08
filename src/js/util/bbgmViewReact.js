// @flow

import g from '../globals';
import type {PageCtx, UpdateEvents} from './types';

type GetOutput = {[key: string]: ?(number | string)};

type RunFunction = (
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    setState: (state: any) => void,
    topMenu: any,
) => Promise<void | {[key: string]: any}>;

type InitArgs = {
    Component: any,
    inLeague?: boolean,
    get?: (ctx: PageCtx) => GetOutput,
    runBefore?: RunFunction[],
    runWhenever?: RunFunction[],
};

function init(args: InitArgs) {
    args.inLeague = args.inLeague !== undefined ? args.inLeague : true;
    args.get = args.get !== undefined ? args.get : () => { return {}; };
    args.runBefore = args.runBefore !== undefined ? args.runBefore : [];
    args.runWhenever = args.runWhenever !== undefined ? args.runWhenever : [];


    if (!args.Component) { throw new Error('Missing arg Component'); }

    const output = {};
    output.update = (inputs: GetOutput, updateEvents: UpdateEvents, cb: () => void) => {
        g.emitter.emit('updatePage', args, inputs, updateEvents, cb);
    };
    output.get = (ctx: PageCtx, next: () => void) => {
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
function title(newTitle: string) {
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
