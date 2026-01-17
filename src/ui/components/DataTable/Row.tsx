import clsx from "clsx";
import { use, type MouseEvent } from "react";
import useClickable from "../../hooks/useClickable.tsx";
import type { DataTableRow, DataTableRowMetadata } from "./index.tsx";
import {
	SortableHandle,
	SortableTableContext,
	type RenderRowProps,
} from "./sortableRows.tsx";
import { DataTableContext } from "./contexts.ts";

type MyRow = Omit<DataTableRow, "data"> & {
	data: any[];
};

const BulkSelectCheckbox = ({
	rowKey,
	metadata,
}: {
	rowKey: DataTableRow["key"];
	metadata: DataTableRowMetadata;
}) => {
	const { disableBulkSelectKeys, selectedRows } = use(DataTableContext);

	const onChange = () => {
		selectedRows.toggle(rowKey, metadata);
	};

	// Similar to singleCheckbox stuff below
	const onClickCell = (event: MouseEvent) => {
		if (event.target && (event.target as any).tagName === "TD" && !disabled) {
			onChange();
		}
	};

	const checked = selectedRows.map.has(rowKey);
	const disabled = !!disableBulkSelectKeys?.has(rowKey);

	return (
		<td data-no-row-highlight onClick={onClickCell}>
			<input
				className="form-check-input"
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={onChange}
			/>
		</td>
	);
};

const Row = ({
	row,
	sortableRows,
}: {
	row: MyRow;
	sortableRows?: RenderRowProps;
}) => {
	const {
		clickable,
		highlightCols,
		isFiltered,
		showBulkSelectCheckboxes,
		showRowLabels,
		sortBys,
	} = use(DataTableContext);

	const { clicked, toggleClicked } = useClickable();

	let classNames;
	let disableSort;
	if (sortableRows || typeof row.classNames === "function") {
		const { disableRow, draggedIndex } = use(SortableTableContext);

		if (sortableRows && disableRow) {
			disableSort = disableRow(sortableRows.index);
		}

		if (typeof row.classNames === "function") {
			classNames = row.classNames({
				isDragged: draggedIndex !== undefined,
				isFiltered,
				sortBys,
			});
		}
	}
	if (typeof row.classNames !== "function") {
		classNames = row.classNames;
	}

	let seenColSpanToEnd = false;

	return (
		<tr
			className={clsx(classNames, {
				"table-warning": clickable && clicked,
				"opacity-0":
					sortableRows &&
					!sortableRows.overlay &&
					sortableRows.draggedIndex === sortableRows.index,
			})}
			onClick={clickable ? toggleClicked : undefined}
			// Not sure why this works to disable sorting for certain rows, but it seems to work!
			ref={disableSort ? undefined : sortableRows?.setNodeRef}
			style={sortableRows?.style}
		>
			{showBulkSelectCheckboxes ? (
				row.metadata ? (
					<BulkSelectCheckbox rowKey={row.key} metadata={row.metadata} />
				) : (
					<td />
				)
			) : null}
			{showRowLabels ? <td>{row.rowLabel}</td> : null}
			{sortableRows ? <SortableHandle {...sortableRows} /> : null}
			{row.data.map((value = null, i) => {
				if (seenColSpanToEnd) {
					// If we've seen colSpanToEnd, don't render any more columns in this row
					return;
				}

				// Value is either the value, or an object containing the value as a property
				const actualValue =
					value !== null && Object.hasOwn(value, "value") ? value.value : value;

				const props: any = {};

				const highlightCol = highlightCols.includes(i);
				if (value?.classNames) {
					props.className = clsx(
						value.classNames,
						highlightCol ? "sorting_highlight" : undefined,
					);
				} else if (highlightCol) {
					props.className = "sorting_highlight";
				}

				if (value?.colSpanToEnd) {
					props.colSpan = row.data.length - i;
					seenColSpanToEnd = true;
				}
				if (value?.style) {
					props.style = value.style;
				}
				if (value?.title) {
					props.title = value.title;
				}

				const singleCheckbox =
					actualValue?.type === "input" &&
					actualValue.props.type === "checkbox" &&
					actualValue.props.onChange;
				const singleButton =
					actualValue?.type === "button" && actualValue.props.onClick;

				// Expand clickable area of checkboxes/buttons to the whole td - similar logic is elsewhere, search for singleCheckbox
				if (singleCheckbox || singleButton) {
					props.onClick = (event: MouseEvent) => {
						if (
							event.target &&
							(event.target as any).tagName === "TD" &&
							!actualValue.props.disabled
						) {
							if (singleCheckbox) {
								actualValue.props.onChange();
							} else {
								actualValue.props.onClick();
							}
						}
					};
					props["data-no-row-highlight"] = "true";
				}

				if (value?.header) {
					return (
						<th key={i} {...props}>
							{actualValue}
						</th>
					);
				}

				return (
					<td key={i} {...props}>
						{actualValue}
					</td>
				);
			})}
		</tr>
	);
};

export default Row;
