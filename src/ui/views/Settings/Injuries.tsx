import { ChangeEvent, Fragment, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
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
	const [injuries, setInjuries] = useState(
		defaultValue.map(row => ({
			name: row.name,
			frequency: String(row.frequency),
			games: String(row.games),
		})),
	);

	const handleCancel = () => setShow(false);
	const handleShow = () => setShow(true);

	const handleSave = () => {
		setShow(false);
	};

	const handleChange =
		(key: "name" | "frequency" | "games", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setInjuries(rows =>
				rows.map((row, j) => {
					if (i !== j) {
						return row;
					}

					return {
						...row,
						[key]: event.target.value,
					};
				}),
			);
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
					<p>
						Injury rate is determined by the "Injury Rate" setting, which is
						viewable on the main League Settings page. The "Frequency" field
						here is a relative frequency or weight. It doesn't change how often
						injuries in general occur, but it does determine the probability
						that an injury will be a specific type.
					</p>
					<p>
						"Games" is the average number of games that will be missed. There is
						some variability based on luck and health spending.
					</p>

					<div className="d-flex justify-content-between mb-3">
						<Dropdown>
							<Dropdown.Toggle
								className="btn-light-bordered"
								variant="foo"
								id="dropdown-injuries-reset"
							>
								Reset
							</Dropdown.Toggle>

							<Dropdown.Menu>
								<Dropdown.Item href="#/action-1">Default</Dropdown.Item>
								<Dropdown.Item
									onClick={() => {
										setInjuries([]);
									}}
								>
									Clear
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
						<div className="btn-group">
							<button className="btn btn-light-bordered">Import</button>
							<button className="btn btn-light-bordered">Export</button>
						</div>
					</div>

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
												onChange={handleChange("name", i)}
											/>
										</div>
										<div className="col-xs-3 col-md-2">
											<input
												type="text"
												className="form-control"
												value={injury.frequency}
												onChange={handleChange("frequency", i)}
											/>
										</div>
										<div className="col-xs-3 col-md-2">
											<input
												type="text"
												className="form-control"
												value={injury.games}
												onChange={handleChange("games", i)}
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
