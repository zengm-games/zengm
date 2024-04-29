import classNames from "classnames";
import {
	createContext,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import useClickable from "../hooks/useClickable";
import type { StickyCols } from "./DataTable";
import useStickyXX from "./DataTable/useStickyXX";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type HighlightHandle<Value> = (a: { index: number; value: Value }) => boolean;
type RowClassName<Value> = (a: {
	index: number;
	isDragged: boolean;
	value: Value;
}) => string | undefined;
type Row<Value> = (a: { index: number; value: Value }) => ReactNode;

// Should be Value passed through as generic parameter, but IDK how
type ShouldBeValue = any;

type SortableTableContextInfo = {
	clickedIndex: number | undefined;
	disabled: boolean | undefined;
	draggedIndex: number | undefined;
	highlightHandle: HighlightHandle<ShouldBeValue>;
	row: Row<ShouldBeValue>;
	rowClassName: RowClassName<ShouldBeValue> | undefined;
	rowLabels: string[] | undefined;
	tableRef: RefObject<HTMLTableElement>;
};

const SortableTableContext = createContext<SortableTableContextInfo>(
	{} as SortableTableContextInfo,
);

const DraggableRow = ({ id, value }: { id: string; value: ShouldBeValue }) => {
	const { disabled } = useContext(SortableTableContext);

	const {
		attributes,
		index,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ disabled, id });

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return (
		<Row
			index={index}
			value={value}
			style={style}
			attributes={attributes}
			listeners={listeners}
			setNodeRef={setNodeRef}
			setActivatorNodeRef={setActivatorNodeRef}
		/>
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
	const { clicked, toggleClicked } = useClickable();

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
	const rowLabel = rowLabels ? rowLabels[index] ?? "" : undefined;

	const className: string | undefined = rowClassName
		? rowClassName({ index, isDragged, value })
		: undefined;
	const highlight = highlightHandle({ index, value });

	const overlayRowRef = useRef<HTMLTableRowElement | null>(null);

	useLayoutEffect(() => {
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
	}, [overlay, tableRef]);

	return (
		<tr
			className={classNames(className, {
				"table-warning": clicked,
				"opacity-0": !overlay && draggedIndex === index,
			})}
			onClick={toggleClicked}
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
					className={classNames("roster-handle p-0", {
						"table-info": !selected && highlight,
						"table-secondary": !selected && !highlight,
						"user-select-none": isDragged,
						"bg-primary": selected,
					})}
				>
					<a
						className={classNames("d-block w-100")}
						style={{
							cursor: isDragged ? "grabbing" : "grab",
							height: 27,

							// This is needed for mobile https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action
							touchAction: "none",
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

const SortableTable = <
	Id extends string,
	Value extends Record<string, unknown> & Record<Id, string | number>,
>({
	cols,
	disabled,
	getId,
	highlightHandle,
	onChange,
	onSwap,
	row,
	rowClassName,
	rowLabels,
	stickyCols = 0,
	values,
}: {
	cols: () => ReactNode;
	disabled?: boolean;
	getId: (value: Value) => string; // string rather than string | number because 0 as an ID doesn't work, and that's more likely than an empty string!
	highlightHandle: HighlightHandle<Value>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	row: Row<Value>;
	rowClassName?: RowClassName<Value>;
	rowLabels?: string[];
	stickyCols?: StickyCols;
	values: Value[];
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | undefined>(
		undefined,
	);
	const [clickedIndex, setClickedIndex] = useState<number | undefined>(
		undefined,
	);

	const { stickyClass, tableRef } = useStickyXX(stickyCols);

	// Hacky shit to try to determine click from drag. start is to track how long a click lasted.
	const clicked = useRef<{
		index: number | undefined;
		start: number; // Milliseconds
	}>({
		index: undefined,
		start: 0,
	});

	/*const onSortStart = useCallback(
		({ node, index }: { node: Element; index: number }) => {
			setIsDragged(true);

			// Hack to avoid responding to duiplicated event on mobile
			const ignoreToDebounce = Date.now() - clicked.current.time < 500;
			if (!ignoreToDebounce) {
				clicked.current.index = index;
			}

			// https://github.com/clauderic/react-sortable-hoc/issues/361#issuecomment-471907612
			const tds =
				document.getElementsByClassName("SortableHelper")[0].childNodes;
			for (let i = 0; i < tds.length; i++) {
				const childNode = node.childNodes[i];
				// @ts-expect-error
				tds[i].style.width = `${childNode.offsetWidth}px`;
				// @ts-expect-error
				tds[i].style.padding = "4px";
			}
		},
		[],
	);

	const onSortOver = useCallback(() => {
		clicked.current.index = undefined;
	}, []);

	const onSortEnd = useCallback(
		({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
			setIsDragged(false);

			// Hack to avoid responding to duiplicated event on mobile
			const ignoreToDebounce = Date.now() - clicked.current.time < 500;
			if (ignoreToDebounce) {
				return;
			}
			clicked.current.time = Date.now();

			if (oldIndex === newIndex && clicked.current.index === newIndex) {
				if (clickedIndex === undefined) {
					setClickedIndex(newIndex);
				} else if (clickedIndex === newIndex) {
					// Hack to avoid responding to duiplicated event on mobile
					if (!ignoreToDebounce) {
						setClickedIndex(undefined);
					}
				} else {
					onSwap(clickedIndex, newIndex);
					setClickedIndex(undefined);
				}
			} else {
				onChange({ oldIndex, newIndex });
				setClickedIndex(undefined);
			}
			clicked.current.index = undefined;
		},
		[onChange, onSwap, clickedIndex],
	);*/

	let tableClasses =
		"table table-striped table-borderless table-sm table-hover";
	if (stickyClass) {
		tableClasses += ` ${stickyClass}`;
	}

	const context = useMemo(
		() => ({
			clickedIndex,
			disabled,
			draggedIndex,
			highlightHandle,
			row,
			rowClassName,
			rowLabels,
			tableRef,
		}),
		[
			clickedIndex,
			disabled,
			draggedIndex,
			highlightHandle,
			row,
			rowClassName,
			rowLabels,
			tableRef,
		],
	);

	const ids = values.map(value => getId(value));

	return (
		<DndContext
			onDragStart={event => {
				const index = ids.indexOf(event.active.id as string);
				setDraggedIndex(index);

				clicked.current.index = index;
				clicked.current.start = Date.now();
			}}
			onDragEnd={event => {
				setDraggedIndex(undefined);
				console.log("onDragEnd", event);
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
					<ResponsiveTableWrapper nonfluid>
						<table ref={tableRef} className={tableClasses}>
							<thead>
								<tr>
									<th className="p-0" />
									{rowLabels ? <th className="p-0" /> : null}
									{cols()}
								</tr>
							</thead>
							<tbody>
								{values.map((value, i) => {
									return (
										<DraggableRow key={ids[i]} id={ids[i]} value={value} />
									);
								})}
							</tbody>
							<DragOverlay wrapperElement="tbody">
								{draggedIndex !== undefined ? (
									<Row
										index={draggedIndex}
										value={values[draggedIndex]}
										overlay
									/>
								) : null}
							</DragOverlay>
						</table>
					</ResponsiveTableWrapper>
				</SortableTableContext.Provider>
			</SortableContext>
		</DndContext>
	);
};

export default SortableTable;
