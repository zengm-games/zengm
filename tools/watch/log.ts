import fs from "node:fs/promises";
import { existsSync } from "node:fs";

const LOG_PATH = "spinners.log";

export const log = async (type: string, message: string, init?: boolean) => {
	if (init && existsSync(LOG_PATH)) {
		await fs.unlink(LOG_PATH);
	}

	await fs.appendFile(
		LOG_PATH,
		`${new Date().toISOString()} - ${type} - ${message}\n`,
	);
};
