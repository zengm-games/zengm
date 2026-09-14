import { local } from "../util/index.ts";

const updateDangerZone = () => {
	return {
		autoSave: local.autoSave,
	};
};

export default updateDangerZone;
