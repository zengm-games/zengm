import PropTypes from "prop-types";
import React, { useState, ChangeEvent } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, realtimeUpdate, toWorker } from "../util";
import { View } from "../../common/types";

const NewTeam = ({ gameOver, godMode, phase, teams }: View<"newTeam">) => {
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
		await toWorker("switchTeam", tid);
		realtimeUpdate([], helpers.leagueUrl([]));
	};

	useTitleBar({ title: "Pick a New Team" });

	if (!gameOver && !godMode) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You may only switch to another team after you're fired or when you're
					in <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
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
	if (godMode) {
		message = (
			<p>
				Because you're in <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
				, you can become the GM of any team.
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

	return (
		<>
			{message}

			<div className="form-group">
				<select
					className="form-control select-team"
					onChange={handleTidChange}
					value={tid}
				>
					{teams.map(t => {
						return (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						);
					})}
				</select>
			</div>

			<button
				className="btn btn-primary"
				disabled={tid === undefined}
				onClick={handleNewTeam}
			>
				{godMode ? "Switch Team" : "Accept New Job"}
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
