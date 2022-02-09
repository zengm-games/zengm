import range from "lodash-es/range";
import { useCallback, useEffect, useRef } from "react";
import type { StickyCols } from ".";

// >1 sticky column requires some JS to compute the left offset of all besides the first sticky column (whose offset is always 0)
const useStickyXX = (stickyCols: StickyCols) => {
	const tableRef = useRef<HTMLTableElement>(null);
	const prevStickyCols = useRef(stickyCols);
	console.log("useStickyXX", stickyCols);

	const updateStickyCols = useCallback(() => {
		const getRows = () => {
			const table = tableRef.current;
			if (!table) {
				return [];
			}

			return Array.from(table.querySelectorAll<HTMLTableRowElement>("tr"));
		};

		if (stickyCols >= 2) {
			const rows = getRows();

			// Header/footer might have weird colspan, so try to use something before the footer
			const row = rows.at(-2) ?? rows.at(-1);

			if (!row) {
				return;
			}

			// For each stickyCol beyond the first, need to figure out how much it needs to be offset by the fixed width of prior sticky cols
			let left = 0;
			for (let i = 1; i < stickyCols; i++) {
				left += row.cells[i - 1].offsetWidth;
				console.log("set left", i, left);

				const width = `${left}px`;
				for (const row of rows) {
					row.cells[i].style.left = width;
				}
			}
		}

		// When removing a sticky col that had a style manually applied above, reset that style
		if (prevStickyCols.current >= 2 && prevStickyCols.current > stickyCols) {
			const colsToReset = range(stickyCols, prevStickyCols.current);
			console.log("colsToReset", colsToReset);

			const rows = getRows();
			for (const row of rows) {
				for (const i of colsToReset) {
					const cell = row.cells[i];
					cell.style.left = "";
				}
			}
		}

		prevStickyCols.current = stickyCols;
	}, [stickyCols]);

	useEffect(() => {
		window.addEventListener("optimizedResize", updateStickyCols);
		return () => {
			window.removeEventListener("optimizedResize", updateStickyCols);
		};
	}, [updateStickyCols]);

	// Run every render, because there's no better way to detect when data changes, which can change column widths
	useEffect(updateStickyCols);

	return tableRef;
};

export default useStickyXX;
