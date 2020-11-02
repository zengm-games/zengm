import React, { ChangeEvent, FormEvent, useState } from "react";

import useTitleBar from "../hooks/useTitleBar";
import type { Player, View } from "../../common/types";
import Select from "react-select";
import { localActions, logEvent, toWorker, helpers } from "../util";
const EditAwardsBasketball = ({
	godMode,
	players,
	awards,
	season,
}: View<"editAwards">) => {
	useTitleBar({
		title: "Edit awards",
		dropdownView: "edit_awards",
		dropdownFields: { seasons: season },
	});

	const awardsInitial = awards;
	const [state, setState] = useState(() => {
		const aws = helpers.deepCopy(awards);

		return {
			aws,
		};
	});
	const iyo = "yoo";
	const handleChange = (
		type: string,
		numberPlayer: number,
		numberTeam: number,
		event: any,
	) => {
		const p: any = event;
		setState(prevState => {
			const aws: any = prevState.aws;
			if (
				type == "finalsMvp" ||
				type == "mvp" ||
				type == "smoy" ||
				type == "roy"
			) {
				aws[type] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					pts: p.currentStats == undefined ? 0.0 : p.currentStats.pts,
					trb: p.currentStats == undefined ? 0.0 : p.currentStats.trb,
					ast: p.currentStats == undefined ? 0.0 : p.currentStats.ast,
				};
			} else if (type == "dpoy") {
				aws[type] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					trb: p.currentStats == undefined ? 0.0 : p.currentStats.trb,
					blk: p.currentStats == undefined ? 0.0 : p.currentStats.blk,
					stl: p.currentStats == undefined ? 0.0 : p.currentStats.stl,
				};
			} else if (type == "allDefensive") {
				aws[type][numberTeam]["players"][numberPlayer] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					trb: p.currentStats == undefined ? 0.0 : p.currentStats.trb,
					blk: p.currentStats == undefined ? 0.0 : p.currentStats.blk,
					stl: p.currentStats == undefined ? 0.0 : p.currentStats.stl,
				};
			} else if (type == "allLeague") {
				aws[type][numberTeam]["players"][numberPlayer] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					pts: p.currentStats == undefined ? 0.0 : p.currentStats.pts,
					trb: p.currentStats == undefined ? 0.0 : p.currentStats.trb,
					ast: p.currentStats == undefined ? 0.0 : p.currentStats.ast,
				};
			} else if (type == "allRookie") {
				aws[type][numberPlayer] = {
					pid: p.pid,
					name: p.firstName + " ",
					tid: p.tid,
					abbrev: p.abbrev,
					pts: p.currentStats == undefined ? 0.0 : p.currentStats.pts,
					trb: p.currentStats == undefined ? 0.0 : p.currentStats.trb,
					ast: p.currentStats == undefined ? 0.0 : p.currentStats.ast,
				};
			}

			return {
				...prevState,
				aws,
			};
		});
	};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setState(prevState => ({
			...prevState,
			saving: true,
		}));

		try {
			const aws = await toWorker("main", "upsertAwards", state, awardsInitial);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			setState(prevState => ({
				...prevState,
				saving: false,
			}));
		}
	};
	if (awards) {
		return (
			<form onSubmit={handleFormSubmit}>
				<div className="row">
					<div className="col-sm-3 col-6 form-group">
						<label>Finals MVP</label>
						<Select
							defaultValue={awards["finalsMvp"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("finalsMvp", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>MVP</label>
						<Select
							defaultValue={awards["mvp"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("mvp", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>

					<div className="col-sm-3 col-6 form-group">
						<label>Rookie of the year</label>
						<Select
							defaultValue={awards["roy"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("roy", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Defensive Player of the year</label>
						<Select
							defaultValue={awards["dpoy"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("dpoy", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Six Man of the year</label>
						<Select
							defaultValue={awards["smoy"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("smoy", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
				</div>
				<h1>Teams</h1>
				<div className="row">
					{awards["allLeague"].map((element: any, i: number) => {
						const title = <h1 key={i}>{element.title} All NBA</h1>;
						const teamSelect = element["players"].map(
							(player: any, j: number) => {
								return (
									<div className="col form-group">
										<Select
											defaultValue={player}
											label="Single select"
											options={players}
											onChange={(event: any) => {
												handleChange("allLeague", j, i, event);
											}}
											getOptionValue={option => option["pid"]}
											getOptionLabel={option => option["name"]}
										/>
									</div>
								);
							},
						);

						return [
							<div className="col">
								{" "}
								{title} {teamSelect}{" "}
							</div>,
						];
					})}
				</div>
				<div className="row">
					{awards["allDefensive"].map((element: any, i: number) => {
						const title = <h1 key={i}>{element.title} All Defensive</h1>;
						const teamSelect = element["players"].map(
							(player: any, j: number) => {
								return (
									<div className="col form-group">
										<Select
											defaultValue={player}
											label="Single select"
											options={players}
											onChange={(event: any) => {
												handleChange("allDefensive", j, i, event);
											}}
											getOptionValue={option => option["pid"]}
											getOptionLabel={option => option["name"]}
										/>
									</div>
								);
							},
						);

						return [
							<div className="col">
								{" "}
								{title} {teamSelect}{" "}
							</div>,
						];
					})}
				</div>
				<h1>All-Rookie Team</h1>
				{awards["allRookie"].map((element: any, i: number) => {
					return (
						<div className="col-sm-3 col-6 form-group">
							<Select
								defaultValue={element}
								label="Single select"
								options={players}
								onChange={(event: any) => {
									handleChange("allRookie", i, 0, event);
								}}
								getOptionValue={option => option["pid"]}
								getOptionLabel={option => option["name"]}
							/>
						</div>
					);
				})}
				<button className="btn btn-primary mt-3">Save changes</button>
			</form>
		);
	} else {
		return <div>Awards from thsis season do not exist</div>;
	}
};
export default EditAwardsBasketball;
