import classNames from "classnames";
import PropTypes from "prop-types";

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
					{colOrder.map(({ colIndex }) => {
						const value = row[colIndex];
						if (value != null && value.hasOwnProperty("value")) {
							return (
								<th className={classNames(value.classNames)} key={colIndex}>
									{value.value}
								</th>
							);
						}

						return <th key={colIndex}>{value}</th>;
					})}
				</tr>
			))}
		</tfoot>
	);
};

Footer.propTypes = {
	footer: PropTypes.array,
};

export default Footer;
