import { GetOutput } from "../../common/types";

async function updateToken(inputs: GetOutput) {
	return {
		token: inputs.token,
	};
}

export default updateToken;
