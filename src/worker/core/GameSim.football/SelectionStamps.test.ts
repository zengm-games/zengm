import { assert, test } from "vitest";
import SelectionStamps from "./SelectionStamps.ts";
import type { PlayerGameSim } from "./types.ts";

const player = (id: number) => ({ id }) as PlayerGameSim;

test("selection stamps preserve ID equality through depth and ID edits", () => {
	const selection = new SelectionStamps();
	const depth = [player(1), player(1), player(2)];
	const before = structuredClone(depth);
	const cached = selection.getDepthSlots(depth);
	selection.start();
	assert.isFalse(selection.has(depth[0]!.id, cached, 0));
	assert.isFalse(selection.has(depth[1]!.id, cached, 1));
	selection.mark(1);
	assert.isTrue(selection.has(depth[0]!.id, cached, 0));
	assert.isTrue(selection.has(depth[1]!.id, cached, 1));
	assert.isFalse(selection.has(depth[2]!.id, cached, 2));
	assert.deepEqual(depth, before);

	depth.reverse();
	assert.isFalse(selection.has(depth[0]!.id, cached, 0));
	depth[0]!.id = 1;
	assert.isTrue(selection.has(depth[0]!.id, cached, 0));
	depth.splice(0, 2, player(3));
	assert.isFalse(selection.has(depth[0]!.id, cached, 0));
	depth.push(player(1));
	assert.isTrue(selection.has(depth[2]!.id, cached, 2));

	const replacement = [player(1)];
	assert.isTrue(selection.has(1, selection.getDepthSlots(replacement), 0));
	selection.start();
	assert.isFalse(selection.has(1, cached, 2));
});

test("selection stamps preserve SameValueZero and handle growth and epoch wrap", () => {
	const selection = new SelectionStamps();
	const depth = [player(Number.NaN), player(Number.NaN), player(-0), player(0)];
	const cached = selection.getDepthSlots(depth);
	selection.start();
	selection.mark(Number.NaN);
	assert.isTrue(selection.has(Number.NaN, cached, 0));
	assert.isTrue(selection.has(Number.NaN, cached, 1));
	selection.mark(-0);
	assert.isTrue(selection.has(0, cached, 2));
	assert.isTrue(selection.has(-0, cached, 3));

	for (let id = 1; id <= 400; id++) {
		depth.push(player(id));
		assert.isFalse(selection.has(id, cached, depth.length - 1));
		selection.mark(id);
		assert.isTrue(selection.has(id, cached, depth.length - 1));
	}
	assert.isTrue(selection.has(Number.NaN, cached, 0));
	assert.isTrue(selection.has(0, cached, 2));

	(selection as unknown as { stamp: number }).stamp = 0xffffffff;
	selection.start();
	for (const [index, p] of depth.entries()) {
		assert.isFalse(selection.has(p.id, cached, index));
	}
	selection.mark(Number.NaN);
	assert.isTrue(selection.has(Number.NaN, cached, 1));
});

test("marking a new ID retains it when the stamp array grows", () => {
	const selection = new SelectionStamps();
	const depth = Array.from({ length: 400 }, (_, id) => player(id));
	const cached = selection.getDepthSlots(depth);
	selection.start();
	for (const [index, p] of depth.entries()) {
		// Mark first: assigning the slot can replace the backing typed array.
		selection.mark(p.id);
		assert.isTrue(selection.has(p.id, cached, index));
	}
	for (const [index, p] of depth.entries()) {
		assert.isTrue(selection.has(p.id, cached, index));
	}
});
