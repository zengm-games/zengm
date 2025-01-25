import { useCallback, useRef, useState } from "react";
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

export const useBulkSelectRows = (initialCanBulkSelectRows: () => boolean) => {
	const [bulkSelectRows, setBulkSelectRows] = useState(false);
	const selectedRows = useSelectedRows();

	const canBulkSelectRows = useRef<boolean | undefined>(undefined);
	if (canBulkSelectRows.current === undefined) {
		canBulkSelectRows.current = initialCanBulkSelectRows();
	}

	const toggleBulkSelectRows = useCallback(() => {
		setBulkSelectRows(bulk => !bulk);
	}, []);

	const showBulkSelectCheckboxes = bulkSelectRows;

	return {
		bulkSelectRows,
		canBulkSelectRows: canBulkSelectRows.current,
		selectedRows,
		showBulkSelectCheckboxes,
		toggleBulkSelectRows,
	};
};

export type SelectedRows = ReturnType<typeof useBulkSelectRows>["selectedRows"];
