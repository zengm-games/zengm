/* eslint-disable no-async-promise-executor */
import { assert, test } from "vitest";
import router from "./index.ts";
import type { Context } from "./index.ts";

const counts: Record<string, number> = {};
const countCallback = async (context: Context) => {
	// This is to remove the query string that vitest adds to the URL
	const { pathname } = new URL(context.path, window.location.origin);

	if (pathname.startsWith("/3/")) {
		counts["/3/:foo"]! += 1;
	} else {
		counts[pathname]! += 1;
	}
};
const routes = {
	"/": countCallback,
	"/0": countCallback,
	"/1": countCallback,
	"/2": countCallback,
	"/3/:foo": countCallback,
	"/error": async (context: Context) => {
		countCallback(context);
		throw new Error("runtime error");
	},
	"/state": async (context: Context) => {
		countCallback(context);
		assert.deepStrictEqual(context.state, { custom: 123 });
	},
};
for (const key of Object.keys(routes)) {
	counts[key] = 0;
}

test("sets routes", () => {
	const countBefore = counts["/"]!;

	router.start({
		routes,
	});

	assert.strictEqual((router as any).routes.length, 7);
	assert.strictEqual(counts["/"], countBefore + 1);
});

test("navigates", async () => {
	const countBefore = counts["/0"]!;
	assert.strictEqual(window.location.pathname, "/");

	await router.navigate("/0");

	assert.strictEqual(window.location.pathname, "/0");
	assert.strictEqual(counts["/0"], countBefore + 1);
});

test("handles back/forward navigation", async () => {
	// This is to wait for the asynchronous effect of window.history.back() and window.history.forward() to occur
	const waitForPopstate = () => {
		return new Promise((resolve) => {
			window.addEventListener("popstate", resolve, { once: true });
		});
	};
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
	const countBefore = counts["/1"]!;
	assert.strictEqual(window.location.pathname, "/0");

	await router.navigate("/1", { replace: true });

	assert.strictEqual(window.location.pathname, "/1");
	assert.strictEqual(counts["/1"], countBefore + 1);
});

test("fires routematched event", () => {
	return new Promise<void>(async (resolve, reject) => {
		const countBefore = counts["/2"];
		const callback = (arg: any) => {
			try {
				assert.strictEqual(counts["/2"], countBefore); // Hasn't navigated yet
				assert.deepStrictEqual(arg, {
					context: {
						params: {},
						path: "/2",
						state: {},
					},
				});
				resolve();
			} catch (error) {
				console.error(error);
				reject(error);
			}

			(router as any).routeMatched = undefined;
		};
		(router as any).routeMatched = callback;
		await router.navigate("/2");
	});
});

test("fires navigationend event", () => {
	return new Promise<void>(async (resolve, reject) => {
		const countBefore = counts["/3/:foo"]!;
		const callback = (arg: any) => {
			try {
				assert.strictEqual(counts["/3/:foo"], countBefore + 1);
				assert.deepStrictEqual(arg, {
					context: {
						params: {
							foo: "bar",
						},
						path: "/3/bar",
						state: {},
					},
					error: null,
				});
				resolve();
			} catch (error) {
				reject(error);
			}

			(router as any).navigationEnd = undefined;
		};
		(router as any).navigationEnd = callback;
		await router.navigate("/3/bar");
	});
});

test("fires navigationend event with 404 error", () => {
	return new Promise<void>(async (resolve, reject) => {
		const callback = (arg: any) => {
			try {
				assert.strictEqual(arg.error.message, "Matching route not found");
				resolve();
			} catch (error) {
				reject(error);
			}

			(router as any).navigationEnd = undefined;
		};
		(router as any).navigationEnd = callback;
		await router.navigate("/does-not-exist");
	});
});

test("fires navigationend event with runtime error", () => {
	return new Promise<void>(async (resolve, reject) => {
		const countBefore = counts["/error"]!;
		const callback = (arg: any) => {
			try {
				assert.strictEqual(arg.error.message, "runtime error");
				assert.strictEqual(counts["/error"], countBefore + 1);
				resolve();
			} catch (error) {
				reject(error);
			}

			(router as any).navigationEnd = undefined;
		};
		(router as any).navigationEnd = callback;
		await router.navigate("/error");
	});
});

test("passes state to callback", async () => {
	const countBefore = counts["/state"]!;

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
