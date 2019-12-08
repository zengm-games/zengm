const fs = require("fs");
const { render, Box, Color } = require("ink");
const Spinner = require("ink-spinner").default;
const logSymbols = require("log-symbols");
const React = require("react");
const build = require("./lib/buildFuncs");
const watchCSS = require("./lib/watchCSS");
const watchJS = require("./lib/watchJS");
const watchJSONSchema = require("./lib/watchJSONSchema");

const { useEffect, useReducer } = React;

build.reset();
build.copyFiles();

// Remove service worker, so I don't have to deal with it being wonky in dev
fs.unlinkSync("build/sw.js");

const rev = build.genRev();
build.setTimestamps(rev, true);

const TIME_CUTOFF_GREEN = 10000; // 10 seconds
const TIME_CUTOFF_YELLOW = 30000; // 30 seconds

const reducer = (files, { type, filename, error }) => {
	switch (type) {
		case "start":
			if (!files[filename]) {
				return {
					...files,
					[filename]: {
						building: true,
						dateStart: new Date(),
						dateEnd: new Date(),
						error: undefined,
						size: 0,
					},
				};
			}
			return {
				...files,
				[filename]: {
					...files[filename],
					building: true,
					dateStart: new Date(),
					error: undefined,
				},
			};
		case "end": {
			const { size } = fs.statSync(filename);
			return {
				...files,
				[filename]: {
					...files[filename],
					building: false,
					dateEnd: new Date(),
					error: undefined,
					size,
				},
			};
		}
		case "error":
			return {
				...files,
				[filename]: {
					...files[filename],
					building: false,
					dateEnd: new Date(),
					error,
				},
			};
		default:
			throw new Error(`Unknown action type "${type}"`);
	}
};

/* eslint-disable react/prop-types */
const File = ({ filename, info }) => {
	if (info.error) {
		return `${logSymbols.error} ${filename}: ${info.error.stack}`;
	}

	const time = (info.building
		? info.dateStart
		: info.dateEnd
	).toLocaleTimeString();
	const numMillisecondsSinceTime = new Date() - info.dateEnd;

	const colorParams = {};

	if (numMillisecondsSinceTime < TIME_CUTOFF_GREEN) {
		if (!info.building) {
			colorParams.green = true;
		}
	} else if (numMillisecondsSinceTime < TIME_CUTOFF_YELLOW) {
		colorParams.yellow = true;
	} else {
		// eslint-disable-next-line no-lonely-if
		if (info.building) {
			colorParams.red = true;
		}
	}

	if (info.building) {
		return (
			<Box>
				<Color yellow>
					<Spinner type="dots" />
				</Color>{" "}
				{filename}: build started at <Color {...colorParams}>{time}</Color>
			</Box>
		);
	}

	const duration = (info.dateEnd - info.dateStart) / 1000;
	const megabytes = (info.size / 1024 / 1024).toFixed(2);

	return (
		<Box>
			{logSymbols.success} {filename}: {megabytes} MB in {duration} seconds at{" "}
			<Color {...colorParams}>{time}</Color>
		</Box>
	);
};
/* eslint-enable react/prop-types */

const Watch = () => {
	const [files, dispatch] = useReducer(reducer, {});

	useEffect(() => {
		const updateStart = filename => {
			dispatch({
				type: "start",
				filename,
			});
		};

		const updateEnd = filename => {
			dispatch({
				type: "end",
				filename,
			});
		};

		const updateError = (filename, error) => {
			dispatch({
				type: "error",
				filename,
				error,
			});
		};

		// This will complete its initial write before watchJS runs, which is good because then the schema
		// file will be available to be included in the JS bundle.
		watchJSONSchema(updateStart, updateEnd, updateError);

		watchJS(updateStart, updateEnd, updateError);

		// Since watchJS is async, this will run in parallel
		watchCSS(updateStart, updateEnd, updateError);
	}, []);

	const outputs = Object.entries(files).map(([filename, info]) => (
		<File key={filename} filename={filename} info={info} />
	));

	return <>{outputs}</>;
};

render(<Watch />);
