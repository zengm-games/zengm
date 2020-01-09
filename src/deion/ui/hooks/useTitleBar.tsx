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
	moreInfoAbbrev,
	moreInfoSeason,
}: {
	title?: string;
	hideNewWindow?: boolean;
	jumpTo?: boolean;
	jumpToSeason?: number;
	dropdownExtraParam?: number | string;
	dropdownView?: string;
	dropdownFields?: {
		[key: string]: number | string;
	};
	moreInfoAbbrev?: string;
	moreInfoSeason?: number;
} = {}) => {
	const state = useLocalShallow(state2 => ({
		teamAbbrevsCache: state2.teamAbbrevsCache,
		teamNamesCache: state2.teamNamesCache,
		teamRegionsCache: state2.teamRegionsCache,
	}));
	useEffect(() => {
		const parts = [];

		if (title) {
			parts.push(title);
		} else {
			parts.push("Basketball GM");
		}

		const sortedTeams = getSortedTeams(state);

		for (const key of Object.values(dropdownFields)) {
			if (key === "all") {
				// Not much use showing "All X" in the title, and also this saves us from having to dedupe all the "all|||" keys in getDropdownValue
				continue;
			} // $FlowFixMe

			const value = getDropdownValue(key, sortedTeams);

			if (value !== undefined) {
				parts.push(value);
			}
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
		moreInfoAbbrev,
		moreInfoSeason,
	});
};

export default useTitleBar;
