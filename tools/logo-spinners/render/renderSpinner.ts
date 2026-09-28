import { spawn } from "node:child_process";
import { once } from "node:events";
import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";

const FPS = 30;
const CRF = 32; // AV1 quality (lower = better/bigger)

// Options shared by every sport's render function
export type SpinnerOptions = {
	colors: [string, string];
	filename: string;
	size: number;
};

// Spawn ffmpeg reading raw RGBA frames from stdin. write() respects
// backpressure, and if ffmpeg dies early, its exit error is reported rather
// than an EPIPE from stdin.
const startEncoder = (size: number, outArgs: string[]) => {
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
			String(FPS),
			"-i",
			"-",
			...outArgs,
		],
		{ stdio: ["pipe", "inherit", "inherit"] },
	);

	const done = new Promise<void>((resolve, reject) => {
		proc.on("error", reject);
		proc.on("close", (code: number | null) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`ffmpeg exited with ${code}`));
			}
		});
	});

	// Ignore stdin errors (EPIPE); the close handler above reports the failure
	proc.stdin.on("error", () => {});

	return {
		write: async (frame: Buffer) => {
			if (!proc.stdin.write(frame)) {
				// once() rejects on a stdin error, so fall back to done, which
				// rejects with ffmpeg's exit code
				await Promise.race([once(proc.stdin, "drain").catch(() => done), done]);
			}
		},
		end: async () => {
			proc.stdin.end();
			await done;
		},
	};
};

// Render one loop of an animation to an animated AVIF. frameSvg gets t, the
// fraction of the loop (0 to 1), and must return an SVG with a square viewBox.
export const renderSpinner = async ({
	duration,
	filename,
	frameSvg,
	size,
}: {
	duration: number; // [seconds]
	filename: string;
	frameSvg: (t: number) => string;
	size: number;
}) => {
	const numFrames = Math.round(FPS * duration);

	// AVIF: color and alpha are encoded as two AV1 streams in one file. resvg
	// outputs premultiplied alpha, but ffmpeg treats rgba input as straight alpha,
	// so unpremultiply first to avoid dark fringes on semi-transparent edges.
	const encoder = startEncoder(size, [
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
		"-cpu-used",
		"4",
		"-loop",
		"0",
		"-f",
		"avif",
		filename,
	]);

	for (let i = 0; i < numFrames; i++) {
		const png = new Resvg(frameSvg(i / numFrames), {
			fitTo: { mode: "width", value: size },
		}).render();
		if (png.width !== size || png.height !== size) {
			throw new Error(
				`Rendered frame is ${png.width}x${png.height}, expected ${size}x${size}`,
			);
		}
		await encoder.write(Buffer.from(png.pixels));
	}
	await encoder.end();

	console.log(`Wrote ${filename} (${numFrames} frames, ${size}px)`);
};
