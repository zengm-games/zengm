import { defineView } from "../util/defineView.ts";

export default defineView("resetPassword", ({ inputs }) => {
	return {
		token: inputs.token,
	};
});
