//   node tools/logo-spinners/basketball.ts [--size 128] [--fps 30] [--duration 4] [--out bbgm-spinner] [--crf 32]
//
// --size is in pixels; use 2x the display size for sharp results on high-DPI
// screens. --crf is AV1 quality (lower = better/bigger).

import { spawn } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";

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
	] as const,

	// Rotation axis in screen space (x right, y down, z toward viewer).
	// [0, 1, 0] = spin around the vertical axis.
	axis: [0, 1, 0] as [number, number, number],

	// 1 = front of the ball moves right, -1 = left
	direction: 1,

	strokeWidth: 4.924,
	gradient: ["#ffd52a", "#ff7f2a"],

	// Points per seam. More = smoother curves, bigger SVG (only matters for the
	// intermediate SVG, not the output image).
	samples: 120,
};

type Vec3 = [number, number, number];

// Geometry of the original logo SVG (viewBox units)
const VIEWBOX = "0 0 252.263 251.88";
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
			seams[k]!.push(
				orient.map((r) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2]) as Vec3,
			);
		});
	}
	return seams;
};

// Rodrigues rotation of v around unit axis k by angle th
const rotate = (v: Vec3, k: Vec3, th: number): Vec3 => {
	const c = Math.cos(th);
	const s = Math.sin(th);
	const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
	const cross: Vec3 = [
		k[1] * v[2] - k[2] * v[1],
		k[2] * v[0] - k[0] * v[2],
		k[0] * v[1] - k[1] * v[0],
	];
	return ([0, 1, 2] as const).map(
		(i) => v[i] * c + cross[i] * s + k[i] * dot * (1 - c),
	) as Vec3;
};

// SVG path of the visible (front-facing) half of the seams, rotated by th
const seamPath = (seams: Vec3[][], th: number) => {
	const len = Math.hypot(...CONFIG.axis);
	const axis = CONFIG.axis.map((v) => v / len) as Vec3;
	const f = (v: number) => v.toFixed(2);
	let d = "";
	for (const seam of seams) {
		let prev: Vec3 | undefined;
		let first = true;
		for (const p0 of seam) {
			const p = rotate(p0, axis, th);
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

const frameSvg = (seams: Vec3[][], th: number) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"><defs><linearGradient id="a"><stop offset="0" stop-color="${CONFIG.gradient[0]}"/><stop offset="1" stop-color="${CONFIG.gradient[1]}"/></linearGradient><radialGradient href="#a" xlink:href="#a" xmlns:xlink="http://www.w3.org/1999/xlink" id="b" cx="362.177" cy="386.004" r="126.131" gradientTransform="matrix(1.13773 .88039 -.61106 .78967 186 -238)" gradientUnits="userSpaceOnUse"/></defs><g stroke="#000" stroke-width="${CONFIG.strokeWidth}" fill="none"><path fill="url(#b)" d="M290.079 500.005c-30.113-61.16-4.838-135.198 56.417-165.265 61.255-30.066 135.41-4.83 165.522 56.33 30.113 61.16 4.838 135.199-56.417 165.265-61.2 30.039-135.271 4.89-165.444-56.171" transform="translate(-274.917 -319.599)"/><path stroke-linejoin="round" stroke-linecap="round" d="${seamPath(seams, th)}"/></g></svg>`;

const parseArgs = () => {
	const args = process.argv.slice(2);
	const get = (name: string, def: string) => {
		const i = args.indexOf(`--${name}`);
		return i >= 0 ? args[i + 1] : def;
	};
	return {
		size: Number(get("size", "128")),
		fps: Number(get("fps", "30")),
		duration: Number(get("duration", "4")),
		out: get("out", "bbgm-spinner"),
		crf: Number(get("crf", "32")),
		svgFrame: get("svg-frame", ""),
	};
};

// Pipe raw RGBA frames into ffmpeg
const encode = (
	frames: Buffer[],
	size: number,
	fps: number,
	outArgs: string[],
) =>
	new Promise<void>((resolve, reject) => {
		// ffmpeg-static's types resolve oddly under NodeNext; it is a path or null
		const ffmpeg = ffmpegPath as unknown as string | null;
		if (!ffmpeg) {
			throw new Error("ffmpeg-static has no binary for this platform");
		}
		const proc = spawn(
			ffmpeg,
			[
				"-y",
				"-loglevel",
				"error",
				"-f",
				"rawvideo",
				"-pix_fmt",
				"rgba",
				"-s",
				`${size}x${size}`,
				"-r",
				String(fps),
				"-i",
				"-",
				...outArgs,
			],
			{ stdio: ["pipe", "inherit", "inherit"] },
		);
		proc.on("error", reject);
		proc.on("close", (code: number | null) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`ffmpeg exited with ${code}`));
			}
		});
		for (const frame of frames) {
			proc.stdin.write(frame);
		}
		proc.stdin.end();
	});

const { size, fps, duration, out, crf, svgFrame } = parseArgs();
const seams = buildSeams();
const numFrames = Math.round(fps * duration);
const dir = CONFIG.direction;

if (svgFrame) {
	// Handy for checking a single frame: --svg-frame 0.25 (fraction of a turn)
	process.stdout.write(frameSvg(seams, dir * 2 * Math.PI * Number(svgFrame)));
	process.exit(0);
}

const frames: Buffer[] = [];
for (let i = 0; i < numFrames; i++) {
	const svg = frameSvg(seams, (dir * 2 * Math.PI * i) / numFrames);
	const png = new Resvg(svg, {
		fitTo: { mode: "width", value: size },
	}).render();
	frames.push(Buffer.from(png.pixels));
}

// AVIF: color and alpha are encoded as two AV1 streams in one file
await encode(frames, size, fps, [
	"-filter_complex",
	"[0:v]format=yuva444p,split[main][alpha];[alpha]alphaextract[alpha]",
	"-map",
	"[main]",
	"-map",
	"[alpha]",
	"-c:v",
	"libaom-av1",
	"-pix_fmt:0",
	"yuv420p",
	"-crf",
	String(crf),
	"-b:v",
	"0",
	"-cpu-used",
	"4",
	"-loop",
	"0",
	"-f",
	"avif",
	`${out}.avif`,
]);

console.log(`Wrote ${out}.avif (${numFrames} frames, ${size}px)`);
