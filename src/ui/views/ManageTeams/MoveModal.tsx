import { useState } from "react";
import orderBy from "lodash-es/orderBy";
import { Modal } from "react-bootstrap";
import teamInfos from "../../../common/teamInfos";
import getTeamInfos from "../../../common/getTeamInfos";
import { TeamsSplitNorthAmericaWorld } from "../../components/TeamsSplitNorthAmericaWorld";
import { TeamLogoJerseyInfo } from "../../components/TeamLogoJerseyInfo";

export type MoveModalTeam = {
	abbrev: string;
	colors: [string, string, string];
	jersey?: string;
	name: string;
	region: string;
	pop: number | string;
	imgURL?: string;
	imgURLSmall?: string;
};

export type MoveModalTeamFinal = MoveModalTeam & {
	jersey: string;
	pop: number;
	imgURL: string;
};

let abbrevs: string[] | undefined;
let moveOptions: MoveModalTeamFinal[] | undefined;

const MoveModal = ({
	show,
	onHide,
	onSave,
	currentTeam,
}: {
	show: boolean;
	onHide: () => void;
	onSave: (newTeamInfo: MoveModalTeamFinal, rebrand: boolean) => void;
	currentTeam: MoveModalTeam;
}) => {
	if (!abbrevs || !moveOptions) {
		abbrevs = Object.keys(teamInfos);
		moveOptions = orderBy(
			getTeamInfos(
				abbrevs.map(abbrev => ({
					abbrev,
					tid: -1,
					cid: -1,
					did: -1,
				})),
			),
			["region", "name"],
		);
	}

	const [selectedRegion, setSelectedRegion] = useState(0);
	const selectedTeam = moveOptions[selectedRegion];

	const [rebrandTeam, setRebrandTeam] = useState(true);

	const brandedTeam = rebrandTeam ? selectedTeam : currentTeam;

	return (
		<Modal show={show} onHide={onHide} scrollable>
			<Modal.Body>
				<div className="d-sm-flex">
					<div style={{ width: 150 }}>
						<div className="mb-3">
							<select
								className="form-select"
								onChange={event => {
									setSelectedRegion(parseInt(event.target.value));
								}}
								value={selectedRegion}
							>
								<TeamsSplitNorthAmericaWorld
									teams={moveOptions}
									option={(t, i) => (
										<option key={i} value={i}>
											{t.region}
										</option>
									)}
								/>
							</select>
							<div className="mt-2">Population: {selectedTeam.pop} million</div>
						</div>
						<div className="form-check">
							<input
								type="checkbox"
								className="form-check-input"
								id="move-modal-reband"
								checked={rebrandTeam}
								onChange={() => {
									setRebrandTeam(checked => !checked);
								}}
							/>
							<label className="form-check-label" htmlFor="move-modal-reband">
								Rebrand team
							</label>
						</div>
					</div>
					<div className="mt-4 mt-sm-0 ms-sm-5">
						<TeamLogoJerseyInfo
							brandedTeam={brandedTeam}
							selectedTeam={selectedTeam}
						/>
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onHide}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					onClick={() => {
						onSave(selectedTeam, rebrandTeam);
					}}
				>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default MoveModal;
