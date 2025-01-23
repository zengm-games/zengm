import { useCallback, useState } from "react";

export const useBulkSelectRows = () => {
	const [bulkSelectRows, setBulkSelectRows] = useState(true);

	const toggleBulkSelectRows = useCallback(() => {
		setBulkSelectRows(bulk => !bulk);
	}, []);

	const showBulkSelectCheckboxes = bulkSelectRows;

	return {
		bulkSelectRows,
		showBulkSelectCheckboxes,
		toggleBulkSelectRows,
	};
};
