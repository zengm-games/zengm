import classNames from "classnames";

const Footer = ({
	colOrder,
	footer,
	highlightCols,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	footer?: any[];
	highlightCols: number[];
}) => {
	if (!footer) {
		return null;
	}

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
						if (value != null && value.hasOwnProperty("value")) {
							return (
								<th
									className={classNames(
										value.classNames,
										highlightColClassNames,
									)}
									key={colIndex}
								>
									{value.value}
								</th>
							);
						}

						return (
							<th key={colIndex} className={classNames(highlightColClassNames)}>
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
