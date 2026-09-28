// Baseball spinning like a pitch. The ball stays fixed; the red stitches
// rotate around it.
//
// The seam is the classic figure-8 baseball curve on a sphere, with its shape
// and orientation fitted to the stitches in the original SVG, so frame 0 looks
// like the original. The stitches are drawn as chevrons along the seam in the
// original's style.

import {
	add,
	applyMatrix,
	cross,
	f,
	normalize,
	rotate,
	scale,
	type Vec3,
} from "../geometry.ts";
import { renderSpinner, type SpinnerOptions } from "../renderSpinner.ts";

const DURATION = 2; // [seconds]

const CONFIG = {
	// Spin axis in screen space (x right, y down, z toward the viewer).
	// [1, 0, 0] = around the horizontal axis, like a fastball's backspin.
	axis: [1, 1, 0] as Vec3,

	// 1 or -1: which way the ball spins
	direction: 1,

	// Seam shape: 0 is a plain circle, higher bends the figure 8 more. Fitted
	// to the original drawing.
	seamBend: 0.2736,

	// Distance between stitches along the seam, in the original SVG's units
	stitchSpacing: 21,
	// Length and widths of each stitch arm (outer end, inner end), its angle
	// to the seam in degrees, and the gap between its inner end and the seam
	stitchLength: 26,
	stitchWidthOuter: 8,
	stitchWidthInner: 2.5,
	stitchAngle: 62,
	stitchGap: 2.5,

	// Width of the thin line along the middle of the seam (0 to hide it)
	seamLineWidth: 1.2,

	// Degrees of rotation over which stitches fade out near the ball's edge
	edgeFade: 10,

	color: "#C03018",
	ballColor: "#E3DCDA",
};

// Ball in the original SVG (it is very slightly oval)
const CX = 179.162;
const CY = 173.92;
const RX = 178.43;
const RY = 173.92;
// Average radius, to convert the SVG's units to the unit sphere
const R = (RX + RY) / 2;

// Orientation of the seam at frame 0 (rows = screen x, y, z), fitted to the
// original drawing
const ORIENT: Vec3[] = [
	[0.5023, 0.2229, -0.8355],
	[0.4645, -0.8845, 0.0433],
	[-0.7293, -0.4098, -0.5479],
];

// Baseball seam: a curve on the unit sphere, for t in [0, 2pi)
const seamPoint = (t: number): Vec3 => {
	const b = CONFIG.seamBend;
	const a = 1 - b;
	const c = 2 * Math.sqrt(a * b);
	return [
		a * Math.cos(t) + b * Math.cos(3 * t),
		a * Math.sin(t) - b * Math.sin(3 * t),
		c * Math.sin(2 * t),
	];
};

// Evenly spaced points along the seam (by arc length), with the tangent
const seamSamples = (spacing: number) => {
	const N = 2000;
	const pts = Array.from({ length: N + 1 }, (_, i) =>
		seamPoint((2 * Math.PI * i) / N),
	);
	const cum = [0];
	for (let i = 1; i <= N; i++) {
		cum.push(cum[i - 1]! + Math.hypot(...add(pts[i]!, scale(pts[i - 1]!, -1))));
	}
	const total = cum[N]!;
	const count = Math.round(total / spacing);
	const out: { p: Vec3; tangent: Vec3 }[] = [];
	let j = 0;
	for (let k = 0; k < count; k++) {
		const s = (k * total) / count;
		while (cum[j + 1]! < s) {
			j++;
		}
		const u = (s - cum[j]!) / (cum[j + 1]! - cum[j]!);
		const p = normalize(add(scale(pts[j]!, 1 - u), scale(pts[j + 1]!, u)));
		out.push({ p, tangent: normalize(add(pts[j + 1]!, scale(pts[j]!, -1))) });
	}
	return out;
};

// One stitch: two tapered arms forming a chevron, as polygons on the sphere
const stitchPolygons = (p: Vec3, tangent: Vec3): Vec3[][] => {
	const side = normalize(cross(p, tangent));
	const len = CONFIG.stitchLength / R;
	const wo = CONFIG.stitchWidthOuter / R / 2;
	const wi = CONFIG.stitchWidthInner / R / 2;
	const ang = (CONFIG.stitchAngle * Math.PI) / 180;
	return [1, -1].map((s) => {
		const inner = add(p, scale(side, (s * CONFIG.stitchGap) / R));
		const outer = add(
			p,
			scale(side, s * len * Math.sin(ang)),
			scale(tangent, len * Math.cos(ang)),
		);
		// Perpendicular to the arm, within the surface
		const armDir = normalize(add(outer, scale(inner, -1)));
		const perp = normalize(cross(p, armDir));
		return [
			add(inner, scale(perp, wi)),
			add(outer, scale(perp, wo)),
			add(outer, scale(perp, -wo)),
			add(inner, scale(perp, -wi)),
		].map(normalize);
	});
};

// Everything that doesn't depend on the frame
const STITCHES = seamSamples(CONFIG.stitchSpacing / R).map(
	({ p, tangent }) => ({
		p,
		polygons: stitchPolygons(p, tangent),
	}),
);
const SEAM_LINE = Array.from({ length: 601 }, (_, i) =>
	seamPoint((2 * Math.PI * i) / 600),
);
const AXIS = normalize(CONFIG.axis);
const FADE_SIN = Math.sin((CONFIG.edgeFade * Math.PI) / 180);

const xy = (v: Vec3) => `${f(CX + RX * v[0])} ${f(CY + RY * v[1])}`;

// Square viewBox around the original 357.588 x 347.967 drawing
const VIEWBOX = "0 -4.81 357.588 357.588";

const BALL = `<path fill="${CONFIG.ballColor}" d="M.732 173.92c0 96.05 79.885 173.92 178.43 173.92s178.43-77.865 178.43-173.92S277.702 0 179.162 0 .732 77.865.732 173.92z"/>`;

// t = fraction of a full turn (0 to 1)
const frameSvg = (t: number) => {
	const th = CONFIG.direction * 2 * Math.PI * t;
	const view = (v: Vec3) => rotate(applyMatrix(ORIENT, v), AXIS, th);

	// Stitches
	let stitches = "";
	for (const { p, polygons } of STITCHES) {
		const z = view(p)[2];
		const opacity = Math.min(1, z / FADE_SIN);
		if (opacity <= 0) {
			continue;
		}
		const d = polygons
			.map((poly) => `M${poly.map((v) => xy(view(v))).join("L")}Z`)
			.join("");
		stitches += `<path opacity="${f(opacity)}" d="${d}"/>`;
	}

	// Thin line along the seam, front half only
	let line = "";
	if (CONFIG.seamLineWidth > 0) {
		let penDown = false;
		for (const p of SEAM_LINE) {
			const v = view(p);
			if (v[2] > FADE_SIN) {
				line += `${penDown ? "L" : "M"}${xy(v)}`;
				penDown = true;
			} else {
				penDown = false;
			}
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">${BALL}<g fill="${CONFIG.color}" stroke="${CONFIG.color}" stroke-width="2" stroke-linejoin="round">${stitches}</g>${
		line
			? `<path fill="none" stroke="${CONFIG.color}" stroke-width="${CONFIG.seamLineWidth}" stroke-linecap="round" d="${line}"/>`
			: ""
	}</svg>`;
};

export const baseball = ({ filename, size }: SpinnerOptions) =>
	renderSpinner({
		duration: DURATION,
		filename,
		frameSvg,
		size,
	});
