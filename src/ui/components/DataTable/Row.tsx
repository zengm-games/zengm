import clsx from "clsx";
import { useContext, type MouseEvent } from "react";
import useClickable from "../../hooks/useClickable";
import type { DataTableRow, DataTableRowMetadata } from ".";
import { SortableHandle, type RenderRowProps } from "./sortable";
import { DataTableContext } from "./contexts";

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
	const { disableBulkSelectKeys, selectedRows } = useContext(DataTableContext);

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

const Row = ({ row, sortable }: { row: MyRow; sortable?: RenderRowProps }) => {
	const { clickable, highlightCols, showBulkSelectCheckboxes } =
		useContext(DataTableContext);

	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			className={clsx(row.classNames, {
				"table-warning": clickable && clicked,
				"opacity-0":
					sortable &&
					!sortable.overlay &&
					sortable.draggedIndex === sortable.index,
			})}
			onClick={clickable ? toggleClicked : undefined}
			ref={sortable?.setNodeRef}
			style={sortable?.style}
		>
			{showBulkSelectCheckboxes ? (
				row.metadata ? (
					<BulkSelectCheckbox rowKey={row.key} metadata={row.metadata} />
				) : (
					<td />
				)
			) : null}
			{sortable ? <SortableHandle {...sortable} /> : null}
			{row.data.map((value = null, i) => {
				// Value is either the value, or an object containing the value as a property
				const actualValue =
					value !== null && Object.hasOwn(value, "value") ? value.value : value;

				const props: any = {};

				const highlightCol = highlightCols.includes(i);
				if (value && value.classNames) {
					props.className = clsx(
						value.classNames,
						highlightCol ? "sorting_highlight" : undefined,
					);
				} else if (highlightCol) {
					props.className = "sorting_highlight";
				}

				if (value && value.title) {
					props.title = value.title;
				}

				if (value && value.style) {
					props.style = value.style;
				}

				const singleCheckbox =
					actualValue &&
					actualValue.type === "input" &&
					actualValue.props.type === "checkbox" &&
					actualValue.props.onChange;
				const singleButton =
					actualValue &&
					actualValue.type === "button" &&
					actualValue.props.onClick;

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
