import type { Conf, Div } from "../../common/types.ts";
import { g } from "../util/index.ts";

const updateConfs = async () => {
	// While editing, can have 0 confs or divs
	const confs: Conf[] = g.get("confs");
	const divs: Div[] = g.get("divs");

	return {
		actualPhase: g.get("nextPhase") ?? g.get("phase"),
		autoRelocate: !!g.get("autoRelocate"),
		confs,
		divs,
	};
};

export default updateConfs;
