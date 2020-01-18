import { overrides } from "../util";

const updateChanges = async () => {
	return {
		changes: overrides.util.changes.slice(0).reverse(),
	};
};

export default updateChanges;
