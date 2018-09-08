// @flow

import EventTarget from "event-target-shim";
import pathToRegexp from "path-to-regexp";

type Route = {
    cb: Function,
    keys: string[],
    regex: RegExp,
};

const decodeURLEncodedURIComponent = (val: string) => {
    if (typeof val !== "string") {
        return val;
    }
    return decodeURIComponent(val.replace(/\+/g, " "));
};

const match = (route: Route, path: string) => {
    const params = {};
    let matches = false;

    const [pathname] = path.split("?");
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

const sameOrigin = (href: string) => {
    if (!href) return false;

    const url = new URL(href, window.location.toString());

    return (
        window.location.protocol === url.protocol &&
        window.location.hostname === url.hostname &&
        window.location.port === url.port
    );
};

const samePath = (url: string) => {
    return (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
    );
};

const clickEvent = window.document.ontouchstart ? "touchstart" : "click";

class Router extends EventTarget {
    routes: Route[];

    constructor() {
        super();

        this.routes = [];

        this._onclick = this._onclick.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
    }

    // Mostly taken from page.js
    _onclick(e) {
        if (
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.defaultPrevented
        ) {
            return;
        }

        // Find link element
        let el = e.target;
        const eventPath = e.path || (e.composedPath ? e.composedPath() : null);
        if (eventPath) {
            for (const eventTarget of eventPath) {
                if (!eventTarget.nodeName) continue;
                if (eventTarget.nodeName.toUpperCase() !== "A") continue;
                if (!eventTarget.href) continue;

                el = eventTarget;
                break;
            }
        }

        // Fallback if the eventPath stuff didn't do anything (cross browser)
        while (el && el.nodeName.toUpperCase() !== "A") {
            el = el.parentNode;
        }
        if (!el || el.nodeName.toUpperCase() !== "A") {
            return;
        }

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        const svg =
            typeof el.href === "object" &&
            el.href.constructor.name === "SVGAnimatedString";

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (
            el.hasAttribute("download") ||
            el.getAttribute("rel") === "external"
        )
            return;

        // ensure non-hash for the same path
        const link = el.getAttribute("href");
        if (!this._hashbang && samePath(el) && (el.hash || link === "#"))
            return;

        // Check for mailto: in the href
        if (link && link.indexOf("mailto:") > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        let path = svg
            ? el.href.baseVal
            : el.pathname + el.search + (el.hash || "");

        path = path[0] !== "/" ? `/${path}` : path;

        e.preventDefault();

        this.navigate(path);
    }

    _onpopstate(event) {
        if (window.document.readyState !== "complete") {
            return;
        }

        if (event.state) {
            const path = event.state.path;
            this.navigate(path, { replace: true });
        } else {
            throw new Error("No state found in onpopstate event");
        }
    }

    async navigate(path, { replace = false, state = {} } = {}) {
        if (replace) {
            window.history.replaceState(
                {
                    path,
                },
                window.document.title,
                path,
            );
        } else {
            window.history.pushState(
                {
                    path,
                },
                window.document.title,
                path,
            );
        }

        const context = {
            params: {},
            path,
            state,
        };

        const detail = {
            context,
            error: null,
        };

        let handled = false;

        for (const route of this.routes) {
            const { matches, params } = match(route, path);
            if (matches) {
                context.params = params;
                try {
                    await route.cb(context);
                } catch (error) {
                    detail.error = error;
                }

                handled = true;
                break;
            }
        }

        if (!handled) {
            detail.error = new Error("Matching route not found");
        }

        this.dispatchEvent(
            new CustomEvent("navigationend", {
                detail,
            }),
        );
    }

    start(routes) {
        for (const [path, cb] of Object.entries(routes)) {
            const keys = [];
            const regex = pathToRegexp(path, keys);
            this.routes.push({
                cb,
                keys: keys.map(key => key.name),
                regex,
            });
        }

        window.document.addEventListener(clickEvent, this._onclick);
        window.addEventListener("popstate", this._onpopstate);

        this.navigate(
            window.location.pathname +
                window.location.search +
                window.location.hash,
            {
                replace: true,
            },
        );
    }
}

const router = new Router();
window.router = router;

export default router;
