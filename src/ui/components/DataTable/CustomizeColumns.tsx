import type { Col } from ".";
import React from "react";
import { Modal } from "react-bootstrap";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

const Item = SortableElement(
	({
		col,
		hidden,
		onToggleHidden,
	}: {
		col: Col;
		hidden?: boolean;
		onToggleHidden: () => void;
	}) => {
		let title = col.title;
		if (col.desc) {
			title += ` (${col.desc})`;
		}
		if (title === "") {
			title = "No Title";
		}

		return (
			<div className="form-check">
				<input
					className="form-check-input"
					type="checkbox"
					checked={!hidden}
					onChange={onToggleHidden}
				/>
				<label className="form-check-label cursor-grab">{title}</label>
			</div>
		);
	},
);

const Container = SortableContainer(({ children }: { children: any[] }) => {
	return <ul className="list-unstyled mb-0 cursor-grab">{children}</ul>;
});

const CustomizeColumns = ({
	colOrder,
	cols,
	hasSuperCols,
	onHide,
	onReset,
	onSortEnd,
	onToggleHidden,
	show,
}: {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	hasSuperCols: boolean;
	onHide: () => void;
	onReset: () => void;
	onSortEnd: (arg: { oldIndex: number; newIndex: number }) => void;
	onToggleHidden: (i: number) => () => void;
	show: boolean;
}) => {
	return (
		<Modal animation={false} centered show={show} onHide={onHide}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				{hasSuperCols ? (
					<p className="mb-0">
						This is not yet supported for tables with two header rows.
					</p>
				) : (
					<>
						<p>
							Click and drag to reorder columns, or use the checkboxes to
							show/hide columns.
						</p>
						<Container helperClass="sort-inside-modal" onSortEnd={onSortEnd}>
							{colOrder.map(({ colIndex, hidden }, i) => {
								const col = cols[colIndex];
								return (
									<Item
										key={colIndex}
										index={i}
										onToggleHidden={onToggleHidden(i)}
										hidden={hidden}
										col={col}
									/>
								);
							})}
						</Container>
					</>
				)}
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
