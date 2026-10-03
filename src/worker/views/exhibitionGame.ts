import type { ViewInput } from "../util/defineView.ts";

const updateExibitionGame = ({ liveSim }: ViewInput<"exhibitionGame">) => {
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
