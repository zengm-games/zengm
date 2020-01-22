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

type HighlightHandle<Value> = (a: { index: number; value: Value }) => boolean;
type RowClassName<Value> = (a: {
	index: number;
	isDragged: boolean;
	value: Value;
}) => string | undefined;
type Row<Value> = (a: { index: number; value: Value }) => React.ReactNode;

// Should be Value passed through as generic parameter, but that is annoying with HOC
type ShouldBeValue = any;

const ReorderHandle = SortableHandle(
	({ highlight, isDragged }: { highlight: boolean; isDragged: boolean }) => {
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
	},
);

ReorderHandle.propTypes = {
	highlight: PropTypes.bool.isRequired,
	isDragged: PropTypes.bool.isRequired,
};

const Row = SortableElement(
	(props: {
		className?: string;
		disabled2?: boolean;
		highlight: boolean;
		i: number;
		isDragged: boolean;
		row: Row<ShouldBeValue>;
		value: ShouldBeValue;
	}) => {
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
					value,
				})}
			</tr>
		);
	},
);

// @ts-ignore
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
	({
		disabled,
		highlightHandle,
		isDragged,
		row,
		rowClassName,
		values,
	}: {
		disabled?: boolean;
		highlightHandle: HighlightHandle<ShouldBeValue>;
		isDragged: boolean;
		row: ShouldBeValue;
		rowClassName?: RowClassName<ShouldBeValue>;
		values: ShouldBeValue[];
	}) => {
		return (
			<tbody>
				{values.map((value, index) => {
					const className: string | undefined = rowClassName
						? rowClassName({ index, isDragged, value })
						: undefined;
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

// @ts-ignore
TBody.propTypes = {
	disabled: PropTypes.bool,
	highlightHandle: PropTypes.func,
	isDragged: PropTypes.bool.isRequired,
	row: PropTypes.func.isRequired,
	rowClassName: PropTypes.func,
	values: PropTypes.array.isRequired,
};

const SortableTable = <Value extends {}>({
	cols,
	disabled,
	highlightHandle,
	onChange,
	row,
	rowClassName,
	values,
}: {
	cols: () => React.ReactNode;
	disabled?: boolean;
	highlightHandle: HighlightHandle<Value>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	row: Row<Value>;
	rowClassName?: RowClassName<Value>;
	values: Value[];
}) => {
	const [isDragged, setIsDragged] = useState(false);

	const onSortStart = useCallback(({ node }) => {
		setIsDragged(true);

		// https://github.com/clauderic/react-sortable-hoc/issues/361#issuecomment-471907612
		const tds = document.getElementsByClassName("SortableHelper")[0].childNodes;
		for (let i = 0; i < tds.length; i++) {
			const childNode = node.childNodes[i];
			// @ts-ignore
			tds[i].style.width = `${childNode.offsetWidth}px`;
			// @ts-ignore
			tds[i].style.padding = "5px";
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
					helperClass="SortableHelper"
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
