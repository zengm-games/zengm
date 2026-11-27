import type { FaceConfig } from "facesjs";

// The parts of a face that change with age. A player's face as generated (his adult look) is saved as this once, so aging is always computed from the same starting point and never compounds.
export type FaceBase = {
	fatness: number;
	hairColor: string;
	facialHair: string;
	eyeLine: string;
	smileLine: string;
	smileLineSize: number;
	miscLine: string;
};

export const getFaceBase = (face: FaceConfig): FaceBase => {
	return {
		fatness: face.fatness,
		hairColor: face.hair.color,
		facialHair: face.facialHair.id,
		eyeLine: face.eyeLine.id,
		smileLine: face.smileLine.id,
		smileLineSize: face.smileLine.size,
		miscLine: face.miscLine.id,
	};
};

export const applyFaceBase = (face: FaceConfig, base: FaceBase): FaceConfig => {
	return {
		...face,
		fatness: base.fatness,
		hair: { ...face.hair, color: base.hairColor },
		facialHair: { ...face.facialHair, id: base.facialHair },
		eyeLine: { ...face.eyeLine, id: base.eyeLine },
		smileLine: {
			...face.smileLine,
			id: base.smileLine,
			size: base.smileLineSize,
		},
		miscLine: { ...face.miscLine, id: base.miscLine },
	};
};

// Seeded random numbers, so aging never uses Math.random or the game's random stream (and so can't change any game result)
const hash = (s: string) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^ (h >>> 16)) >>> 0;
};
const seededRandom = (seed: number | string, key: string) =>
	hash(`${seed}|${key}`) / 4294967296;

const clamp = (x: number, min: number, max: number) =>
	Math.min(max, Math.max(min, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

const GREY = [198, 199, 202];
const greyColor = (color: string, t: number) => {
	const match = /^#([\da-f]{6})$/i.exec(color);
	if (!match || t <= 0) {
		return color;
	}
	const n = Number.parseInt(match[1]!, 16);
	const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	return `#${rgb
		.map((x, i) =>
			Math.round(x + (GREY[i]! - x) * t)
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
};

const LIGHT_FACIAL_HAIR = ["mustache-thin", "goatee-thin", "soul"];
const EYE_LINES = ["line1", "line2", "line3", "line4", "line5", "line6"];
const SMILE_LINES = ["line1", "line2", "line3", "line4"];
const FOREHEAD_LINES = ["forehead1", "forehead2", "forehead3", "forehead4"];

const pick = <T>(array: T[], u: number) => array[Math.floor(u * array.length)]!;

// Facial hair: none or light as a young player, growing into his adult style at some age from 22 to 25
const facialHairAtAge = (base: string, seed: number | string, age: number) => {
	const growAge = 22 + Math.floor(seededRandom(seed, "growAge") * 4);
	if (base === "none" || age >= growAge) {
		return base;
	}
	const light = LIGHT_FACIAL_HAIR.includes(base)
		? base
		: pick(LIGHT_FACIAL_HAIR, seededRandom(seed, "lightStyle"));
	if (age <= 21 && seededRandom(seed, "clean") < 0.6) {
		return "none";
	}
	return light;
};

/**
 * A face at an age. baseFace is the face as generated (his adult look). This is a pure function of its inputs, so the same player at the same age always looks the same.
 */
export const ageFace = (
	baseFace: FaceConfig,
	seed: number | string,
	age: number,
): FaceConfig => {
	const r = (key: string) => seededRandom(seed, key);
	const base = getFaceBase(baseFace);

	// Greying of hair (and so beard and eyebrows, which use the hair color), starting at some age from 32 to 43
	const greyStart = 32 + Math.floor(r("greyStart") * 12);
	const greySpan = 16 + Math.floor(r("greySpan") * 14);
	const grey = clamp((age - greyStart) / greySpan, 0, 0.9);

	// Lines appear one at a time from the late 20s, a few years earlier or later depending on the player
	const shift = Math.floor(r("linesShift") * 7) - 3;
	const smileAge = 28 + shift;
	const eyeAge = 31 + shift;
	const foreheadAge = 33 + shift;

	let smileLine = "none";
	let smileLineSize = base.smileLineSize;
	if (age >= smileAge) {
		smileLine =
			base.smileLine !== "none"
				? base.smileLine
				: pick(SMILE_LINES, r("smileLine"));
		// Deeper with the years
		smileLineSize = round2(
			clamp(base.smileLineSize + 0.02 * (age - smileAge), 0.5, 1.5),
		);
	}

	let eyeLine = "none";
	if (age >= eyeAge) {
		eyeLine =
			base.eyeLine !== "none" ? base.eyeLine : pick(EYE_LINES, r("eyeLine"));
	}

	// The misc slot also has freckles and such, which are kept
	let miscLine = base.miscLine;
	if (miscLine === "none" || miscLine.startsWith("forehead")) {
		if (age >= foreheadAge + 8) {
			miscLine = "forehead5";
		} else if (age >= foreheadAge) {
			miscLine =
				miscLine !== "none" ? miscLine : pick(FOREHEAD_LINES, r("forehead"));
		} else {
			miscLine = "none";
		}
	}

	// Fullness: a little leaner as a young player, filling out slowly after 28
	const young = age < 22 ? -0.03 * (22 - age) : 0;
	const gain = Math.min(0.2, Math.max(0, age - 28) * 0.012 * r("fatGain"));
	const fatness = round2(clamp(base.fatness + young + gain, 0, 1));

	return applyFaceBase(baseFace, {
		fatness,
		hairColor: greyColor(base.hairColor, grey),
		facialHair: facialHairAtAge(base.facialHair, seed, age),
		eyeLine,
		smileLine,
		smileLineSize,
		miscLine,
	});
};
