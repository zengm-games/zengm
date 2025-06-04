import { g } from "../util/index.ts";

const updateConfs = async () => {
	const confs = g.get("confs");
	const divs = g.get("divs");

	return {
		actualPhase: g.get("nextPhase") ?? g.get("phase"),
		autoRelocate: !!g.get("autoRelocate"),
		confs,
		divs,
	};
};

export default updateConfs;
