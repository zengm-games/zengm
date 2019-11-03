import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { List } from "react-movable";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";

const SortableTable = ({
	cols,
	disabled,
	highlightHandle,
	onChange,
	row,
	rowClassName,
	values,
}) => {
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
								{disabled ? null : <th />}
								{cols()}
							</tr>
						</thead>
						<tbody {...props}>{children}</tbody>
					</table>
				</ResponsiveTableWrapper>
			)}
			renderItem={({ index, isDragged, props, value }) => {
				const highlight = highlightHandle({ index, value });

				const wholeRow = (
					<tr
						{...props}
						className={rowClassName ? rowClassName({ index }) : null}
					>
						{disabled ? null : (
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
						)}
						{row({
							index,
							value,
							style: i => ({ padding: 5, width: widths[i] }),
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
			transitionDuration={0}
		/>
	);
};

SortableTable.propTypes = {
	cols: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
	highlightHandle: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
	row: PropTypes.func.isRequired,
	rowClassName: PropTypes.func,
	values: PropTypes.array.isRequired,
};

export default SortableTable;
