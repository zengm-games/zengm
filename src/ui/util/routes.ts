import type { ComponentType } from "react";
import { helpers } from "./helpers.ts";
import { initView } from "./initView.ts";
import * as views from "../views/index.ts";
import { routeInfos } from "./routeInfos.ts";
import type { ViewId } from "../router/types.ts";

// Every view ID in routeInfos needs a component in ui/views/index.ts, exported with the first letter capitalized
const components: Record<Capitalize<ViewId>, ComponentType<any>> = views;

const genPage = (id: ViewId, inLeague: boolean) => {
	return initView({
		id,
		inLeague,
		Component: components[helpers.upperCaseFirstLetter(id)],
	});
};

export const routes: Record<string, ReturnType<typeof genPage>> = {};
for (const [path, id] of helpers.entries(routeInfos)) {
	const inLeague = path.startsWith("/l/");
	routes[path] = genPage(id, inLeague);
}
