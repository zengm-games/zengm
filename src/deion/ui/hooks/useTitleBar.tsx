import { useEffect, useLayoutEffect } from "react";
import { getSortedTeams, getDropdownValue } from "./useDropdownOptions";
import { localActions, useLocalShallow } from "../util";
import type { MenuItemHeader } from "../../common/types";

// helpers.upperCaseFirst failed for some reason
const sport = `${process.env.SPORT.charAt(
	0,
).toUpperCase()}${process.env.SPORT.slice(1)}`;

const useTitleBar = ({
	title,
	customMenu,
	hideNewWindow,
	jumpTo,
	jumpToSeason,
	dropdownExtraParam,
	dropdownView,
	dropdownFields = {},
	moreInfoAbbrev,
	moreInfoSeason,
	moreInfoTid,
}: {
	title?: string;
	customMenu?: MenuItemHeader;
	hideNewWindow?: boolean;
	jumpTo?: boolean;
	jumpToSeason?: number | "all";
	dropdownExtraParam?: number | string;
	dropdownView?: string;
	dropdownFields?: {
		[key: string]: number | string;
	};
	moreInfoAbbrev?: string;
	moreInfoSeason?: number;
	moreInfoTid?: number;
} = {}) => {
	const state = useLocalShallow(state2 => ({
		teamInfoCache: state2.teamInfoCache,
	}));

	useEffect(() => {
		const parts: string[] = [];

		if (title) {
			parts.push(title);
		} else {
			parts.push(`${sport} GM`);
		}

		const sortedTeams = getSortedTeams(state);

		for (const key of Object.values(dropdownFields)) {
			if (key === "all") {
				// Not much use showing "All X" in the title, and also this saves us from having to dedupe all the "all|||" keys in getDropdownValue
				continue;
			}

			const value = getDropdownValue(key, sortedTeams);

			if (value !== undefined) {
				parts.push(value);
			}
		}

		document.title = parts.join(" » ");
	}, [dropdownFields, state, title]);

	// Without useLayoutEffect, weird shit happens in Safari! State inappropriately bleeds over from one load of a view to the next. Not sure why!
	useLayoutEffect(() => {
		localActions.update({
			title,
			customMenu,
			hideNewWindow,
			jumpTo,
			jumpToSeason,
			dropdownExtraParam,
			dropdownView,
			dropdownFields,
			moreInfoAbbrev,
			moreInfoSeason,
			moreInfoTid,
		});
	}, [
		title,
		customMenu,
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdownExtraParam,
		dropdownView,
		dropdownFields,
		moreInfoAbbrev,
		moreInfoSeason,
		moreInfoTid,
	]);
};

export default useTitleBar;
