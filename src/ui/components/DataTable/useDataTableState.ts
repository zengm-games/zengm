import { useCallback, useState } from "react";
import loadStateFromCache, {
	type LoadStateFromCacheProps,
	type State,
} from "./loadStateFromCache.ts";

export const useDataTableState = ({
	cols,
	defaultSort,
	defaultStickyCols,
	disableSettingsCache,
	hideAllControls,
	name,
}: LoadStateFromCacheProps) => {
	const [state, setState] = useState<State>(() =>
		loadStateFromCache({
			cols,
			defaultSort,
			defaultStickyCols,
			disableSettingsCache,
			hideAllControls,
			name,
		}),
	);

	const setStatePartial = useCallback((newState: Partial<State>) => {
		setState((state2) => ({
			...state2,
			...newState,
		}));
	}, []);

	const resetState = useCallback(
		(stateProps: LoadStateFromCacheProps) =>
			setState(loadStateFromCache(stateProps)),
		[],
	);

	return { state, setStatePartial, resetState };
};
