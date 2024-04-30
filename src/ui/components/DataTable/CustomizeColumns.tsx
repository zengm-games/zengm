import type { Col, StickyCols } from ".";
import { useState, type CSSProperties } from "react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import classNames from "classnames";
import Modal from "../Modal";

const DraggableItem = ({
	col,
	id,
	hidden,
	onToggleHidden,
}: {
	col?: Col;
	id: string;
	hidden?: boolean;
	onToggleHidden: () => void;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ id, disabled: !col });

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return (
		<Item
			col={col}
			hidden={hidden}
			onToggleHidden={onToggleHidden}
			style={style}
			attributes={attributes}
			listeners={listeners}
			setNodeRef={setNodeRef}
			setActivatorNodeRef={setActivatorNodeRef}
		/>
	);
};

const Item = ({
	col,
	hidden,
	onToggleHidden,
	style,
	attributes,
	listeners,
	setNodeRef,
	setActivatorNodeRef,
}: {
	col?: Col;
	hidden?: boolean;
	onToggleHidden: () => void;
	style?: CSSProperties;
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
				className="form-check-label cursor-grab"
				ref={setActivatorNodeRef}
				{...listeners}
				{...attributes}
			>
				{title}
			</label>
		</div>
	);
};

const Container = ({
	children,
	isDragged,
}: {
	children: any[];
	isDragged: boolean;
}) => {
	return (
		<ul
			className={classNames("list-unstyled mb-0 cursor-grab user-select-none", {
				"cursor-grabbing": isDragged,
			})}
		>
			{children}
		</ul>
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
	const [isDragged, setIsDragged] = useState(false);

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
					onDragStart={() => {
						setIsDragged(true);
					}}
					onDragEnd={event => {
						if (hasSuperCols) {
							return;
						}
						setIsDragged(false);

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
						<Container isDragged={isDragged}>
							{colOrder.map(({ colIndex, hidden }, i) => {
								const col = cols[colIndex];
								return (
									<DraggableItem
										key={colIndex}
										id={ids[i]}
										onToggleHidden={onToggleHidden(i)}
										hidden={hidden}
										col={col}
									/>
								);
							})}
						</Container>
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
