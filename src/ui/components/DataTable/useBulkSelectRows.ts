import { useCallback, useRef, useState } from "react";
import type { DataTableRow, DataTableRowMetadata } from "./index.tsx";

export const useSelectedRows = () => {
	type Key = DataTableRow["key"];
	type Metadata = DataTableRowMetadata;

	const [map, setMap] = useState(new Map<Key, Metadata>());

	const toggle = useCallback((key: Key, metadata: Metadata) => {
		setMap((prev) => {
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

	const deleteEntry = useCallback((key: Key) => {
		setMap((prev) => {
			const copy = new Map(prev);
			copy.delete(key);
			return copy;
		});
	}, []);

	const deleteAll = useCallback((keys: Iterable<Key>) => {
		setMap((prev) => {
			const copy = new Map(prev);
			for (const key of keys) {
				copy.delete(key);
			}
			return copy;
		});
	}, []);

	const setAll = useCallback((records: { key: Key; metadata: Metadata }[]) => {
		setMap((prev) => {
			const copy = new Map(prev);
			for (const { key, metadata } of records) {
				copy.set(key, metadata);
			}
			return copy;
		});
	}, []);

	return {
		clear,
		delete: deleteEntry,
		deleteAll,
		map,
		toggle,
		setAll,
	};
};

export type SelectedRows = ReturnType<typeof useSelectedRows>;

export const useBulkSelectRows = ({
	alwaysShowBulkSelectRows,
	controlledSelectedRows,
	rows,
}: {
	alwaysShowBulkSelectRows?: boolean;
	controlledSelectedRows?: SelectedRows;
	rows: DataTableRow[];
}) => {
	const [bulkSelectRows, setBulkSelectRows] = useState(false);

	// We always need to call useSelectedRows because React, even if we are not using it
	let selectedRows = useSelectedRows();
	if (controlledSelectedRows) {
		selectedRows = controlledSelectedRows;
	}

	// undefined means we haven't checked contents of rows, either because there are no rows yet or because this is the first render
	const info = useRef<
		| undefined
		| {
				metadataType: NonNullable<DataTableRow["metadata"]>["type"];
		  }
		| {
				metadataType: undefined;
		  }
	>(undefined);
	if (info.current === undefined && rows.length > 0) {
		info.current = {
			// This assumes metadata type the same in every row, no table mixing two types! Some rows having no metadata is fine though (such as drafted players during draft)
			metadataType: rows.find((row) => row.metadata)?.metadata?.type,
		};
	}

	const toggleBulkSelectRows = useCallback(() => {
		setBulkSelectRows((bulk) => !bulk);
	}, []);

	const showBulkSelectCheckboxes = alwaysShowBulkSelectRows || bulkSelectRows;

	return {
		bulkSelectRows,
		metadataType: info.current?.metadataType,
		selectedRows,
		showBulkSelectCheckboxes,
		toggleBulkSelectRows,
	};
};
