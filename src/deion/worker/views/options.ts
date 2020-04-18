import type { UpdateEvents, Options } from "../../common/types";
import { idb } from "../db";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
		const options = (((await idb.meta.get("attributes", "options")) ||
			{}) as unknown) as Options;

		return {
			units: options.units,
		};
	}
};

export default updateOptions;
