import { type FormEvent, useState, useEffect } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { logEvent, toWorker, helpers, realtimeUpdate } from "../util/index.ts";
import SelectMultiple from "../components/SelectMultiple/index.tsx";
import {
	AWARD_NAMES,
	bySport,
	isSport,
	SIMPLE_AWARDS,
} from "../../common/index.ts";
import { range } from "../../common/utils.ts";

const Position = ({ index, p }: { index: number; p: any }) => {
	if (!isSport("football")) {
		return null;
	}

	let pos = p ? p.pos : "";
	if (index === 24) {
		pos = "KR";
	} else if (index === 25) {
		pos = "PR";
	}
	return <div style={{ width: 26, marginTop: 10 }}>{pos}</div>;
};

const makeAwardPlayer = (
	p: any,
	{
		type,
		pos,
	}: {
		type?: "defense";
		pos?: string;
	} = {},
) => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.stats.tid,
		abbrev: p.stats.abbrev,
		...bySport<any>({
			baseball: {
				pos: pos ?? p.ratings.pos,
				keyStats: p.stats.keyStats,
			},
			basketball:
				type === "defense"
					? {
							trb: p.stats.trb,
							blk: p.stats.blk,
							stl: p.stats.stl,
						}
					: {
							pts: p.stats.pts,
							trb: p.stats.trb,
							ast: p.stats.ast,
						},
			football: {
				pos: pos ?? p.ratings.pos,
				keyStats: p.stats.keyStats,
			},
			hockey: {
				pos: pos ?? p.ratings.pos,
				a: p.stats.a,
				dps: p.stats.dps,
				g: p.stats.g,
				gaa: p.stats.gaa,
				gps: p.stats.gps,
				hit: p.stats.hit,
				ops: p.stats.ops,
				pts: p.stats.pts,
				svPct: p.stats.svPct,
				tk: p.stats.tk,
			},
		}),
	};
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

	const handleChange =
		(type: string, teamNumber = 0, playerNumber = 0) =>
		(p: any) => {
			let error = false;

			const newAwards = { ...aws };
			if (
				type == "finalsMvp" ||
				type == "mvp" ||
				type == "goy" ||
				type == "smoy" ||
				type == "roy" ||
				type == "mip" ||
				type == "oroy" ||
				type == "droy" ||
				type == "poy" ||
				type == "rpoy"
			) {
				// All these == and != undefined checks are because when exporting a league, undefined is changed to null
				if (p?.pid == undefined) {
					newAwards[type] = undefined;
				} else {
					newAwards[type] = makeAwardPlayer(p);
				}
			} else if (type == "dpoy" || type === "dfoy") {
				if (p?.pid == undefined) {
					newAwards[type] = undefined;
				} else {
					newAwards[type] = makeAwardPlayer(p, {
						type: "defense",
					});
				}
			} else if (type == "allDefensive") {
				if (p?.pid == undefined) {
					newAwards[type][teamNumber].players[playerNumber] = undefined;
				} else {
					const arrayPids: number[] = [];
					for (const team of newAwards[type]) {
						for (const element of team.players) {
							if (element != undefined) {
								arrayPids.push(element.pid);
							}
						}
					}
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
					} else {
						newAwards[type][teamNumber].players[playerNumber] = makeAwardPlayer(
							p,
							{
								type: "defense",
								pos: newAwards[type][teamNumber].players[playerNumber]?.pos,
							},
						);
					}
				}
			} else if (type == "allLeague") {
				if (p?.pid == undefined) {
					newAwards[type][teamNumber].players[playerNumber] = undefined;
				} else {
					const arrayPids: number[] = [];
					for (const team of newAwards[type]) {
						for (const element of team.players) {
							if (element != undefined) {
								arrayPids.push(element.pid);
							}
						}
					}
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
					} else {
						newAwards[type][teamNumber].players[playerNumber] = makeAwardPlayer(
							p,
							{
								pos: newAwards[type][teamNumber].players[playerNumber]?.pos,
							},
						);
					}
				}
			} else if (
				type == "allRookie" ||
				(isSport("baseball") &&
					(type === "allOffense" || type === "allDefense")) ||
				type === "sfmvp"
			) {
				if (p?.pid == undefined) {
					newAwards[type][playerNumber] = undefined;
				} else {
					const arrayPids: number[] = [];
					for (const element of newAwards[type]) {
						if (element != undefined) {
							arrayPids.push(element.pid);
						}
					}
					if (arrayPids.includes(p.pid)) {
						logEvent({
							type: "error",
							text: "Cannot add player to team twice",
							saveToDb: false,
						});
						error = true;
					} else {
						newAwards[type][playerNumber] = makeAwardPlayer(p, {
							pos: newAwards[type][playerNumber]?.pos,
						});
					}
				}
			}

			if (!error) {
				setAws({ ...newAwards });
			}

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

	const getPlayer = (p?: { pid: number }) => {
		if (!p) {
			return;
		}

		return players.find((p2) => p2.pid === p.pid);
	};

	const getOptionLabel = (award: string) => (p: any) => {
		if (p.pid === undefined) {
			return p.name;
		}

		let stats;
		if (isSport("basketball")) {
			if (award === "dpoy" || award === "allDefensive") {
				stats = `${helpers.roundStat(p.stats.trb, "trb")} reb, ${helpers.roundStat(p.stats.blk, "blk")} blk, ${helpers.roundStat(p.stats.stl, "stl")} stl`;
			} else {
				stats = `${helpers.roundStat(p.stats.pts, "pts")} pts, ${helpers.roundStat(p.stats.trb, "reb")} reb, ${helpers.roundStat(p.stats.ast, "ast")} ast`;
			}
		} else if (isSport("hockey")) {
			stats = p.stats.keyStatsWithGoalieGP;
		} else {
			stats = p.stats.keyStats;
		}
		return `${p.name} (${p.ratings.pos}, ${p.stats.abbrev}) ${stats}`;
	};

	if (aws) {
		return (
			<form onSubmit={handleFormSubmit}>
				<div className="row">
					{SIMPLE_AWARDS.map((key) => (
						<div key={key} className="col-lg-4 col-md-6 mb-3">
							<label className="form-label">{AWARD_NAMES[key]}</label>
							<SelectMultiple
								options={players}
								key={season}
								value={getPlayer(aws[key])}
								getOptionLabel={getOptionLabel(key)}
								getOptionValue={(p) => String(p.pid)}
								onChange={handleChange(key)}
							/>
						</div>
					))}
					{isSport("basketball") ? (
						<div className="col-lg-4 col-md-6 mb-3">
							<label className="form-label">{AWARD_NAMES.sfmvp}s</label>
							{range(2).map((i) => {
								const player = aws.sfmvp[i];
								return (
									<div className="d-flex" key={i}>
										<Position index={i} p={player} />
										<div className="mb-3 flex-grow-1">
											<SelectMultiple
												options={players}
												key={season}
												value={getPlayer(player)}
												getOptionLabel={getOptionLabel("sfmvp")}
												getOptionValue={(p) => String(p.pid)}
												onChange={handleChange("sfmvp", undefined, i)}
											/>
										</div>
									</div>
								);
							})}
						</div>
					) : null}
				</div>
				<div className="row">
					{!isSport("baseball")
						? aws.allLeague.map((element: any, i: number) => {
								const teamSelect = element.players.map(
									(player: any, j: number) => {
										return (
											<div className="d-flex" key={j}>
												<Position index={j} p={player} />
												<div className="mb-3 flex-grow-1">
													<SelectMultiple
														key={season}
														options={players}
														value={getPlayer(player)}
														getOptionLabel={getOptionLabel("allLeague")}
														getOptionValue={(p) => String(p.pid)}
														onChange={handleChange("allLeague", i, j)}
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
							})
						: null}

					{isSport("basketball") ? (
						<>
							{aws.allDefensive.map((element: any, i: number) => {
								const teamSelect = element.players.map(
									(player: any, j: number) => {
										return (
											<div className="mb-3" key={j}>
												<SelectMultiple
													key={season}
													options={players}
													value={getPlayer(player)}
													getOptionLabel={getOptionLabel("allDefensive")}
													getOptionValue={(p) => String(p.pid)}
													onChange={handleChange("allDefensive", i, j)}
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

					{isSport("baseball") ? (
						<>
							<div className="col-md-4 col-6">
								<h3 className="mt-4">All-Offensive Team</h3>
								{aws.allOffense.map((player: any, i: number) => {
									return (
										<div className="d-flex" key={i}>
											<Position index={i} p={player} />
											<div className="mb-3 flex-grow-1">
												<SelectMultiple
													options={players}
													key={season}
													value={getPlayer(player)}
													getOptionLabel={getOptionLabel("allOffense")}
													getOptionValue={(p) => String(p.pid)}
													onChange={handleChange("allOffense", undefined, i)}
												/>
											</div>
										</div>
									);
								})}
							</div>

							<div className="col-md-4 col-6">
								<h3 className="mt-4">All-Defensive Team</h3>
								{aws.allDefense.map((player: any, i: number) => {
									return (
										<div className="d-flex" key={i}>
											<Position index={i} p={player} />
											<div className="mb-3 flex-grow-1">
												<SelectMultiple
													options={players}
													key={season}
													value={getPlayer(player)}
													getOptionLabel={getOptionLabel("allDefense")}
													getOptionValue={(p) => String(p.pid)}
													onChange={handleChange("allDefense", undefined, i)}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</>
					) : null}

					<div className="col-md-4 col-6">
						<h3 className="mt-4">All-Rookie Team</h3>
						{aws.allRookie.map((player: any, i: number) => {
							return (
								<div className="d-flex" key={i}>
									<Position index={i} p={player} />
									<div className="mb-3 flex-grow-1">
										<SelectMultiple
											options={players}
											key={season}
											value={getPlayer(player)}
											getOptionLabel={getOptionLabel("allRookie")}
											getOptionValue={(p) => String(p.pid)}
											onChange={handleChange("allRookie", undefined, i)}
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
