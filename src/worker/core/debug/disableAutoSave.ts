import api from "../../api/index.ts";

export const disableAutoSave = async () => {
	await api.main.setLocal(["autoSave", false]);
};
