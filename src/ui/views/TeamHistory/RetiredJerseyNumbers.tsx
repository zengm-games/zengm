import React, { useState, ChangeEvent } from "react";
import { JerseyNumber } from "../../components";
import { helpers, confirm, toWorker, logEvent } from "../../util";
import type { View } from "../../../common/types";
import orderBy from "lodash/orderBy";
import { PLAYER } from "../../../common";

const RetiredJerseyNumbers = ({
	godMode,
	players,
	retiredJerseyNumbers,
	season,
	tid,
	userTid,
}: Pick<
	View<"teamHistory">,
	"godMode" | "players" | "retiredJerseyNumbers" | "season" | "tid" | "userTid"
>) => {
	const [editing, setEditing] = useState<
		| {
				type: "edit";
				index: number;
				number: string;
				seasonRetired: string;
				seasonTeamInfo: string;
				linkToPlayer: "yes" | "no";
				pid: string;
				text: string;
		  }
		| {
				type: "add";
				number: string;
				seasonRetired: string;
				seasonTeamInfo: string;
				linkToPlayer: "yes" | "no";
				pid: string;
				text: string;
		  }
		| undefined
	>();

	const sortedPlayers = orderBy(
		players.filter(p => p.tid === PLAYER.RETIRED),
		"name",
	);

	if (editing) {
		const editingPidInt = parseInt(editing.pid);
		const playerSelectValue = sortedPlayers.some(p => p.pid === editingPidInt)
			? editing.pid
			: "other";

		const handleChange = (field: string) => (
			event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		) => {
			setEditing({
				...editing,
				[field]: event.target.value,
			});
		};

		return (
			<form
				className="mb-3"
				onSubmit={async event => {
					event.preventDefault();

					try {
						await toWorker(
							"main",
							"retiredJerseyNumberUpsert",
							tid,
							editing.type === "edit" ? editing.index : undefined,
							{
								number: editing.number,
								seasonRetired: parseInt(editing.seasonRetired),
								seasonTeamInfo: parseInt(editing.seasonTeamInfo),
								pid:
									editing.linkToPlayer === "yes"
										? parseInt(editing.pid)
										: undefined,
								text: editing.text,
							},
						);

						setEditing(undefined);
					} catch (error) {
						logEvent({
							type: "error",
							text: error.message,
							saveToDb: false,
							persistent: true,
						});
					}
				}}
			>
				<h3>
					{editing.type === "add"
						? "Add Retired Jersey Number"
						: "Edit Retired Jersey Number"}
				</h3>
				<div className="row">
					<div className="col-lg-6">
						<div className="form-group">
							<label htmlFor="rjn-number">Jersey number</label>
							<input
								type="text"
								className="form-control"
								id="rjn-number"
								value={editing.number}
								onChange={handleChange("number")}
							/>
						</div>
						<div className="form-group">
							<label htmlFor="rjn-seasonRetired">
								Season of jersey retirement
							</label>
							<input
								type="text"
								className="form-control"
								id="rjn-seasonRetired"
								value={editing.seasonRetired}
								onChange={handleChange("seasonRetired")}
							/>
						</div>
						<div className="form-group">
							<label htmlFor="rjn-seasonTeamInfo">
								Season of displayed jersey
							</label>
							<input
								type="text"
								className="form-control"
								id="rjn-seasonTeamInfo"
								value={editing.seasonTeamInfo}
								onChange={handleChange("seasonTeamInfo")}
							/>
							<span className="form-text text-muted">
								This is used to determine the team region, name, and colors used
								to show the retired jersey.
							</span>
						</div>
						<div className="form-group">
							<label htmlFor="rjn-text">Optional text description</label>
							<input
								type="text"
								className="form-control"
								id="rjn-text"
								value={editing.text}
								onChange={handleChange("text")}
							/>
						</div>
					</div>
					<div className="col-lg-6">
						<div className="form-group">
							<label htmlFor="rjn-link">Link to player?</label>
							<select
								className="form-control"
								id="rjn-link"
								value={editing.linkToPlayer}
								onChange={handleChange("linkToPlayer")}
							>
								<option value="yes">Yes</option>
								<option value="no">No</option>
							</select>
						</div>

						{editing.linkToPlayer === "yes" ? (
							<>
								<p>
									You can either select one of your past players, or enter a
									player ID number to manually select any player, including
									players on other teams. The player ID number is at the end of
									the URL when you view a player's profile page.
								</p>
								<div className="form-group">
									<label htmlFor="rjn-player-select">Select player</label>
									<select
										className="form-control"
										id="rjn-player-select"
										value={playerSelectValue}
										onChange={event => {
											if (event.target.value !== "other") {
												handleChange("pid")(event);
											}
										}}
									>
										{sortedPlayers.map(p => (
											<option key={p.pid} value={p.pid}>
												{p.name}
											</option>
										))}
										<option value="other">Other</option>
									</select>
								</div>
								<div className="form-group">
									<label htmlFor="rjn-pid">Player ID number</label>
									<input
										type="text"
										className="form-control"
										id="rjn-pid"
										value={editing.pid}
										onChange={handleChange("pid")}
									/>
								</div>
							</>
						) : null}
					</div>
				</div>
				<button type="submit" className="btn btn-primary mr-2">
					Save
				</button>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						setEditing(undefined);
					}}
				>
					Cancel
				</button>
			</form>
		);
	}

	const deleteRetiredJersey = async (i: number) => {
		const row = retiredJerseyNumbers[i];
		if (!row) {
			return;
		}
		const proceed = await confirm(
			`Are you sure you want to un-retire jersey number ${row.number}?`,
			{
				okText: "Un-retire",
			},
		);

		if (proceed) {
			await toWorker("main", "retiredJerseyNumberDelete", tid, i);
		}
	};

	const editRetiredJersey = (i: number) => {
		const row = retiredJerseyNumbers[i];
		if (!row) {
			return;
		}

		setEditing({
			type: "edit",
			index: i,
			number: row.number,
			seasonRetired: String(row.seasonRetired),
			seasonTeamInfo: String(row.seasonTeamInfo),
			linkToPlayer: row.pid === undefined ? "no" : "yes",
			pid: row.pid === undefined ? "" : String(row.pid),
			text: row.text,
		});
	};

	const addRetiredJersey = () => {
		setEditing({
			type: "add",
			number: "",
			seasonRetired: String(season),
			seasonTeamInfo: String(season),
			linkToPlayer: "yes",
			pid: sortedPlayers.length > 0 ? sortedPlayers[0].pid : "",
			text: "",
		});
	};

	return (
		<>
			{retiredJerseyNumbers.length === 0 ? (
				<p>None yet!</p>
			) : (
				<div className="row">
					{retiredJerseyNumbers.map((row, i) => (
						<div
							key={i}
							className="col-md-6 col-lg-4 d-flex align-items-center mb-3"
						>
							<JerseyNumber
								className="flex-shrink-0"
								number={row.number}
								start={row.seasonRetired}
								end={row.seasonRetired}
								t={row.teamInfo}
							/>
							<div className="ml-3">
								<div>
									{row.pid !== undefined ? (
										<>
											{row.pos ? `${row.pos} ` : null}
											<a href={helpers.leagueUrl(["player", row.pid])}>
												{row.name}
											</a>
											{row.text ? " - " : null}
										</>
									) : null}
									{row.text}
								</div>
								{godMode || tid === userTid ? (
									<>
										<button
											className="btn btn-sm btn-link p-0 border-0"
											onClick={() => {
												editRetiredJersey(i);
											}}
										>
											Edit
										</button>{" "}
										|{" "}
										<button
											className="btn btn-sm btn-link p-0 border-0"
											onClick={() => {
												deleteRetiredJersey(i);
											}}
										>
											Delete
										</button>
									</>
								) : null}
							</div>
						</div>
					))}
				</div>
			)}
			{godMode || tid === userTid ? (
				<button className="btn btn-secondary mb-3" onClick={addRetiredJersey}>
					Add Retired Jersey Number
				</button>
			) : null}
		</>
	);
};

export default RetiredJerseyNumbers;
