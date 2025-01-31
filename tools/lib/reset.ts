import fsp from "node:fs/promises";

export const reset = async () => {
	await fsp.rm("build", { recursive: true, force: true });
	await fsp.mkdir("build/gen", { recursive: true });
};
