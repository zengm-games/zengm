import helpers from "./helpers.ts";
import initView from "./initView.ts";
import views from "../views/index.ts";
import routeInfos from "./routeInfos.ts";

const genPage = (id: string, inLeague: boolean) => {
	const componentName = helpers.upperCaseFirstLetter(id);
	let Component;

	// @ts-expect-error
	if (views[componentName]) {
		// @ts-expect-error
		Component = views[componentName];
	}

	if (Component) {
		return initView({
			id,
			inLeague,
			Component,
		});
	}

	return () => {
		throw new Error(`Invalid component name: "${componentName}"`);
	};
};

const routes: Record<string, ReturnType<typeof genPage>> = {};
for (const [path, id] of Object.entries(routeInfos)) {
	const inLeague = path.startsWith("/l/");
	routes[path] = genPage(id, inLeague);
}

export default routes;
