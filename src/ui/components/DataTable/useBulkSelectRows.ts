import { useCallback, useState } from "react";
import type { DataTableRow, DataTableRowMetadata } from ".";

const useSelectedRows = () => {
	type Key = DataTableRow["key"];
	type Metadata = DataTableRowMetadata;

	const [map, setMap] = useState(new Map<Key, Metadata>());

	const toggle = useCallback((key: Key, metadata: Metadata) => {
		setMap(prev => {
			const copy = new Map(prev);
			if (copy.has(key)) {
				copy.delete(key);
			} else {
				copy.set(key, metadata);
			}
			return copy;
		});
	}, []);

	const clear = useCallback(() => {
		setMap(new Map());
	}, []);

	const setAll = useCallback((records: { key: Key; metadata: Metadata }[]) => {
		setMap(prev => {
			const copy = new Map(prev);
			for (const { key, metadata } of records) {
				copy.set(key, metadata);
			}
			return copy;
		});
	}, []);

	return {
		clear,
		map,
		toggle,
		setAll,
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
