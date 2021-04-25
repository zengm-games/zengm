import { useState } from "react";
import {
	DEFAULT_JERSEY,
	DEFAULT_STADIUM_CAPACITY,
	helpers,
} from "../../../common";
import type { Conf, DiscriminateUnion, Div } from "../../../common/types";
import TeamForm from "../ManageTeams/TeamForm";
import type { StateInfo } from "./ScheduledEventEditor";

type Info = DiscriminateUnion<StateInfo, "type", "teamInfo">;

const FIELDS = [
	{
		key: "",
		value: "",
	},
];

const defaultT = {
	abbrev: "",
	region: "",
	name: "",
	imgURL: "",
	colors: ["#000000", "#cccccc", "#ffffff"] as [string, string, string],
	jersey: DEFAULT_JERSEY,
	pop: "1",
	stadiumCapacity: String(DEFAULT_STADIUM_CAPACITY),
	did: "0",
};

const EditInfoTeamInfo = ({
	existingScheduledEvent,
	info,
	teams,
	onChange,
	onDelete,
	confs,
	divs,
}: {
	existingScheduledEvent: boolean;
	info: Info;
	teams: {
		tid: number;
		region: string;
		name: string;
		disabled: boolean;
		future: boolean;
	}[];
	onChange: <Key extends keyof Info>(
		key: Key,
		value: NonNullable<Info[Key]>,
	) => void;
	onDelete: (key: keyof Info) => void;
	confs: Conf[];
	divs: Div[];
}) => {
	const initialT: Partial<typeof defaultT> = {};
	for (const key of helpers.keys(defaultT)) {
		if (info[key] !== undefined) {
			if (key === "did") {
				initialT[key] = String(info[key]);
			} else {
				initialT[key] = info[key];
			}
		}
	}

	const [t, setT] = useState(initialT);
	const [showFields, setShowFields] = useState(helpers.keys(initialT));
	const [fieldToAdd, setFieldToAdd] = useState("none");

	return (
		<>
			<div className="row">
				<div className="form-group col-6">
					<label htmlFor="team-info-tid">Team</label>
					<select
						id="team-info-tid"
						className="form-control"
						onChange={event => {
							const tid = parseInt(event.target.value);
							onChange("tid", tid);
						}}
						value={info.tid}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
								{t.disabled ? " (inactive)" : null}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="row">
				<div className="form-group col-6">
					<label htmlFor="team-info-field">Add field</label>
					<select
						id="team-info-field"
						className="form-control"
						onChange={event => {
							setFieldToAdd(event.target.value);
						}}
						value={info.tid}
					>
						<option value="none">Select a field to edit</option>
						{fieldsAvailable.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
					</select>
				</div>
			</div>
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
					handleInputChange={(field, event) => {}}
					hideStatus
					showFields={showFields}
					t={{
						...defaultT,
						...t,
					}}
				/>
			</div>
		</>
	);
};

export default EditInfoTeamInfo;
