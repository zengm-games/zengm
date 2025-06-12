import { useCallback, useEffect, useRef } from "react";
import type { StickyCols } from "./index.tsx";
import getStickyColsClass from "./getStickyColsClass.ts";
import { range } from "../../../common/utils.ts";

// Add 1 to the StickyCols setting
export type StickyColsPlusCheckboxes = StickyCols | 4;

// >1 sticky column requires some JS to compute the left offset of all besides the first sticky column (whose offset is always 0)
const useStickyXX = (
	stickyColsRaw: StickyCols,
	showBulkSelectCheckboxes: boolean,
) => {
	const tableRef = useRef<HTMLTableElement>(null);
	const prevLefts = useRef<number[] | undefined>(undefined);

	const stickyCols = (stickyColsRaw +
		(showBulkSelectCheckboxes ? 1 : 0)) as StickyColsPlusCheckboxes;

	const updateStickyCols = useCallback(() => {
		const table = tableRef.current;
		if (!table) {
			return;
		}

		// Get example row to be used to compute column widths
		const getRow = () => {
			let row = table.querySelector<HTMLTableRowElement>("tbody tr");
			if (!row) {
				// Would rather not look at thead, since superCols could be weird
				row = table.querySelector<HTMLTableRowElement>("thead tr");
			}
			return row;
		};

		const getRows = () => {
			return table.querySelectorAll<HTMLTableRowElement>("tr");
		};

		const lefts = [0];
		const row = getRow();
		let rows;

		// Remove left margin from the first column, which I think only matters when you're hiding the first column (like clicking "Hide bulk select players")
		if (row && row.cells[0]?.style.left) {
			rows = getRows();
			for (const row of rows) {
				if (row.cells[0]) {
					row.cells[0].style.removeProperty("left");
				}
			}
		}

		if (stickyCols >= 2) {
			if (!row || row.cells.length < stickyCols) {
				return;
			}

			// For each stickyCol beyond the first, need to figure out how much it needs to be offset by the fixed width of prior sticky cols
			for (let i = 1; i < stickyCols; i++) {
				lefts[i] = lefts[i - 1]! + row.cells[i - 1]!.offsetWidth;
			}

			if (
				prevLefts.current &&
				lefts.length === prevLefts.current.length &&
				prevLefts.current.every((left, i) => left === lefts[i])
			) {
				// If left offsets did not change, then no point in updating the DOM
				return;
			}

			if (!rows) {
				rows = getRows();
			}

			const widths = lefts.map((left) => `${left}px`);

			for (const row of rows) {
				for (let i = 1; i < widths.length; i++) {
					const cell = row.cells[i];
					if (cell) {
						cell.style.left = widths[i]!;
					}
				}
			}
		}

		// When removing a sticky col that had a style manually applied above, reset that style
		if (prevLefts.current) {
			const prevStickyCols = prevLefts.current.length;
			if (prevStickyCols >= 2 && prevStickyCols > stickyCols) {
				const colsToReset = range(stickyCols, prevStickyCols);

				if (!rows) {
					rows = getRows();
				}
				for (const row of rows) {
					for (const i of colsToReset) {
						const cell = row.cells[i]!;
						cell.style.left = "";
					}
				}
			}
		}

		prevLefts.current = lefts;
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
		tableRef,
	};
};

export default useStickyXX;
