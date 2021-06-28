import { Fragment, useState } from "react";
import { Modal } from "react-bootstrap";
import type { InjuriesSetting } from "../../../common/types";
import { godModeRequiredMessage } from "./SettingsForm";

const Injuries = ({
	defaultValue,
	disabled,
	godModeRequired,
}: {
	defaultValue: InjuriesSetting;
	disabled: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
}) => {
	const [show, setShow] = useState(false);
	const [injuries, setInjuries] = useState(defaultValue);

	const handleCancel = () => setShow(false);
	const handleShow = () => setShow(true);

	const handleSave = () => {
		setShow(false);
	};

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

			<Modal show={show} onHide={handleCancel} backdrop="static">
				<Modal.Header closeButton>
					<Modal.Title>Injury Types</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<form onSubmit={handleSave}>
						<div className="form-row" style={{ marginRight: 22 }}>
							<div className="col-xs-6 col-md-8">Name</div>
							<div className="col-xs-3 col-md-2">Frequency</div>
							<div className="col-xs-3 col-md-2">Games</div>
						</div>
						{injuries.map((injury, i) => (
							<Fragment key={i}>
								<div className="d-flex">
									<div className="form-row mt-1 flex-grow-1" key={i}>
										<div className="col-xs-6 col-md-8">
											<input
												type="text"
												className="form-control"
												value={injury.name}
											/>
										</div>
										<div className="col-xs-3 col-md-2">
											<input
												type="text"
												className="form-control"
												value={injury.frequency}
											/>
										</div>
										<div className="col-xs-3 col-md-2">
											<input
												type="text"
												className="form-control"
												value={injury.games}
											/>
										</div>
									</div>
									<button
										className="text-danger btn btn-link pl-2 pr-0 border-0"
										onClick={() => {
											setInjuries(rows => rows.filter(row => row !== injury));
										}}
										style={{ fontSize: 20 }}
										title="Delete"
										type="button"
									>
										<span className="glyphicon glyphicon-remove" />
									</button>
								</div>
							</Fragment>
						))}
					</form>
				</Modal.Body>
				<Modal.Footer>
					<button className="btn btn-secondary" onClick={handleCancel}>
						Cancel
					</button>
					<button className="btn btn-primary" onClick={handleSave}>
						Save
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default Injuries;
