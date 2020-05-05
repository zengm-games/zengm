import { g } from "../util";

const updateExpansionDraft = async () => {
	return {
		confs: g.get("confs", Infinity),
		divs: g.get("divs", Infinity),
		multiTeamMode: g.get("userTids").length > 1,
		phase: g.get("phase"),
	};
};

export default updateExpansionDraft;
