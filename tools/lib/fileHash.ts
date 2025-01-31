import crypto from "node:crypto";

export const fileHash = (contents: string) => {
	// https://github.com/sindresorhus/rev-hash
	return crypto.createHash("md5").update(contents).digest("hex").slice(0, 10);
};
