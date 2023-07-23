import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import { TeamLogoJerseyInfo } from "../components/TeamLogoJerseyInfo";

const Relocate = ({
	currentTeam,
	godMode,
	newTeam,
	realignInfo,
}: View<"relocate">) => {
	useTitleBar({ title: "Team Relocation Vote" });

	const [rebrandTeam, setRebrandTeam] = useState(true);
	const brandedTeam = rebrandTeam ? newTeam : currentTeam;

	console.log({
		currentTeam,
		godMode,
		newTeam,
		realignInfo,
	});

	return (
		<>
			<p>
				The{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${currentTeam.abbrev}_${currentTeam.tid}`,
					])}
				>
					{currentTeam.region} {currentTeam.name}
				</a>{" "}
				woud like to move to <b>{newTeam.region}</b>.
			</p>

			<TeamLogoJerseyInfo brandedTeam={brandedTeam} selectedTeam={newTeam} />
			<div className="form-check mt-2 mb-3">
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

			<p>This move must be approved by a majority of teams. How do you vote?</p>
		</>
	);
};

export default Relocate;
