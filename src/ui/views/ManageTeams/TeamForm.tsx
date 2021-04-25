import type { ChangeEvent } from "react";
import { helpers, JERSEYS } from "../../../common";
import type { View, ExpansionDraftSetupTeam } from "../../../common/types";

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
	showFields,
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
	showFields?: (
		| "region"
		| "name"
		| "abbrev"
		| "did"
		| "pop"
		| "stadiumCapacity"
		| "imgURL"
		| "colors"
		| "jersey"
		| "disabled"
	)[];
}) => {
	const divisions = divs.map(div => {
		const conf = confs.find(c => c.cid === div.cid);
		return {
			did: div.did,
			name: conf ? `${div.name} (${conf.name})` : div.name,
		};
	});

	return (
		<>
			{!showFields || showFields.includes("region") ? (
				<div className={classNamesCol[0]}>
					<div className="form-group">
						<label className={classNameLabel}>Region</label>
						<input
							type="text"
							className="form-control"
							onChange={e => handleInputChange("region", e)}
							value={t.region}
						/>
					</div>
				</div>
			) : null}
			{!showFields || showFields.includes("name") ? (
				<div className={classNamesCol[1]}>
					<div className="form-group">
						<label className={classNameLabel}>Name</label>
						<input
							type="text"
							className="form-control"
							onChange={e => handleInputChange("name", e)}
							value={t.name}
						/>
					</div>
				</div>
			) : null}
			{!showFields || showFields.includes("abbrev") ? (
				<div className={classNamesCol[2]}>
					<div className="form-group">
						<label className={classNameLabel}>Abbrev</label>
						<input
							type="text"
							className="form-control"
							onChange={e => handleInputChange("abbrev", e)}
							value={t.abbrev}
						/>
					</div>
				</div>
			) : null}
			{!showFields || showFields.includes("did") ? (
				<div className={classNamesCol[3]}>
					<div className="form-group">
						<label className={classNameLabel}>Division</label>
						<select
							className="form-control"
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
			) : null}
			{!showFields || showFields.includes("pop") ? (
				<div className={classNamesCol[4]}>
					<div className="form-group">
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
			) : null}
			{!showFields || showFields.includes("stadiumCapacity") ? (
				<div className={classNamesCol[5]}>
					<div className="form-group">
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
			) : null}
			{!showFields || showFields.includes("imgURL") ? (
				<div className={classNamesCol[6]}>
					<div className="form-group">
						<label className={classNameLabel}>Logo URL</label>
						<input
							type="text"
							className="form-control"
							onChange={e => handleInputChange("imgURL", e)}
							value={t.imgURL}
						/>
					</div>
				</div>
			) : null}
			{!showFields ||
			showFields.includes("colors") ||
			showFields.includes("jersey") ? (
				<div className={classNamesCol[7]}>
					<div className="form-group">
						<label className={classNameLabel}>Jersey</label>
						<div className="d-flex">
							{!showFields || showFields.includes("colors")
								? [0, 1, 2].map(j => (
										<input
											key={j}
											type="color"
											className="form-control"
											onChange={e => handleInputChange(`colors${j}`, e)}
											value={t.colors[j]}
										/>
								  ))
								: null}
							{!showFields || showFields.includes("jersey") ? (
								<select
									className="form-control"
									onChange={e => handleInputChange("jersey", e)}
									value={t.jersey}
								>
									{helpers.keys(JERSEYS).map(jersey => (
										<option key={jersey} value={jersey}>
											{JERSEYS[jersey]}
										</option>
									))}
								</select>
							) : null}
						</div>
					</div>
				</div>
			) : null}
			{!hideStatus && (!showFields || showFields.includes("disabled")) ? (
				<div className={classNamesCol[8]}>
					<div className="form-group">
						<label className={classNameLabel}>Status</label>
						<select
							className="form-control"
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
