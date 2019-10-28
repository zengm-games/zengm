// @flow

import emitter from "./emitter";
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

	return async (context: RouterContext): Promise<void> => {
		emitter.emit("get", args, context);
	};
};

export default initView;
