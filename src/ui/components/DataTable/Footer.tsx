import classNames from "classnames";
import type { Col } from "./index";

const Footer = ({
	cols,
	footer,
	highlightCols,
}: {
	cols: Col[];
	footer?: any[];
	highlightCols: string[];
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
					{cols.map((col, j) => {
						const highlightColClassNames = highlightCols.includes(col.key)
							? "sorting_highlight"
							: undefined;

						const value = row[j];
						if (value != null && value.hasOwnProperty("value")) {
							return (
								<th
									className={classNames(
										value.classNames,
										highlightColClassNames,
									)}
									key={col.key}
								>
									{value.value}
								</th>
							);
						}

						return (
							<th key={col.key} className={classNames(highlightColClassNames)}>
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
