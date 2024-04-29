import classNames from "classnames";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import useClickable from "../hooks/useClickable";
import type { StickyCols } from "./DataTable";
import useStickyXX from "./DataTable/useStickyXX";
import {
	DndContext,
	DragOverlay,
	useSensors,
	useSensor,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

type HighlightHandle<Value> = (a: { index: number; value: Value }) => boolean;
type RowClassName<Value> = (a: {
	index: number;
	isDragged: boolean;
	value: Value;
}) => string | undefined;
type Row<Value> = (a: { index: number; value: Value }) => ReactNode;

// Should be Value passed through as generic parameter, but that is annoying with HOC
type ShouldBeValue = any;

type SortableTableContextInfo = {
	disabled: boolean | undefined;
	highlightHandle: HighlightHandle<ShouldBeValue>;
	id: any;
	indexSelected: number | undefined;
	isDragged: boolean;
	row: Row<ShouldBeValue>;
	rowClassName: RowClassName<ShouldBeValue> | undefined;
	rowLabels: string[] | undefined;
};

const SortableTableContext = createContext<SortableTableContextInfo>(
	{} as SortableTableContextInfo,
);

const DraggableRow = ({ value }: { value: ShouldBeValue }) => {
	const { disabled, id } = useContext(SortableTableContext);

	const {
		attributes,
		index,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ disabled, id: value[id] });

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
	style,
	attributes,
	listeners,
	setNodeRef,
	setActivatorNodeRef,
}: { index: number; value: ShouldBeValue; style?: CSSProperties } & Partial<
	Pick<
		ReturnType<typeof useSortable>,
		"attributes" | "listeners" | "setNodeRef" | "setActivatorNodeRef"
	>
>) => {
	const { clicked, toggleClicked } = useClickable();

	const {
		disabled,
		highlightHandle,
		indexSelected,
		isDragged,
		row,
		rowClassName,
		rowLabels,
	} = useContext(SortableTableContext);

	const selected = indexSelected === index;
	const rowLabel = rowLabels ? rowLabels[index] ?? "" : undefined;

	const className: string | undefined = rowClassName
		? rowClassName({ index, isDragged, value })
		: undefined;
	const highlight = highlightHandle({ index, value });

	return (
		<tr
			className={classNames(className, {
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
			ref={setNodeRef}
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
	id,
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
	id: keyof Value;
	highlightHandle: HighlightHandle<Value>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	row: Row<Value>;
	rowClassName?: RowClassName<Value>;
	rowLabels?: string[];
	stickyCols?: StickyCols;
	values: Value[];
}) => {
	const [activeIndex, setActiveIndex] = useState<any>(undefined);
	const [indexSelected, setIndexSelected] = useState<number | undefined>(
		undefined,
	);

	const { stickyClass, tableRef } = useStickyXX(stickyCols);

	// Hacky shit to try to determine click from drag. Could just be a boolean, except on mobile seems sorting fires twice in a row, so we need to track the time to debounce.
	const clicked = useRef<{
		index: number | undefined;
		time: number; // Milliseconds
	}>({
		index: undefined,
		time: 0,
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
	);*/

	let tableClasses =
		"table table-striped table-borderless table-sm table-hover";
	if (stickyClass) {
		tableClasses += ` ${stickyClass}`;
	}

	const isDragged = activeIndex !== undefined;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const context = useMemo(
		() => ({
			disabled,
			highlightHandle,
			id,
			indexSelected,
			isDragged,
			row,
			rowClassName,
			rowLabels,
		}),
		[
			disabled,
			highlightHandle,
			id,
			indexSelected,
			isDragged,
			row,
			rowClassName,
			rowLabels,
		],
	);

	return (
		<DndContext
			onDragStart={event => {
				console.log("onDragStart", event);
				setActiveIndex(
					values.findIndex(value => value[id] === event.active.id),
				);
			}}
			onDragMove={event => {
				// console.log("onDragMove", event);
			}}
			onDragOver={event => {
				// console.log("onDragOver", event);
			}}
			onDragEnd={event => {
				setActiveIndex(undefined);
				console.log("onDragEnd", event);
				const oldId = event.active.id as number;
				const newId = event.over?.id as number | undefined;
				if (newId !== undefined) {
					const oldIndex = values.findIndex(value => value[id] === oldId);
					const newIndex = values.findIndex(value => value[id] === newId);
					onChange({ oldIndex, newIndex });
				}
			}}
			onDragCancel={() => console.log("onDragCancel")}
			collisionDetection={closestCenter}
		>
			<SortableContext
				items={values.map(value => value[id])}
				strategy={verticalListSortingStrategy}
			>
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
								{values.map(value => {
									return <DraggableRow key={value[id]} value={value} />;
								})}
							</tbody>
							<DragOverlay wrapperElement="tbody">
								{activeIndex !== undefined ? (
									<Row index={activeIndex} value={values[activeIndex]} />
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
