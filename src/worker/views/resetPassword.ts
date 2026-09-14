import type { ViewInput } from "../../common/types.ts";

const updateToken = (inputs: ViewInput<"resetPassword">) => {
	return {
		token: inputs.token,
	};
};

export default updateToken;
