import { g } from "../util";

const updateExpansionDraft = async () => {
	return {
		confs: g.get("confs"),
		divs: g.get("divs"),
		phase: g.get("phase"),
	};
};

export default updateExpansionDraft;
