import { assert, describe, test } from "vitest";
import { RouteNotFoundError, router } from "./index.ts";
import type { Context } from "./index.ts";

const counts: Record<string, number> = {};
const countCallback = (context: Context) => {
	// This is to remove the query string that vitest adds to the URL
	const { pathname } = new URL(context.path, window.location.origin);

	if (pathname.startsWith("/3/")) {
		counts["/3/:foo"] ??= 0;
		counts["/3/:foo"] += 1;
	} else {
		counts[pathname] ??= 0;
		counts[pathname] += 1;
	}
};
const routes = {
	"/": countCallback,
	"/0": countCallback,
	"/1": countCallback,
	"/2": countCallback,
	"/3/:foo": countCallback,
	"/error": (context: Context) => {
		countCallback(context);
		throw new Error("runtime error");
	},
	"/state": (context: Context) => {
		countCallback(context);
		assert.deepStrictEqual(context.state, { custom: 123 });
	},
};

const callbacks: Pick<
	Parameters<(typeof router)["start"]>[0],
	"navigationEnd" | "routeMatched"
> = {
	navigationEnd: undefined,
	routeMatched: undefined,
};

test("sets routes", async () => {
	const countBefore = counts["/"] ?? 0;

	await router.start({
		navigationEnd: (...params) => {
			callbacks.navigationEnd?.(...params);
		},
		routeMatched: (...params) => {
			callbacks.routeMatched?.(...params);
		},
		routes,
	});

	assert.strictEqual(counts["/"], countBefore + 1);
});

test("navigates", async () => {
	const countBefore = counts["/0"] ?? 0;
	assert.strictEqual(window.location.pathname, "/");

	await router.navigate("/0");

	assert.strictEqual(window.location.pathname, "/0");
	assert.strictEqual(counts["/0"], countBefore + 1);
});

// This is to wait for the asynchronous effect of window.history.back() and window.history.forward() to occur
const waitForPopstate = () => {
	return new Promise((resolve) => {
		window.addEventListener("popstate", resolve, { once: true });
	});
};

test("handles back/forward navigation", async () => {
	let promise;

	await router.navigate("/");
	await router.navigate("/0");
	assert.strictEqual(window.location.pathname, "/0");

	promise = waitForPopstate();
	window.history.back();
	await promise;
	assert.strictEqual(window.location.pathname, "/");

	promise = waitForPopstate();
	window.history.forward();
	await promise;
	assert.strictEqual(window.location.pathname, "/0");
});

// Same issue as previous test prevents this test from being good
test("navigates without creating a history entry", async () => {
	const countBefore = counts["/1"] ?? 0;
	assert.strictEqual(window.location.pathname, "/0");

	await router.navigate("/1", { replace: true });

	assert.strictEqual(window.location.pathname, "/1");
	assert.strictEqual(counts["/1"], countBefore + 1);
});

test("fires routematched event", async () => {
	const { promise, resolve, reject } = Promise.withResolvers<void>();

	const countBefore = counts["/2"] ?? 0;
	const callback = (arg: unknown) => {
		try {
			assert.strictEqual(counts["/2"] ?? 0, countBefore); // Hasn't navigated yet
			assert.deepStrictEqual(arg, {
				context: {
					params: {},
					path: "/2",
					scrollToTop: undefined,
					state: {},
				},
			});
			resolve();
		} catch (error) {
			console.error(error);
			reject(error);
		}

		callbacks.routeMatched = undefined;
	};
	callbacks.routeMatched = callback;

	await router.navigate("/2");
	await promise;
});

test("fires navigationend event", async () => {
	const { promise, resolve, reject } = Promise.withResolvers<void>();

	const countBefore = counts["/3/:foo"] ?? 0;
	const callback = (arg: unknown) => {
		try {
			assert.strictEqual(counts["/3/:foo"], countBefore + 1);
			assert.deepStrictEqual(arg, {
				context: {
					params: {
						foo: "bar",
					},
					path: "/3/bar",
					scrollToTop: undefined,
					state: {},
				},
				error: null,
			});
			resolve();
		} catch (error) {
			reject(error);
		}

		callbacks.navigationEnd = undefined;
	};
	callbacks.navigationEnd = callback;

	await router.navigate("/3/bar");
	await promise;
});

test("fires navigationend event with 404 error", async () => {
	const { promise, resolve, reject } = Promise.withResolvers<void>();

	const callback = (arg: any) => {
		try {
			assert.instanceOf(arg.error, RouteNotFoundError);
			resolve();
		} catch (error) {
			reject(error);
		}

		callbacks.navigationEnd = undefined;
	};
	callbacks.navigationEnd = callback;

	await router.navigate("/does-not-exist");
	await promise;
});

test("fires navigationend event with runtime error", async () => {
	const { promise, resolve, reject } = Promise.withResolvers<void>();

	const countBefore = counts["/error"] ?? 0;
	const callback = (arg: any) => {
		try {
			assert.strictEqual(arg.error.message, "runtime error");
			assert.strictEqual(counts["/error"], countBefore + 1);
			resolve();
		} catch (error) {
			reject(error);
		}

		callbacks.navigationEnd = undefined;
	};
	callbacks.navigationEnd = callback;

	await router.navigate("/error");
	await promise;
});

test("passes state to callback", async () => {
	const countBefore = counts["/state"] ?? 0;

	const arg = { state: { custom: 123 } };
	await router.navigate("/state", arg);

	assert.strictEqual(window.location.pathname, "/state");
	assert.strictEqual(counts["/state"], countBefore + 1);
});

test("shouldBlock true blocks navigation", async () => {
	await router.navigate("/0");
	assert.strictEqual(window.location.pathname, "/0");

	router.shouldBlock = () => true;

	await router.navigate("/");
	assert.strictEqual(window.location.pathname, "/0");
});

test("shouldBlock false allows navigation", async () => {
	await router.navigate("/0");
	assert.strictEqual(window.location.pathname, "/0");

	router.shouldBlock = () => false;

	await router.navigate("/");
	assert.strictEqual(window.location.pathname, "/");
});

test("shouldBlock true restores URL after blocked back/forward navigation", async () => {
	router.shouldBlock = undefined;
	await router.navigate("/1");
	await router.navigate("/2");
	await router.navigate("/0");
	const countBefore = counts["/1"];

	// Go back two entries, to make sure it returns to the right place
	router.shouldBlock = () => true;
	let promise = waitForPopstate();
	window.history.go(-2);
	await promise;
	assert.strictEqual(window.location.pathname, "/1");
	assert.strictEqual(router.location.pathname, "/0");

	// Blocked, so the router goes forward again
	await waitForPopstate();
	assert.strictEqual(window.location.pathname, "/0");
	assert.strictEqual(counts["/1"], countBefore);

	// History is intact, so unblocked back navigation works normally
	router.shouldBlock = undefined;
	promise = waitForPopstate();
	window.history.back();
	await promise;
	assert.strictEqual(window.location.pathname, "/2");

	// Blocked forward navigation
	router.shouldBlock = () => true;
	promise = waitForPopstate();
	window.history.forward();
	await promise;
	assert.strictEqual(window.location.pathname, "/0");
	await waitForPopstate();
	assert.strictEqual(window.location.pathname, "/2");

	router.shouldBlock = undefined;
});

test("tracks history entries created by hash links", async () => {
	await router.navigate("/1");

	let promise = waitForPopstate();
	window.location.hash = "foo";
	await promise;
	await router.navigate("/2");

	// Go back past the hash entry, and get blocked
	router.shouldBlock = () => true;
	promise = waitForPopstate();
	window.history.go(-2);
	await promise;
	assert.strictEqual(window.location.pathname, "/1");
	assert.strictEqual(window.location.hash, "");
	await waitForPopstate();
	assert.strictEqual(window.location.pathname, "/2");

	router.shouldBlock = undefined;
});

describe("scrollToTop", () => {
	const getScrollToTop = (navigate: () => void) => {
		const { promise, resolve } = Promise.withResolvers<boolean | undefined>();
		callbacks.navigationEnd = ({ context }) => {
			callbacks.navigationEnd = undefined;
			resolve(context.scrollToTop);
		};
		navigate();
		return promise;
	};

	const clickLink = (path: string, noScrollReset: boolean) => {
		const a = document.createElement("a");
		a.href = path;
		if (noScrollReset) {
			a.setAttribute("data-no-scroll-reset", "");
		}
		document.body.append(a);
		a.click();
		a.remove();
	};

	test("scrollToTop is passed through from navigate", async () => {
		assert.strictEqual(
			await getScrollToTop(() => {
				void router.navigate("/1", { scrollToTop: true });
			}),
			true,
		);
	});

	test("scrollToTop is true when clicking a link", async () => {
		assert.strictEqual(
			await getScrollToTop(() => {
				clickLink("/2", false);
			}),
			true,
		);
		assert.strictEqual(window.location.pathname, "/2");
	});

	test("scrollToTop is false when clicking a link with data-no-scroll-reset", async () => {
		assert.strictEqual(
			await getScrollToTop(() => {
				clickLink("/0", true);
			}),
			false,
		);
		assert.strictEqual(window.location.pathname, "/0");
	});

	test("scrollToTop is false for back/forward navigation", async () => {
		assert.strictEqual(
			await getScrollToTop(() => {
				window.history.back();
			}),
			false,
		);
		assert.strictEqual(window.location.pathname, "/2");
	});
});
