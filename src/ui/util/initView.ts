import type { Context } from "../router";
import { viewManager } from "./viewManager";

type InitArgs = {
	Component: any;
	id: string;
	inLeague?: boolean;
};

const initView = (args: InitArgs) => {
	if (!args.Component) {
		throw new Error("Missing arg Component");
	}

	return async (context: Context): Promise<void> => {
		return new Promise((resolve, reject) => {
			const viewInfo = {
				Component: args.Component,
				id: args.id,
				inLeague: !!args.inLeague,
				context,
				cb: (error?: Error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				},
			};

			viewManager.fromRouter(viewInfo);
		});
	};
};

export default initView;
