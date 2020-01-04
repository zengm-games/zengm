import React from "react";
import initView from "./initView";
import setTitleBar from "./setTitleBar";

const genStaticPage = (
	name: string,
	title: string,
	content: React.Element<*>,
	inLeague: boolean,
) => {
	return initView({
		id: name,
		inLeague,
		Component: () => {
			setTitleBar({ title });

			return content;
		},
	});
};

export default genStaticPage;
