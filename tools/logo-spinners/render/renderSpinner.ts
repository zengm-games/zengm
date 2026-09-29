import fs from "node:fs/promises";
import { getLogoSpinnerInfo } from "../../../common/logoSpinners.ts";
import type { Sport } from "../../lib/getSport.ts";

// Avoid floating point noise like 756.7890000000001 in the output
const r3 = (v: number) => Math.round(v * 1000) / 1000;

export type SpinnerOptions<Colors> = {
	colors: Colors;
	filename: string;
};

// Render one loop of an animation to an SVG sprite sheet: a grid of frames, laid
// out as described in common/logoSpinners.ts.
//
// Every frame is drawn in the same coordinate system, given by viewBox (square:
// [minX, minY, size]). defs holds everything shared by all frames (gradients,
// and shapes that never move, drawn in each frame with <use>), so it's only in
// the file once. frame gets t, the fraction of the loop (0 to 1), and returns
// the markup for that frame.
export const renderSpinner = async ({
	defs,
	filename,
	frame,
	sport,
	viewBox,
}: {
	defs: string;
	filename: string;
	frame: (t: number) => string;
	sport: Sport;
	viewBox: [number, number, number];
}) => {
	const { cols, frames, rows } = getLogoSpinnerInfo(sport);
	const [minX, minY, size] = viewBox;

	let cells = "";
	for (let i = 0; i < frames; i++) {
		const x = r3((i % cols) * size);
		const y = r3(Math.floor(i / cols) * size);
		// A nested <svg> gives each frame its own coordinate system, and clips it
		// to its cell
		cells += `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${minX} ${minY} ${size} ${size}">${frame(i / frames)}</svg>`;
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r3(cols * size)} ${r3(rows * size)}"><defs>${defs}</defs>${cells}</svg>`;
	await fs.writeFile(filename, svg);

	const kilobytes = (Buffer.byteLength(svg) / 1024).toFixed(2);

	console.log(
		`Wrote ${filename} (${frames} frames, ${cols}x${rows} grid, ${kilobytes} KB)`,
	);
};
