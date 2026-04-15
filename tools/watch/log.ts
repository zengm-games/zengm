import fs from "node:fs/promises";

const LOG_PATH = "spinners.log";

export const log = async (type: string, message: string, init?: boolean) => {
	if (init) {
		// Delete old file if it exists
		try {
			await fs.unlink(LOG_PATH);
		} catch (error) {
			if (error.code !== "ENOENT") {
				throw error;
			}
		}
	}

	await fs.appendFile(
		LOG_PATH,
		`${new Date().toISOString()} - ${type} - ${message}\n`,
	);
};
