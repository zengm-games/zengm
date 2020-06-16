import type { Col } from ".";
import React from "react";
import { Modal } from "react-bootstrap";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

const Item = SortableElement(({ value }: { value: Col }) => {
	let title = value.title;
	if (value.desc) {
		title += ` (${value.desc})`;
	}
	if (title === "") {
		title = "No Title";
	}

	return <li>{title}</li>;
});

const Container = SortableContainer(({ children }: { children: any[] }) => {
	return (
		<ul
			className="list-unstyled mb-0"
			style={{
				cursor: "grab",
			}}
		>
			{children}
		</ul>
	);
});

const CustomizeColumns = ({
	colOrder,
	cols,
	hasSuperCols,
	onHide,
	onReset,
	onSortEnd,
	show,
}: {
	colOrder: number[];
	cols: Col[];
	hasSuperCols: boolean;
	onHide: () => void;
	onReset: () => void;
	onSortEnd: (arg: { oldIndex: number; newIndex: number }) => void;
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
						<p>Click and drag to reorder columns.</p>
						<Container helperClass="sort-inside-modal" onSortEnd={onSortEnd}>
							{colOrder.map((colIndex, i) => {
								const col = cols[colIndex];
								return <Item key={colIndex} index={i} value={col} />;
							})}
						</Container>
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-danger" onClick={onReset}>
					Reset
				</button>
				<button className="btn btn-primary" onClick={onHide}>
					Close
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomizeColumns;
