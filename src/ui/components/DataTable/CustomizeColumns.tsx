import type { Col } from ".";
import React from "react";
import { Modal } from "react-bootstrap";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

const Item = SortableElement(({ value }: { value: Col }) => (
	<li>
		{value.title}
		{value.desc ? ` (${value.desc})` : ""}
	</li>
));

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
	onHide,
	onReset,
	onSortEnd,
	show,
}: {
	colOrder: number[];
	cols: Col[];
	onHide: () => void;
	onReset: () => void;
	onSortEnd: (arg: { oldIndex: number; newIndex: number }) => void;
	show: boolean;
}) => {
	return (
		<Modal animation={false} centered show={show} onHide={onHide}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				<p>Click and drag to reorder columns.</p>
				<Container helperClass="sort-inside-modal" onSortEnd={onSortEnd}>
					{colOrder.map((colIndex, i) => {
						const col = cols[colIndex];
						return <Item key={`${col.title}`} index={i} value={col} />;
					})}
				</Container>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-danger" onClick={onReset}>
					Reset
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default CustomizeColumns;
