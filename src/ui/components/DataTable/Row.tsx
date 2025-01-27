import clsx from "clsx";
import { useRef, type MouseEvent } from "react";
import useClickable from "../../hooks/useClickable";
import type { DataTableRow, DataTableRowMetadata } from ".";
import { SortableHandle, type RenderRowProps } from "./sortable";

type MyRow = Omit<DataTableRow, "data"> & {
	data: any[];
};

type OnBulkSelectToggle = (
	key: DataTableRow["key"],
	metadata: DataTableRowMetadata,
) => void;

const BulkSelectCheckbox = ({
	checked,
	disabled,
	rowKey,
	metadata,
	onToggle,
}: {
	checked: boolean;
	disabled: boolean;
	rowKey: DataTableRow["key"];
	metadata: DataTableRowMetadata;
	onToggle: OnBulkSelectToggle;
}) => {
	const onChange = () => {
		onToggle(rowKey, metadata);
	};

	// Similar to singleCheckbox stuff below
	const onClickCell = (event: MouseEvent) => {
		if (event.target && (event.target as any).tagName === "TD" && !disabled) {
			onChange();
		}
	};

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
	clickable,
	highlightCols,
	row,

	bulkSelectChecked,
	disableBulkSelectCheckbox,
	onBulkSelectToggle,
	showBulkSelectCheckboxes,

	sortable,
	overlay,
}: {
	clickable?: boolean;
	highlightCols: number[];
	row: MyRow;

	bulkSelectChecked: boolean;
	disableBulkSelectCheckbox: boolean;
	onBulkSelectToggle: OnBulkSelectToggle;
	showBulkSelectCheckboxes: boolean;

	sortable?: RenderRowProps;
	overlay?: boolean;
}) => {
	const { clicked, toggleClicked } = useClickable();

	const overlayRowRef = useRef<HTMLTableRowElement | null>(null);

	return (
		<tr
			className={clsx(row.classNames, {
				"table-warning": clickable && clicked,
				"opacity-0":
					sortable && !overlay && sortable.draggedIndex === sortable.index,
			})}
			onClick={clickable ? toggleClicked : undefined}
			ref={node => {
				if (sortable?.setNodeRef) {
					sortable.setNodeRef(node);
				}
				if (overlay) {
					overlayRowRef.current = node;
				}
			}}
			style={sortable?.style}
		>
			{showBulkSelectCheckboxes ? (
				row.metadata ? (
					<BulkSelectCheckbox
						checked={bulkSelectChecked}
						disabled={disableBulkSelectCheckbox}
						rowKey={row.key}
						metadata={row.metadata}
						onToggle={onBulkSelectToggle}
					/>
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
