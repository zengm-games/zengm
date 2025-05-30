import { g } from "../util/index.ts";

const updateConfs = async () => {
	const confs = g.get("confs");
	const divs = g.get("divs");

	return {
		autoRelocate: !!g.get("autoRelocate"),
		confs,
		divs,
		phase: g.get("phase"),
	};
};

export default updateConfs;
