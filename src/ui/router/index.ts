export interface Params {
	[key: string]: string | undefined;
}

export interface Context {
	params: Params;
	path: string;
	state: {
		[key: string]: any;
	};
}

type RouteCallback = (context: Context) => Promise<void>;

export interface Route {
	cb: RouteCallback;
	keys: string[];
	regex: RegExp;
}

type NonStandardEvent = (MouseEvent | TouchEvent) & {
	button: 0 | 1 | 2 | 3 | 4;
	composedPath: () => HTMLAnchorElement[];
	path: HTMLAnchorElement[];
};

type RouteMatched = (arg: {
	context: Context;
}) => void | Promise<void> | Promise<void | false>;

type NavigationEnd = (arg: { context: Context; error: Error | null }) => void;

const decodeURLEncodedURIComponent = (val: string) => {
	if (typeof val !== "string") {
		return val;
	}
	return decodeURIComponent(val.replace(/\+/g, " "));
};

const match = (route: Route, path: string) => {
	const params: Params = {};
	let matches = false;

	const pathname = path.split("?")[0].split("#")[0];
	const m = route.regex.exec(decodeURIComponent(pathname));

	if (m) {
		matches = true;
		for (let i = 1, len = m.length; i < len; ++i) {
			const key = route.keys[i - 1];
			const val = decodeURLEncodedURIComponent(m[i]);
			if (val !== undefined) {
				params[key] = val;
			}
		}
	}

	return { matches, params };
};

const makeRegex = (path: string) => {
	const parts = path
		.replace(/(^\/+|\/+$)/g, "") // Strip starting and ending slashes
		.split("/");

	const keys = [];
	let regexString = "^";
	for (const part of parts) {
		if (part.startsWith(":")) {
			keys.push(part.slice(1));
			regexString += "/([^/]+?)";
		} else {
			regexString += `/${part}`;
		}
	}
	regexString += "$";

	return {
		keys,
		regex: new RegExp(regexString),
	};
};

const findAnchor = (e: NonStandardEvent): HTMLAnchorElement | undefined => {
	// Find link element
	let el: HTMLElement = e.target as HTMLElement;
	const eventPath = e.path || (e.composedPath ? e.composedPath() : null);
	if (eventPath) {
		for (const eventTarget of eventPath) {
			if (!eventTarget.nodeName) {
				continue;
			}
			if (eventTarget.nodeName.toUpperCase() !== "A") {
				continue;
			}
			if (!eventTarget.href) {
				continue;
			}

			el = eventTarget;
			break;
		}
	}

	// Fallback if the eventPath stuff didn't do anything (cross browser)
	while (el && el.nodeName.toUpperCase() !== "A") {
		el = el.parentNode as HTMLAnchorElement;
	}
	if (!el || el.nodeName.toUpperCase() !== "A") {
		return;
	}

	return el as HTMLAnchorElement;
};

const sameOrigin = (href: string) => {
	if (!href) {
		return false;
	}

	const url = new URL(href, window.location.toString());

	return (
		window.location.protocol === url.protocol &&
		window.location.hostname === url.hostname &&
		window.location.port === url.port
	);
};

const samePath = (url: HTMLAnchorElement) => {
	return (
		url.pathname === window.location.pathname &&
		url.search === window.location.search
	);
};

const clickEvent = window.document.ontouchstart ? "touchstart" : "click";

class Router {
	private routeMatched: RouteMatched | undefined;
	private navigationEnd: NavigationEnd | undefined;
	private routes: Route[];
	private lastNavigatedPath: string | undefined;

	constructor() {
		this.routes = [];
	}

	public async navigate(
		path: string,
		{
			refresh = false,
			replace = false,
			state = {},
		}: {
			refresh?: boolean;
			replace?: boolean;
			state?: { [key: string]: any };
		} = {},
	) {
		const context: Context = {
			params: {},
			path,
			state,
		};
		let error: Error | null = null;

		let handled = false;
		for (const route of this.routes) {
			const { matches, params } = match(route, path);
			if (matches) {
				context.params = params;

				try {
					if (this.routeMatched) {
						const output = await this.routeMatched({
							context,
						});
						if (output === false) {
							return;
						}
					}

					if (replace) {
						// Only do this on replace, not refresh, or Safari can complain about too many calls
						window.history.replaceState(
							{
								path,
							},
							window.document.title,
							path,
						);
					} else if (!refresh) {
						window.history.pushState(
							{
								path,
							},
							window.document.title,
							path,
						);
					}

					this.lastNavigatedPath = path;

					await route.cb(context);
				} catch (errorLocal) {
					error = errorLocal;
				}

				handled = true;
				break;
			}
		}

		if (!handled) {
			error = new Error("Matching route not found");
		}

		if (this.navigationEnd) {
			this.navigationEnd({
				context,
				error,
			});
		}
	}

	public start({
		routeMatched,
		navigationEnd,
		routes,
	}: {
		routeMatched?: RouteMatched;
		navigationEnd?: NavigationEnd;
		routes: { [key: string]: RouteCallback };
	}) {
		this.routeMatched = routeMatched;
		this.navigationEnd = navigationEnd;

		for (const [path, cb] of Object.entries(routes)) {
			const { keys, regex } = makeRegex(path);
			this.routes.push({
				cb,
				keys,
				regex,
			});
		}

		window.document.addEventListener(clickEvent, e => {
			this._onclick(e as NonStandardEvent);
		});
		window.addEventListener("popstate", e => {
			this._onpopstate(e);
		});

		this.navigate(
			window.location.pathname + window.location.search + window.location.hash,
			{
				replace: true,
			},
		);
	}

	// Mostly taken from page.js
	private _onclick(e: NonStandardEvent) {
		if (
			e.button !== 0 ||
			e.metaKey ||
			e.ctrlKey ||
			e.shiftKey ||
			e.defaultPrevented ||
			!e.target
		) {
			return;
		}

		const anchor = findAnchor(e);
		if (!anchor) {
			return;
		}

		if (
			anchor.hasAttribute("download") ||
			anchor.getAttribute("rel") === "external"
		) {
			return;
		}

		// ensure non-hash for the same path
		const link = anchor.getAttribute("href");
		if (samePath(anchor) && (anchor.hash || link === "#")) {
			return;
		}

		if (link && link.includes("mailto:")) {
			return;
		}

		if (anchor.target) {
			return;
		}

		if (!sameOrigin(anchor.href)) {
			return;
		}

		// rebuild path
		let path = anchor.pathname + anchor.search + (anchor.hash || "");
		path = path[0] !== "/" ? `/${path}` : path;

		e.preventDefault();

		this.navigate(path);
	}

	private _onpopstate(event: Event & { state: any }) {
		if (window.document.readyState !== "complete") {
			return;
		}

		const path =
			event.state && typeof event.state.path === "string"
				? event.state.path
				: window.location.pathname +
				  window.location.search +
				  window.location.hash;

		if (
			this.lastNavigatedPath &&
			this.lastNavigatedPath.split("#")[0] === path.split("#")[0]
		) {
			// Just switching the hash in the URL on the same page, not actually navigation
			return;
		}

		this.navigate(path, { replace: true });
	}
}

const router = new Router();

export default router;
