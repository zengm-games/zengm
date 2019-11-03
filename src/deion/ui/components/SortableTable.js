import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { List } from "react-movable";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";

const SortableTable = ({ cols, highlightHandle, onChange, row, values }) => {
	const [widths, setWidths] = useState([]);

	return (
		<List
			values={values}
			beforeDrag={({ elements, index }) => {
				const cells = Array.from(elements[index].children);
				const newWidths = cells.map(
					cell => window.getComputedStyle(cell).width,
				);
				setWidths(newWidths);
			}}
			onChange={onChange}
			renderList={({ children, props }) => (
				<ResponsiveTableWrapper nonfluid>
					<table className="table table-striped table-bordered table-sm table-hover">
						<thead>
							<tr>
								<th />
								{cols()}
							</tr>
						</thead>
						<tbody {...props}>{children}</tbody>
					</table>
				</ResponsiveTableWrapper>
			)}
			renderItem={({ index, isDragged, props, value }) => {
				const highlight = highlightHandle({ value });

				const wholeRow = (
					<tr {...props}>
						<td
							className={classNames("roster-handle", {
								"table-info": highlight,
								"table-secondary": !highlight,
							})}
							data-movable-handle
							style={{
								cursor: isDragged ? "grabbing" : "grab",
								padding: 5,
								width: widths[0],
							}}
						/>
						{row({
							index,
							value,
							widths,
						})}
					</tr>
				);

				return isDragged ? (
					<table>
						<tbody>{wholeRow}</tbody>
					</table>
				) : (
					wholeRow
				);
			}}
			transitionDuration={100}
		/>
	);
};

SortableTable.propTypes = {
	cols: PropTypes.func.isRequired,
	highlightHandle: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
	row: PropTypes.func.isRequired,
	values: PropTypes.array.isRequired,
};

export default SortableTable;
