// @flow

import emitter from "./emitter";
import { local, localActions } from "./local";
import realtimeUpdate from "./realtimeUpdate";
import toWorker from "./toWorker";
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
		const lid = local.getState().lid;

		const updateEvents =
			context.state.updateEvents !== undefined
				? context.state.updateEvents
				: [];
		const newLidInt = parseInt(context.params.lid, 10);
		const newLid = Number.isNaN(newLidInt) ? undefined : newLidInt;

		if (args.inLeague) {
			if (newLid !== lid) {
				await toWorker("beforeViewLeague", newLid, lid);
			}
		} else {
			// eslint-disable-next-line no-lonely-if
			if (lid !== undefined) {
				await toWorker("beforeViewNonLeague");
				localActions.updateGameAttributes({
					lid: undefined,
				});
			}
		}

		// No good reason for this to be brought back to the UI, since inputs are sent back to the worker below.
		// ctxBBGM is hacky!
		const ctxBBGM = { ...context.state };
		delete ctxBBGM.err; // Can't send error to worker
		const inputs = await toWorker(
			`processInputs.${args.id}`,
			context.params,
			ctxBBGM,
		);

		if (typeof inputs.redirectUrl === "string") {
			await realtimeUpdate([], inputs.redirectUrl, {}, true);
		} else {
			await new Promise((resolve, reject) => {
				emitter.emit("get", args, inputs, updateEvents, resolve, reject);
			});
		}
	};
};

export default initView;
