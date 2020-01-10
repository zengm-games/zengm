import { overrides } from "../util";

async function updateChanges(): Promise<void | {
	[key: string]: any;
}> {
	return {
		changes: overrides.util.changes.slice(0).reverse(),
	};
}

export default {
	runBefore: [updateChanges],
};
