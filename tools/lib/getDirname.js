import { fileURLToPath } from "node:url";
import path from "node:path";

const getDirname = url => {
	const fileURL = fileURLToPath(url);
	return path.dirname(fileURL);
};

export { getDirname };
