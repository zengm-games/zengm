import range from "lodash-es/range";
import { useCallback, useEffect, useRef } from "react";
import type { StickyCols } from ".";
import getStickyColsClass from "./getStickyColsClass";

// >1 sticky column requires some JS to compute the left offset of all besides the first sticky column (whose offset is always 0)
const useStickyXX = (stickyCols: StickyCols) => {
	const tableRef = useRef<HTMLTableElement>(null);
	const prevLefts = useRef<number[] | undefined>();

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

		if (stickyCols >= 2) {
			const row = getRow();
			if (!row || row.cells.length < stickyCols) {
				return;
			}

			// For each stickyCol beyond the first, need to figure out how much it needs to be offset by the fixed width of prior sticky cols
			for (let i = 1; i < stickyCols; i++) {
				lefts[i] = lefts[i - 1] + row.cells[i - 1].offsetWidth;
			}

			if (
				prevLefts.current &&
				lefts.length === prevLefts.current.length &&
				prevLefts.current.every((left, i) => left === lefts[i])
			) {
				// If left offsets did not change, then no point in updating the DOM
				return;
			}

			const rows = getRows();

			const widths = lefts.map(left => `${left}px`);

			for (const row of rows) {
				for (let i = 1; i < widths.length; i++) {
					if (row.cells[i]) {
						row.cells[i].style.left = widths[i];
					}
				}
			}
		}

		// When removing a sticky col that had a style manually applied above, reset that style
		if (prevLefts.current) {
			const prevStickyCols = prevLefts.current.length;
			if (prevStickyCols >= 2 && prevStickyCols > stickyCols) {
				const colsToReset = range(stickyCols, prevStickyCols);

				const rows = getRows();
				for (const row of rows) {
					for (const i of colsToReset) {
						const cell = row.cells[i];
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
	useEffect(updateStickyCols);

	const stickyClass = getStickyColsClass(stickyCols);

	return {
		stickyClass,
		tableRef,
	};
};

export default useStickyXX;
