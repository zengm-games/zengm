import { useCallback, useState } from "react";
import { runAction } from "./runAction.ts";

// Owns the busy flag for actions that call the worker. See runAction for the semantics of run. Usage:
//   const { busy, run } = useAction();
//   await run(() => toWorker("main", "doThing", undefined));
export const useAction = () => {
	const [busy, setBusy] = useState(false);

	const run = useCallback(
		(
			action: () => Promise<unknown>,
			options?: { keepProcessingOnSuccess?: boolean },
		) => runAction(setBusy, action, options),
		[],
	);

	return { busy, run };
};
