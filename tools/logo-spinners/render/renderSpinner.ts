import fs from "node:fs/promises";
import { LOGO_SPINNERS } from "./constants.ts";
import type { Sport } from "../../lib/getSport.ts";

// Avoid floating point noise like 756.7890000000001 in the output
const r3 = (v: number) => Math.round(v * 1000) / 1000;

export type SpinnerOptions<Colors> = {
	colors: {
		gold: Colors;
		normal: Colors;
	};
	filename: string;
};

// Replace every color in colors (a string, or an array/object of them) with a
// CSS variable, returning the same shape. The variables and their values are
// added to entries.
const toCssVars = (
	colors: unknown,
	name: string,
	entries: [string, string][],
): unknown => {
	if (typeof colors === "string") {
		entries.push([name, colors]);
		return `var(${name})`;
	}
	if (Array.isArray(colors)) {
		return colors.map((value, i) => toCssVars(value, `${name}${i}`, entries));
	}
	return Object.fromEntries(
		Object.entries(colors as Record<string, unknown>).map(([key, value]) => [
			key,
			toCssVars(value, `${name}-${key}`, entries),
		]),
	);
};

// Render one loop of an animation to an SVG sprite sheet: a single row of
// frames, as described in common/logoSpinners.ts.
//
// Every frame is drawn in the same coordinate system, given by viewBox (square:
// [minX, minY, size]). defs returns everything shared by all frames
// (gradients, and shapes that never move, drawn in each frame with <use>), so
// it's only in the file once. frame returns the markup for one frame, where t
// is the fraction of the loop (0 to 1).
//
// The normal and gold versions are in the same file. Both functions get colors
// as CSS variables (so they must be used in style attributes, not presentation
// attributes like fill), which are set to the normal colors by default. Loading
// the file as spinner.svg#gold makes the <g id="gold"> element the :target,
// which switches the variables to the gold colors.
export const renderSpinner = async <Colors>({
	colors,
	defs,
	filename,
	frame,
	sport,
	viewBox,
}: {
	colors: {
		gold: Colors;
		normal: Colors;
	};
	defs: (colors: Colors) => string;
	filename: string;
	frame: (colors: Colors, t: number) => string;
	sport: Sport;
	viewBox: [number, number, number];
}) => {
	const { frames } = LOGO_SPINNERS[sport];
	const [minX, minY, size] = viewBox;

	const normalEntries: [string, string][] = [];
	const cssVars = toCssVars(colors.normal, "--c", normalEntries) as Colors;
	const goldEntries: [string, string][] = [];
	toCssVars(colors.gold, "--c", goldEntries);
	const declarations = (entries: [string, string][]) =>
		entries.map(([name, value]) => `${name}:${value}`).join(";");
	// Only the colors that differ need to be overridden
	const goldChanges = goldEntries.filter(
		([name, value]) =>
			normalEntries.find((entry) => entry[0] === name)?.[1] !== value,
	);
	const style = `<style>:root{${declarations(normalEntries)}}#gold:target~*{${declarations(goldChanges)}}</style><g id="gold"/>`;

	let cells = "";
	for (let i = 0; i < frames; i++) {
		// A nested <svg> gives each frame its own coordinate system, and clips it
		// to its cell
		cells += `<svg x="${r3(i * size)}" y="0" width="${size}" height="${size}" viewBox="${minX} ${minY} ${size} ${size}">${frame(cssVars, i / frames)}</svg>`;
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r3(frames * size)} ${size}">${style}<defs>${defs(cssVars)}</defs>${cells}</svg>`;
	await fs.writeFile(filename, svg);

	const kilobytes = (Buffer.byteLength(svg) / 1024).toFixed(2);

	console.log(`Wrote ${filename} (${frames} frames, ${kilobytes} KB)`);
};
