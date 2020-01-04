// @flow

import React from "react";
import Dropdown from "./Dropdown";
import JumpTo from "./JumpTo";
import NewWindowLink from "./NewWindowLink";
import { useLocalShallow } from "../util";

const TitleBar = () => {
	const { title, jumpToSeason, dropdownView, dropdownFields } = useLocalShallow(
		state => ({
			title: state.title,
			jumpToSeason: state.jumpToSeason,
			dropdownView: state.dropdownView,
			dropdownFields: state.dropdownFields,
		}),
	);

	return (
		<div className="p-2 mb-2 bg-primary text-white title-bar">
			<b>{title === undefined ? "..." : title}</b>
			<NewWindowLink />
			{dropdownView !== undefined ? (
				<Dropdown
					view={dropdownView}
					fields={Object.keys(dropdownFields)}
					values={Object.values(dropdownFields)}
				/>
			) : null}
			{jumpToSeason !== undefined ? <JumpTo season={jumpToSeason} /> : null}
		</div>
	);
};

export default TitleBar;
