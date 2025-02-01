import clsx, { type ClassValue } from "clsx";
import { use, type ReactNode } from "react";
import { DataTableContext } from "./contexts";

type FooterElement = (
	| ReactNode
	| {
			value: ReactNode;
			classNames?: ClassValue;
	  }
)[];

const Footer = ({
	colOrder,
	footer,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	footer?: FooterElement[] | FooterElement[][];
}) => {
	if (!footer) {
		return null;
	}

	const { highlightCols } = use(DataTableContext);

	let footers: FooterElement[][];

	if (Array.isArray(footer[0])) {
		// There are multiple footers
		// @ts-expect-error
		footers = footer;
	} else {
		// There's only one footer
		// @ts-expect-error
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
									className={clsx(
										(value as any).classNames,
										highlightColClassNames,
									)}
									key={colIndex}
								>
									{(value as any).value}
								</th>
							);
						}

						return (
							<th key={colIndex} className={clsx(highlightColClassNames)}>
								{value as any}
							</th>
						);
					})}
				</tr>
			))}
		</tfoot>
	);
};

export default Footer;
