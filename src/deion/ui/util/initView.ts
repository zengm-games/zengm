import { localActions } from "./local";
import { RouterContext } from "../../common/types";
type InitArgs = {
	Component: any;
	id: string;
	inLeague?: boolean;
};

const initView = (args: InitArgs) => {
	if (!args.Component) {
		throw new Error("Missing arg Component");
	}

	return async (context: RouterContext): Promise<void> => {
		return new Promise((resolve, reject) => {
			localActions.update({
				viewInfo: {
					Component: args.Component,
					id: args.id,
					inLeague: !!args.inLeague,
					context,
					cb: error => {
						if (error) {
							reject(error);
						} else {
							resolve();
						}
					},
				},
			});
		});
	};
};

export default initView;
