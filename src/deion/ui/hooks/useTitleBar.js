// @flow

import { useEffect } from "react";
import { localActions } from "../util";

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
	useEffect(() => {
		document.title = title;
	}, [title]);

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
