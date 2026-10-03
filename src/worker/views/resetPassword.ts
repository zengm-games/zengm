import { defineView } from "../util/defineView.ts";
import type { RouteParams } from "../../ui/router/types.ts";

const processInputs = (params: RouteParams<"resetPassword">) => {
	return {
		token: params.token,
	};
};

export default defineView({
	id: "resetPassword",
	processInputs,
	load: ({ inputs }) => {
		return {
			token: inputs.token,
		};
	},
});
