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
	use,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from "react";
import type { DataTableRow } from "./index.tsx";
import clsx from "clsx";

export type DisableRow = (index: number) => boolean;

export type HighlightHandle = (a: {
	index: number;
	row: DataTableRow;
}) => boolean;

export const SortableTableContext = createContext<{
	clickedIndex: number | undefined;
	disableRow: DisableRow | undefined;
	draggedIndex: number | undefined;
	highlightHandle: HighlightHandle | undefined;
	renderRow: (props: RenderRowProps) => ReactNode;
	rows: DataTableRow[];
	tableRef: RefObject<HTMLTableElement | null>;
}>({} as any);

type SortableHandleProps = {
	index: number;
	row: DataTableRow;
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
	row,
	overlay,
	attributes,
	listeners,
	setActivatorNodeRef,
}: SortableHandleProps) => {
	const { clickedIndex, disableRow, draggedIndex, highlightHandle, tableRef } =
		use(SortableTableContext);

	const sortableHandleRef = useRef<HTMLTableCellElement | null>(null);

	useLayoutEffect(() => {
		if (overlay && tableRef.current && sortableHandleRef.current) {
			// All tds in the first row of the actual table
			const tableTds =
				tableRef.current.querySelector("tbody")!.children[0]!.children;

			// All tds in the overlay row
			const overlayTds = sortableHandleRef.current.parentElement!.children;

			for (let i = 0; i < overlayTds.length; i++) {
				const overlayTd = overlayTds[i] as HTMLTableCellElement | undefined;
				if (overlayTd) {
					const tableTd = tableTds[i] as HTMLTableCellElement | undefined;

					if (tableTd) {
						overlayTd.style.width = `${tableTd.offsetWidth}px`;
					}
					overlayTd.style.padding = "4px";
				}
			}
		}
	}, [overlay, tableRef]);

	if (disableRow?.(index)) {
		return <td className="roster-handle p-0" />;
	}

	const isDragged = draggedIndex !== undefined;
	const selected = clickedIndex === index;

	// If highlightHandle is not defined, highlight them all
	const highlight = !highlightHandle || highlightHandle({ index, row });

	return (
		<td
			className={clsx("roster-handle p-0", {
				// Colors need to be here rather than on button so they play nice with hover/clicked table row highlighting
				"bg-primary": selected,
				"table-info": !selected && highlight,
				"table-secondary": !selected && !highlight,
				"user-select-none": isDragged,
			})}
			ref={sortableHandleRef}
			style={{
				height: 27,
			}}
		>
			<button
				className={clsx(
					"btn border-0 rounded-0 d-block w-100 h-100",
					isDragged ? "cursor-grabbing" : "cursor-grab",
				)}
				ref={setActivatorNodeRef}
				{...listeners}
				{...attributes}
			/>
		</td>
	);
};

export type RenderRowProps = SortableHandleProps & {
	draggedIndex: number | undefined;
};

export const DraggableRow = ({
	id,
	row,
}: {
	id: string;
	row: DataTableRow;
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
	const { draggedIndex, renderRow } = use(SortableTableContext);

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return renderRow({
		index,
		row,
		style,
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		draggedIndex,
	});
};

export const getId = (row: DataTableRow) => {
	// string rather than string | number because 0 as an ID doesn't work, and that's more likely than an empty string!
	return String(row.key);
};

export const SortableContextWrappers = ({
	children,
	disableRow,
	highlightHandle,
	onChange,
	onSwap,
	renderRow,
	rows,
	tableRef,
}: {
	children: ReactNode;
	disableRow?: DisableRow;
	highlightHandle?: HighlightHandle;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	renderRow: (props: RenderRowProps) => ReactNode;
	rows: DataTableRow[];
	tableRef: RefObject<HTMLTableElement | null>;
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | undefined>(
		undefined,
	);
	const [clickedIndex, setClickedIndex] = useState<number | undefined>(
		undefined,
	);

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
			disableRow,
			draggedIndex,
			highlightHandle,
			renderRow,
			tableRef,
			rows,
		}),
		[
			clickedIndex,
			disableRow,
			draggedIndex,
			highlightHandle,
			renderRow,
			rows,
			tableRef,
		],
	);

	const ids = rows.map((row) => getId(row));

	// If I use the default sensor (pointer rather than mouse+touch) everything works (as long as you put touch-action-none on the handle)... except on iOS for some reason it sometimes only fires click events rather than pointer events. This seems to happen for roughly the bottom 2/3 of rows in the table. No idea why.
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

	return (
		<DndContext
			sensors={sensors}
			onDragStart={(event) => {
				const index = ids.indexOf(event.active.id as string);
				setDraggedIndex(index);

				clicked.current.index = index;
				clicked.current.start = Date.now();
			}}
			onDragEnd={(event) => {
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
			onDragOver={(event) => {
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
				<SortableTableContext value={context}>{children}</SortableTableContext>
			</SortableContext>
		</DndContext>
	);
};

export const MyDragOverlay = () => {
	const { draggedIndex, renderRow, rows } = use(SortableTableContext);

	return (
		<DragOverlay wrapperElement="tbody">
			{draggedIndex !== undefined
				? renderRow({
						draggedIndex,
						index: draggedIndex,
						overlay: true,
						row: rows[draggedIndex]!,
					})
				: null}
		</DragOverlay>
	);
};
