import { statSync } from "fs";
import yoctocolors from "yoctocolors";
import { Spinners } from "./Spinners.ts";
import watchCSS from "./watchCSS.ts";
import watchFiles from "./watchFiles.ts";
import watchJS from "./watchJS.ts";
import watchJSONSchema from "./watchJSONSchema.ts";

const TIME_CUTOFF_SPIN_1 = 1_000;
const TIME_CUTOFF_SPIN_2 = 5_000;
const TIME_CUTOFF_SUCCESS_1 = 10_000;
const TIME_CUTOFF_SUCCESS_2 = 30_000;

const spinners = new Spinners(
	({ key, info, symbol }) => {
		const symbolAndText = `${symbol} ${key}`;

		if (info.status === "spin") {
			const dateStart = info.dateStart;
			const millisecondsElapsed = Date.now() - dateStart.getTime();
			const time = dateStart.toLocaleTimeString();
			let coloredTime;
			if (millisecondsElapsed > TIME_CUTOFF_SPIN_2) {
				coloredTime = yoctocolors.red(time);
			} else if (millisecondsElapsed > TIME_CUTOFF_SPIN_1) {
				coloredTime = yoctocolors.yellow(time);
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
				coloredTime = yoctocolors.green(time);
			} else if (millisecondsElapsed < TIME_CUTOFF_SUCCESS_2) {
				coloredTime = yoctocolors.yellow(time);
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

const updateStart = (filename: string) => {
	spinners.setStatus(filename, {
		status: "spin",
	});
};

const updateEnd = (filename: string) => {
	let size;
	if (filename !== "static files") {
		size = statSync(filename).size;
	}

	spinners.setStatus(filename, {
		status: "success",
		size,
	});
};

const updateError = (filename: string, error: Error) => {
	spinners.setStatus(filename, {
		status: "error",
		error,
	});
};

// Needs to run first, to create output folder
watchFiles(updateStart, updateEnd, updateError);

// Schema is needed for JS bunlde, and watchJSONSchema is async
watchJSONSchema(updateStart, updateEnd, updateError).then(() => {
	watchJS(updateStart, updateEnd, updateError);
});

watchCSS(updateStart, updateEnd, updateError);
