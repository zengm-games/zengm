import { overrides } from "../util";

async function updateChanges() {
	return {
		changes: overrides.util.changes.slice(0).reverse(),
	};
}

export default updateChanges;
