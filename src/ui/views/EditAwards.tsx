import React, { FormEvent, useState, useEffect } from "react";

import useTitleBar from "../hooks/useTitleBar";
import type { Player, View } from "../../common/types";
import { logEvent, toWorker, helpers, realtimeUpdate } from "../util";
import SelectReact from "../components/SelectMultiple";
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
	const football = process.env.SPORT === "football";
	const basketball = process.env.SPORT === "basketball";
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
					if (basketball) {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.currentStats == undefined ? 0 : p.currentStats.pts,
							trb: p.currentStats == undefined ? 0 : p.currentStats.trb,
							ast: p.currentStats == undefined ? 0 : p.currentStats.ast,
						};
					} else {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.currentStats.keyStats,
							pos: p.pos,
						};
					}
				}
			} else if (type == "dpoy") {
				if (p.pid == undefined) {
					aws[type] = undefined;
				} else {
					if (basketball) {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							trb: p.currentStats == undefined ? 0 : p.currentStats.trb,
							blk: p.currentStats == undefined ? 0 : p.currentStats.blk,
							stl: p.currentStats == undefined ? 0 : p.currentStats.stl,
						};
					} else {
						aws[type] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.currentStats.keyStats,
							pos: p.pos,
						};
					}
				}
			} else if (type == "allDefensive") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = {};
				} else {
					const arrayPids: number[] = [];
					aws[type].map((team: any) => {
						team["players"].map((element: Player) => {
							arrayPids.push(element.pid);
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
					if (basketball) {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							trb: p.currentStats == undefined ? 0 : p.currentStats.trb,
							blk: p.currentStats == undefined ? 0 : p.currentStats.blk,
							stl: p.currentStats == undefined ? 0 : p.currentStats.stl,
						};
					} else {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.currentStats.keyStats,
							pos: p.pos,
						};
					}
				}
			} else if (type == "allLeague") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = {};
				} else {
					const arrayPids: number[] = [];
					aws[type].map((team: any) => {
						team["players"].map((element: Player) => {
							arrayPids.push(element.pid);
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
					if (basketball) {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.currentStats == undefined ? 0 : p.currentStats.pts,
							trb: p.currentStats == undefined ? 0 : p.currentStats.trb,
							ast: p.currentStats == undefined ? 0 : p.currentStats.ast,
						};
					} else {
						aws[type][numberTeam]["players"][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							keyStats: p.currentStats.keyStats,
							pos: p.pos,
						};
					}
				}
			} else if (type == "allRookie") {
				if (p.pid == undefined) {
					aws[type][numberPlayer] = {};
				} else {
					const arrayPids: number[] = [];
					aws[type].map((element: any) => {
						arrayPids.push(element.pid);
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
					if (basketball) {
						aws[type][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pts: p.currentStats == undefined ? 0 : p.currentStats.pts,
							trb: p.currentStats == undefined ? 0 : p.currentStats.trb,
							ast: p.currentStats == undefined ? 0 : p.currentStats.ast,
						};
					} else {
						aws[type][numberPlayer] = {
							pid: p.pid,
							name: p.name,
							tid: p.tid,
							abbrev: p.abbrev,
							pos: p.pos,
							keyStats: p.currentStats.keyStats,
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
	if (awards) {
		return (
			<form onSubmit={handleFormSubmit}>
				<div className="row">
					<div className="col-sm-4 col-6 form-group">
						<label>Finals MVP</label>
						<SelectReact
							options={players}
							key={season}
							player={awards["finalsMvp"]}
							award="finalsMvp"
							changing={handleChange}
						/>
					</div>
					<div className="col-sm-4 col-6 form-group">
						<label>MVP</label>
						<SelectReact
							options={players}
							key={season}
							player={awards["mvp"]}
							award="mvp"
							changing={handleChange}
						/>
					</div>

					<div className="col-sm-4 col-6 form-group" hidden={football}>
						<label>Rookie of the Year</label>
						<SelectReact
							key={season}
							options={players}
							player={awards["roy"]}
							award="roy"
							changing={handleChange}
						/>
					</div>
					<div className="col-sm-4 col-6 form-group">
						<label>Defensive Player of the Year</label>
						<SelectReact
							options={players}
							key={season}
							player={awards["dpoy"]}
							award="dpoy"
							changing={handleChange}
						/>
					</div>
					{basketball ? (
						<div className="col-sm-4 col-6 form-group" hidden={football}>
							<label>Six Man of the Year</label>
							<SelectReact
								options={players}
								key={season}
								player={awards["smoy"]}
								award="smoy"
								changing={handleChange}
							/>
						</div>
					) : null}
					{basketball ? (
						<div className="col-sm-4 col-6 form-group" hidden={football}>
							<label>Most Improved Player</label>
							<SelectReact
								options={players}
								key={season}
								player={awards["mip"]}
								award="mip"
								changing={handleChange}
							/>
						</div>
					) : null}

					{football ? (
						<div className="col-sm-4 col-6 form-group">
							<label>Defensive Rookie of the Year</label>

							<SelectReact
								options={players}
								key={season}
								player={awards["droy"]}
								award="droy"
								changing={handleChange}
							/>
						</div>
					) : null}
					{football ? (
						<div className="col-sm-4 col-6 form-group" hidden={basketball}>
							<label>Offensive Rookie of the Year</label>
							<SelectReact
								options={players}
								key={season}
								player={awards["oroy"]}
								award="oroy"
								changing={handleChange}
							/>
						</div>
					) : null}
				</div>
				<div className="row mt-4">
					{awards["allLeague"].map((element: any, i: number) => {
						const teamSelect = element["players"].map(
							(player: any, j: number) => {
								return (
									<div className="form-group" key={j}>
										<SelectReact
											key={season}
											options={players}
											player={player}
											award="allLeague"
											teamNumber={i}
											playerNumber={j}
											changing={handleChange}
										/>
									</div>
								);
							},
						);

						return [
							<div className="col-sm-4" key={i}>
								<h3>{element.title} All-League</h3>
								{teamSelect}
							</div>,
						];
					})}
				</div>
				{basketball ? (
					<div className="row mt-4">
						{awards["allDefensive"].map((element: any, i: number) => {
							const teamSelect = element["players"].map(
								(player: any, j: number) => {
									return (
										<div className="form-group" key={j}>
											<SelectReact
												key={season}
												options={players}
												player={player}
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
								<div className="col-sm-4" key={i}>
									<h3>{element.title} All-Defensive</h3>
									{teamSelect}
								</div>,
							];
						})}
					</div>
				) : null}
				<div className="row mt-4">
					<div className="col-sm-4">
						<h3>All-Rookie Team</h3>
						{awards["allRookie"].map((element: any, i: number) => {
							return (
								<div className="form-group" key={i}>
									<SelectReact
										options={players}
										key={season}
										player={element}
										award="allRookie"
										playerNumber={i}
										changing={handleChange}
									/>
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
