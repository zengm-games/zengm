import { useEffect, useLayoutEffect } from "react";
import { getSortedTeams, getDropdownValue } from "./useDropdownOptions";
import { localActions, useLocalShallow } from "../util";
import type { LocalStateUI, MenuItemHeader } from "../../common/types";
import { GAME_NAME } from "../../common";

const useTitleBar = <DropdownFields extends Record<string, number | string>>({
	title,
	customMenu,
	hideNewWindow,
	jumpTo,
	jumpToSeason,
	dropdownCustomOptions,
	dropdownCustomURL,
	dropdownView,
	dropdownFields,
	moreInfoAbbrev,
	moreInfoSeason,
	moreInfoTid,
}: {
	title?: string;
	customMenu?: MenuItemHeader;
	hideNewWindow?: boolean;
	jumpTo?: boolean;
	jumpToSeason?: number | "all";
	dropdownCustomOptions?: LocalStateUI["dropdownCustomOptions"];
	dropdownCustomURL?: (fields: DropdownFields) => string;
	dropdownView?: string;
	dropdownFields?: DropdownFields;
	moreInfoAbbrev?: string;
	moreInfoSeason?: number;
	moreInfoTid?: number;
} = {}) => {
	const state = useLocalShallow(state2 => ({
		hideDisabledTeams: state2.hideDisabledTeams,
		teamInfoCache: state2.teamInfoCache,
	}));

	useEffect(() => {
		const parts: string[] = [];

		if (title) {
			parts.push(title);
		} else {
			parts.push(GAME_NAME);
		}

		const sortedTeams = getSortedTeams(state);

		if (dropdownFields) {
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
			dropdownCustomOptions,
			dropdownCustomURL: dropdownCustomURL as any,
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
		dropdownCustomOptions,
		dropdownCustomURL,
		dropdownView,
		dropdownFields,
		moreInfoAbbrev,
		moreInfoSeason,
		moreInfoTid,
	]);
};

export default useTitleBar;
