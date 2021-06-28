import { useState } from "react";
import { Modal } from "react-bootstrap";
import { godModeRequiredMessage } from "./SettingsForm";

const Injuries = ({
	disabled,
	godModeRequired,
}: {
	disabled: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
}) => {
	const [show, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;
	return (
		<>
			<button
				className="btn btn-secondary"
				type="button"
				disabled={disabled}
				title={title}
				onClick={handleShow}
			>
				Customize
			</button>

			<Modal show={show} onHide={handleClose} size="lg" backdrop="static">
				<Modal.Header closeButton>
					<Modal.Title>Injury Types</Modal.Title>
				</Modal.Header>
				<Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
				<Modal.Footer>
					<button className="btn btn-secondary" onClick={handleClose}>
						Cancel
					</button>
					<button className="btn btn-primary" onClick={handleClose}>
						Save
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default Injuries;
