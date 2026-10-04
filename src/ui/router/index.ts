interface Params {
	[key: string]: string | undefined;
}

export interface Context {
	params: Params;
	path: string;
	state: {
		[key: string]: any;
	};
}

export class RouteNotFoundError extends Error {
	constructor() {
		super("Matching route not found");
		this.name = "RouteNotFoundError";
	}
}

type RouteCallback = (context: Context) => void | Promise<void>;

interface Route {
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

// Switch to URLPattern when supported: Chrome 95, Firefox 142, Safari 26

const decodeURLEncodedURIComponent = (val: string) => {
	if (typeof val !== "string") {
		return val;
	}
	return decodeURIComponent(val.replaceAll("+", " "));
};

const match = (route: Route, pathname: string) => {
	const params: Params = {};
	let matches = false;

	const m = route.regex.exec(pathname);

	if (m) {
		matches = true;
		for (let i = 1, len = m.length; i < len; ++i) {
			const key = route.keys[i - 1]!;
			let val;
			try {
				val = decodeURLEncodedURIComponent(m[i]!);
			} catch {
				// This happens on some inputs to decodeURIComponent such as /user/%C2 - returning no match is better than an error
				return {
					matches: false,
					params: {},
				};
			}
			if (val !== undefined) {
				params[key] = val;
			}
		}
	}

	return { matches, params };
};

export const makeRegex = (path: string) => {
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

const findAnchor = (
	e: NonStandardEvent,
): HTMLAnchorElement | SVGAElement | undefined => {
	// Find link element
	let el = e.target as HTMLElement | SVGElement;
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
		el = el.parentNode as HTMLAnchorElement | SVGAElement;
	}
	if (!el || el.nodeName.toUpperCase() !== "A") {
		return;
	}

	return el as HTMLAnchorElement | SVGAElement;
};

const sameOrigin = (url: URL) => {
	return (
		window.location.protocol === url.protocol &&
		window.location.hostname === url.hostname &&
		window.location.port === url.port
	);
};

const samePath = (url: URL) => {
	return (
		url.pathname === window.location.pathname &&
		url.search === window.location.search
	);
};

// Entries in the history stack are numbered so that when back/forward navigation is blocked, we know how far to go to get back to where we were
const getHistoryIndex = (state: unknown) => {
	const index = (state as { index?: unknown } | null)?.index;
	return typeof index === "number" ? index : undefined;
};

const clickEvent = document.ontouchstart ? "touchstart" : "click";

class Router {
	private routeMatched: RouteMatched | undefined;
	private navigationEnd: NavigationEnd | undefined;
	private routes: Route[];
	private lastNavigatedPath: string | undefined;
	private historyIndex = 0;
	public shouldBlock:
		| ((refresh: boolean) => boolean | Promise<boolean>)
		| undefined;

	constructor() {
		this.routes = [];

		window.addEventListener("beforeunload", (event) => {
			// Only show prompt when needed
			if (this.shouldBlock) {
				// Cancel the event
				event.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
				// Chrome requires returnValue to be set
				event.returnValue = "";
			}
		});
	}

	// URL of the page currently being shown. Use this rather than window.location, which is wrong while back/forward navigation is being blocked, since the browser changes the URL before shouldBlock is called.
	public get location(): { pathname: string; search: string } {
		if (this.lastNavigatedPath === undefined) {
			return window.location;
		}

		return new URL(this.lastNavigatedPath, window.location.origin);
	}

	// If return false, then no navigation happened and navigationEnd was not called
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

		let pathname = path;
		const queryIndex = pathname.indexOf("?");
		if (queryIndex !== -1) {
			pathname = pathname.slice(0, queryIndex);
		}
		const hashIndex = pathname.indexOf("#");
		if (hashIndex !== -1) {
			pathname = pathname.slice(0, hashIndex);
		}

		let handled = false;
		for (const route of this.routes) {
			const { matches, params } = match(route, pathname);
			if (matches) {
				context.params = params;

				try {
					if (this.shouldBlock) {
						const shouldBlock = await this.shouldBlock(refresh);
						if (shouldBlock) {
							return false;
						}
					}

					if (this.routeMatched) {
						const output = await this.routeMatched({
							context,
						});
						if (output === false) {
							return false;
						}
					}

					if (replace) {
						// Keep the index of the entry being replaced, which is not this.historyIndex after back/forward navigation
						this.historyIndex =
							getHistoryIndex(window.history.state) ?? this.historyIndex;

						// Only do this on replace, not refresh, or Safari can complain about too many calls
						window.history.replaceState(
							{
								path,
								index: this.historyIndex,
							},
							document.title,
							path,
						);
					} else if (!refresh) {
						// Based on the current entry rather than this.historyIndex, in case some back/forward navigation was not tracked
						this.historyIndex =
							(getHistoryIndex(window.history.state) ?? this.historyIndex) + 1;
						window.history.pushState(
							{
								path,
								index: this.historyIndex,
							},
							document.title,
							path,
						);
					}

					this.lastNavigatedPath = path;

					await route.cb(context);
				} catch (error_) {
					error = error_;
				}

				handled = true;
				break;
			}
		}

		if (!handled) {
			error = new RouteNotFoundError();

			if (replace) {
				// On initial load and back/forward navigation, the URL has already changed to this path
				this.lastNavigatedPath = path;
			}
		}

		// HACK! Some ads were including a request for /ads.txt?upapi=true which somehow triggered this code and led to Controller attempting to render multiple pages at once, one of which was outside of the league, leading to beforeViewNonLeague to be called and stop game sim
		if (error && path.includes("ads.txt")) {
			return false;
		}

		if (this.navigationEnd) {
			this.navigationEnd({
				context,
				error,
			});
		}

		return true;
	}

	public async start({
		navigationEnd,
		routeMatched,
		routes,
	}: {
		navigationEnd?: NavigationEnd;
		routeMatched?: RouteMatched;
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

		document.addEventListener(clickEvent, (e) => {
			this._onclick(e as NonStandardEvent);
		});
		window.addEventListener("popstate", (e) => {
			void this._onpopstate(e);
		});

		await this.navigate(location.pathname + location.search + location.hash, {
			replace: true,
		});
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

		// In SVG links (like in Player Graphs) href and target are SVGAnimatedString rather than string
		const svg = anchor instanceof SVGAElement;
		const href = svg ? anchor.href.baseVal : anchor.href;
		const target = svg ? anchor.target.baseVal : anchor.target;

		if (!href) {
			return;
		}
		const url = new URL(href, window.location.href);

		// ensure non-hash for the same path
		const link = anchor.getAttribute("href");
		if (samePath(url) && (url.hash || link === "#")) {
			return;
		}

		if (link && link.includes("mailto:")) {
			return;
		}

		if (target.startsWith("_")) {
			return;
		}

		if (!sameOrigin(url)) {
			return;
		}

		const path = url.pathname + url.search + url.hash;

		e.preventDefault();

		void this.navigate(path);
	}

	private async _onpopstate(event: Event & { state: any }) {
		if (document.readyState !== "complete") {
			return;
		}

		const path =
			event.state && typeof event.state.path === "string"
				? event.state.path
				: location.pathname + location.search + location.hash;

		if (
			this.lastNavigatedPath &&
			this.lastNavigatedPath.split("#")[0] === path.split("#")[0]
		) {
			// Just switching the hash in the URL on the same page, not actually navigation. Still need to track the index, and assign one to a new entry created by the browser when following a hash link.
			const index = getHistoryIndex(event.state);
			if (index === undefined) {
				this.historyIndex += 1;
				window.history.replaceState(
					{
						path,
						index: this.historyIndex,
					},
					document.title,
					path,
				);
			} else {
				this.historyIndex = index;
			}
			return;
		}

		const navigated = await this.navigate(path, { replace: true });
		if (!navigated) {
			// Navigation was blocked, but the browser already moved to a different history entry, so go back to the one for the page that is still being shown. That fires another popstate event, which is ignored by the lastNavigatedPath check above.
			const index = getHistoryIndex(window.history.state);
			if (index !== undefined && index !== this.historyIndex) {
				window.history.go(this.historyIndex - index);
			}
		}
	}
}

export const router = new Router();
