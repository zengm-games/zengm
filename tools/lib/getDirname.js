import { fileURLToPath } from "node:url";
import path from "path";

const getDirname = url => {
	const fileURL = fileURLToPath(new URL(url));
	return path.dirname(fileURL);
};

export { getDirname };
