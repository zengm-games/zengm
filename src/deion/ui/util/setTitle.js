// @flow

import { localActions } from "./local";

let currentTitle;
const setTitle = (title: string) => {
	if (title !== currentTitle) {
		currentTitle = title;
		document.title = title;
	}

	localActions.update({
		title,
	});
};

export default setTitle;
