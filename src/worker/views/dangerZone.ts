import { g, local } from "../util";

const updateDangerZone = async () => {
	return {
		autoSave: local.autoSave,
		godMode: g.get("godMode"),
		phase: g.get("phase"),
	};
};

export default updateDangerZone;
