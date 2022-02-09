import { useCallback, useEffect, useRef } from "react";

// >1 sticky column requires some JS to compute the left offset of all besides the first sticky column (whose offset is always 0)
const useStickyXX = (stickyCols: 0 | 1 | 2) => {
	const tableRef = useRef<HTMLTableElement>(null);
	const prevStickyCols = useRef(stickyCols);

	const updateStickyCols = useCallback(() => {
		const getRows = () => {
			const table = tableRef.current;
			if (!table) {
				return [];
			}

			return Array.from(table.querySelectorAll<HTMLTableRowElement>("tr"));
		};

		if (stickyCols === 2) {
			const rows = getRows();

			if (rows.length === 0) {
				return;
			}

			// Header/footer might have weird colspan, so try to use something before the footer
			const cell = (rows.at(-2) ?? rows.at(-1)).cells[0];

			if (!cell) {
				return;
			}

			// Manually offset the 2nd col by the width of the 1st col
			const width = `${cell.offsetWidth}px`;
			for (const row of rows) {
				const cell = row.cells[1];
				cell.style.left = width;
			}
		} else if (prevStickyCols.current === 2) {
			// When switching away from 2 sticky cols, reset style
			const rows = getRows();
			for (const row of rows) {
				const cell = row.cells[1];
				cell.style.left = "";
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
