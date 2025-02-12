// Based on yocto-spinner https://github.com/sindresorhus/yocto-spinner v0.1.2 - MIT License - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

import process from "node:process";
import type { WriteStream } from "node:tty";
import { stripVTControlCharacters, styleText } from "node:util";

const isUnicodeSupported =
	process.platform !== "win32" || Boolean(process.env.WT_SESSION);

const isInteractive = (stream: WriteStream) =>
	Boolean(
		stream.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env),
	);

const successSymbol = styleText("green", isUnicodeSupported ? "✔" : "√");
const errorSymbol = styleText("red", isUnicodeSupported ? "✖" : "×");

const frames = (
	isUnicodeSupported
		? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
		: ["-", "\\", "|", "/"]
).map((frame) => styleText("cyan", frame));

const interval = 80;

type Info =
	| {
			status: "spin";
			dateStart: Date;
	  }
	| {
			status: "success";
			dateStart: Date;
			dateEnd: Date;
			size: number | undefined;
	  }
	| {
			status: "error";
			error: Error;
	  };

type RenderKey<Key> = ({
	key,
	info,
	symbol,
}: {
	key: Key;
	info: Info;
	symbol: string;
}) => string;

type ExtraRenderDelays = Partial<Record<"error" | "success", number[]>>;

class Spinners<Key extends string = string> {
	private currentFrame = -1;
	private timer: NodeJS.Timeout | undefined;
	private stream = process.stderr;
	private lines = 0;
	private isInteractive;
	private lastSpinnerFrameTime = 0;

	// When true, setInterval is rendering frequently because there is a spinner going. Otherwise, there is no rendering happening until a status changes.
	private rendering = false;

	// If defined, this will trigger another render some number of milliseconds after an event. This is to handle the case when rendering has stopped (no init/spin, all success/error) but renderKey changes with time.
	private extraRenderDelays: ExtraRenderDelays | undefined;

	private keys: Key[] = [];
	private info: Record<Key, Info | undefined> = {} as any;
	private renderKey: RenderKey<Key>;

	constructor(
		renderKey: RenderKey<Key>,
		extraRenderDelays?: ExtraRenderDelays,
	) {
		this.renderKey = renderKey;
		this.extraRenderDelays = extraRenderDelays;
		this.isInteractive = isInteractive(this.stream);

		const exitHandlerBound = this.exitHandler.bind(this);
		process.once("SIGINT", exitHandlerBound);
		process.once("SIGTERM", exitHandlerBound);
	}

	private startRendering() {
		if (this.rendering) {
			return;
		}

		this.rendering = true;

		this.hideCursor();
		this.render();

		this.timer = setInterval(() => {
			this.render();
		}, interval);
	}

	private stopRendering() {
		if (!this.rendering) {
			return;
		}

		this.rendering = false;

		clearInterval(this.timer);
		this.timer = undefined;
	}

	setStatus(
		key: Key,
		info:
			| {
					status: "spin";
			  }
			| {
					status: "success";
					size: number | undefined;
			  }
			| {
					status: "error";
					error: Error;
			  },
	) {
		const oldInfo = this.info[key];

		if (info.status === "spin") {
			if (!this.keys.includes(key)) {
				// First event from this key
				this.keys.push(key);
			}

			this.info[key] = {
				status: "spin",
				dateStart: new Date(),
			};
		} else if (info.status === "success") {
			this.info[key] = {
				status: "success",
				dateStart:
					!oldInfo || oldInfo.status === "error"
						? new Date()
						: oldInfo.dateStart,
				dateEnd: new Date(),
				size: info.size,
			};
		} else {
			this.info[key] = {
				status: "error",
				error: info.error,
			};
		}

		// If no statuses are spinning, stop rendering. Or if now a status is spinning, start rendering.
		if (
			this.keys.every((key) => {
				const status = this.info[key]?.status;
				return status !== "spin";
			})
		) {
			this.stopRendering();
		} else {
			this.startRendering();
		}

		// If we aren't already rendering in a loop, draw this update
		if (!this.rendering) {
			this.render();
		}

		if (info.status !== "spin") {
			const delays = this.extraRenderDelays?.[info.status];
			if (delays) {
				for (const delay of delays) {
					setTimeout(() => {
						if (!this.rendering) {
							this.render();
						}
					}, delay);
				}
			}
		}
	}

	private clear() {
		if (!this.isInteractive) {
			return this;
		}

		this.stream.cursorTo(0);

		for (let index = 0; index < this.lines; index++) {
			if (index > 0) {
				this.stream.moveCursor(0, -1);
			}

			this.stream.clearLine(1);
		}

		this.lines = 0;

		return this;
	}

	private render() {
		// Ensure we only update the spinner frame at the wanted interval,
		// even if the frame method is called more often.
		const now = Date.now();
		if (
			this.currentFrame === -1 ||
			now - this.lastSpinnerFrameTime >= interval
		) {
			this.currentFrame = ++this.currentFrame % frames.length;
			this.lastSpinnerFrameTime = now;
		}

		let string = this.keys
			.map((key) => {
				const info = this.info[key]!;

				let symbol: string;
				if (info.status === "error") {
					symbol = errorSymbol;
				} else if (info.status === "success") {
					symbol = successSymbol;
				} else {
					symbol = frames[this.currentFrame];
				}

				return this.renderKey({
					key,
					info,
					symbol,
				});
			})
			.join("\n");

		string += "\n";

		this.clear();
		this.write(string);

		if (this.isInteractive) {
			this.lines = this.lineCount(string);
		}
	}

	private write(text: string) {
		this.stream.write(text);
	}

	private lineCount(text: string) {
		const width = this.stream.columns ?? 80;
		const lines = stripVTControlCharacters(text).split("\n");

		let lineCount = 0;
		for (const line of lines) {
			lineCount += Math.max(1, Math.ceil(line.length / width));
		}

		return lineCount;
	}

	private hideCursor() {
		if (this.isInteractive) {
			this.write("\u001B[?25l");
		}
	}

	private showCursor() {
		if (this.isInteractive) {
			this.write("\u001B[?25h");
		}
	}

	private exitHandler(signal: NodeJS.Signals) {
		// Restore hidden cursor before exit, or it stays hidden after!
		this.showCursor();

		// This guarantees no more rendering after exit
		// SIGINT: 128 + 2
		// SIGTERM: 128 + 15
		const exitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1;
		process.exit(exitCode);
	}
}

const TIME_CUTOFF_SPIN_1 = 1000;
const TIME_CUTOFF_SPIN_2 = 5000;
const TIME_CUTOFF_SUCCESS_1 = 10_000;
const TIME_CUTOFF_SUCCESS_2 = 30_000;

export const spinners = new Spinners(
	({ key, info, symbol }) => {
		const symbolAndText = `${symbol} ${key}`;

		if (info.status === "spin") {
			const dateStart = info.dateStart;
			const millisecondsElapsed = Date.now() - dateStart.getTime();
			const time = dateStart.toLocaleTimeString();
			let coloredTime;
			if (millisecondsElapsed > TIME_CUTOFF_SPIN_2) {
				coloredTime = styleText("red", time);
			} else if (millisecondsElapsed > TIME_CUTOFF_SPIN_1) {
				coloredTime = styleText("yellow", time);
			} else {
				coloredTime = time;
			}

			return `${symbolAndText}: build started at ${coloredTime}`;
		}
		if (info.status === "error") {
			return `${symbolAndText} ${info.error.stack ?? "See error above from ESBuild"}`;
		}

		if (info.status === "success") {
			const { dateStart, dateEnd, size } = info;

			const duration = (dateEnd.getTime() - dateStart.getTime()) / 1000;
			const megabytes =
				size !== undefined ? (size / 1024 / 1024).toFixed(2) : undefined;

			const millisecondsElapsed = Date.now() - dateEnd.getTime();
			const time = dateEnd.toLocaleTimeString();
			let coloredTime;
			if (millisecondsElapsed < TIME_CUTOFF_SUCCESS_1) {
				coloredTime = styleText("green", time);
			} else if (millisecondsElapsed < TIME_CUTOFF_SUCCESS_2) {
				coloredTime = styleText("yellow", time);
			} else {
				coloredTime = time;
			}

			return `${symbolAndText}: ${megabytes !== undefined ? `${megabytes} MB in ` : ""}${duration} seconds at ${coloredTime}`;
		}

		return symbolAndText;
	},
	{
		// Don't need to pass "spin" ones because it's always rendering while spinning
		success: [TIME_CUTOFF_SUCCESS_1, TIME_CUTOFF_SUCCESS_2],
	},
);
