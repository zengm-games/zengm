import { setAutoSave } from "../league/setAutoSave.ts";

export const disableAutoSave = async () => {
	await setAutoSave(false);
};
