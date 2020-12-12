import React, { FormEvent, useState, useEffect } from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { logEvent, toWorker, helpers, realtimeUpdate } from "../util";
import SelectMultiple from "../components/SelectMultiple";
import { AWARD_NAMES } from "../../common";

const Position = ({ index, p }: { index: number; p: any }) => {
	if (process.env.SPORT !== "football") {
		return null;
	}

	let pos = p.pos;
	if (index === 24) {
		pos = "KR";
	} else if (index === 25) {
		pos = "PR";
	}
	return <div style={{ width: 26, marginTop: 10 }}>{pos}</div>;
};

const EditAwards = ({
	godMode,
	players,
	awards,
	season,
}: View<"editAwards">) => {
	useTitleBar({
		title: "Edit Awards",
		dropdownView: "edit_awards",
		dropdownFields: { seasonsHistory: season },
	});
	const [aws, setAws] = useState(() => helpers.deepCopy(awards));
	useEffect(() => {
		setAws(() => helpers.deepCopy(awards));
	}, [awards, season]);
	const handleChange = (obj: any, pl: any) => {
		let error: boolean = false;
		const p: any = pl;
		const type = obj.props.award;
		const numberTeam = obj.props.teamNumber;
		const numberPlayer = obj.props.playerNumber;

		setAws((prevState: any) => {
			const aws: any = prevState;

			if (
				type == "finalsMvp" ||
				type == "mvp" ||
				type == "smoy" ||
				type == "roy" ||
				type == "mip" ||
				type == "oroy" ||
				type == "droy"
			) {
				if (p.pid == undefined) {
					aws[type] = undefined;
				} else {
					if (process.env.SPORT === "basketball") {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.stats.pts,
							trb: p.stats.trb,
							ast: p.stats.ast,
						};
					} else {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.stats.keyStats,
							pos: p.ratings.pos,
						};
					}
				}
			} else if (type == "dpoy") {
				if (p.pid == undefined) {
					aws[type] = undefined;
				} else {
					if (process.env.SPORT === "basketball") {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							trb: p.stats.trb,
							blk: p.stats.blk,
							stl: p.stats.stl,
						};
					} else {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.stats.keyStats,
							pos: p.ratings.pos,
						};
					}
				}
			} else if (type == "allDefensive") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = undefined;
				} else {
					const arrayPids: number[] = [];
					aws[type].map((team: any) => {
						team["players"].map((element: any) => {
							if (element !== undefined) {
								arrayPids.push(element.pid);
							}
						});
					});
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
						obj.setValue(obj.state.select.value);
						return {
							...prevState,
							aws,
						};
					}
					if (process.env.SPORT === "basketball") {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							trb: p.stats.trb,
							blk: p.stats.blk,
							stl: p.stats.stl,
						};
					} else {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.stats.keyStats,
							pos:
								aws[type][numberTeam]["players"][numberPlayer]?.pos ??
								p.ratings.pos,
						};
					}
				}
			} else if (type == "allLeague") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = undefined;
				} else {
					const arrayPids: number[] = [];
					aws[type].map((team: any) => {
						team["players"].map((element: any) => {
							if (element !== undefined) {
								arrayPids.push(element.pid);
							}
						});
					});
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
						obj.setValue(obj.state.select.value);
						return {
							...prevState,
							aws,
						};
					}
					if (process.env.SPORT === "basketball") {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.stats.pts,
							trb: p.stats.trb,
							ast: p.stats.ast,
						};
					} else {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.stats.keyStats,
							pos:
								aws[type][numberTeam]["players"][numberPlayer]?.pos ??
								p.ratings.pos,
						};
					}
				}
			} else if (type == "allRookie") {
				if (p.pid == undefined) {
					aws[type][numberPlayer] = undefined;
				} else {
					const arrayPids: number[] = [];
					aws[type].map((element: any) => {
						if (element !== undefined) {
							arrayPids.push(element.pid);
						}
					});
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
						obj.setValue(obj.state.select.value);
						return {
							...prevState,
							aws,
						};
					}
					if (process.env.SPORT === "basketball") {
						aws[type][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.stats.pts,
							trb: p.stats.trb,
							ast: p.stats.ast,
						};
					} else {
						aws[type][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pos: aws[type][numberPlayer]?.pos ?? p.ratings.pos,
							keyStats: p.stats.keyStats,
						};
					}
				}
			}

			return aws;
		});
		return error;
	};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		try {
			await toWorker("main", "updateAwards", aws);
			realtimeUpdate([], helpers.leagueUrl(["history", season]));
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
		}
	};

	const simpleAwardKeys =
		process.env.SPORT === "basketball"
			? ["mvp", "dpoy", "smoy", "mip", "roy", "finalsMvp"]
			: ["mvp", "dpoy", "oroy", "droy", "finalsMvp"];

	console.log("hi", players, awards.mvp);

	const getPlayer = (p?: { pid: number }) => {
		if (!p) {
			return;
		}

		return players.find(p2 => p2.pid === p.pid);
	};

	if (awards) {
		return (
			<form onSubmit={handleFormSubmit}>
				<div className="row">
					{simpleAwardKeys.map(key => (
						<div key={key} className="col-lg-4 col-md-6 form-group">
							<label>{AWARD_NAMES[key]}</label>
							<SelectMultiple
								options={players}
								key={season}
								player={getPlayer(awards[key])}
								award={key}
								changing={handleChange}
							/>
						</div>
					))}
				</div>
				<div className="row">
					{awards["allLeague"].map((element: any, i: number) => {
						const teamSelect = element["players"].map(
							(player: any, j: number) => {
								return (
									<div className="d-flex" key={j}>
										<Position index={j} p={player} />
										<div className="form-group flex-grow-1">
											<SelectMultiple
												key={season}
												options={players}
												player={getPlayer(player)}
												award="allLeague"
												teamNumber={i}
												playerNumber={j}
												changing={handleChange}
											/>
										</div>
									</div>
								);
							},
						);

						return [
							<div className="col-lg-4 col-md-6" key={i}>
								<h3 className="mt-4">{element.title} All-League</h3>
								{teamSelect}
							</div>,
						];
					})}

					{process.env.SPORT === "basketball" ? (
						<>
							{awards["allDefensive"].map((element: any, i: number) => {
								const teamSelect = element["players"].map(
									(player: any, j: number) => {
										return (
											<div className="form-group" key={j}>
												<SelectMultiple
													key={season}
													options={players}
													player={getPlayer(player)}
													award="allDefensive"
													teamNumber={i}
													playerNumber={j}
													changing={handleChange}
												/>
											</div>
										);
									},
								);

								return [
									<div className="col-lg-4 col-md-6" key={i}>
										<h3 className="mt-4">{element.title} All-Defensive</h3>
										{teamSelect}
									</div>,
								];
							})}
						</>
					) : null}

					<div className="col-md-4 col-6">
						<h3 className="mt-4">All-Rookie Team</h3>
						{awards["allRookie"].map((player: any, i: number) => {
							return (
								<div className="d-flex" key={i}>
									<Position index={i} p={player} />
									<div className="form-group flex-grow-1">
										<SelectMultiple
											options={players}
											key={season}
											player={getPlayer(player)}
											award="allRookie"
											playerNumber={i}
											changing={handleChange}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<button className="btn btn-primary mt-3" disabled={!godMode}>
					Save Changes
				</button>
			</form>
		);
	} else {
		return <div>Awards from this season do not exist</div>;
	}
};
export default EditAwards;
