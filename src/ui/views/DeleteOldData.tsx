import React, { useState, FormEvent, ChangeEvent } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../util";

const DeleteOldData = () => {
	const [state, setState] = useState({
		boxScores: true,
		events: true,
		teamStats: true,
		teamHistory: true,
		retiredPlayersUnnotable: true,
		retiredPlayers: true,
		playerStatsUnnotable: true,
		playerStats: true,
	});
	const [deleting, setDeleting] = useState(false);

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		setState({
			...state,
			[name]: event.target.checked,
		});
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setDeleting(true);

		await toWorker("main", "deleteOldData", state);

		logEvent({
			type: "success",
			text: "Data successfully deleted.",
			saveToDb: false,
		});
		setDeleting(false);
	};

	useTitleBar({ title: "Delete Old Data" });

	return (
		<>
			<p>
				As you play multiple seasons in a league, the database can grow quite
				large. This used to slow down performance, but doesn't much anymore.
				However it does still use up hard drive space, which you can reclaim
				here by deleting old data from this league.
			</p>

			<form onSubmit={handleSubmit}>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("boxScores")}
							type="checkbox"
							checked={state.boxScores}
						/>
						Delete Old Box Scores{" "}
						<a href={helpers.leagueUrl(["settings"])}>
							(done automatically by default)
						</a>
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("teamStats")}
							type="checkbox"
							checked={state.teamStats}
						/>
						Delete Old Team Stats
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("teamHistory")}
							type="checkbox"
							checked={state.teamHistory}
						/>
						Delete Old Team History (stuff like W/L, finances, etc)
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("retiredPlayersUnnotable")}
							type="checkbox"
							checked={state.retiredPlayersUnnotable}
						/>
						Delete Unnotable Retired Players
						<br />
						<i>Won't delete your past players or players who have won awards</i>
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("retiredPlayers")}
							type="checkbox"
							checked={state.retiredPlayers}
						/>
						Delete All Retired Players
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("playerStatsUnnotable")}
							type="checkbox"
							checked={state.playerStatsUnnotable}
						/>
						Delete Unnotable Player Stats and Ratings
						<br />
						<i>Won't delete your past players or players who have won awards</i>
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("playerStats")}
							type="checkbox"
							checked={state.playerStats}
						/>
						Delete Old Player Stats and Ratings
					</label>
				</div>
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("events")}
							type="checkbox"
							checked={state.events}
						/>
						Delete All Event Log Entries
					</label>
				</div>

				<p className="alert alert-danger mt-3">
					<b>Warning!</b> Once you delete old data, it's completely gone!
					There's no going back! This can impact your players making the Hall of
					Fame and the completion of in-progress achievements!
				</p>

				<button className="btn btn-danger" disabled={deleting} type="submit">
					Delete Old Data
				</button>
			</form>
		</>
	);
};

export default DeleteOldData;
