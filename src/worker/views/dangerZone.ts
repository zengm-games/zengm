import { local } from "../util";

const updateDangerZone = async () => {
	return {
		autoSave: local.autoSave,
	};
};

export default updateDangerZone;
