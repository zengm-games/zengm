export const registerGlobal = (variables: Record<string, unknown>) => {
	globalThis.bbgm ??= {};
	for (const [key, value] of Object.entries(variables)) {
		globalThis.bbgm[key] = value;
	}
};
