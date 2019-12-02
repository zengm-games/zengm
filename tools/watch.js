const chalk = require("chalk");
const fs = require("fs");
const logSymbols = require("log-symbols");
const logUpdate = require("log-update");
const build = require("./lib/buildFuncs");
const watchCSS = require("./lib/watchCSS");
const watchJS = require("./lib/watchJS");
const watchJSONSchema = require("./lib/watchJSONSchema");

build.reset();
build.copyFiles();

// Remove service worker, so I don't have to deal with it being wonky in dev
fs.unlinkSync("build/sw.js");

const rev = build.genRev();
build.setTimestamps(rev, true);

const files = {};

let doRender = false;

const updateStart = filename => {
	if (!files[filename]) {
		files[filename] = {
			building: true,
			dateStart: new Date(),
			dateEnd: new Date(),
			error: undefined,
			size: 0,
			spinnerIndex: -1,
		};
	} else {
		files[filename] = {
			...files[filename],
			building: true,
			dateStart: new Date(),
			error: undefined,
			spinnerIndex: -1,
		};
	}
	doRender = true;
};

const updateEnd = filename => {
	const { size } = fs.statSync(filename);

	files[filename] = {
		...files[filename],
		building: false,
		dateEnd: new Date(),
		error: undefined,
		size,
	};
};

const updateError = (filename, error) => {
	files[filename] = {
		...files[filename],
		building: false,
		dateEnd: new Date(),
		error,
	};
	doRender = true;
};

// This will complete its initial write before watchJS runs, which is good because then the schema
// file will be available to be included in the JS bundle.
watchJSONSchema(updateStart, updateEnd, updateError);

watchJS(updateStart, updateEnd, updateError);

// Since watchJS is async, this will run in parallel
watchCSS(updateStart, updateEnd, updateError);

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const TIME_CUTOFF_GREEN = 10000; // 10 seconds
const TIME_CUTOFF_YELLOW = 30000; // 30 seconds

const render = () => {
	if (!doRender) {
		return;
	}

	let numCompletelyDone = 0;

	const outputs = Object.entries(files).map(([filename, info]) => {
		if (info.error) {
			return `${logSymbols.error} ${filename}: ${info.error.stack}`;
		}

		const time = (info.building
			? info.dateStart
			: info.dateEnd
		).toLocaleTimeString();
		const numMillisecondsSinceTime = new Date() - info.dateEnd;
		let coloredTime;
		if (numMillisecondsSinceTime < TIME_CUTOFF_GREEN) {
			if (info.building) {
				coloredTime = time;
			} else {
				coloredTime = chalk.green(time);
			}
		} else if (numMillisecondsSinceTime < TIME_CUTOFF_YELLOW) {
			coloredTime = chalk.yellow(time);
		} else {
			// eslint-disable-next-line no-lonely-if
			if (info.building) {
				coloredTime = chalk.red(time);
			} else {
				coloredTime = time;
			}
		}

		if (info.building) {
			info.spinnerIndex = (info.spinnerIndex + 1) % spinnerFrames.length;
			return `${chalk.yellow(
				spinnerFrames[info.spinnerIndex],
			)} ${filename}: build started at ${coloredTime}`;
		}

		const duration = (info.dateEnd - info.dateStart) / 1000;
		const megabytes = (info.size / 1024 / 1024).toFixed(2);

		if (numMillisecondsSinceTime > TIME_CUTOFF_YELLOW) {
			numCompletelyDone += 1;
		}

		return `${logSymbols.success} ${filename}: ${megabytes} MB in ${duration} seconds at ${coloredTime}`;
	});

	logUpdate(outputs.join("\n"));

	if (numCompletelyDone === outputs.length) {
		doRender = false;
	}
};
setInterval(render, 80);
