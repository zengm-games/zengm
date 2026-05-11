import { local } from "../util/index.ts";

const updateDangerZone = async () => {
	return {
		autoSave: local.autoSave,
	};
};

export default updateDangerZone;
