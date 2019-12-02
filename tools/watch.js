const fs = require("fs");
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

const render = () => {
	if (Object.keys(files).length >= 5) {
		const outputs = Object.entries(files).map(([filename, info]) => {
			if (info.building) {
				return `${filename}: build started at ${info.dateStart.toLocaleTimeString()}`;
			}

			const duration = (info.dateEnd - info.dateStart) / 1000;
			const megabytes = (info.size / 1024 / 1024).toFixed(2);

			return `${filename}: ${megabytes} MB in ${duration} seconds at ${info.dateEnd.toLocaleTimeString()}`;
		});

		logUpdate(outputs.join("\n"));
	}
};

const addFile = filename => {
	if (files[filename]) {
		throw new Error(`Duplicate file name "${filename}"`);
	}

	files[filename] = {
		building: true,
		dateStart: new Date(),
		dateEnd: new Date(),
		size: 0,
	};
};

const updateStart = filename => {
	files[filename] = {
		...files[filename],
		building: true,
		dateStart: new Date(),
	};

	render();
};

const updateEnd = filename => {
	const { size } = fs.statSync(filename);

	files[filename] = {
		...files[filename],
		building: false,
		dateEnd: new Date(),
		size,
	};

	render();
};

// This will complete its initial write before watchJS runs, which is good because then the schema
// file will be available to be included in the JS bundle.
watchJSONSchema(addFile, updateStart, updateEnd);

watchJS(addFile, updateStart, updateEnd);

// Since watchJS is async, this will run in parallel
watchCSS(addFile, updateStart, updateEnd);
