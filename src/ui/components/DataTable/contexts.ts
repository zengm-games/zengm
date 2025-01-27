import { createContext } from "react";
import type { SelectedRows } from "./useBulkSelectRows";
import type { Props, SortBy } from ".";

export const DataTableContext = createContext<
	{
		highlightCols: number[];
		isFiltered: boolean;
		selectedRows: SelectedRows;
		showBulkSelectCheckboxes: boolean;
		sortBys: SortBy[] | undefined;
	} & Pick<Props, "clickable" | "disableBulkSelectKeys">
>({} as any);
