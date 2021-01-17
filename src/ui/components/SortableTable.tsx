import classNames from "classnames";
import PropTypes from "prop-types";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
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
type Row<Value> = (a: { index: number; value: Value }) => ReactNode;

// Should be Value passed through as generic parameter, but that is annoying with HOC
type ShouldBeValue = any;

const ReorderHandle = SortableHandle(
	({
		highlight,
		isDragged,
		selected,
	}: {
		highlight: boolean;
		isDragged: boolean;
		selected: boolean;
	}) => {
		return (
			<td
				className={classNames("roster-handle", {
					"table-info": !selected && highlight,
					"table-secondary": !selected && !highlight,
					"user-select-none": isDragged,
					"bg-primary": selected,
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
		selected: boolean;
		row: Row<ShouldBeValue>;
		value: ShouldBeValue;
	}) => {
		const { clicked, toggleClicked } = useClickable();

		const {
			className,
			disabled2,
			highlight,
			i,
			isDragged,
			row,
			selected,
			value,
		} = props;

		return (
			<tr
				className={classNames(className, {
					"table-warning": clicked,
				})}
				onClick={toggleClicked}
			>
				{disabled2 ? null : (
					<ReorderHandle
						highlight={highlight}
						isDragged={isDragged}
						selected={selected}
					/>
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
		indexSelected,
		isDragged,
		row,
		rowClassName,
		values,
	}: {
		disabled?: boolean;
		highlightHandle: HighlightHandle<ShouldBeValue>;
		indexSelected: number | undefined;
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
							selected={indexSelected === index}
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
	highlightHandle: PropTypes.func.isRequired,
	isDragged: PropTypes.bool.isRequired,
	row: PropTypes.func.isRequired,
	rowClassName: PropTypes.func,
	values: PropTypes.array.isRequired,
};

const SortableTable = <Value extends Record<string, unknown>>({
	cols,
	disabled,
	highlightHandle,
	onChange,
	onSwap,
	row,
	rowClassName,
	values,
}: {
	cols: () => ReactNode;
	disabled?: boolean;
	highlightHandle: HighlightHandle<Value>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	row: Row<Value>;
	rowClassName?: RowClassName<Value>;
	values: Value[];
}) => {
	const [isDragged, setIsDragged] = useState(false);
	const [indexSelected, setIndexSelected] = useState<number | undefined>(
		undefined,
	);

	// Hacky shit to try to determine click from drag. Could just be a boolean, except on mobile seems sorting fires twice in a row, so we need to track the time to debounce.
	const clicked = useRef<{
		index: number | undefined;
		time: number; // Milliseconds
	}>({
		index: undefined,
		time: 0,
	});

	const onSortStart = useCallback(({ node, index }) => {
		setIsDragged(true);

		// Hack to avoid responding to duiplicated event on mobile
		const ignoreToDebounce = Date.now() - clicked.current.time < 500;
		if (!ignoreToDebounce) {
			clicked.current.index = index;
		}

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

	const onSortOver = useCallback(() => {
		clicked.current.index = undefined;
	}, []);

	const onSortEnd = useCallback(
		({ oldIndex, newIndex }) => {
			setIsDragged(false);

			// Hack to avoid responding to duiplicated event on mobile
			const ignoreToDebounce = Date.now() - clicked.current.time < 500;
			if (ignoreToDebounce) {
				return;
			}
			clicked.current.time = Date.now();

			if (oldIndex === newIndex && clicked.current.index === newIndex) {
				if (indexSelected === undefined) {
					setIndexSelected(newIndex);
				} else if (indexSelected === newIndex) {
					// Hack to avoid responding to duiplicated event on mobile
					if (!ignoreToDebounce) {
						setIndexSelected(undefined);
					}
				} else {
					onSwap(indexSelected, newIndex);
					setIndexSelected(undefined);
				}
			} else {
				onChange({ oldIndex, newIndex });
				setIndexSelected(undefined);
			}
			clicked.current.index = undefined;
		},
		[onChange, onSwap, indexSelected],
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
					indexSelected={indexSelected}
					isDragged={isDragged}
					onSortEnd={onSortEnd}
					onSortStart={onSortStart}
					onSortOver={onSortOver}
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
