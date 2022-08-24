import type { ViewInput } from "../../common/types";

const updateExibitionGame = async ({
	hash,
	liveSim,
}: ViewInput<"exhibitionGame">) => {
	const redirect = {
		redirectUrl: "/exhibition",
	};

	if (!liveSim) {
		return redirect;
	}

	return {
		hash,
		liveSim,
	};
};

export default updateExibitionGame;
