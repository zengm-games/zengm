import React from "react";
import { Modal } from "react-bootstrap";

const UpsertTeamModal = ({
	tid,
	onCancel,
	onSave,
}: {
	tid?: number;
	onCancel: () => void;
	onSave: () => void;
}) => {
	return (
		<Modal show={tid !== undefined} onHide={onCancel}>
			<Modal.Header closeButton>
				{tid !== undefined && tid >= 0 ? "Edit" : "Add"} Team
			</Modal.Header>
			<Modal.Body>
				<p>
					Click and drag to reorder columns, or use the checkboxes to show/hide
					columns.
				</p>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={onSave}>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default UpsertTeamModal;
