import type { MouseEvent } from "react";
import type { Col, SortBy } from ".";
import { helpers } from "../../util";

const updateSortBys = ({
	cols,
	event,
	colKey,
	prevSortBys,
}: {
	cols: Col[];
	event: MouseEvent;
	colKey: string;
	prevSortBys: SortBy[];
}) => {
	const col = cols.find(c => c.key === colKey);

	// Ignore click on unsortable column
	if (!col || (col.sortSequence && col.sortSequence.length === 0)) {
		return prevSortBys;
	}

	let found = false;
	let sortBys = helpers.deepCopy(prevSortBys);

	const nextOrder = (col2: Col, sortBy: SortBy) => {
		const sortSequence = col2.sortSequence;

		if (sortSequence) {
			// Move up to next entry in sortSequence
			let j = sortSequence.indexOf(sortBy[1]) + 1;

			if (j >= sortSequence.length) {
				j = 0;
			}

			return sortSequence[j];
		}

		// Default asc/desc toggle
		return sortBy[1] === "asc" ? "desc" : "asc";
	};

	// If this column is already in sortBys and shift is pressed, update
	if (event.shiftKey) {
		for (const sortBy of sortBys) {
			if (sortBy[0] === colKey) {
				sortBy[1] = nextOrder(col, sortBy);
				found = true;
				break;
			}
		}

		// If this column is not in sortBys and shift is pressed, append
		if (!found) {
			sortBys.push([colKey, col.sortSequence ? col.sortSequence[0] : "asc"]);
			found = true;
		}
	}

	// If this column is the only one in sortBys, update order
	if (!found && sortBys.length === 1 && sortBys[0][0] === colKey) {
		sortBys[0][1] = nextOrder(col, sortBys[0]);
		found = true;
	}

	// Otherwise, reset to sorting only by this column, default order
	if (!found) {
		sortBys = [[colKey, col.sortSequence ? col.sortSequence[0] : "asc"]];
	}

	return sortBys;
};

export default updateSortBys;
