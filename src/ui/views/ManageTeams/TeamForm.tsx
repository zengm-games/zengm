import { display } from "facesjs";
import type { Face } from "facesjs";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DEFAULT_JERSEY, helpers, JERSEYS } from "../../../common";
import type { View, ExpansionDraftSetupTeam } from "../../../common/types";
import { JerseyNumber } from "../../components";
import { toWorker } from "../../util";

const TeamForm = ({
	classNamesCol,
	classNameLabel,
	confs,
	disablePop,
	disableStadiumCapacity,
	disableStatus,
	divs,
	handleInputChange,
	hideStatus,
	t,
}: {
	classNamesCol: [
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
	];
	classNameLabel?: string;
	confs: View<"manageTeams">["confs"];
	disablePop?: boolean;
	disableStatus?: boolean;
	disableStadiumCapacity?: boolean;
	divs: View<"manageTeams">["divs"];
	handleInputChange: (
		field: string,
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void;
	hideStatus?: boolean;
	// Really should just be ExpansionDraftSetupTeam, but need to update Manage Teams
	t:
		| Omit<View<"manageTeams">["teams"][number], "tid">
		| (Omit<ExpansionDraftSetupTeam, "takeControl"> & {
				disabled?: boolean;
		  });
}) => {
	const [faceWrapper, setFaceWrapper] = useState<HTMLDivElement | null>(null);
	const face = useRef<Face | undefined>();
	const [showFace, setShowFace] = useState(false);

	const divisions = divs.map(div => {
		const conf = confs.find(c => c.cid === div.cid);
		return {
			did: div.did,
			name: conf ? `${div.name} (${conf.name})` : div.name,
		};
	});

	const [color1, color2, color3] = t.colors ?? [
		"#000000",
		"#cccccc",
		"#ffffff",
	];

	useEffect(() => {
		const renderFace = async () => {
			if (!showFace) {
				if (faceWrapper) {
					faceWrapper.innerHTML = "";
				}
				return;
			}

			if (!face.current) {
				face.current = await toWorker("main", "generateFace", undefined);
			}

			if (faceWrapper && face.current) {
				const overrides = {
					teamColors: [color1, color2, color3],
					jersey: {
						id: t.jersey ?? DEFAULT_JERSEY,
					},
				};
				display(faceWrapper, face.current, overrides);
			}
		};

		renderFace();
	}, [faceWrapper, showFace, color1, color2, color3, t.jersey]);

	return (
		<>
			<div className={classNamesCol[0]}>
				<div className="mb-3">
					<label className={classNameLabel}>Region</label>
					<input
						type="text"
						className="form-control"
						onChange={e => handleInputChange("region", e)}
						value={t.region}
					/>
				</div>
			</div>
			<div className={classNamesCol[1]}>
				<div className="mb-3">
					<label className={classNameLabel}>Name</label>
					<input
						type="text"
						className="form-control"
						onChange={e => handleInputChange("name", e)}
						value={t.name}
					/>
				</div>
			</div>
			<div className={classNamesCol[2]}>
				<div className="mb-3">
					<label className={classNameLabel}>Abbrev</label>
					<input
						type="text"
						className="form-control"
						onChange={e => handleInputChange("abbrev", e)}
						value={t.abbrev}
					/>
				</div>
			</div>
			<div className={classNamesCol[3]}>
				<div className="mb-3">
					<label className={classNameLabel}>Division</label>
					<select
						className="form-select"
						onChange={e => handleInputChange("did", e)}
						value={t.did}
					>
						{divisions.map(division => (
							<option key={division.did} value={division.did}>
								{division.name}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className={classNamesCol[4]}>
				<div className="mb-3">
					<label className={classNameLabel}>Population (millions)</label>
					<input
						type="text"
						className="form-control"
						disabled={disablePop}
						onChange={e => handleInputChange("pop", e)}
						value={t.pop}
					/>
				</div>
			</div>
			<div className={classNamesCol[5]}>
				<div className="mb-3">
					<label className={classNameLabel}>Stadium Capacity</label>
					<input
						type="text"
						className="form-control"
						disabled={disableStadiumCapacity}
						onChange={e => handleInputChange("stadiumCapacity", e)}
						value={t.stadiumCapacity}
					/>
				</div>
			</div>
			<div className={classNamesCol[6]}>
				<div className="mb-3">
					<label className={classNameLabel}>Logo URL</label>
					<input
						type="text"
						className="form-control"
						onChange={e => handleInputChange("imgURL", e)}
						value={t.imgURL}
					/>
				</div>
			</div>
			<div className={classNamesCol[7]}>
				<div className="mb-3">
					<label className={classNameLabel}>Small Logo</label>
					<input
						type="text"
						className="form-control"
						onChange={e => handleInputChange("imgURLSmall", e)}
						value={t.imgURLSmall}
					/>
				</div>
			</div>
			<div className={classNamesCol[8]}>
				<div className="mb-3">
					<label className={classNameLabel}>Jersey</label>
					<div className="d-flex">
						{[0, 1, 2].map(j => (
							<input
								key={j}
								type="color"
								className="form-control form-control-color"
								onClick={() => {
									setShowFace(true);
								}}
								onChange={e => {
									handleInputChange(`colors${j}`, e);
								}}
								value={t.colors[j]}
								style={{
									// Set positive z-index here rather than negative on face, because otherwise face doesn't appear when TeamForm is in modal
									zIndex: 1,
									flexBasis: "100%",
								}}
							/>
						))}
						<select
							className="form-select"
							onMouseDown={() => {
								// Runs when select is opened
								setShowFace(true);
							}}
							onChange={e => {
								handleInputChange("jersey", e);

								// Just to be sure, since onMouseDown seems strange
								setShowFace(true);
							}}
							value={t.jersey}
							style={{
								// Set positive z-index here rather than negative on face, because otherwise face doesn't appear when TeamForm is in modal
								zIndex: 1,
								flexBasis: "100%",
							}}
						>
							{helpers.keys(JERSEYS).map(jersey => (
								<option key={jersey} value={jersey}>
									{JERSEYS[jersey]}
								</option>
							))}
						</select>
					</div>
				</div>
				<div
					onClick={() => {
						setShowFace(show => !show);
					}}
					className="d-flex"
				>
					<div
						ref={setFaceWrapper}
						style={{ maxWidth: 120, marginTop: -35 }}
						className="position-relative mb-3"
					/>
					{showFace ? (
						<JerseyNumber
							number={"35"}
							start={2002}
							end={2004}
							t={{
								colors: t.colors,
								name: t.name,
								region: t.region,
							}}
						/>
					) : null}
				</div>
			</div>
			{!hideStatus ? (
				<div className={classNamesCol[9]}>
					<div className="mb-3">
						<label className={classNameLabel}>Status</label>
						<select
							className="form-select"
							disabled={disableStatus}
							onChange={e => handleInputChange("disabled", e)}
							value={t.disabled ? "1" : "0"}
						>
							<option value="0">Active</option>
							<option value="1">Inactive</option>
						</select>
					</div>
				</div>
			) : null}
		</>
	);
};

export default TeamForm;
