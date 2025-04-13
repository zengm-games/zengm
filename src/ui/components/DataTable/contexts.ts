import { createContext } from "react";
import type { SelectedRows } from "./useBulkSelectRows.ts";
import type { Props, SortBy } from "./index.tsx";

export const DataTableContext = createContext<
	{
		highlightCols: number[];
		isFiltered: boolean;
		selectedRows: SelectedRows;
		showBulkSelectCheckboxes: boolean;
		showRowLabels: boolean | undefined;
		sortBys: SortBy[] | undefined;
	} & Pick<Props, "clickable" | "disableBulkSelectKeys">
>({} as any);
