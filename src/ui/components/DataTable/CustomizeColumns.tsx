import type { Col, StickyCols } from ".";
import { type CSSProperties } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Modal from "../Modal";

const DraggableItem = ({
	col,
	disabled,
	id,
	hidden,
	onToggleHidden,
}: {
	col?: Col;
	disabled: boolean;
	id: string;
	hidden?: boolean;
	onToggleHidden: () => void;
}) => {
	const {
		active,
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ id, disabled });

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return (
		<Item
			col={col}
			disabled={disabled}
			hidden={hidden}
			onToggleHidden={onToggleHidden}
			style={style}
			isDragged={!!active}
			attributes={attributes}
			listeners={listeners}
			setNodeRef={setNodeRef}
			setActivatorNodeRef={setActivatorNodeRef}
		/>
	);
};

const Item = ({
	col,
	disabled,
	hidden,
	onToggleHidden,
	style,
	isDragged,
	attributes,
	listeners,
	setNodeRef,
	setActivatorNodeRef,
}: {
	col?: Col;
	disabled: boolean;
	hidden?: boolean;
	onToggleHidden: () => void;
	style?: CSSProperties;
	isDragged: boolean;
} & Partial<
	Pick<
		ReturnType<typeof useSortable>,
		"attributes" | "listeners" | "setNodeRef" | "setActivatorNodeRef"
	>
>) => {
	let title;
	if (col) {
		title = col.title;
		if (col.desc) {
			title += ` (${col.desc})`;
		}
		if (title === "") {
			title = "No Title";
		}
	} else {
		title = (
			<span className="text-body-secondary">Not Currently Available</span>
		);
	}

	return (
		<div className="form-check" ref={setNodeRef} style={style}>
			<input
				className="form-check-input"
				type="checkbox"
				checked={!hidden}
				onChange={onToggleHidden}
			/>
			<label
				className={`form-check-label touch-action-none ${disabled ? "" : isDragged ? " cursor-grabbing" : " cursor-grab"}`}
				ref={setActivatorNodeRef}
				style={{
					minWidth: 100,
				}}
				{...listeners}
				{...attributes}
			>
				{title}
			</label>
		</div>
	);
};

const CustomizeColumns = ({
	colOrder,
	cols,
	hasSuperCols,
	onChangeStickyCols,
	onHide,
	onReset,
	onChange,
	onToggleHidden,
	show,
	stickyCols,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	hasSuperCols: boolean;
	onChangeStickyCols: (stickyCols: StickyCols) => void;
	onHide: () => void;
	onReset: () => void;
	onChange: (arg: { oldIndex: number; newIndex: number }) => void;
	onToggleHidden: (i: number) => () => void;
	show: boolean;
	stickyCols: StickyCols;
}) => {
	const stickyColsOptions = [0, 1, 2, 3] as StickyCols[];

	const ids = colOrder.map(col => String(col.colIndex));

	return (
		<Modal animation={false} centered show={show} onHide={onHide}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				<div className="d-flex mb-3 align-items-center">
					<div>Number of sticky columns:</div>
					<div className="btn-group ms-2">
						{stickyColsOptions.map(i => (
							<button
								key={i}
								className={`btn ${
									stickyCols === i ? "btn-primary" : "btn-secondary"
								}`}
								onClick={() => {
									onChangeStickyCols(i);
								}}
							>
								{i}
							</button>
						))}
					</div>
				</div>
				<p>
					Click and drag to reorder columns, or use the checkboxes to show/hide
					columns.
				</p>
				{hasSuperCols ? (
					<p className="text-danger">
						This table has two header rows. That means you can enable/disable
						columns, but not reorder them.
					</p>
				) : null}
				<DndContext
					onDragEnd={event => {
						if (hasSuperCols) {
							return;
						}

						const oldId = event.active.id as string;
						const newId = event.over?.id as string | undefined;

						const oldIndex = ids.indexOf(oldId);
						if (newId !== undefined) {
							const newIndex = ids.indexOf(newId);

							onChange({ oldIndex, newIndex });
						}
					}}
					collisionDetection={closestCenter}
				>
					<SortableContext items={ids} strategy={verticalListSortingStrategy}>
						<ul className="list-unstyled mb-0 user-select-none">
							{colOrder.map(({ colIndex, hidden }, i) => {
								const col = cols[colIndex];
								return (
									<DraggableItem
										key={colIndex}
										id={ids[i]}
										onToggleHidden={onToggleHidden(i)}
										hidden={hidden}
										col={col}
										disabled={!col || hasSuperCols}
									/>
								);
							})}
						</ul>
					</SortableContext>
				</DndContext>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-danger" onClick={onReset}>
					Reset
				</button>
				<button className="btn btn-secondary" onClick={onHide}>
					Close
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomizeColumns;
