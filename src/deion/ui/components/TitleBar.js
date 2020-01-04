// @flow

import React from "react";
import Dropdown from "./Dropdown";
import JumpTo from "./JumpTo";
import NewWindowLink from "./NewWindowLink";
import { useLocalShallow } from "../util";

const TitleBar = () => {
	const {
		title,
		hideNewWindow,
		jumpTo,
		jumpToSeason,
		dropdownView,
		dropdownFields,
	} = useLocalShallow(state => ({
		title: state.title,
		hideNewWindow: state.hideNewWindow,
		jumpTo: state.jumpTo,
		jumpToSeason: state.jumpToSeason,
		dropdownView: state.dropdownView,
		dropdownFields: state.dropdownFields,
	}));

	return (
		<div className="py-2 mb-2 title-bar d-flex navbar-border">
			<div>
				<b>{title === undefined ? "..." : title}</b>
				{!hideNewWindow ? <NewWindowLink /> : null}
			</div>
			{dropdownView ? (
				<Dropdown
					view={dropdownView}
					fields={Object.keys(dropdownFields)}
					values={Object.values(dropdownFields)}
				/>
			) : null}
			{jumpTo ? <JumpTo season={jumpToSeason} /> : null}
		</div>
	);
};

export default TitleBar;
