import React, { ChangeEvent, FormEvent, useState } from "react";

import useTitleBar from "../hooks/useTitleBar";
import type { Player, View } from "../../common/types";
import Select from "react-select";
import { localActions, logEvent, toWorker, helpers } from "../util";
const EditAwardsFootball = ({
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
	const handleChange = (
		type: string,
		numberPlayer: number,
		numberTeam: number,
		event: any,
		index?: string,
	) => {
		let error: boolean = false;
		let returnedPlayer: any;
		const p: any = event;
		setState(prevState => {
			const aws: any = prevState.aws;
			if (
				type == "finalsMvp" ||
				type == "mvp" ||
				type == "droy" ||
				type == "oroy" ||
				type == "dpoy"
			) {
				aws[type] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					keyStats: p.currentStats.keyStats,
				};
			} else if (type == "allDefensive" || type == "allLeague") {
				let arrayPids: number[] = [];
				aws[type].map((team: any, index: number) => {
					team["players"].map((element: Player, index: number) => {
						arrayPids.push(element.pid);
					});
				});
				console.log(arrayPids);
				console.log(p.pid);
				console.log(p.pid in arrayPids);
				if (arrayPids.includes(p.pid)) {
					console.log("iyo");
					logEvent({
						type: "error",
						text: "Player already in teams of this category",
						saveToDb: false,
						persistent: true,
					});
					console.log("ito");
					returnedPlayer = aws[type][numberTeam]["players"][numberPlayer];
					error = true;
					return {
						...prevState,
						aws,
					};
				}

				aws[type][numberTeam]["players"][numberPlayer] = {
					pid: p.pid,
					name: p.name,
					tid: p.tid,
					abbrev: p.abbrev,
					keyStats: p.currentStats.keyStats,
				};
			} else if (type == "allRookie") {
				aws[type][numberPlayer] = {
					pid: p.pid,
					name: p.firstName + " ",
					tid: p.tid,
					abbrev: p.abbrev,
					keyStats: p.currentStats.keyStats,
				};
			}

			return {
				...prevState,
				aws,
			};
		});
		if (error && !!undefined) {
		}
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
						<label>Defensive Rookie of the year</label>
						<Select
							defaultValue={awards["droy"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("droy", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Offensive Rookie of the year</label>
						<Select
							defaultValue={awards["oroy"]}
							label="Single select"
							options={players}
							onChange={(event: any) => {
								handleChange("oroy", 0, 0, event);
							}}
							getOptionValue={option => option["pid"]}
							getOptionLabel={option => option["name"]}
						/>
					</div>
				</div>
				<h1>Teams</h1>
				<div className="row">
					{awards["allLeague"].map((element: any, i: number) => {
						const title = <h1 key={i}>{element.title} All League</h1>;
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
export default EditAwardsFootball;
