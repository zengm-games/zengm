import { useState } from "react";
import { orderBy } from "../../../common/utils.ts";
import { type EditProps, FormButtons, formatTeamOption } from "./common.tsx";

const EditContraction = ({
	event,
	onCancel,
	onSave,
	saving,
	teams,
}: EditProps<"contraction">) => {
	const [tid, setTid] = useState(event?.info.tid);

	const activeTeams = orderBy(
		teams.filter((t) => t.active),
		["region", "name", "tid"],
	);

	// Selected team may not be active anymore, if the season/phase changed
	const selectedTeam = activeTeams.find((t) => t.tid === tid);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (selectedTeam) {
					onSave({ tid: selectedTeam.tid });
				}
			}}
		>
			<label className="form-label" htmlFor="scheduled-event-tid">
				Team
			</label>
			<select
				id="scheduled-event-tid"
				className="form-select"
				style={{ maxWidth: 400 }}
				value={selectedTeam?.tid ?? ""}
				onChange={(event) => {
					setTid(Number.parseInt(event.target.value));
				}}
			>
				<option value="" disabled>
					Select a team
				</option>
				{activeTeams.map((t) => (
					<option key={t.tid} value={t.tid}>
						{formatTeamOption(t)}
					</option>
				))}
			</select>
			<div className="form-text">
				Only teams that will be active at this time can be contracted. All
				players on the team will become free agents.
			</div>
			<FormButtons
				disabled={!selectedTeam}
				onCancel={onCancel}
				saving={saving}
			/>
		</form>
	);
};

export default EditContraction;
