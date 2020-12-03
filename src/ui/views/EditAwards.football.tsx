import React, { FormEvent, useState } from "react";

import useTitleBar from "../hooks/useTitleBar";
import type { Player, View } from "../../common/types";
import { logEvent, toWorker, helpers, realtimeUpdate } from "../util";
import SelectReact from "../components/SelectMultiple";
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
	const handleChange = (obj: any, pl: any) => {
		let error: boolean = false;
		const p: any = pl;
		const type = obj.props.award;
		const numberTeam = obj.props.teamNumber;
		const numberPlayer = obj.props.playerNumber;
		if (state.aws == undefined) {
			setState(prevState => {
				const aws = helpers.deepCopy(awards);
				return {
					...prevState,
					aws,
				};
			});
		}
		setState(prevState => {
			const aws: any = prevState.aws;
			if (p.currentStats == undefined) {
				p.currentStats = { keyStats: "No stats available" };
			}
			if (
				type == "finalsMvp" ||
				type == "mvp" ||
				type == "droy" ||
				type == "oroy" ||
				type == "dpoy"
			) {
				if (p.pid == undefined) {
					aws[type] = undefined;
				} else {
					aws[type] = {
						pid: p.pid,
						name: p.name,
						tid: p.tid,
						abbrev: p.abbrev,
						keyStats: p.currentStats.keyStats,
					};
				}
			} else if (type == "allDefensive" || type == "allLeague") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = undefined;
				}
				{
					const arrayPids: number[] = [];
					aws[type].map((team: any) => {
						team["players"].map((element: Player) => {
							arrayPids.push(element.pid);
						});
					});
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Player already in teams of this category",
							saveToDb: false,
							persistent: true,
						});
						error = true;
						obj.setValue(obj.state.select.value);
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
				}
			} else if (type == "allRookie") {
				if (p.pid == undefined) {
					aws[type][numberTeam]["players"][numberPlayer] = {};
				} else {
					const arrayPids: number[] = [];
					aws[type].map((element: any) => {
						arrayPids.push(element.pid);
					});
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Player already in teams of this category",
							saveToDb: false,
							persistent: true,
						});
						error = true;
						obj.setValue(obj.state.select.value);
						return {
							...prevState,
							aws,
						};
					}
					aws[type][numberPlayer] = {
						pid: p.pid,
						name: p.firstName + " ",
						tid: p.tid,
						abbrev: p.abbrev,
						keyStats: p.currentStats.keyStats,
					};
				}
			}

			return {
				...prevState,
				aws,
			};
		});
		return error;
	};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setState(prevState => ({
			...prevState,
			saving: true,
		}));

		try {
			await toWorker("main", "upsertAwards", state, awardsInitial);
			realtimeUpdate([], helpers.leagueUrl(["history"]));
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
						<SelectReact
							options={players}
							player={awards["finalsMvp"]}
							award="finalsMvp"
							changing={handleChange.bind(this)}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>MVP</label>
						<SelectReact
							options={players}
							player={awards["mvp"]}
							award="mvp"
							changing={handleChange.bind(this)}
						/>
					</div>

					<div className="col-sm-3 col-6 form-group">
						<label>Defensive Player of the year</label>
						<SelectReact
							options={players}
							player={awards["dpoy"]}
							award="dpoy"
							changing={handleChange.bind(this)}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Defensive Rookie of the year</label>

						<SelectReact
							options={players}
							player={awards["droy"]}
							award="droy"
							changing={handleChange.bind(this)}
						/>
					</div>
					<div className="col-sm-3 col-6 form-group">
						<label>Offensive Rookie of the year</label>
						<SelectReact
							options={players}
							player={awards["oroy"]}
							award="oroy"
							changing={handleChange.bind(this)}
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
									<div className="col form-group" key={j}>
										<SelectReact
											options={players}
											player={player}
											award="allLeague"
											teamNumber={i}
											playerNumber={j}
											changing={handleChange.bind(this)}
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
						<div className="col-sm-3 col-6 form-group" key={i}>
							<SelectReact
								options={players}
								player={element}
								award="allRookie"
								playerNumber={i}
								changing={handleChange.bind(this)}
							/>
						</div>
					);
				})}
				<button className="btn btn-primary mt-3" disabled={!godMode}>
					Save changes
				</button>
			</form>
		);
	} else {
		return <div>Awards from this season do not exist</div>;
	}
};
export default EditAwardsFootball;
