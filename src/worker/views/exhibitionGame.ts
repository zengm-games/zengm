import type { UpdateEvents, ViewInput } from "../../common/types";

const updateExibitionGame = async (
	inputs: ViewInput<"exhibitionGame">,
	updateEvents: UpdateEvents,
) => {
	const redirect = {
		redirectUrl: "/exhibition",
	};

	if (updateEvents.includes("firstRun") && !inputs.liveSim) {
		return redirect;
	}

	return inputs.liveSim;
};

export default updateExibitionGame;
