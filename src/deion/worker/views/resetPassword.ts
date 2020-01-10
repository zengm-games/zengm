import { GetOutput } from "../../common/types";

async function updateToken(
	inputs: GetOutput,
): Promise<void | {
	[key: string]: any;
}> {
	return {
		token: inputs.token,
	};
}

export default {
	runBefore: [updateToken],
};
