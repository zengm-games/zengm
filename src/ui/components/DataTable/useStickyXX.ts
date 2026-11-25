import { useCallback, useEffect, useRef } from "react";
import type { StickyCols } from "./index.tsx";
import getStickyColsClass from "./getStickyColsClass.ts";

// Add 1 to the StickyCols setting
export type StickyColsPlusCheckboxes = StickyCols | 4;

const MAX_STICKY_COLS: StickyColsPlusCheckboxes = 4;

// CSS variable used in light.scss for the left offset of a sticky column. Column numbers start at 1, like nth-child
const getLeftVariable = (colNumber: number) => `--sticky-left-${colNumber}`;

// >1 sticky column requires some JS to compute the left offset of all besides the first sticky column (whose offset is always 0). The offsets are CSS variables on the table, so they apply to every row, including rows rendered later.
export const useStickyXX = (
	stickyColsRaw: StickyCols,
	showBulkSelectCheckboxes: boolean,
) => {
	const tableRef = useRef<HTMLTableElement>(null);

	const stickyCols = (stickyColsRaw +
		(showBulkSelectCheckboxes ? 1 : 0)) as StickyColsPlusCheckboxes;

	const updateStickyCols = useCallback(() => {
		const table = tableRef.current;
		if (!table) {
			return;
		}

		// Left offset of each sticky column after the first, keyed by column number
		const lefts = new Map<number, number>();
		if (stickyCols >= 2) {
			// Example row to be used to compute column widths. Would rather not look at thead, since superCols could be weird
			const row =
				table.querySelector<HTMLTableRowElement>("tbody tr") ??
				table.querySelector<HTMLTableRowElement>("thead tr");
			if (!row || row.cells.length < stickyCols) {
				return;
			}

			let left = 0;
			for (let colNumber = 2; colNumber <= stickyCols; colNumber++) {
				left += row.cells[colNumber - 2]!.offsetWidth;
				lefts.set(colNumber, left);
			}
		}

		// Also removes variables for columns that are no longer sticky
		for (let colNumber = 2; colNumber <= MAX_STICKY_COLS; colNumber++) {
			const variable = getLeftVariable(colNumber);
			const left = lefts.get(colNumber);
			const value = left === undefined ? "" : `${left}px`;

			// Changing a variable on the table restyles the whole table, so skip it when nothing changed, since this runs every render
			if (table.style.getPropertyValue(variable) === value) {
				continue;
			}

			if (left === undefined) {
				table.style.removeProperty(variable);
			} else {
				table.style.setProperty(variable, value);
			}
		}
	}, [stickyCols]);

	useEffect(() => {
		window.addEventListener("optimizedResize", updateStickyCols);
		return () => {
			window.removeEventListener("optimizedResize", updateStickyCols);
		};
	}, [updateStickyCols]);

	// Run every render, because there's no better way to detect when data changes, which can change column widths
	useEffect(updateStickyCols, undefined);

	const stickyClass = getStickyColsClass(stickyCols);

	return {
		stickyClass,
		stickyCols,
		tableRef,
	};
};
