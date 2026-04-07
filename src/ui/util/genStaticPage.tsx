import type { ReactNode } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { initView } from "./initView.ts";

export const genStaticPage = (
	name: string,
	title: string,
	content: ReactNode,
	inLeague: boolean,
) => {
	return initView({
		id: name,
		inLeague,
		Component: () => {
			useTitleBar({
				title,
			});
			return content;
		},
	});
};
