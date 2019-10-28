// @flow

import { localActions } from "./local";
import type { RouterContext } from "../../common/types";

type InitArgs = {
	Component: any,
	id: string,
	inLeague?: boolean,
};

const initView = (args: InitArgs) => {
	if (!args.Component) {
		throw new Error("Missing arg Component");
	}

	return async (context: RouterContext): Promise<void> => {
		localActions.update({
			viewInfo: {
				Component: args.Component,
				id: args.id,
				inLeague: !!args.inLeague,
				context,
			},
		});
	};
};

export default initView;
