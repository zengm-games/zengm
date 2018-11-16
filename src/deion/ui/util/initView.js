// @flow

import { emitter } from ".";
import type { RouterContext } from "../../common/types";

type InitArgs = {
    Component: any,
    id: string,
    inLeague?: boolean,
};

const initView = (args: InitArgs) => {
    args.inLeague = args.inLeague !== undefined ? args.inLeague : true;

    if (!args.Component) {
        throw new Error("Missing arg Component");
    }

    return (context: RouterContext): Promise<void> => {
        return new Promise((resolve, reject) => {
            emitter.emit("get", args, context, resolve, reject);
        });
    };
};

export default initView;
