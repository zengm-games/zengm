import type { ViewInput } from "../../common/types.ts";

const updateExibitionGame = async ({
	liveSim,
}: ViewInput<"exhibitionGame">) => {
	const redirect = {
		redirectUrl: "/exhibition",
	};

	if (!liveSim) {
		return redirect;
	}

	return {
		liveSim,
	};
};

export default updateExibitionGame;
