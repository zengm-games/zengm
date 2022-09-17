import { useEffect, useLayoutEffect } from "react";
import { getSortedTeams, getDropdownValue } from "./useDropdownOptions";
import { localActions, useLocalPartial } from "../util";
import type { LocalStateUI, MenuItemHeader } from "../../common/types";
import { GAME_NAME } from "../../common";
import { getResponsiveValue } from "../components/Dropdown";

const useTitleBar = <DropdownFields extends Record<string, number | string>>({
	title,
	titleLong,
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
	titleLong?: string;
	customMenu?: MenuItemHeader;
	hideNewWindow?: boolean;
	jumpTo?: boolean;
	jumpToSeason?: number | "all" | "career";
	dropdownCustomOptions?: LocalStateUI["dropdownCustomOptions"];
	dropdownCustomURL?: (fields: DropdownFields) => string;
	dropdownView?: string;
	dropdownFields?: DropdownFields;
	moreInfoAbbrev?: string;
	moreInfoSeason?: number;
	moreInfoTid?: number;
} = {}) => {
	const state = useLocalPartial(["hideDisabledTeams", "teamInfoCache"]);

	useEffect(() => {
		const parts: string[] = [];

		if (titleLong) {
			parts.push(titleLong);
		} else if (title) {
			parts.push(title);
		} else {
			parts.push(GAME_NAME);
		}

		const sortedTeams = getSortedTeams(state);

		if (dropdownFields) {
			for (const [dropdownKey, key] of Object.entries(dropdownFields)) {
				if (key === "all") {
					// Not much use showing "All X" in the title, and also this saves us from having to dedupe all the "all|||" keys in getDropdownValue
					continue;
				}

				let value;
				if (dropdownCustomOptions?.[dropdownKey]) {
					const option = dropdownCustomOptions[dropdownKey].find(
						row => row.key === key,
					);
					if (option) {
						value = option.value;
					}
				}

				if (value === undefined) {
					value = getDropdownValue(key, sortedTeams);
				}

				if (value !== undefined) {
					parts.push(getResponsiveValue(value, Infinity));
				}
			}
		}

		document.title = parts.filter(part => part !== "???").join(" » ");
	}, [dropdownCustomOptions, dropdownFields, state, title, titleLong]);

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
