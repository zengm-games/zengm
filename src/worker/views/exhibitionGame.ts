import { defineView } from "../util/defineView.ts";

export default defineView("exhibitionGame", ({ inputs: { liveSim } }) => {
	const redirect = {
		redirectUrl: "/exhibition",
	};

	if (!liveSim) {
		return redirect;
	}

	return {
		liveSim,
	};
});
