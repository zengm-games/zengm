import clsx from "clsx";
import { use } from "react";
import { DataTableContext } from "./contexts";

const Footer = ({
	colOrder,
	footer,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	footer?: any[];
}) => {
	if (!footer) {
		return null;
	}

	const { highlightCols } = use(DataTableContext);

	let footers: any[][];

	if (Array.isArray(footer[0])) {
		// There are multiple footers
		footers = footer;
	} else {
		// There's only one footer
		footers = [footer];
	}

	return (
		<tfoot>
			{footers.map((row, i) => (
				<tr key={i}>
					{colOrder.map(({ colIndex }, j) => {
						const highlightColClassNames = highlightCols.includes(j)
							? "sorting_highlight"
							: undefined;

						const value = row[colIndex];
						if (value != null && Object.hasOwn(value, "value")) {
							return (
								<th
									className={clsx(value.classNames, highlightColClassNames)}
									key={colIndex}
								>
									{value.value}
								</th>
							);
						}

						return (
							<th key={colIndex} className={clsx(highlightColClassNames)}>
								{value}
							</th>
						);
					})}
				</tr>
			))}
		</tfoot>
	);
};

export default Footer;
