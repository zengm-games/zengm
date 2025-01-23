import { useCallback, useState } from "react";
import type { DataTableRow } from ".";

const useSelectedRows = () => {
	const [map, setMap] = useState(new Map<DataTableRow["key"], DataTableRow>());

	const toggle = useCallback((row: DataTableRow) => {
		setMap(prev => {
			const copy = new Map(prev);
			if (copy.has(row.key)) {
				copy.delete(row.key);
			} else {
				copy.set(row.key, row);
			}
			return copy;
		});
	}, []);

	return {
		map,
		toggle,
	};
};

export const useBulkSelectRows = () => {
	const [bulkSelectRows, setBulkSelectRows] = useState(true);
	const selectedRows = useSelectedRows();

	const toggleBulkSelectRows = useCallback(() => {
		setBulkSelectRows(bulk => !bulk);
	}, []);

	const showBulkSelectCheckboxes = bulkSelectRows;

	return {
		bulkSelectRows,
		selectedRows,
		showBulkSelectCheckboxes,
		toggleBulkSelectRows,
	};
};
