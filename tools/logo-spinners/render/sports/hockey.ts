// Hockey puck that wobbles like a spinning coin settling on a table. A puck
// looks the same however it spins, so the visible motion is its tilt, whose
// direction goes around in a circle. The lighting (the highlight on the side)
// stays fixed while the puck moves.
//
// The puck is rebuilt as a 3D cylinder whose size, viewing angle and colors
// match the original SVG, so an untilted frame looks like the original.

import {
	add,
	cross,
	f,
	normalize,
	rotate,
	scale,
	type Vec3,
} from "../geometry.ts";
import { renderSpinner, type SpinnerOptions } from "../renderSpinner.ts";

const DURATION = 1.5; // [seconds]

export type HockeyColors = {
	top: string;
	side: string;
	// Highlight gradient over the side, left to right: [edge, highlight,
	// fade-out]. Colors can have alpha, like #ffffff34.
	sideGradient: [string, string, string];
	// [outer, inner]
	rings: [string, string];
};

const CONFIG = {
	// Maximum tilt, in degrees
	tilt: 10,

	// 1 or -1: which way the wobble goes around
	direction: 1,
};

type Pt = [number, number];

// Measurements from the original SVG
const RADIUS = 149.64;
// Viewing angle above the ice, from the top face's ellipse (50 / 149.64)
const ELEVATION = Math.asin(50 / RADIUS);
// Thickness: the side is 100 units tall on screen
const HEIGHT = 100 / Math.cos(ELEVATION);
// Screen position of the puck's center (halfway between top and bottom faces)
const CENTER: Pt = [149.64, 101.33 + (HEIGHT * Math.cos(ELEVATION)) / 2];
// Rings on the top face, as fractions of the radius: [outer, inner]
const RING_RADII = [0.782, 0.758];
const RING_WIDTH = 5.3;

// World axes: x right, y up, z toward the viewer (ice is the x-z plane)

// Orthographic camera looking down at the ice from ELEVATION
const project = ([x, y, z]: Vec3): Pt => [
	CENTER[0] + x,
	CENTER[1] - y * Math.cos(ELEVATION) + z * Math.sin(ELEVATION),
];

// Puck axis at time t (fraction of a cycle)
const axisAt = (t: number): Vec3 => {
	const tilt = (CONFIG.tilt * Math.PI) / 180;
	const phase = CONFIG.direction * 2 * Math.PI * t;
	// Tilt direction goes around the vertical axis
	const hinge: Vec3 = [Math.cos(phase), 0, Math.sin(phase)];
	return rotate([0, 1, 0], hinge, tilt);
};

// Points on a circle of radius r centered on the axis at height h
const circle = (axis: Vec3, h: number, r: number, n = 96): Pt[] => {
	// Two directions perpendicular to the axis
	const u = normalize(
		cross(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]),
	);
	const v = cross(axis, u);
	const pts: Pt[] = [];
	for (let i = 0; i < n; i++) {
		const a = (2 * Math.PI * i) / n;
		pts.push(
			project(
				add(
					scale(axis, h),
					scale(u, r * Math.cos(a)),
					scale(v, r * Math.sin(a)),
				),
			),
		);
	}
	return pts;
};

// Convex hull (monotone chain): the outline of the whole puck
const hull = (pts: Pt[]): Pt[] => {
	const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const turn = (o: Pt, a: Pt, b: Pt) =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (list: Pt[]) => {
		const out: Pt[] = [];
		for (const p of list) {
			while (out.length >= 2 && turn(out.at(-2)!, out.at(-1)!, p) <= 0) {
				out.pop();
			}
			out.push(p);
		}
		out.pop();
		return out;
	};
	return [...half(sorted), ...half(sorted.reverse())];
};

const pathD = (pts: Pt[]) =>
	`M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;

// Side highlight from the original, fixed in screen space
const defs = (colors: HockeyColors) =>
	`<defs><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="0.65" y1="0" x2="201.53" y2="0"><stop stop-color="${colors.sideGradient[0]}" offset="0"/><stop stop-color="${colors.sideGradient[1]}" offset=".211"/><stop stop-color="${colors.sideGradient[2]}" offset="1"/></linearGradient></defs>`;

// The tilting puck can reach past the original's edges, so frame the
// viewBox around every pose (square, same for all frames)
const VIEWBOX = (() => {
	let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
	for (let i = 0; i < 48; i++) {
		const axis = axisAt(i / 48);
		for (const h of [HEIGHT / 2, -HEIGHT / 2]) {
			for (const [x, y] of circle(axis, h, RADIUS, 48)) {
				[minX, minY, maxX, maxY] = [
					Math.min(minX, x),
					Math.min(minY, y),
					Math.max(maxX, x),
					Math.max(maxY, y),
				];
			}
		}
	}
	const pad = 3;
	const size = Math.max(maxX - minX, maxY - minY) + 2 * pad;
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;
	return `${f(cx - size / 2)} ${f(cy - size / 2)} ${f(size)} ${f(size)}`;
})();

// t = fraction of a wobble cycle (0 to 1)
const frameSvg = (colors: HockeyColors, t: number) => {
	const axis = axisAt(t);
	const top = circle(axis, HEIGHT / 2, RADIUS);
	const bottom = circle(axis, -HEIGHT / 2, RADIUS);
	const outline = pathD(hull([...top, ...bottom]));
	const rings = RING_RADII.map(
		(r, i) =>
			`<path fill="none" stroke="${colors.rings[i]}" stroke-width="${RING_WIDTH}" d="${pathD(circle(axis, HEIGHT / 2, RADIUS * r))}"/>`,
	).join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">${defs(colors)}<path fill="${colors.side}" d="${outline}"/><path fill="url(#a)" d="${outline}"/><path fill="${colors.top}" d="${pathD(top)}"/>${rings}</svg>`;
};

export const hockey = ({
	colors,
	filename,
	size,
}: SpinnerOptions<HockeyColors>) =>
	renderSpinner({
		duration: DURATION,
		filename,
		frameSvg: (t) => frameSvg(colors, t),
		size,
	});
