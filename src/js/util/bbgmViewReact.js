// @flow

import g from '../globals';
import type {GetOutput, PageCtx} from './types';

type InitArgs = {
    Component: any,
    id: string,
    inLeague?: boolean,
    get?: (ctx: PageCtx) => ?GetOutput,
};

function init(args: InitArgs) {
    args.inLeague = args.inLeague !== undefined ? args.inLeague : true;
    args.get = args.get !== undefined ? args.get : () => { return {}; };

    if (!args.Component) { throw new Error('Missing arg Component'); }

    const output = {};
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
        g.emitter.emit('get', args, ctx);
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
