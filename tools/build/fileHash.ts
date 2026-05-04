import { hash } from "node:crypto";

export const fileHash = (contents: string) => {
	// https://github.com/sindresorhus/rev-hash
	return hash("md5", contents).slice(0, 10);
};
