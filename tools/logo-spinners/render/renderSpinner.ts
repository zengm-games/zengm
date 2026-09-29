import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";
import { getLogoSpinnerInfo } from "../../../common/logoSpinners.ts";
import type { Sport } from "../../lib/getSport.ts";

const CRF = 36; // AV1 quality (lower = better/bigger)

export type SpinnerOptions<Colors> = {
	colors: Colors;
	filename: string;
	size: number;
};

// Run ffmpeg with raw RGBA image data on stdin
const runFfmpeg = (args: string[], input: Buffer) =>
	new Promise<void>((resolve, reject) => {
		if (!ffmpegPath) {
			throw new Error("ffmpeg-static has no binary for this platform");
		}
		const proc = spawn(ffmpegPath, ["-y", "-loglevel", "error", ...args], {
			stdio: ["pipe", "inherit", "inherit"],
		});
		proc.on("error", reject);
		proc.on("close", (code: number | null) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`ffmpeg exited with ${code}`));
			}
		});
		// Ignore stdin errors (EPIPE); the close handler above reports the failure
		proc.stdin.on("error", () => {});
		proc.stdin.end(input);
	});

// Render one loop of an animation to a sprite sheet: a grid of frames, laid out
// as described in common/logoSpinners.ts. frameSvg gets t, the fraction of the
// loop (0 to 1), and must return an SVG with a square viewBox.
export const renderSpinner = async ({
	filename,
	frameSvg,
	size,
	sport,
}: {
	filename: string;
	frameSvg: (t: number) => string;
	size: number;
	sport: Sport;
}) => {
	const { cols, frames, rows } = getLogoSpinnerInfo(sport);
	const width = cols * size;
	const height = rows * size;
	const sheet = Buffer.alloc(width * height * 4);

	for (let i = 0; i < frames; i++) {
		const png = new Resvg(frameSvg(i / frames), {
			fitTo: { mode: "width", value: size },
		}).render();
		if (png.width !== size || png.height !== size) {
			throw new Error(
				`Rendered frame is ${png.width}x${png.height}, expected ${size}x${size}`,
			);
		}

		// Copy the frame into its cell, row by row
		const x0 = (i % cols) * size;
		const y0 = Math.floor(i / cols) * size;
		for (let y = 0; y < size; y++) {
			png.pixels.copy(
				sheet,
				((y0 + y) * width + x0) * 4,
				y * size * 4,
				(y + 1) * size * 4,
			);
		}
	}

	// AVIF: color and alpha are encoded as two AV1 images in one file. resvg
	// outputs premultiplied alpha, but ffmpeg treats rgba input as straight
	// alpha, so unpremultiply first to avoid dark fringes on semi-transparent
	// edges.
	await runFfmpeg(
		[
			"-f",
			"rawvideo",
			"-pix_fmt",
			"rgba",
			"-s",
			`${width}x${height}`,
			"-i",
			"-",
			"-filter_complex",
			"[0:v]unpremultiply=inplace=1,format=yuva444p,split[main][alpha];[alpha]alphaextract[alpha]",
			"-map",
			"[main]",
			"-map",
			"[alpha]",
			"-c:v",
			"libaom-av1",
			"-pix_fmt:0",
			"yuv444p",
			"-crf",
			String(CRF),
			"-b:v",
			"0",
			"-still-picture",
			"1",
			// Intra block copy lets the encoder reuse blocks from elsewhere in the
			// image. Most of each frame repeats in every cell of the sprite sheet,
			// so this makes the files about 15-20% smaller at the same quality.
			"-enable-intrabc",
			"1",
			"-aom-params",
			"tune-content=screen",
			// Multithreaded encoding gives slightly different output each run, so
			// regenerating would change every file in git even when nothing else
			// changed. One thread is about 2.5x slower, but deterministic.
			"-threads",
			"1",
			"-frames:v",
			"1",
			"-f",
			"avif",
			filename,
		],
		sheet,
	);

	const fileSize = (await fs.stat(filename)).size;
	const kilobytes = (fileSize / 1024).toFixed(2);

	console.log(
		`Wrote ${filename} (${frames} frames, ${cols}x${rows} grid, ${size}px, ${kilobytes} KB)`,
	);
};
