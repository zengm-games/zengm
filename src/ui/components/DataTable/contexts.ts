import { createContext } from "react";
import type { SelectedRows } from "./useBulkSelectRows";
import type { Props } from ".";

export const DataTableContext = createContext<
	{
		highlightCols: number[];
		selectedRows: SelectedRows;
		showBulkSelectCheckboxes: boolean;
	} & Pick<Props, "clickable" | "disableBulkSelectKeys">
>({} as any);
