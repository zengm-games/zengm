// Basketball spinning like a sphere around the vertical axis. The ball's fill,
// shading and outline stay fixed; only the seams rotate.

import { applyMatrix, f, normalize, rotate, type Vec3 } from "../geometry.ts";
import { renderSpinner, type SpinnerOptions } from "../renderSpinner.ts";

const DURATION = 4; // [seconds]

// Ball gradient: [outer, inner]
export type BasketballColors = [string, string];

const CONFIG = {
	// Curved seam oval: tan of its angular radius where it crosses the great
	// circle (A) and halfway between the crossings (B). B = 1 puts that midpoint
	// exactly halfway between the two great circles, like a real ball.
	seamA: 3.435,
	seamB: 1,

	// Orientation of the ball at frame 0 (rotation matrix, rows = screen x, y, z).
	// Fitted so frame 0 matches the original logo.
	orient: [
		[0.1156, -0.6769, 0.7269],
		[-0.9709, 0.0776, 0.2267],
		[-0.2099, -0.7319, -0.6483],
	] as Vec3[],

	// Rotation axis in screen space (x right, y down, z toward viewer).
	// [0, 1, 0] = spin around the vertical axis.
	axis: [1, 0, 0] as Vec3,

	// 1 = front of the ball moves right, -1 = left
	direction: 1,

	strokeWidth: 4.924,

	// Points per seam. More = smoother curves, bigger SVG (only matters for the
	// intermediate SVG, not the output image).
	samples: 120,
};

// Geometry of the original logo SVG (viewBox units). The original is 252.263 x
// 251.88; the viewBox is padded vertically to make it square.
const VIEWBOX = "0 -0.1915 252.263 252.263";
const CX = 126.13;
const CY = 125.94;
const R = 123.57;

const buildSeams = (): Vec3[][] => {
	const { seamA: A, seamB: B, orient, samples } = CONFIG;
	const seams: Vec3[][] = [[], [], [], []];
	for (let i = 0; i <= samples; i++) {
		const t = (2 * Math.PI * i) / samples;
		const ct = Math.cos(t);
		const st = Math.sin(t);
		const n = Math.hypot(1, A * ct, B * st);
		const pts: Vec3[] = [
			// Two perpendicular great circles
			[0, ct, st],
			[ct, st, 0],
			// Curved seams, around the +x and -x axes
			[1 / n, (A * ct) / n, (B * st) / n],
			[-1 / n, (A * ct) / n, (B * st) / n],
		];
		pts.forEach((p, k) => {
			seams[k]!.push(applyMatrix(orient, p));
		});
	}
	return seams;
};

const SEAMS = buildSeams();
const AXIS = normalize(CONFIG.axis);

// SVG path of the visible (front-facing) half of the seams, rotated by th
const seamPath = (th: number) => {
	let d = "";
	for (const seam of SEAMS) {
		let prev: Vec3 | undefined;
		let first = true;
		for (const p0 of seam) {
			const p = rotate(p0, AXIS, th);
			if (prev && (p[2] > 0 || prev[2] > 0)) {
				let [px, py] = prev;
				let [qx, qy] = p;
				if (prev[2] <= 0 || p[2] <= 0) {
					// Cut the segment exactly at the rim
					const u = prev[2] / (prev[2] - p[2]);
					const ex = prev[0] + (p[0] - prev[0]) * u;
					const ey = prev[1] + (p[1] - prev[1]) * u;
					if (prev[2] <= 0) {
						[px, py] = [ex, ey];
					} else {
						[qx, qy] = [ex, ey];
					}
				}
				if (prev[2] <= 0 || first) {
					d += `M${f(CX + R * px)} ${f(CY + R * py)}`;
				}
				d += `L${f(CX + R * qx)} ${f(CY + R * qy)}`;
				first = false;
			}
			prev = p;
		}
	}
	return d;
};

// t = fraction of a full turn (0 to 1)
const frameSvg = (colors: BasketballColors, t: number) => {
	const th = CONFIG.direction * 2 * Math.PI * t;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"><defs><linearGradient id="a"><stop offset="0" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[0]}"/></linearGradient><radialGradient href="#a" xlink:href="#a" xmlns:xlink="http://www.w3.org/1999/xlink" id="b" cx="362.177" cy="386.004" r="126.131" gradientTransform="matrix(1.13773 .88039 -.61106 .78967 186 -238)" gradientUnits="userSpaceOnUse"/></defs><g stroke="#000" stroke-width="${CONFIG.strokeWidth}" fill="none"><path fill="url(#b)" d="M290.079 500.005c-30.113-61.16-4.838-135.198 56.417-165.265 61.255-30.066 135.41-4.83 165.522 56.33 30.113 61.16 4.838 135.199-56.417 165.265-61.2 30.039-135.271 4.89-165.444-56.171" transform="translate(-274.917 -319.599)"/><path stroke-linejoin="round" stroke-linecap="round" d="${seamPath(th)}"/></g></svg>`;
};

export const basketball = ({
	colors,
	filename,
	size,
}: SpinnerOptions<BasketballColors>) =>
	renderSpinner({
		duration: DURATION,
		filename,
		frameSvg: (t) => frameSvg(colors, t),
		size,
	});
