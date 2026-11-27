import { assert, beforeEach, describe, test } from "vitest";
import { generate } from "facesjs";
import { resetG } from "../../../test/helpers.ts";
import { g, helpers } from "../../util/index.ts";
import { ageFace } from "../../../common/ageFace.ts";
import applyFaceAging from "./applyFaceAging.ts";
import type { Player } from "../../../common/types.ts";

const makePlayer = (pid: number) =>
	({
		pid,
		born: { year: 2000, loc: "" },
		face: generate(),
		imgURL: "",
	}) as unknown as Player;

beforeEach(() => {
	resetG();
});

describe("ageFace", () => {
	test("is deterministic", () => {
		const face = generate();
		for (const age of [19, 25, 33, 40]) {
			assert.deepStrictEqual(ageFace(face, 5, age), ageFace(face, 5, age));
		}
	});

	test("young players are lean with little facial hair, older players get lines and gray hair", () => {
		const face = generate();
		face.hair.color = "#2c1608";
		face.facialHair.id = "beard2";
		face.fatness = 0.5;

		const young = ageFace(face, 1, 19);
		assert.isBelow(young.fatness, face.fatness);
		assert.include(
			["none", "mustache-thin", "goatee-thin", "soul"],
			young.facialHair.id,
		);
		assert.strictEqual(young.eyeLine.id, "none");
		assert.strictEqual(young.smileLine.id, "none");

		const old = ageFace(face, 1, 45);
		assert.strictEqual(old.facialHair.id, "beard2");
		assert.notStrictEqual(old.hair.color, face.hair.color);
		assert.notStrictEqual(old.eyeLine.id, "none");
		assert.notStrictEqual(old.smileLine.id, "none");
		assert.isAtLeast(old.fatness, face.fatness);
	});
});

describe("applyFaceAging", () => {
	test("never compounds", () => {
		const p = makePlayer(7);
		const original = helpers.deepCopy(p.face);
		applyFaceAging(p, 2036);
		const once = helpers.deepCopy(p.face);
		for (let season = 2019; season <= 2040; season++) {
			applyFaceAging(p, season);
		}
		applyFaceAging(p, 2036);
		assert.deepStrictEqual(p.face, once);
		assert.deepStrictEqual(p.face, ageFace(original, 7, 36));
	});

	test("leaves edited faces and photos alone", () => {
		const edited = makePlayer(1);
		edited.faceEdited = 1;
		const editedFace = helpers.deepCopy(edited.face);
		applyFaceAging(edited, 2040);
		assert.deepStrictEqual(edited.face, editedFace);
		assert.isUndefined(edited.faceBase);

		const photo = makePlayer(2);
		photo.imgURL = "/img/player.png";
		const photoFace = helpers.deepCopy(photo.face);
		applyFaceAging(photo, 2040);
		assert.deepStrictEqual(photo.face, photoFace);
	});

	test("does nothing when the setting is off", () => {
		g.setWithoutSavingToDB("faceAging", false);
		const p = makePlayer(3);
		const face = helpers.deepCopy(p.face);
		applyFaceAging(p, 2040);
		assert.deepStrictEqual(p.face, face);
		assert.isUndefined(p.faceBase);
	});
});
