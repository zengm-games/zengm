import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { DEFAULT_STADIUM_CAPACITY } from "../../../common";
import type { Conf, Div } from "../../../common/types";
import { logEvent } from "../../util";
import TeamForm from "../ManageTeams/TeamForm";
import type { NewLeagueTeam } from "./types";

const UpsertTeamModal = ({
	t,
	confs,
	divs,
	onCancel,
	onSave,
}: {
	t?: NewLeagueTeam;
	confs: Conf[];
	divs: Div[];
	onCancel: () => void;
	onSave: (t: NewLeagueTeam) => void;
}) => {
	const [controlledTeam, setControlledTeam] = useState(() => {
		if (t === undefined) {
			return;
		}

		return {
			region: t.region,
			name: t.name,
			abbrev: t.abbrev,
			pop: String(t.pop),
			stadiumCapacity: String(t.stadiumCapacity ?? DEFAULT_STADIUM_CAPACITY),
			colors: t.colors ?? ["#000000", "#cccccc", "#ffffff"],
			did: String(t.did),
			imgURL: t.imgURL,
		};
	});

	return (
		<Modal size="lg" show={t !== undefined} onHide={onCancel}>
			<Modal.Header closeButton>
				{t !== undefined && t.tid >= 0 ? "Edit" : "Add"} Team
			</Modal.Header>
			<Modal.Body>
				{controlledTeam ? (
					<div className="row">
						<TeamForm
							classNamesCol={[
								"col-6",
								"col-6",
								"col-6",
								"col-6",
								"col-6",
								"col-6",
								"col-6",
								"col-6",
								"col-6",
							]}
							confs={confs}
							divs={divs}
							handleInputChange={(field, event) => {
								console.log(field, event.target.value);
								if (field.startsWith("colors")) {
									const ind = parseInt(field.replace("colors", ""));
									if (ind >= 0 && ind <= 2) {
										const colors = [...controlledTeam.colors] as [
											string,
											string,
											string,
										];
										(colors[ind] = event.target.value),
											setControlledTeam({
												...controlledTeam,
												colors,
											});
									}
								} else {
									setControlledTeam({
										...controlledTeam,
										[field]: event.target.value,
									});
								}
							}}
							hideStatus
							t={controlledTeam}
						/>
					</div>
				) : null}
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					onClick={() => {
						if (t === undefined || controlledTeam === undefined) {
							return;
						}
						const edited = {
							...t,
							region: controlledTeam.region,
							name: controlledTeam.name,
							abbrev: controlledTeam.abbrev,
							pop: parseFloat(controlledTeam.pop),
							stadiumCapacity: parseInt(controlledTeam.stadiumCapacity),
							colors: controlledTeam.colors,
							did: parseInt(controlledTeam.did),
							imgURL: t.imgURL,
						};

						const errors = [];
						let errorMessage: string | undefined;
						if (Number.isNaN(edited.pop)) {
							errors.push("Population");
						}
						if (Number.isNaN(edited.stadiumCapacity)) {
							errors.push("Stadium Capacity");
						}
						if (errors.length === 1) {
							errorMessage = `${errors[0]} must be a number.`;
						} else if (errors.length > 1) {
							errorMessage = `${errors[0]} and ${errors[1]} must be numbers.`;
						}
						if (errorMessage) {
							logEvent({
								type: "error",
								text: errorMessage,
								saveToDb: false,
							});
							return;
						}

						onSave(edited);
					}}
				>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default UpsertTeamModal;
