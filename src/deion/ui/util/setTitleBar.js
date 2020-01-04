// @flow

import { localActions } from "./local";

let currentTitle;
const setTitleBar = ({
	title,
	jumpToSeason,
	dropdownView,
	dropdownFields = {},
}: {
	title: string,
	jumpToSeason?: number,
	dropdownView?: string,
	dropdownFields?: {
		[key: string]: number | string,
	},
}) => {
	if (title !== currentTitle) {
		currentTitle = title;
		document.title = title;
	}

	localActions.update({
		title,
		jumpToSeason,
		dropdownView,
		dropdownFields,
	});
};

export default setTitleBar;
