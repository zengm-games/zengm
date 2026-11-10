import { assert, beforeEach, describe, test } from "vitest";
import {
	consumeDropboxAuthState,
	createDropboxAuthState,
} from "./dropboxAuthState.ts";

describe("dropboxAuthState", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	test("returns the lid for the matching state", () => {
		const state = createDropboxAuthState(5);
		assert.strictEqual(consumeDropboxAuthState(state), 5);
	});

	test("a state can only be used once", () => {
		const state = createDropboxAuthState(5);
		consumeDropboxAuthState(state);
		assert.strictEqual(consumeDropboxAuthState(state), undefined);
	});

	test("a wrong state fails and clears the saved value", () => {
		const state = createDropboxAuthState(5);
		assert.strictEqual(consumeDropboxAuthState("wrong"), undefined);
		assert.strictEqual(consumeDropboxAuthState(state), undefined);
	});

	test("fails when nothing was saved", () => {
		assert.strictEqual(consumeDropboxAuthState("anything"), undefined);
	});

	test("fails when state is null", () => {
		assert.strictEqual(consumeDropboxAuthState(null), undefined);
	});

	test("creates a different state each time", () => {
		const state1 = createDropboxAuthState(5);
		const state2 = createDropboxAuthState(5);
		assert.notStrictEqual(state1, state2);
	});
});
