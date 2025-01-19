import { statSync } from "fs";
import { spinners } from "./spinners.ts";
import watchCSS from "./watchCSS.ts";
import watchFiles from "./watchFiles.ts";
import watchJS from "./watchJS.ts";
import watchJSONSchema from "./watchJSONSchema.ts";
import { startServer } from "./server.ts";

await startServer();
console.log("");

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
await watchFiles(updateStart, updateEnd, updateError);

// Schema is needed for JS bunlde, and watchJSONSchema is async
watchJSONSchema(updateStart, updateEnd, updateError).then(() => {
	watchJS(updateStart, updateEnd, updateError);
});

watchCSS(updateStart, updateEnd, updateError);
