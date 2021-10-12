import fs from "fs";
import { render, Box, Text } from "ink";
import SpinnerFoo from "ink-spinner";
import logSymbols from "log-symbols";
import React from "react";
import watchCSS from "./watchCSS";
import watchFiles from "./watchFiles";
import watchJS from "./watchJS";
import watchJSONSchema from "./watchJSONSchema";

const Spinner = (SpinnerFoo as any).default as typeof SpinnerFoo;

const { useEffect, useReducer } = React;

const TIME_CUTOFF_GREEN = 10000; // 10 seconds
const TIME_CUTOFF_YELLOW = 30000; // 30 seconds

type FileInfo = {
	building: boolean;
	dateStart: Date;
	dateEnd: Date;
	error: Error | undefined;
	size: number | undefined;
};

type Files = Record<string, FileInfo>;

type Action =
	| {
			type: "start";
			filename: string;
	  }
	| {
			type: "end";
			filename: string;
	  }
	| {
			type: "error";
			filename: string;
			error: Error;
	  };

const reducer = (files: Files, action: Action): Files => {
	const { filename, type } = action;
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
			let size;
			if (filename !== "static files") {
				size = fs.statSync(filename).size;
			}

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
					error: action.error,
				},
			};
	}
};

const File = ({ filename, info }: { filename: string; info: FileInfo }) => {
	if (info.error) {
		return (
			<Text>{`${logSymbols.error} ${filename}: ${info.error.stack}`}</Text>
		);
	}

	const time = (
		info.building ? info.dateStart : info.dateEnd
	).toLocaleTimeString();
	const numMillisecondsSinceTime = Date.now() - info.dateEnd.getTime();

	const colorParams: Record<string, string> = {};

	if (numMillisecondsSinceTime < TIME_CUTOFF_GREEN) {
		if (!info.building) {
			colorParams.color = "green";
		}
	} else if (numMillisecondsSinceTime < TIME_CUTOFF_YELLOW) {
		colorParams.color = "yellow";
	} else {
		if (info.building) {
			colorParams.color = "red";
		}
	}

	if (info.building) {
		return (
			<Box>
				<Text color="yellow">
					<Spinner type="dots" />
				</Text>
				<Text>
					{" "}
					{filename}: build started at <Text {...colorParams}>{time}</Text>
				</Text>
			</Box>
		);
	}

	const duration = (info.dateEnd.getTime() - info.dateStart.getTime()) / 1000;
	const megabytes =
		info.size !== undefined ? (info.size / 1024 / 1024).toFixed(2) : undefined;

	return (
		<Box>
			<Text>
				{logSymbols.success} {filename}:{" "}
				{megabytes !== undefined ? `${megabytes} MB in ` : ""}
				{duration} seconds at <Text {...colorParams}>{time}</Text>
			</Text>
		</Box>
	);
};

const Watch = () => {
	const [files, dispatch] = useReducer(reducer, {});
	const [forceUpdateCounter, forceUpdate] = useReducer(x => x + 1, 0);

	useEffect(() => {
		const updateStart = (filename: string) => {
			dispatch({
				type: "start",
				filename,
			});
		};

		const updateEnd = (filename: string) => {
			dispatch({
				type: "end",
				filename,
			});
		};

		const updateError = (filename: string, error: Error) => {
			dispatch({
				type: "error",
				filename,
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
	}, []);

	useEffect(() => {
		let id: NodeJS.Timeout | undefined;
		for (const info of Object.values(files)) {
			const numMillisecondsSinceTime = Date.now() - info.dateEnd.getTime();
			if (numMillisecondsSinceTime < TIME_CUTOFF_YELLOW) {
				// Make sure we check in a little if we need to update the color here, because otherwise there might not be another render to handle the color change
				id = setTimeout(() => {
					forceUpdate();
				}, 2000);
				break;
			}
		}

		return () => {
			if (id !== undefined) {
				clearInterval(id);
			}
		};
	}, [files, forceUpdateCounter]);

	return (
		<>
			{Object.entries(files).map(([filename, info]) => (
				<File key={filename} filename={filename} info={info} />
			))}
		</>
	);
};

export default () => {
	render(<Watch />);
};
