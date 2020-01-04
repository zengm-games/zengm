// @flow

import { localActions } from "./local";

let currentTitle;
const setTitleBar = ({
	title,
	hideNewWindow,
	jumpTo,
	jumpToSeason,
	dropdownView,
	dropdownFields = {},
}: {
	title: string,
	hideNewWindow?: boolean,
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
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdownView,
		dropdownFields,
	});
};

export default setTitleBar;
