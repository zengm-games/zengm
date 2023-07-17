import type { Face } from "facesjs";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import orderBy from "lodash-es/orderBy";
import { Modal } from "react-bootstrap";
import teamInfos from "../../../common/teamInfos";
import getTeamInfos from "../../../common/getTeamInfos";
import { JerseyNumber } from "../../components";
import { displayFace, toWorker } from "../../util";
import { TeamsSplitNorthAmericaWorld } from "../../components/TeamsSplitNorthAmericaWorld";

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

	const [faceWrapper, setFaceWrapper] = useState<HTMLDivElement | null>(null);
	const face = useRef<Face | undefined>();

	useEffect(() => {
		const renderFace = async () => {
			if (!face.current) {
				face.current = await toWorker("main", "generateFace", undefined);
			}

			if (faceWrapper && face.current) {
				displayFace({
					colors: brandedTeam.colors,
					face: face.current,
					jersey: brandedTeam.jersey,
					wrapper: faceWrapper,
				});
			}
		};

		renderFace();
	}, [faceWrapper, brandedTeam]);

	const logoStyle: CSSProperties = {};
	if (brandedTeam.imgURL) {
		logoStyle.display = "inline";
		logoStyle.backgroundImage = `url('${brandedTeam.imgURL}')`;
	}

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
								Rebrand Team
							</label>
						</div>
					</div>
					<div className="mt-4 mt-sm-0 ms-sm-5">
						<h3 className="position-relative" style={{ zIndex: 1 }}>
							{selectedTeam.region} {brandedTeam.name} ({selectedTeam.abbrev})
						</h3>
						<div className="d-flex">
							<div className="team-picture" style={logoStyle} />
							<div
								className="mx-2"
								ref={setFaceWrapper}
								style={{ maxWidth: 100, marginTop: -25 }}
							/>
							<JerseyNumber
								number={"35"}
								start={2002}
								end={2004}
								t={{
									colors: brandedTeam.colors,
									name: brandedTeam.name,
									region: brandedTeam.region,
								}}
							/>
						</div>
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
