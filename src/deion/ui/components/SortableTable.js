import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import {
	SortableContainer,
	SortableElement,
	SortableHandle,
} from "react-sortable-hoc";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import useClickable from "../hooks/useClickable";

const ReorderHandle = SortableHandle(({ highlight, isDragged }) => {
	return (
		<td
			className={classNames("roster-handle", {
				"table-info": highlight,
				"table-secondary": !highlight,
				"user-select-none": isDragged,
			})}
			data-movable-handle
			style={{
				cursor: isDragged ? "grabbing" : "grab",
			}}
		/>
	);
});

ReorderHandle.propTypes = {
	isDragged: PropTypes.bool.isRequired,
};

const style = () => null;

const Row = SortableElement(props => {
	const { clicked, toggleClicked } = useClickable();

	const { className, disabled2, highlight, i, isDragged, row, value } = props;

	return (
		<tr
			className={classNames(className, {
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			{disabled2 ? null : (
				<ReorderHandle highlight={highlight} isDragged={isDragged} />
			)}
			{row({
				index: i,
				style,
				value,
			})}
		</tr>
	);
});

Row.propTypes = {
	className: PropTypes.string,
	disabled2: PropTypes.bool,
	highlight: PropTypes.bool.isRequired,
	index: PropTypes.number.isRequired,
	isDragged: PropTypes.bool.isRequired,
	row: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired,
};

const TBody = SortableContainer(
	({ disabled, highlightHandle, isDragged, row, rowClassName, values }) => {
		return (
			<tbody>
				{values.map((value, index) => {
					const className = rowClassName
						? rowClassName({ index, isDragged, value })
						: null;
					const highlight = highlightHandle({ index, value });

					// Hacky! Would be better to pass in explicitly. If `index` is just used, then it breaks highlighting (highlight doesn't move with row when dragged)
					let key;
					if (value.hasOwnProperty("pid")) {
						key = value.pid;
					} else if (value.hasOwnProperty("tid")) {
						key = value.tid;
					} else {
						key = index;
					}

					return (
						<Row
							className={className}
							disabled2={disabled}
							key={key}
							highlight={highlight}
							i={index}
							index={index}
							isDragged={isDragged}
							row={row}
							value={value}
						/>
					);
				})}
			</tbody>
		);
	},
);

TBody.propTypes = {
	disabled: PropTypes.bool,
	highlightHandle: PropTypes.func,
	isDragged: PropTypes.bool.isRequired,
	row: PropTypes.func.isRequired,
	rowClassName: PropTypes.func,
	values: PropTypes.array.isRequired,
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
	const [isDragged, setIsDragged] = useState(false);

	const onSortStart = useCallback(({ clonedNode, node }) => {
		setIsDragged(true);

		// Ideally, this wouldn't be necessary https://github.com/clauderic/react-sortable-hoc/issues/175
		const clonedChildren = clonedNode.childNodes;
		const children = node.childNodes;
		for (let i = 0; i < children.length; i++) {
			clonedChildren[i].style.padding = "5px";
			clonedChildren[i].style.width = `${children[i].offsetWidth}px`;
		}
	}, []);

	const onSortEnd = useCallback(
		({ oldIndex, newIndex }) => {
			setIsDragged(false);
			onChange({ oldIndex, newIndex });
		},
		[onChange],
	);

	return (
		<ResponsiveTableWrapper nonfluid>
			<table className="table table-striped table-bordered table-sm table-hover">
				<thead>
					<tr>
						{disabled ? null : <th />}
						{cols()}
					</tr>
				</thead>
				<TBody
					disabled={disabled}
					highlightHandle={highlightHandle}
					isDragged={isDragged}
					onSortEnd={onSortEnd}
					onSortStart={onSortStart}
					row={row}
					rowClassName={rowClassName}
					transitionDuration={0}
					values={values}
					useDragHandle
				/>
			</table>
		</ResponsiveTableWrapper>
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
