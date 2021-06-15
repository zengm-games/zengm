import type { UpdateEvents, ViewInput } from "../../common/types";
import { getCommon } from "./player";

const updatePlayerGameLog = async (
	{ pid, season }: ViewInput<"playerGameLog">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.retired ||
		state.pid !== pid ||
		state.season !== season
	) {
		const topStuff = await getCommon(pid);

		if (topStuff.type === "error") {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: topStuff.errorMessage,
			};
			return returnValue;
		}

		return {
			...topStuff,
			season,
		};
	}
};

export default updatePlayerGameLog;
