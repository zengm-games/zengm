import { useCallback, useState } from "react";
import type {
	DataTableRow,
	DataTableRowMetadata,
	MetadataType,
} from "./index.tsx";

type Key = DataTableRow["key"];

export type SelectedRows<Type extends MetadataType = undefined> = {
	// These are methods rather than function properties so that SelectedRows with a specific type of metadata can be passed to the internal parts of DataTable that work with any type of metadata
	clear(): void;
	delete(key: Key): void;
	deleteAll(keys: Iterable<Key>): void;
	map: Map<Key, DataTableRowMetadata<Type>>;
	toggle(key: Key, metadata: DataTableRowMetadata<Type>): void;
	setAll(records: { key: Key; metadata: DataTableRowMetadata<Type> }[]): void;
};

export const useSelectedRows = <
	Type extends MetadataType = undefined,
>(): SelectedRows<Type> => {
	type Metadata = DataTableRowMetadata<Type>;

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

export const useBulkSelectRows = <Type extends MetadataType>({
	alwaysShowBulkSelectRows,
	controlledSelectedRows,
	rows,
}: {
	alwaysShowBulkSelectRows?: boolean;
	controlledSelectedRows?: SelectedRows<Type>;
	rows: DataTableRow<Type>[];
}) => {
	const [bulkSelectRows, setBulkSelectRows] = useState(false);

	// We always need to call useSelectedRows because React, even if we are not using it
	let selectedRows = useSelectedRows<Type>();
	if (controlledSelectedRows) {
		selectedRows = controlledSelectedRows;
	}

	// undefined means we haven't checked contents of rows, either because there are no rows yet or because this is the first render
	const [info, setInfo] = useState<
		| undefined
		| {
				metadataType: MetadataType;
		  }
	>(undefined);
	if (info === undefined && rows.length > 0) {
		// Setting state during render makes React immediately re-render with the new value
		setInfo({
			metadataType: rows.find((row) => row.metadata)?.metadata?.type,
		});
	}

	const toggleBulkSelectRows = useCallback(() => {
		setBulkSelectRows((bulk) => !bulk);
	}, []);

	const showBulkSelectCheckboxes = alwaysShowBulkSelectRows || bulkSelectRows;

	return {
		bulkSelectRows,
		metadataType: info?.metadataType,
		selectedRows,
		showBulkSelectCheckboxes,
		toggleBulkSelectRows,
	};
};
