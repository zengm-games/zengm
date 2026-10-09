import type { FaceConfig } from "facesjs";
import { useId, useState } from "react";
import { JERSEYS } from "../../../common/constants.ts";
import type { View, ExpansionDraftSetupTeam } from "../../../common/types.ts";
import { JerseyNumber } from "../../components/JerseyNumber.tsx";
import { toWorker } from "../../util/toWorker.ts";
import MoveModal, { type MoveModalTeamFinal } from "./MoveModal.tsx";
import { ColorPicker } from "../../components/ColorPicker/index.tsx";
import { MyFace } from "../../components/MyFace.tsx";
import { helpers } from "../../util/helpers.ts";

export type TeamFormToggleField =
	| "abbrev"
	| "colors"
	| "did"
	| "imgURL"
	| "imgURLSmall"
	| "jersey"
	| "name"
	| "pop"
	| "region"
	| "stadiumCapacity";

type FieldToggles = {
	enabled: ReadonlySet<TeamFormToggleField>;
	onToggle: (field: TeamFormToggleField) => void;
};

// Normally just a label. With fieldToggles, it also has a checkbox to enable/disable the field.
const FieldLabel = ({
	className,
	field,
	fieldToggles,
	text,
}: {
	className: string | undefined;
	field: TeamFormToggleField;
	fieldToggles: FieldToggles | undefined;
	text: string;
}) => {
	const id = useId();

	if (!fieldToggles) {
		return <label className={className}>{text}</label>;
	}

	return (
		<div className="form-check form-check-inline">
			<input
				id={id}
				className="form-check-input"
				type="checkbox"
				checked={fieldToggles.enabled.has(field)}
				onChange={() => {
					fieldToggles.onToggle(field);
				}}
			/>
			<label className="form-check-label" htmlFor={id}>
				{text}
			</label>
		</div>
	);
};

const TeamForm = ({
	classNamesCol,
	classNameLabel,
	confs,
	disablePop,
	disableStadiumCapacity,
	disableStatus,
	divs,
	fieldToggles,
	handleInputChange,
	hideStatus,
	showPlayers,
	moveButton,
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
		string,
	];
	classNameLabel?: string;
	confs: View<"manageTeams">["confs"];
	disablePop?: boolean;
	disableStatus?: boolean;
	disableStadiumCapacity?: boolean;
	divs: View<"manageTeams">["divs"];

	// When defined, each field has a checkbox and only the enabled fields can be edited
	fieldToggles?: FieldToggles;

	handleInputChange: (
		field: string,
		event: { target: { value: string } },
	) => void;
	hideStatus?: boolean;
	showPlayers?: boolean;
	moveButton?: boolean;

	// Really should just be ExpansionDraftSetupTeam, but need to update Manage Teams
	t: (
		| Omit<View<"manageTeams">["teams"][number], "tid">
		| (Omit<ExpansionDraftSetupTeam, "takeControl"> & {
				disabled?: boolean;
		  })
	) & {
		usePlayers?: boolean;
	};
}) => {
	const [face, setFace] = useState<FaceConfig | undefined>();

	const isDisabled = (field: TeamFormToggleField) => {
		return fieldToggles !== undefined && !fieldToggles.enabled.has(field);
	};

	const divisions = divs.map((div) => {
		const conf = confs.find((c) => c.cid === div.cid);
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

	const ensureFace = async () => {
		if (!face) {
			setFace(await toWorker("main", "generateFace", undefined));
		}
	};

	const [showMoveModal, setShowMoveModal] = useState(false);

	const cancelMoveModal = () => {
		setShowMoveModal(false);
	};

	const saveMoveModal = (newTeamInfo: MoveModalTeamFinal, rebrand: boolean) => {
		const apply = (key: string, value: string) => {
			handleInputChange(key, { target: { value } });
		};
		apply("region", newTeamInfo.region);
		apply("abbrev", newTeamInfo.abbrev);
		apply("pop", String(newTeamInfo.pop));

		if (rebrand) {
			apply("jersey", newTeamInfo.jersey);
			apply("name", newTeamInfo.name);
			apply("imgURL", newTeamInfo.imgURL);
			apply("imgURLSmall", newTeamInfo.imgURLSmall ?? "");
			apply("colors0", newTeamInfo.colors[0]);
			apply("colors1", newTeamInfo.colors[1]);
			apply("colors2", newTeamInfo.colors[2]);
		}

		setShowMoveModal(false);
	};

	return (
		<>
			<div className={classNamesCol[0]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="region"
						fieldToggles={fieldToggles}
						text="Region"
					/>
					<div className="input-group">
						<input
							type="text"
							className="form-control"
							disabled={isDisabled("region")}
							onChange={(e) => handleInputChange("region", e)}
							value={t.region}
						/>
						{moveButton ? (
							<button
								className="btn btn-light-bordered"
								type="button"
								onClick={() => {
									setShowMoveModal(true);
								}}
							>
								Move
							</button>
						) : null}
					</div>
				</div>
			</div>
			<div className={classNamesCol[1]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="name"
						fieldToggles={fieldToggles}
						text="Name"
					/>
					<input
						type="text"
						className="form-control"
						disabled={isDisabled("name")}
						onChange={(e) => handleInputChange("name", e)}
						value={t.name}
					/>
				</div>
			</div>
			<div className={classNamesCol[2]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="abbrev"
						fieldToggles={fieldToggles}
						text="Abbrev"
					/>
					<input
						type="text"
						className="form-control"
						disabled={isDisabled("abbrev")}
						onChange={(e) => handleInputChange("abbrev", e)}
						value={t.abbrev}
					/>
				</div>
			</div>
			<div className={classNamesCol[3]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="did"
						fieldToggles={fieldToggles}
						text="Division"
					/>
					<select
						className="form-select"
						disabled={isDisabled("did")}
						onChange={(e) => handleInputChange("did", e)}
						value={t.did}
					>
						{divisions.map((division) => (
							<option key={division.did} value={division.did}>
								{division.name}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className={classNamesCol[4]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="pop"
						fieldToggles={fieldToggles}
						text="Population (millions)"
					/>
					<input
						type="text"
						className="form-control"
						disabled={disablePop || isDisabled("pop")}
						onChange={(e) => handleInputChange("pop", e)}
						value={t.pop}
					/>
				</div>
			</div>
			<div className={classNamesCol[5]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="stadiumCapacity"
						fieldToggles={fieldToggles}
						text="Stadium Capacity"
					/>
					<input
						type="text"
						className="form-control"
						disabled={disableStadiumCapacity || isDisabled("stadiumCapacity")}
						onChange={(e) => handleInputChange("stadiumCapacity", e)}
						value={t.stadiumCapacity}
					/>
				</div>
			</div>
			<div className={classNamesCol[6]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="imgURL"
						fieldToggles={fieldToggles}
						text="Logo URL"
					/>
					<input
						type="text"
						className="form-control"
						disabled={isDisabled("imgURL")}
						onChange={(e) => handleInputChange("imgURL", e)}
						value={t.imgURL}
					/>
				</div>
			</div>
			<div className={classNamesCol[7]}>
				<div className="mb-3">
					<FieldLabel
						className={classNameLabel}
						field="imgURLSmall"
						fieldToggles={fieldToggles}
						text="Small Logo"
					/>
					<input
						type="text"
						className="form-control"
						disabled={isDisabled("imgURLSmall")}
						onChange={(e) => handleInputChange("imgURLSmall", e)}
						value={t.imgURLSmall}
					/>
				</div>
			</div>
			<div className={classNamesCol[8]}>
				<div className="mb-3">
					{fieldToggles ? (
						<>
							<FieldLabel
								className={classNameLabel}
								field="colors"
								fieldToggles={fieldToggles}
								text="Colors"
							/>
							<FieldLabel
								className={classNameLabel}
								field="jersey"
								fieldToggles={fieldToggles}
								text="Jersey"
							/>
						</>
					) : (
						<label className={classNameLabel}>Jersey</label>
					)}
					<div className="input-group">
						{([0, 1, 2] as const).map((j) => (
							<ColorPicker
								key={j}
								disabled={isDisabled("colors")}
								onClick={async () => {
									await ensureFace();
								}}
								onChange={(value) => {
									handleInputChange(`colors${j}`, {
										target: {
											value,
										},
									});
								}}
								value={t.colors[j]}
								style={{
									// Set positive z-index here rather than negative on face, because otherwise face doesn't appear when TeamForm is in modal
									zIndex: 1,
									minWidth: "20%",
								}}
							/>
						))}
						<select
							className="form-select"
							disabled={isDisabled("jersey")}
							onMouseDown={async () => {
								// Runs when select is opened
								await ensureFace();
							}}
							onChange={async (e) => {
								handleInputChange("jersey", e);

								// Just to be sure, since onMouseDown seems strange
								await ensureFace();
							}}
							value={t.jersey}
							style={{
								// Set positive z-index here rather than negative on face, because otherwise face doesn't appear when TeamForm is in modal
								zIndex: 1,
							}}
						>
							{helpers.entries(JERSEYS).map(([jersey, jerseyName]) => (
								<option key={jersey} value={jersey}>
									{jerseyName}
								</option>
							))}
						</select>
					</div>
				</div>
				{face ? (
					<div
						onClick={() => {
							setFace(undefined);
						}}
						className="d-flex"
					>
						<div
							style={{ width: 120, marginTop: -35 }}
							className="position-relative mb-3"
						>
							<MyFace
								colors={[color1, color2, color3]}
								face={face}
								jersey={t.jersey}
							/>
						</div>
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
					</div>
				) : null}
			</div>
			{!hideStatus ? (
				<div className={classNamesCol[9]}>
					<div className="mb-3">
						<label className={classNameLabel}>Status</label>
						<select
							className="form-select"
							disabled={disableStatus}
							onChange={(e) => handleInputChange("disabled", e)}
							value={t.disabled ? "1" : "0"}
						>
							<option value="0">Active</option>
							<option value="1">Inactive</option>
						</select>
					</div>
				</div>
			) : null}
			{showPlayers ? (
				<div className={classNamesCol[10]}>
					<div className="mb-3">
						<label className={classNameLabel}>Include Players</label>
						<div
							className="form-check form-switch"
							title={t.usePlayers ? "Enabled" : "Disabled"}
						>
							<input
								type="checkbox"
								className="form-check-input"
								checked={!!t.usePlayers}
								onChange={(e) => handleInputChange("usePlayers", e)}
								id="TeamForm-usePlayers"
							/>
							<label
								className="form-check-label"
								htmlFor="TeamForm-usePlayers"
							/>
						</div>
					</div>
				</div>
			) : null}
			{moveButton ? (
				<MoveModal
					show={showMoveModal}
					onHide={cancelMoveModal}
					onSave={saveMoveModal}
					currentTeam={t}
				/>
			) : null}
		</>
	);
};

export default TeamForm;
