import { type MouseEvent, useState } from "react";
import type { Col, SortBy } from "./DataTable/index.tsx";
import updateSortBys from "./DataTable/updateSortBys.ts";

// Sorting for a box score table. If there is no defaultSortBys, players start in box score order (like starters first), and clicking the same column a second time goes back to that order.
export const useBoxScoreSortBys = ({
	cols,
	defaultSortBys,
}: {
	cols: Col[];
	defaultSortBys?: SortBy[];
}) => {
	const [sortBys, setSortBys] = useState<SortBy[]>(defaultSortBys ?? []);

	const onClick = (event: MouseEvent, i: number) => {
		setSortBys((prevSortBys) => {
			const newSortBys =
				updateSortBys({
					cols,
					event,
					i,
					prevSortBys,
				}) ?? [];

			if (
				defaultSortBys === undefined &&
				newSortBys.length === 1 &&
				prevSortBys.length === 1 &&
				newSortBys[0]![0] === prevSortBys[0]![0] &&
				newSortBys[0]![1] === "desc"
			) {
				// User just clicked twice on the same column. Reset sort.
				return [];
			}

			return newSortBys;
		});
	};

	return { onClick, sortBys };
};
