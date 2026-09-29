// Football spinning around its long axis, like a spiral pass. The outline,
// stripes and colors stay fixed; the seam, laces and lace shadows rotate
// around the ball.
//
// The laces and seam come from the original SVG: each point is lifted onto
// the ball's surface (x along the ball, angle around it), rotated, and
// projected back. The stripes are drawn as true rings around the ball, so
// their distance to the laces stays constant as the ball turns.

import { renderSpinner, type SpinnerOptions } from "../renderSpinner.ts";
import { num, pathData } from "../svg.ts";

export type FootballColors = {
	ball: string;
	seam: string;
	// Gradient: [bottom, top]
	stripes: [string, string];
	// The wide line under the laces
	laceBackbone: string;
	laces: string;
};

const CONFIG = {
	// 1 = laces roll toward the bottom-left edge first, -1 = toward the top-right
	direction: 1,

	// Degrees of rotation over which laces and shadows fade out as they
	// approach the edge of the ball
	edgeFade: 12,

	// Fraction of each turn the laces spend on the back of the ball. 0.5 is a
	// real spiral. Lower values keep the ball turning at a constant speed but
	// pretend its surface is shorter around than it really is, so features come
	// back into view sooner (see CIRCUMFERENCE).
	hiddenFraction: 0.3,

	// Stripes, in the original SVG's units measured along the ball from its
	// middle: where each stripe starts (inner edge) and how wide it is. They're
	// symmetric, and the laces are centered between them.
	stripeInner: 37.5,
	stripeWidth: 16.7,

	// How much the ball is turned toward the viewer, as a horizontal shift of
	// the ball's front relative to its radius. Curves the stripes (and moves
	// the laces with them) a little, like the original drawing.
	curve: 0.1,
};

type Pt = [number, number];

// Points taken from the original football SVG, in its local (unrotated)
// coordinates: the ball's extent along its axis, its half-height at evenly
// spaced x, the seam under the laces, and the laces and their shadows.
const X0 = -233.954;
const X1 = -76.291;
// Half-height of the ball at evenly spaced x from X0 to X1
// prettier-ignore
const RADII = [0,9.55,14.15,17.84,21.03,23.87,26.43,28.77,30.92,32.9,34.72,36.39,37.93,39.34,40.62,41.79,42.83,43.76,44.58,45.28,45.87,46.34,46.7,46.94,47.07,47.08,46.97,46.74,46.39,45.93,45.35,44.65,43.83,42.89,41.82,40.62,39.29,37.82,36.2,34.42,32.47,30.34,27.99,25.39,22.48,19.19,15.32,10.45,0];
// prettier-ignore
const SEAM_TOP: Pt[] = [[-233.95,573.46],[-233.52,571.52],[-232.49,569.81],[-231.18,568.3],[-229.7,566.96],[-228.12,565.72],[-226.48,564.58],[-224.79,563.51],[-223.07,562.5],[-221.31,561.55],[-219.53,560.63],[-217.73,559.76],[-215.91,558.93],[-214.08,558.13],[-212.23,557.36],[-210.38,556.62],[-208.51,555.91],[-206.63,555.22],[-204.74,554.56],[-202.85,553.92],[-201.42,553.46],[-199.51,552.86],[-198.07,552.43],[-196.63,552.01],[-194.71,551.47],[-193.26,551.07],[-191.33,550.57],[-189.87,550.2],[-187.93,549.73],[-186.47,549.4],[-184.51,548.96],[-182.56,548.55],[-180.59,548.16],[-179.12,547.88],[-177.15,547.53],[-175.18,547.19],[-173.21,546.88],[-171.23,546.59],[-169.74,546.39],[-167.76,546.14],[-165.77,545.91],[-164.28,545.75],[-162.29,545.57],[-160.29,545.4],[-158.3,545.26],[-156.3,545.15],[-154.48,545.07],[-152.48,545.01],[-150.48,544.97],[-148.48,544.97],[-146.98,544.98],[-144.98,545.02],[-142.98,545.08],[-140.99,545.17],[-138.99,545.29],[-136.99,545.43],[-135,545.6],[-133.01,545.8],[-131.02,546.02],[-129.04,546.26],[-127.06,546.54],[-125.08,546.83],[-123.11,547.16],[-121.14,547.51],[-119.17,547.89],[-117.21,548.3],[-115.26,548.73],[-113.32,549.2],[-111.38,549.69],[-109.45,550.21],[-107.53,550.77],[-105.62,551.36],[-103.72,551.98],[-101.83,552.64],[-99.95,553.34],[-98.09,554.07],[-96.25,554.85],[-94.43,555.68],[-92.63,556.55],[-90.86,557.47],[-89.12,558.46],[-87.41,559.5],[-85.75,560.62],[-84.14,561.81],[-82.61,563.08],[-81.15,564.46],[-79.81,565.94],[-78.61,567.54],[-77.6,569.27],[-76.84,571.11],[-76.39,573.06],[-76.33,573.56]];
// prettier-ignore
const LACE_BACKBONE: Pt[] = [[-176.45,547.45],[-174.98,547.14],[-173.51,546.86],[-172.03,546.61],[-170.55,546.38],[-169.56,546.24],[-168.07,546.05],[-166.58,545.88],[-165.09,545.73],[-163.59,545.59],[-162.1,545.47],[-160.6,545.36],[-159.1,545.27],[-157.61,545.19],[-156.11,545.13],[-154.61,545.07],[-153.11,545.04],[-151.61,545.01],[-150.11,544.99],[-149.11,544.99],[-147.61,545],[-146.61,545.01],[-145.11,545.03],[-143.61,545.07],[-142.61,545.11],[-141.11,545.17],[-139.61,545.25],[-138.12,545.34],[-136.62,545.45],[-135.13,545.57],[-133.63,545.72],[-132.14,545.88],[-131.15,546],[-129.66,546.2],[-128.67,546.35]];
// prettier-ignore
const STITCHES: Pt[][] = [[[-174.86,542.23],[-174.29,541.85],[-173.69,542.03],[-173.27,542.46],[-172.89,543.06],[-172.61,543.68],[-172.38,544.31],[-172.19,544.95],[-172.05,545.59],[-171.93,546.24],[-171.85,546.89],[-171.79,547.54],[-171.76,548.18],[-171.77,548.83],[-171.81,549.47],[-171.89,550.1],[-172.03,550.73],[-172.25,551.33],[-172.61,551.87],[-173.26,552.1],[-173.61,551.95]],[[-168.92,541.6],[-168.38,541.23],[-167.77,541.41],[-167.31,541.84],[-166.96,542.33],[-166.62,542.95],[-166.34,543.58],[-166.1,544.22],[-165.91,544.86],[-165.74,545.51],[-165.6,546.16],[-165.5,546.8],[-165.42,547.45],[-165.38,548.1],[-165.37,548.74],[-165.4,549.37],[-165.48,550],[-165.64,550.61],[-165.93,551.16],[-166.5,551.49],[-167,551.33]],[[-162.33,541.1],[-161.79,540.73],[-161.18,540.91],[-160.72,541.34],[-160.37,541.83],[-160.03,542.45],[-159.75,543.08],[-159.51,543.72],[-159.32,544.36],[-159.15,545.01],[-159.01,545.66],[-158.91,546.3],[-158.83,546.95],[-158.79,547.6],[-158.78,548.24],[-158.81,548.87],[-158.89,549.5],[-159.05,550.11],[-159.34,550.66],[-159.91,550.99],[-160.41,550.83]],[[-155.09,540.71],[-154.52,540.33],[-153.92,540.51],[-153.5,540.94],[-153.12,541.54],[-152.84,542.16],[-152.61,542.79],[-152.42,543.43],[-152.28,544.07],[-152.16,544.72],[-152.08,545.37],[-152.02,546.02],[-151.99,546.66],[-152,547.31],[-152.04,547.95],[-152.12,548.58],[-152.26,549.21],[-152.48,549.81],[-152.84,550.35],[-153.49,550.58],[-153.84,550.43]],[[-147.71,540.64],[-147.13,540.26],[-146.54,540.44],[-146.07,540.97],[-145.74,541.57],[-145.5,542.19],[-145.32,542.82],[-145.17,543.47],[-145.06,544.11],[-144.99,544.76],[-144.94,545.4],[-144.92,546.05],[-144.93,546.7],[-144.98,547.34],[-145.06,547.98],[-145.18,548.61],[-145.37,549.23],[-145.63,549.83],[-146.05,550.35],[-146.76,550.48],[-146.98,550.36]],[[-140.35,541.1],[-139.74,540.73],[-139.17,540.91],[-138.73,541.43],[-138.45,542.03],[-138.25,542.65],[-138.11,543.29],[-138.01,543.93],[-137.95,544.57],[-137.91,545.22],[-137.91,545.87],[-137.94,546.51],[-138,547.16],[-138.09,547.8],[-138.21,548.44],[-138.38,549.08],[-138.61,549.7],[-138.91,550.29],[-139.37,550.81],[-139.96,550.97],[-140.3,550.82]],[[-133.01,541.57],[-132.4,541.2],[-131.83,541.38],[-131.39,541.9],[-131.11,542.5],[-130.91,543.12],[-130.77,543.76],[-130.67,544.4],[-130.61,545.04],[-130.57,545.69],[-130.57,546.34],[-130.6,546.98],[-130.66,547.63],[-130.75,548.27],[-130.87,548.91],[-131.04,549.55],[-131.27,550.17],[-131.57,550.76],[-132.03,551.28],[-132.62,551.44],[-132.96,551.29]]];
// prettier-ignore
const SHADOWS: { c: Pt; m: number[] }[] = [{"c":[-173.59,552.11],"m":[0.004,-0.7839,0.7839,0.004,-375.1196,79.2832]},{"c":[-174.35,542.27],"m":[0.004,-0.7839,0.7839,0.004,-375.8805,69.4524]},{"c":[-168.78,541.44],"m":[0.004,-0.7839,0.7839,0.004,-370.3086,68.6168]},{"c":[-167.11,551.11],"m":[0.004,-0.7839,0.7839,0.004,-368.6397,78.2903]},{"c":[-160.3,550.82],"m":[0.004,-0.7839,0.7839,0.004,-361.8294,78.0015]},{"c":[-161.82,541.15],"m":[0.004,-0.7839,0.7839,0.004,-363.3487,68.3284]},{"c":[-154.69,540.65],"m":[0.004,-0.7839,0.7839,0.004,-356.2197,67.824]},{"c":[-153.5,550.21],"m":[0.004,-0.7839,0.7839,0.004,-355.0293,77.3885]},{"c":[-146.64,550.46],"m":[0.004,-0.7839,0.7839,0.004,-348.1695,77.6395]},{"c":[-147.4,540.79],"m":[0.004,-0.7839,0.7839,0.004,-348.9298,67.9693]},{"c":[-147.35,540.68],"m":[0.004,-0.7839,0.7839,0.004,-348.8796,67.8617]},{"c":[-140,541.1],"m":[0.004,-0.7839,0.7839,0.004,-341.5295,68.2775]},{"c":[-140,550.71],"m":[0.004,-0.7839,0.7839,0.004,-341.5282,77.8888]},{"c":[-132.44,551.13],"m":[0.004,-0.7839,0.7839,0.004,-333.9686,78.3052]},{"c":[-132.72,541.95],"m":[0.004,-0.7839,0.7839,0.004,-334.2494,69.125]}];

// Center line of the ball (it is very slightly tilted in the original)
const centerY = (x: number) => 573.8 + 0.0063 * (x + 155);

// Radius of the ball's cross-section at x
const radius = (x: number) => {
	const u = ((x - X0) / (X1 - X0)) * (RADII.length - 1);
	const i = Math.max(0, Math.min(RADII.length - 2, Math.floor(u)));
	const frac = u - i;
	return RADII[i]! * (1 - frac) + RADII[i + 1]! * frac;
};

// 2D point on the drawing -> angle around the ball's axis (0 = facing viewer)
const toAngle = ([x, y]: Pt) => {
	const r = radius(x);
	return r > 0 ? Math.asin(Math.max(-1, Math.min(1, (y - centerY(x)) / r))) : 0;
};

type SurfacePt = [x: number, angle: number];
const lift = (pts: Pt[]): SurfacePt[] => pts.map((p) => [p[0], toAngle(p)]);

// The seam along the bottom of the ball: the half of the original SVG's seam
// path that goes from the right tip, under the ball, to the left tip. It's two
// cubic Bezier curves, given here as absolute points [start, control 1,
// control 2, end].
const SEAM_BOTTOM_CURVES: [Pt, Pt, Pt, Pt][] = [
	[
		[-76.291, 574.2],
		[-75.76, 590.76],
		[-119.42, 605.3],
		[-155.28, 604.04],
	],
	[
		[-155.28, 604.04],
		[-191.57, 602.79],
		[-233.94, 583.4],
		[-233.95, 573.4],
	],
];
const SEAM_BOTTOM = SEAM_BOTTOM_CURVES.flatMap(([p0, p1, p2, p3], i) => {
	const N = 48;
	const pts: Pt[] = [];
	// Skip the first point of the second curve, since it's the end of the first
	for (let k = i === 0 ? 0 : 1; k <= N; k++) {
		const t = k / N;
		const u = 1 - t;
		const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
		pts.push([
			b[0] * p0[0] + b[1] * p1[0] + b[2] * p2[0] + b[3] * p3[0],
			b[0] * p0[1] + b[1] * p1[1] + b[2] * p2[1] + b[3] * p3[1],
		]);
	}
	return pts;
});

// The ball turns at a constant speed, but pretends its surface is only
// CIRCUMFERENCE radians around (less than 2pi), so the laces spend less of each
// turn hidden. A feature that reaches the far back jumps ahead to the other
// side, which is always out of sight, since it happens more than 90 degrees
// from the front. Only the front half (pi) is visible, so the laces are hidden
// for 1 - pi / CIRCUMFERENCE of each turn.
const CIRCUMFERENCE =
	Math.PI / (1 - Math.min(0.5, Math.max(0.05, CONFIG.hiddenFraction)));

// Angle of a surface point (0 = facing the viewer) after turning by phase,
// wrapped into -CIRCUMFERENCE / 2 to CIRCUMFERENCE / 2
const turn = (angle: number, phase: number) => {
	const a = angle + phase;
	return a - CIRCUMFERENCE * Math.round(a / CIRCUMFERENCE);
};

// Angle of a seam at the middle of the ball, where it's farthest from the tips
const seamAngle = (seam: SurfacePt[]) => {
	const middle = (X0 + X1) / 2;
	return seam.reduce((best, p) =>
		Math.abs(p[0] - middle) < Math.abs(best[0] - middle) ? p : best,
	)[1];
};

// Seams running from tip to tip: the two in the original drawing, plus one on
// the back, spaced evenly between them on the shortened circumference so the
// seams pass by at a steady rhythm. A real football has a fourth, but with the
// shortened circumference, three are already about as far apart on the back as
// the front two.
const seamTop = lift(SEAM_TOP);
const seamBottom = lift(SEAM_BOTTOM);
const backSeamOffset =
	(CIRCUMFERENCE - (seamAngle(seamBottom) - seamAngle(seamTop))) / 2;
const seams = [
	seamTop,
	seamBottom,
	seamBottom.map(([x, angle]): SurfacePt => [x, angle + backSeamOffset]),
];
const backboneBase = lift(LACE_BACKBONE);
const stitchesBase = STITCHES.map(lift);
const shadows = SHADOWS.map((s) => ({ ...s, angle: toAngle(s.c) }));

// Middle of the ball along its axis. The original laces are off center by a
// few units; shift them so they sit in the middle, between the stripes.
const MIDDLE = (X0 + X1) / 2;
const laceXs = backboneBase.map(([x]) => x);
const LACE_SHIFT = MIDDLE - (Math.min(...laceXs) + Math.max(...laceXs)) / 2;
const shiftLaces = (pts: SurfacePt[]): SurfacePt[] =>
	pts.map(([x, a]) => [x + LACE_SHIFT, a]);
const backbone = shiftLaces(backboneBase);
const stitches = stitchesBase.map(shiftLaces);

// Point on the surface (x along the ball, angle around it) -> 2D drawing
const project = (x: number, ang: number): Pt => {
	const r = radius(x);
	return [x + CONFIG.curve * r * Math.cos(ang), centerY(x) + r * Math.sin(ang)];
};

// The visible parts of a curve on the surface, turned by phase
const surfaceLines = (pts: SurfacePt[], phase: number) => {
	const lines: Pt[][] = [];
	let line: Pt[] | undefined;
	for (const [x, a] of pts) {
		const ang = turn(a, phase);
		if (Math.cos(ang) > 0) {
			if (!line) {
				line = [];
				lines.push(line);
			}
			line.push(project(x, ang));
		} else {
			line = undefined;
		}
	}
	return lines;
};

// 0 at the edge of the ball, 1 once edgeFade degrees onto the front
const edgeOpacity = (ang: number) =>
	Math.max(
		0,
		Math.min(1, Math.cos(ang) / Math.sin((CONFIG.edgeFade * Math.PI) / 180)),
	);

// Opacity for a group of points: fades with the point nearest the edge
const groupOpacity = (pts: SurfacePt[], phase: number) =>
	Math.min(...pts.map(([, a]) => edgeOpacity(turn(a, phase))));

const BODY_PATH =
	"M-154.88 526.72c42.6-.91 78.679 29.96 78.589 47.48-.087 17.1-33.639 46.68-77.239 46.68-43.29 0-79.84-31.66-80.42-47.48-.59-15.83 36.47-45.77 79.07-46.68z";

// One stripe: the visible half of the ring between x = a and x = b
const stripePoints = (a: number, b: number) => {
	const N = 48;
	const pts: Pt[] = [];
	for (let i = 0; i <= N; i++) {
		pts.push(project(a, -Math.PI / 2 + (Math.PI * i) / N));
	}
	for (let i = N; i >= 0; i--) {
		pts.push(project(b, -Math.PI / 2 + (Math.PI * i) / N));
	}
	return pts;
};

// The stripes don't move, so they're the same in every frame
const STRIPES_PATH = (() => {
	const { stripeInner: inner, stripeWidth: width } = CONFIG;
	return pathData(
		[
			stripePoints(MIDDLE - inner - width, MIDDLE - inner),
			stripePoints(MIDDLE + inner, MIDDLE + inner + width),
		],
		{ closed: true },
	);
})();

const OUTLINE_PATH =
	"M-154.94 524.72c-21.75.46-41.97 8.29-56.78 18.06-7.4 4.89-13.46 10.27-17.69 15.53-4.22 5.26-6.7 10.4-6.53 15.16.18 4.7 2.82 9.89 7.16 15.28 4.34 5.39 10.45 10.92 17.9 15.97 14.92 10.09 35.21 18.15 57.35 18.16 22.25 0 41.9-7.54 56.061-17.29 14.166-9.75 23.137-21.52 23.188-31.37.026-5.07-2.458-10.6-6.657-16.16-4.198-5.56-10.177-11.15-17.5-16.15-14.642-10.01-34.702-17.66-56.502-17.19zm.1 4c20.8-.44 40.1 6.89 54.12 16.47 7.012 4.79 12.722 10.15 16.595 15.28 3.873 5.13 5.863 10.03 5.844 13.72-.037 7.24-7.905 18.81-21.438 28.12-13.531 9.32-32.461 16.57-53.811 16.57-21.16-.01-40.76-7.78-55.09-17.47-7.17-4.85-13.01-10.16-17.04-15.16-4.03-5-6.19-9.72-6.31-12.94-.12-3.15 1.8-7.66 5.69-12.5 3.89-4.83 9.67-9.99 16.78-14.69 14.23-9.38 33.81-16.96 54.66-17.4z";

// Gradients, and the shapes that don't move: the ball, stripes, outline and
// each lace shadow (which moves, but always has the same shape)
const defs = (colors: FootballColors) =>
	`<linearGradient id="b"><stop stop-color="#722e00" offset="0"/><stop stop-color="#722e00" offset=".5"/><stop stop-color="#722e00" stop-opacity="0" offset="1"/></linearGradient><linearGradient id="a"><stop style="stop-color:${colors.stripes[0]}" offset="0"/><stop style="stop-color:${colors.stripes[1]}" offset="1"/></linearGradient><linearGradient id="c" href="#a" gradientUnits="userSpaceOnUse" gradientTransform="translate(123.92 444.08) scale(.42762)" x1="-746.71" y1="401.66" x2="-746.71" y2="273.73"/><radialGradient id="e" href="#b" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 1.2 0 -52.03)" cx="-601.8" cy="260.15" r="2.525"/><clipPath id="clip"><path d="${BODY_PATH}"/></clipPath><path id="ball" style="fill:${colors.ball}" d="${BODY_PATH}"/><path id="stripes" fill="url(#c)" d="${STRIPES_PATH}"/><path id="outline" d="${OUTLINE_PATH}"/>${shadows
		.map(
			(s, i) =>
				`<ellipse id="s${i}" fill="url(#e)" cx="-601.798" cy="260.15" rx="2.525" ry="3.03" transform="matrix(${s.m.join(" ")})"/>`,
		)
		.join("")}`;

// Square viewBox around the original 128.493 x 127.15 drawing
const VIEWBOX: [number, number, number] = [0, -0.67, 128.493];

// t = fraction of a full turn (0 to 1)
const frame = (colors: FootballColors, t: number) => {
	// Frame 0 matches the original drawing
	const phase = CONFIG.direction * CIRCUMFERENCE * t;
	// Unique within the sprite sheet
	const id = `k${Math.round(t * 1000)}`;

	// The seams are long, smooth curves, so whole-unit coordinates are plenty.
	// The laces are small, so they keep 1 decimal, since rounding them to whole
	// units visibly distorts their shape.
	const seamPath = pathData(
		seams.flatMap((s) => surfaceLines(s, phase)),
		{ decimals: 0 },
	);

	// The line under the laces, drawn twice (wide and light, then thin and dark)
	const backboneOpacity = groupOpacity(backbone, phase);
	const backboneEl =
		backboneOpacity > 0
			? `<path id="${id}" d="${pathData(surfaceLines(backbone, phase))}"/>`
			: "";

	const shadowEls = shadows
		.map((s, i) => {
			const ang = turn(s.angle, phase);
			const op = edgeOpacity(ang);
			if (op <= 0) {
				return "";
			}
			// Move the shadow to its new spot and squash it as it turns away
			const [cx, cy] = s.c;
			const [nx, ny] = project(cx + LACE_SHIFT, ang);
			const k = Math.max(
				0.05,
				Math.cos(ang) / Math.max(0.05, Math.cos(s.angle)),
			);
			return `<use href="#s${i}"${op < 1 ? ` opacity="${num(op)}"` : ""} transform="translate(${num(nx, 1)} ${num(ny, 1)}) scale(1 ${num(k)}) translate(${num(-cx, 1)} ${num(-cy, 1)})"/>`;
		})
		.join("");

	// Laces. The fully visible ones are combined into one path, and the ones
	// fading out near the edge each get their own opacity.
	const solid: Pt[][] = [];
	let fading = "";
	for (const s of stitches) {
		const op = groupOpacity(s, phase);
		if (op <= 0) {
			continue;
		}
		const lines = surfaceLines(s, phase);
		if (op === 1) {
			solid.push(...lines);
		} else {
			fading += `<path opacity="${num(op)}" d="${pathData(lines)}"/>`;
		}
	}

	return `<g transform="rotate(-45 -660.87 54.697)"><use href="#ball"/><g clip-path="url(#clip)"><path fill="none" style="stroke:${colors.seam}" stroke-width=".855" stroke-linecap="round" d="${seamPath}"/><use href="#stripes"/>${
		backboneEl
			? `<g opacity="${num(backboneOpacity)}" fill="none" stroke-linecap="round"><defs>${backboneEl}</defs><use href="#${id}" style="stroke:${colors.laceBackbone}" stroke-width="4.276"/><use href="#${id}" stroke="#722e00" stroke-width=".47"/></g>`
			: ""
	}${shadowEls}<g fill="none" style="stroke:${colors.laces}" stroke-width="2.095" stroke-linecap="round" stroke-linejoin="round">${solid.length > 0 ? `<path d="${pathData(solid)}"/>` : ""}${fading}</g></g><use href="#outline"/></g>`;
};

export const football = ({
	colors,
	filename,
}: SpinnerOptions<FootballColors>) =>
	renderSpinner({
		colors,
		defs,
		filename,
		frame,
		sport: "football",
		viewBox: VIEWBOX,
	});
