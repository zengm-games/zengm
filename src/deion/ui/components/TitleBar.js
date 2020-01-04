// @flow

import React from "react";
import NewWindowLink from "./NewWindowLink";
import { useLocalShallow } from "../util";

const TitleBar = () => {
	const { title } = useLocalShallow(state => ({
		title: state.title,
	}));

	return (
		<div className="p-2 mb-2 bg-primary text-white title-bar">
			<b>{title === undefined ? "..." : title}</b>
			<NewWindowLink />
		</div>
	);
};

export default TitleBar;
