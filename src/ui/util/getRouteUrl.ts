import { routeInfos } from "./routeInfos.ts";
import { local } from "./local.ts";
import type { ViewId } from "../router/types.ts";

// URL of the league route of view whose params are exactly the keys of params
export const getRouteUrl = (
	view: ViewId,
	params: Record<string, number | string>,
) => {
	const lid = local.getState().lid;
	if (typeof lid !== "number") {
		return "/";
	}

	const keys = Object.keys(params);

	for (const [path, routeView] of Object.entries(routeInfos)) {
		if (routeView !== view || !path.startsWith("/l/:lid")) {
			continue;
		}

		const pathParams = path
			.split("/")
			.filter((segment) => segment.startsWith(":") && segment !== ":lid")
			.map((segment) => segment.slice(1));
		if (
			pathParams.length === keys.length &&
			pathParams.every((param) => Object.hasOwn(params, param))
		) {
			return path.replaceAll(/:([A-Za-z]+)/g, (_, name: string) =>
				name === "lid" ? String(lid) : String(params[name]),
			);
		}
	}

	throw new Error(`No route for ${view} with params ${keys.join(", ")}`);
};
