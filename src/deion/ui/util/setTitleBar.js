// @flow

import { localActions } from "./local";

let currentTitle;
const setTitleBar = ({
	title,
	jumpTo,
	jumpToSeason,
	dropdownView,
	dropdownFields = {},
}: {
	title: string,
	jumpTo?: boolean,
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
		jumpTo,
		jumpToSeason,
		dropdownView,
		dropdownFields,
	});
};

export default setTitleBar;
