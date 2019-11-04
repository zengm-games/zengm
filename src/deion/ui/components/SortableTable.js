import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { List } from "react-movable";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import useClickable from "../hooks/useClickable";

const Row = React.forwardRef(
	(
		{
			className,
			disabled,
			highlight,
			index,
			isDragged,
			row,
			value,
			widths,
			...props
		},
		ref,
	) => {
		const { clicked, toggleClicked } = useClickable();

		return (
			<tr
				ref={ref}
				{...props}
				className={classNames(className, {
					"table-warning": clicked,
				})}
				onClick={toggleClicked}
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
							width: widths[0],
						}}
					/>
				)}
				{row({
					index,
					value,
					style: i => ({ width: widths[i] }),
				})}
			</tr>
		);
	},
);

Row.propTypes = {
	className: PropTypes.string,
	disabled: PropTypes.bool,
	highlight: PropTypes.bool.isRequired,
	index: PropTypes.number.isRequired,
	isDragged: PropTypes.bool.isRequired,
	row: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired,
	widths: PropTypes.arrayOf(PropTypes.string).isRequired,
};

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
				const className = rowClassName
					? rowClassName({ index, isDragged, value })
					: null;
				const highlight = highlightHandle({ index, value });

				const wholeRow = (
					<Row
						className={className}
						disabled={disabled}
						highlight={highlight}
						index={index}
						isDragged={isDragged}
						row={row}
						value={value}
						widths={widths}
						{...props}
					/>
				);

				return isDragged ? (
					<table className="table table-bordered table-sm">
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
