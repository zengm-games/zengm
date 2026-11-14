import { useEffect } from "react";
import useLocalStorageState from "use-local-storage-state";
import {
	rememberedGraphParamsKeys,
	type RememberedGraphParamsPage,
} from "../../common/rememberedGraphParams.ts";

/**
 * Remember the parameters of a graph page (everything except the season) in localStorage, and restore them when the page is opened without any parameters in the URL, rather than showing random ones.
 *
 * - key: localStorage key, unique per page
 * - current: the parameters currently shown, which are saved whenever they change
 * - isBareUrl: true if the URL has no parameters, in which case `current` is random and is not saved
 * - updateUrl: navigates to the URL with these parameters overriding the current ones. Called with no remembered parameters if there are none.
 */
const useRememberedGraphParams = <Params extends Record<string, string>>({
	page,
	current,
	isBareUrl,
	updateUrl,
}: {
	page: RememberedGraphParamsPage;
	current: Params;
	isBareUrl: boolean;
	updateUrl: () => Promise<void>;
}) => {
	const [, setRemembered] = useLocalStorageState<Params | undefined>(
		rememberedGraphParamsKeys[page],
		{ defaultValue: undefined },
	);

	const currentJson = JSON.stringify(current);

	useEffect(() => {
		if (!isBareUrl) {
			setRemembered(JSON.parse(currentJson) as Params);
		}
	}, [isBareUrl, currentJson, setRemembered]);

	if (isBareUrl) {
		// Set initial URL, for ctrl+r and reloading
		updateUrl();
	}
};

export default useRememberedGraphParams;
