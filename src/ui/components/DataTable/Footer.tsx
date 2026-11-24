import clsx, { type ClassValue } from "clsx";
import { use, type ReactNode } from "react";
import { DataTableContext } from "./contexts.ts";

type FooterCell = {
	value: ReactNode;
	classNames?: ClassValue;

	// Spans the following columns, if they are displayed right after this one and it doesn't cross from sticky to non-sticky columns. Their values in data are ignored.
	colspan?: number;
};

type FooterElement = ReactNode | FooterCell;

export type FooterRow = {
	classNames?: ClassValue;
	data: FooterElement[];
};

const isFooterCell = (element: FooterElement): element is FooterCell =>
	typeof element === "object" &&
	element !== null &&
	Object.hasOwn(element, "value");

const FooterRowCells = ({
	colOrder,
	footer,
	stickyCols,
}: {
	colOrder: {
		colIndex: number;
	}[];
	footer: FooterRow;
	stickyCols: number;
}) => {
	const { highlightCols } = use(DataTableContext);

	const cells = [];
	for (let j = 0; j < colOrder.length; j++) {
		const { colIndex } = colOrder[j]!;
		const element = footer.data[colIndex];
		const cell = isFooterCell(element) ? element : { value: element };

		// A cell in the sticky columns can't span past them, because then it would cover up the first non-sticky column when scrolling
		const lastStickyCol = stickyCols - 1;
		const maxColspan =
			j <= lastStickyCol
				? Math.min(cell.colspan ?? 1, lastStickyCol - j + 1)
				: (cell.colspan ?? 1);

		// Only span columns that are still displayed right after this one, not ones that were hidden or moved
		let colspan = 1;
		while (
			colspan < maxColspan &&
			colOrder[j + colspan]?.colIndex === colIndex + colspan
		) {
			colspan += 1;
		}

		cells.push(
			<th
				className={clsx(cell.classNames, {
					sorting_highlight: highlightCols.includes(j),
					"sticky-divider":
						j < lastStickyCol && j + colspan - 1 === lastStickyCol,
				})}
				colSpan={colspan > 1 ? colspan : undefined}
				key={colIndex}
			>
				{cell.value}
			</th>,
		);

		// Hidden cells in place of the spanned columns, so later cells keep their position in the row, which sticky columns depend on
		for (let k = 1; k < colspan; k++) {
			cells.push(<th className="d-none" key={colOrder[j + k]!.colIndex} />);
		}

		j += colspan - 1;
	}

	return <tr className={clsx(footer.classNames)}>{cells}</tr>;
};

export const Footer = ({
	colOrder,
	footer,
	stickyCols,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	footer?: FooterRow | FooterRow[];
	stickyCols: number;
}) => {
	if (!footer) {
		return null;
	}

	const footers = Array.isArray(footer) ? footer : [footer];

	return (
		<tfoot>
			{footers.map((footer, i) => (
				<FooterRowCells
					colOrder={colOrder}
					footer={footer}
					key={i}
					stickyCols={stickyCols}
				/>
			))}
		</tfoot>
	);
};
