import type { ViewInput } from "../util/defineView.ts";

const updateToken = (inputs: ViewInput<"resetPassword">) => {
	return {
		token: inputs.token,
	};
};

export default updateToken;
