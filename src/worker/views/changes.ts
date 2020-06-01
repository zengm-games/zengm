import { changes } from "../util";

const updateChanges = async () => {
	return {
		changes: changes.slice(0).reverse(),
	};
};

export default updateChanges;
