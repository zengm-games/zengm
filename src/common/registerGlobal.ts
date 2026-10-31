export const registerGlobal = (variables: Record<string, unknown>) => {
	globalThis.bbgm ??= {};
	Object.assign(globalThis.bbgm, variables);
};
