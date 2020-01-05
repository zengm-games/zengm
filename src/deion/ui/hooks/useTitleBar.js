// @flow

import { useEffect } from "react";
import { getSortedTeams, getDropdownValue } from "./useDropdownOptions";
import { localActions, useLocalShallow } from "../util";

const useTitleBar = ({
	title,
	hideNewWindow,
	jumpTo,
	jumpToSeason,
	dropdownExtraParam,
	dropdownView,
	dropdownFields = {},
}: {
	title: string,
	hideNewWindow?: boolean,
	jumpTo?: boolean,
	jumpToSeason?: number,
	dropdownExtraParam?: number | string,
	dropdownView?: string,
	dropdownFields?: {
		[key: string]: number | string,
	},
}) => {
	const state = useLocalShallow(state2 => ({
		teamAbbrevsCache: state2.teamAbbrevsCache,
		teamNamesCache: state2.teamNamesCache,
		teamRegionsCache: state2.teamRegionsCache,
	}));

	useEffect(() => {
		const parts = [title];

		const sortedTeams = getSortedTeams(state);

		for (const key of Object.values(dropdownFields)) {
			if (key === "all") {
				// Not much use showing "All X" in the title, and also this saves us from having to dedupe all the "all|||" keys in getDropdownValue
				continue;
			}
			parts.push(getDropdownValue(key, sortedTeams));
		}

		document.title = parts.join(" » ");
	}, [dropdownFields, state, title]);

	localActions.update({
		title,
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdownExtraParam,
		dropdownView,
		dropdownFields,
	});
};

export default useTitleBar;
