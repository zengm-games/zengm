import { defineView } from "../util/defineView.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import type { boxScoreToLiveSim } from "./liveGame.ts";

const processInputs = (params: RouteParams<"exhibitionGame">, ctxBBGM: any) => {
	return {
		liveSim: ctxBBGM.liveSim as
			| Awaited<ReturnType<typeof boxScoreToLiveSim>>
			| undefined,
	};
};

export default defineView({
	id: "exhibitionGame",
	processInputs,
	load: ({ inputs: { liveSim } }) => {
		const redirect = {
			redirectUrl: "/exhibition",
		};

		if (!liveSim) {
			return redirect;
		}

		return {
			liveSim,
		};
	},
});
