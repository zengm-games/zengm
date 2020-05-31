import PropTypes from "prop-types";
import React, { useState, ChangeEvent } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, realtimeUpdate, toWorker } from "../util";
import type { View } from "../../common/types";
import { PopText } from "../components";

const NewTeam = ({
	disabled,
	expansion,
	gameOver,
	godMode,
	numActiveTeams,
	phase,
	teams,
	userTid,
}: View<"newTeam">) => {
	const [tid, setTid] = useState(
		teams && teams.length > 0 ? teams[0].tid : undefined,
	);

	if (tid === undefined && teams && teams.length > 0) {
		setTid(teams[0].tid);
	}

	const handleTidChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setTid(parseInt(event.currentTarget.value, 10));
	};

	const handleNewTeam = async () => {
		await toWorker("main", "switchTeam", tid);
		realtimeUpdate(
			[],
			expansion
				? helpers.leagueUrl(["protect_players"])
				: helpers.leagueUrl([]),
		);
	};

	let title;
	if (expansion && disabled) {
		title = "Pick an Expansion Team";
	} else if (expansion) {
		title = "Switch To Expansion Team?";
	} else {
		title = "Pick a New Team";
	}

	useTitleBar({ title, hideNewWindow: true });

	if (!expansion && !gameOver && !godMode) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You cannot switch to a new team now unless you enable{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</div>
		);
	}

	if (phase === PHASE.RESIGN_PLAYERS) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					Changing your team while re-signing players currently breaks things.
					Please play until free agency and then you can switch teams.
				</p>
			</div>
		);
	}

	let message;
	if (expansion) {
		if (disabled) {
			message = (
				<p>
					Your old team no longer exists, but fortunately there are some new
					teams willing to hire you.
				</p>
			);
		} else {
			message = (
				<p>
					You can either stay with your current team or take control of a new
					expansion team.
				</p>
			);
		}
	} else if (godMode) {
		message = (
			<p>
				Because you're in <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
				, you can become the GM of any team.
			</p>
		);
	} else if (disabled) {
		message = (
			<p>
				Your team no longer exists! Don't worry, it wasn't your fault. Probably.
				Look, at least some other teams are willing to hire you.
			</p>
		);
	} else {
		message = (
			<p>
				After you were fired, your agent tried to get you job offers from other
				teams. Unfortunately, he was only able to secure offers from some of the
				worst teams in the league. Are you interested in running any of these
				teams?
			</p>
		);
	}

	let submitText;
	if (expansion) {
		submitText = "Continue With Expansion Draft";
	} else if (godMode) {
		submitText = "Switch Team";
	} else {
		submitText = "Accept New Job";
	}

	return (
		<>
			{message}

			<div className="form-group">
				<select
					className="form-control mb-1"
					style={{
						width: "inherit",
					}}
					onChange={handleTidChange}
					value={tid}
				>
					{teams.map(t => {
						return (
							<option key={t.tid} value={t.tid}>
								{expansion && t.tid === userTid
									? `Stay with my current team in ${t.region}`
									: `${t.region} ${t.name}`}
							</option>
						);
					})}
				</select>
				<PopText tid={tid} teams={teams} numActiveTeams={numActiveTeams} />
			</div>

			<button
				className="btn btn-primary"
				disabled={tid === undefined}
				onClick={handleNewTeam}
			>
				{submitText}
			</button>
		</>
	);
};

NewTeam.propTypes = {
	gameOver: PropTypes.bool.isRequired,
	godMode: PropTypes.bool.isRequired,
	phase: PropTypes.number.isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default NewTeam;
