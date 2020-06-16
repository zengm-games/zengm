import type { Col } from ".";
import React, { SyntheticEvent, MouseEvent, ReactNode } from "react";
import { Modal } from "react-bootstrap";

const CustomizeColumns = ({
	colOrder,
	cols,
	onHide,
	show,
}: {
	colOrder: number[];
	cols: Col[];
	onHide: () => void;
	show: boolean;
}) => {
	return (
		<Modal animation={false} centered show={show} onHide={onHide}>
			<Modal.Header closeButton>Customize Columns</Modal.Header>
			<Modal.Body>
				<p>Click and drag to reorder columns.</p>
				<ul>
					{colOrder.map(colIndex => {
						const col = cols[colIndex];
						return (
							<li key={colIndex}>
								{col.title}
								{col.desc ? ` (${col.desc})` : ""}
							</li>
						);
					})}
				</ul>
			</Modal.Body>
		</Modal>
	);
};

export default CustomizeColumns;
