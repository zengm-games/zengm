import {
	DndContext,
	DragOverlay,
	closestCenter,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	createContext,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from "react";
import type { DataTableRow } from ".";
import clsx from "clsx";

// Should be Value passed through as generic parameter, but IDK how
type ShouldBeValue = any;

export type HighlightHandle<Value = ShouldBeValue> = (a: {
	index: number;
	value: Value;
}) => boolean;
type RowClassName<Value = ShouldBeValue> = (a: {
	index: number;
	isDragged: boolean;
	value: Value;
}) => string | undefined;
type Row<Value = ShouldBeValue> = (a: {
	index: number;
	value: Value;
}) => ReactNode;

type SortableTableContextInfo = {
	clickedIndex: number | undefined;
	disabled: string; //boolean | undefined;
	draggedIndex: number | undefined;
	highlightHandle: HighlightHandle<ShouldBeValue>;
	renderRow: (props: RenderRowProps) => ReactNode;
	row: string; //Row<ShouldBeValue>;
	rowClassName: string; // RowClassName<ShouldBeValue> | undefined;
	rowLabels: string[] | undefined;
	tableRef: string; //RefObject<HTMLTableElement | null>;
};

const SortableTableContext = createContext<SortableTableContextInfo>(
	{} as SortableTableContextInfo,
);

type SortableHandleProps = {
	index: number;
	value: ShouldBeValue;
	overlay?: boolean;
	style?: CSSProperties;
} & Partial<
	Pick<
		ReturnType<typeof useSortable>,
		"attributes" | "listeners" | "setNodeRef" | "setActivatorNodeRef"
	>
>;

export const SortableHandle = ({
	index,
	value,
	overlay,
	style,
	attributes,
	listeners,
	setActivatorNodeRef,
}: SortableHandleProps) => {
	const {
		clickedIndex,
		disabled,
		draggedIndex,
		highlightHandle,
		row,
		rowClassName,
		rowLabels,
		tableRef,
	} = useContext(SortableTableContext);

	const isDragged = draggedIndex !== undefined;
	const selected = clickedIndex === index;

	const highlight = highlightHandle({ index, value });

	return (
		<td
			className={clsx("roster-handle p-0", {
				"table-info": !selected && highlight,
				"table-secondary": !selected && !highlight,
				"user-select-none": isDragged,
				"bg-primary": selected,
			})}
		>
			<button
				className={`btn border-0 d-block w-100 $ ${isDragged ? "cursor-grabbing" : "cursor-grab"}`}
				style={{
					height: 27,
				}}
				ref={setActivatorNodeRef}
				{...listeners}
				{...attributes}
			/>
		</td>
	);
};

const Row = ({
	index,
	value,
	overlay,
	style,
	attributes,
	listeners,
	setNodeRef,
	setActivatorNodeRef,
}: {
	index: number;
	value: ShouldBeValue;
	overlay?: boolean;
	style?: CSSProperties;
} & Partial<
	Pick<
		ReturnType<typeof useSortable>,
		"attributes" | "listeners" | "setNodeRef" | "setActivatorNodeRef"
	>
>) => {
	const {
		clickedIndex,
		disabled,
		draggedIndex,
		highlightHandle,
		row,
		rowClassName,
		rowLabels,
		tableRef,
	} = useContext(SortableTableContext);

	const isDragged = draggedIndex !== undefined;
	const selected = clickedIndex === index;
	const rowLabel = rowLabels ? (rowLabels[index] ?? "") : undefined;

	/*const className: string | undefined = rowClassName
		? rowClassName({ index, isDragged, value })
		: undefined;*/
	const className = undefined;
	const highlight = highlightHandle({ index, value });

	const overlayRowRef = useRef<HTMLTableRowElement | null>(null);

	/*useLayoutEffect(() => {
		if (overlay && tableRef.current && overlayRowRef.current) {
			// All tds in the first row of the actual table
			const tableTds =
				tableRef.current.querySelector("tbody")!.children[0].children;

			// All tds in the overlay row
			const overlayTds = overlayRowRef.current.children;

			for (let i = 0; i < overlayTds.length; i++) {
				// @ts-expect-error
				overlayTds[i].style.width = `${tableTds[i].offsetWidth}px`;
				// @ts-expect-error
				overlayTds[i].style.padding = "4px";
			}
		}
	}, [overlay, tableRef]);*/

	return (
		<tr
			className={clsx(className, {
				"opacity-0": !overlay && draggedIndex === index,
			})}
			ref={node => {
				if (setNodeRef) {
					setNodeRef(node);
				}
				if (overlay) {
					overlayRowRef.current = node;
				}
			}}
			style={style}
		>
			{rowLabel !== undefined ? (
				<td className="text-center">{rowLabel}</td>
			) : null}
			{disabled ? (
				<td className="p-0" />
			) : (
				<td
					className={clsx("roster-handle p-0", {
						"table-info": !selected && highlight,
						"table-secondary": !selected && !highlight,
						"user-select-none": isDragged,
						"bg-primary": selected,
					})}
				>
					<button
						className={`btn border-0 d-block w-100 $ ${isDragged ? "cursor-grabbing" : "cursor-grab"}`}
						style={{
							height: 27,
						}}
						ref={setActivatorNodeRef}
						{...listeners}
						{...attributes}
					/>
				</td>
			)}
			{row({
				index,
				value,
			})}
		</tr>
	);
};

export type RenderRowProps = SortableHandleProps & {
	draggedIndex: number | undefined;
};

export const DraggableRow = ({
	id,
	value,
}: {
	id: string;
	value: ShouldBeValue;
}) => {
	const {
		attributes,
		index,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ id });
	const { draggedIndex, renderRow } = useContext(SortableTableContext);

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return renderRow({
		index,
		value,
		style,
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		draggedIndex,
	});
};

export const SortableContextWrappers = ({
	children,
	highlightHandle,
	onChange,
	onSwap,
	renderRow,
	rows,
}: {
	children: ReactNode;
	highlightHandle: HighlightHandle<DataTableRow>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	renderRow: (props: RenderRowProps) => ReactNode;
	rows: DataTableRow[];
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | undefined>(
		undefined,
	);
	const [clickedIndex, setClickedIndex] = useState<number | undefined>(
		undefined,
	);
	console.log("render SortableContextWrappers", { draggedIndex, clickedIndex });

	// Hacky shit to try to determine click from drag. start is to track how long a click lasted.
	const clicked = useRef<{
		index: number | undefined;
		start: number; // Milliseconds
	}>({
		index: undefined,
		start: 0,
	});

	const context = useMemo(
		() => ({
			clickedIndex,
			disabled: "???",
			draggedIndex,
			highlightHandle,
			renderRow,
			row: "???",
			rowClassName: "???",
			rowLabels: undefined,
			tableRef: "???",
		}),
		[clickedIndex, draggedIndex, highlightHandle, renderRow],
	);

	// string rather than string | number because 0 as an ID doesn't work, and that's more likely than an empty string!
	const ids = rows.map(row => String(row.key));

	// If I use the default sensor (pointer rather than mouse+touch) everything works (as long as you put touch-action-none on the handle)... except on iOS for some reason it sometimes only fires click events rather than pointer events. This seems to happen for roughly the bottom 2/3 of rows in the table. No idea why.
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

	return (
		<DndContext
			sensors={sensors}
			onDragStart={event => {
				const index = ids.indexOf(event.active.id as string);
				setDraggedIndex(index);

				clicked.current.index = index;
				clicked.current.start = Date.now();
			}}
			onDragEnd={event => {
				setDraggedIndex(undefined);
				const oldId = event.active.id as string;
				const newId = event.over?.id as string | undefined;

				const oldIndex = ids.indexOf(oldId);

				// For fast clicks, newId will be undefined. For slower clicks, it might be
				if (
					newId === undefined ||
					(newId === oldId && Date.now() - clicked.current.start < 500)
				) {
					// Make sure the click started on this item, otherwise it's not a click it's a drag
					if (clicked.current.index === oldIndex) {
						if (clickedIndex === undefined) {
							// Click on unhighlighted item and no other item is highlighted - highlight
							setClickedIndex(oldIndex);
						} else if (clickedIndex === oldIndex) {
							// Click on highlighted item - unhighlight
							setClickedIndex(undefined);
						} else {
							// Click on unhighlighted item and another item is highlighted - swap
							onSwap(clickedIndex, oldIndex);
							setClickedIndex(undefined);
						}
					}

					clicked.current.index = undefined;
				} else if (newId !== undefined) {
					const newIndex = ids.indexOf(newId);

					onChange({ oldIndex, newIndex });

					// Reset any clicked on after a drag
					setClickedIndex(undefined);
				}
			}}
			onDragOver={event => {
				const oldId = event.active.id as string;
				const newId = event.over?.id as string | undefined;
				if (newId !== undefined && oldId !== newId) {
					// Dragged over something besides self, so this can't be a click
					clicked.current.index = undefined;
				}
			}}
			onDragCancel={() => {
				setDraggedIndex(undefined);
				clicked.current.index = undefined;
			}}
			collisionDetection={closestCenter}
		>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<SortableTableContext.Provider value={context}>
					{children}
				</SortableTableContext.Provider>
			</SortableContext>
		</DndContext>
	);
};

export const MyDragOverlay = () => {
	const { draggedIndex, row } = useContext(SortableTableContext);

	console.log("MyDragOverlay", draggedIndex, row);
	return (
		<DragOverlay wrapperElement="tbody">
			{draggedIndex !== undefined ? <div>HELLO!</div> : null}
		</DragOverlay>
	);
};
