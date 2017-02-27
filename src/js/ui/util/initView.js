// @flow

import type {GetOutput, PageCtx} from '../../common/types';
import {emitter} from '../util';

type InitArgs = {
    Component: any,
    id: string,
    inLeague?: boolean,
    get?: (ctx: PageCtx) => ?GetOutput,
};

const initView = (args: InitArgs) => {
    args.inLeague = args.inLeague !== undefined ? args.inLeague : true;
    args.get = args.get !== undefined ? args.get : () => { return {}; };

    if (!args.Component) { throw new Error('Missing arg Component'); }

    return (ctx: PageCtx, next: () => void) => {
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
        emitter.emit('get', args, ctx);
    };
};

export default initView;
