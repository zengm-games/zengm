import { useCallback, useState } from "react";
import loadStateFromCache, { type State } from "./loadStateFromCache";
import type { Props } from ".";

type StateProps = Pick<
	Props,
	"cols" | "defaultSort" | "defaultStickyCols" | "disableSettingsCache" | "name"
>;

export const useDataTableState = ({
	cols,
	defaultSort,
	defaultStickyCols,
	disableSettingsCache,
	name,
}: StateProps) => {
	const [state, setState] = useState<State>(() =>
		loadStateFromCache({
			cols,
			defaultSort,
			defaultStickyCols,
			disableSettingsCache,
			name,
		}),
	);

	const setStatePartial = useCallback((newState: Partial<State>) => {
		setState(state2 => ({
			...state2,
			...newState,
		}));
	}, []);

	const resetState = useCallback(
		(stateProps: StateProps) => setState(loadStateFromCache(stateProps)),
		[],
	);

	return [state, setStatePartial, resetState] as const;
};
