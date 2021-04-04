import { useReducer, useState } from "react";
import type { Dispatch } from "react";
import type { NewLeagueTeam } from "./types";
import type { Conf, Div, View } from "../../../common/types";
import classNames from "classnames";
import arrayMove from "array-move";
import orderBy from "lodash-es/orderBy";
import UpsertTeamModal from "./UpsertTeamModal";
import countBy from "lodash-es/countBy";
import { logEvent } from "../../util";
import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs";
import getTeamInfos from "../../../common/getTeamInfos";
import confirmDeleteWithChlidren from "./confirmDeleteWithChlidren";

const makeTIDsSequential = <T extends { tid: number }>(teams: T[]): T[] => {
	return teams.map((t, i) => ({
		...t,
		tid: i,
	}));
};

type ConfsDivsTeams = {
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeam[];
};

type State = ConfsDivsTeams;

type Action =
	| ({
			type: "setState";
	  } & ConfsDivsTeams)
	| {
			type: "addConf";
	  }
	| {
			type: "addDiv";
			cid: number;
	  }
	| {
			type: "addTeam";
			t: NewLeagueTeam;
	  }
	| {
			type: "renameConf";
			cid: number;
			name: string;
	  }
	| {
			type: "renameDiv";
			did: number;
			name: string;
	  }
	| {
			type: "editTeam";
			t: NewLeagueTeam;
	  }
	| {
			type: "moveConf";
			cid: number;
			direction: 1 | -1;
	  }
	| {
			type: "moveDiv";
			did: number;
			direction: 1 | -1;
	  }
	| {
			type: "deleteConf";
			cid: number;
			moveToCID?: number;
	  }
	| {
			type: "deleteDiv";
			did: number;
			moveToDID?: number;
	  }
	| {
			type: "deleteTeam";
			tid: number;
	  };

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "setState":
			return {
				...state,
				confs: action.confs,
				divs: action.divs,
				teams: action.teams,
			};

		case "addConf": {
			const maxCID =
				state.confs.length > 0
					? Math.max(...state.confs.map(conf => conf.cid))
					: -1;
			return {
				...state,
				confs: [
					...state.confs,
					{
						cid: maxCID + 1,
						name: "New Conference",
					},
				],
			};
		}

		case "addDiv": {
			const maxDID =
				state.divs.length > 0
					? Math.max(...state.divs.map(div => div.did))
					: -1;
			return {
				...state,
				divs: [
					...state.divs,
					{
						did: maxDID + 1,
						cid: action.cid,
						name: "New Division",
					},
				],
			};
		}

		case "addTeam": {
			return {
				...state,
				teams: makeTIDsSequential([...state.teams, action.t]),
			};
		}

		case "renameConf":
			return {
				...state,
				confs: state.confs.map(conf => {
					if (action.cid !== conf.cid) {
						return conf;
					}

					return {
						...conf,
						name: action.name,
					};
				}),
			};

		case "renameDiv":
			return {
				...state,
				divs: state.divs.map(div => {
					if (action.did !== div.did) {
						return div;
					}

					return {
						...div,
						name: action.name,
					};
				}),
			};

		case "editTeam": {
			const newTeams = state.teams.map(t => {
				if (t.tid !== action.t.tid) {
					return t;
				}

				return action.t;
			});
			return {
				...state,
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "moveConf": {
			const oldIndex = state.confs.findIndex(conf => conf.cid === action.cid);
			const newIndex = oldIndex + action.direction;

			if (newIndex < 0 || newIndex > state.confs.length - 1) {
				return state;
			}

			const newConfs = arrayMove(state.confs, oldIndex, newIndex);

			return {
				...state,
				confs: newConfs,
			};
		}

		case "moveDiv": {
			// Make sure we're sorted by cid, to make moving between conferences easy
			const newDivs = orderBy(state.divs, "cid", "asc");

			const div = newDivs.find(div => div.did === action.did);
			if (!div) {
				return state;
			}

			// See if we're moving at the boundary of the conference, in which case we need to switch to a new conference
			const divsLocal = newDivs.filter(div2 => div2.cid === div.cid);
			const indexLocal = divsLocal.findIndex(div => div.did === action.did);
			let newCID = -1;
			if (
				(indexLocal === 0 && action.direction === -1) ||
				(indexLocal === divsLocal.length - 1 && action.direction === 1)
			) {
				const confIndex = state.confs.findIndex(conf => conf.cid === div.cid);
				if (confIndex > 0 && action.direction === -1) {
					newCID = state.confs[confIndex - 1].cid;
				} else if (
					confIndex < state.confs.length - 1 &&
					action.direction === 1
				) {
					newCID = state.confs[confIndex + 1].cid;
				}
			}

			if (newCID >= 0) {
				return {
					...state,
					divs: newDivs.map(div => {
						if (action.did !== div.did) {
							return div;
						}

						return {
							...div,
							cid: newCID,
						};
					}),
				};
			}

			// Normal move
			const oldIndex = newDivs.findIndex(div => div.did === action.did);
			const newIndex = oldIndex + action.direction;

			if (newIndex < 0 || newIndex > newDivs.length - 1) {
				return state;
			}

			const newDivs2 = arrayMove(newDivs, oldIndex, newIndex);

			return {
				...state,
				divs: newDivs2,
			};
		}

		case "deleteConf": {
			const { moveToCID } = action;

			let newDivs;
			let newTeams;
			if (moveToCID === undefined) {
				// Delete children
				newDivs = state.divs.filter(div => div.cid !== action.cid);
				newTeams = state.teams.filter(t => t.cid !== action.cid);
			} else {
				// Move children
				newDivs = state.divs.map(div => {
					if (div.cid !== action.cid) {
						return div;
					}

					return {
						...div,
						cid: moveToCID,
					};
				});
				newTeams = state.teams.map(t => {
					if (t.cid !== action.cid) {
						return t;
					}

					return {
						...t,
						cid: moveToCID,
					};
				});
			}

			return {
				confs: state.confs.filter(conf => conf.cid !== action.cid),
				divs: newDivs,
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "deleteDiv": {
			let newTeams;
			if (action.moveToDID === undefined) {
				// Delete children
				newTeams = state.teams.filter(t => t.did !== action.did);
			} else {
				// Move children
				const div = state.divs.find(div => div.did === action.moveToDID);
				if (!div) {
					throw new Error("div not found");
				}
				newTeams = state.teams.map(t => {
					if (t.did !== action.did) {
						return t;
					}

					return {
						...t,
						did: div.did,
						cid: div.cid,
					};
				});
			}

			return {
				...state,
				divs: state.divs.filter(div => div.did !== action.did),
				teams: makeTIDsSequential(newTeams),
			};
		}

		case "deleteTeam":
			return {
				...state,
				teams: makeTIDsSequential(
					state.teams.filter(t => t.tid !== action.tid),
				),
			};

		default:
			throw new Error();
	}
};

const EditButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			className="ml-2 btn btn-link p-0 border-0 text-reset"
			onClick={onClick}
			title="Edit"
			type="button"
		>
			<span className="glyphicon glyphicon-edit" />
		</button>
	);
};

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			className="ml-2 btn btn-link text-danger p-0 border-0"
			onClick={onClick}
			title="Delete"
			type="button"
		>
			<span className="glyphicon glyphicon-remove" />
		</button>
	);
};

const CardHeader = ({
	alignButtonsRight,
	name,
	onDelete,
	onMoveDown,
	onMoveUp,
	onRename,
	disableMoveUp,
	disableMoveDown,
}: {
	alignButtonsRight?: boolean;
	name: string;
	onDelete: () => void;
	onMoveDown: () => void;
	onMoveUp: () => void;
	onRename: (name: string) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [controlledName, setControlledName] = useState(name);

	return (
		<div
			className={classNames("card-header", renaming ? "p-1" : undefined)}
			style={{ height: 44 }}
		>
			{renaming ? (
				<form
					className="d-flex"
					onSubmit={event => {
						event.preventDefault();
						onRename(controlledName);
						setRenaming(false);
					}}
					style={{ maxWidth: 300 }}
				>
					<input
						type="text"
						className="form-control mr-2"
						value={controlledName}
						onChange={event => {
							setControlledName(event.target.value);
						}}
					/>
					<button type="submit" className="btn btn-primary">
						Save
					</button>
				</form>
			) : (
				<div className="d-flex">
					<div className={alignButtonsRight ? "mr-auto" : "mr-2"}>{name}</div>
					<button
						className="ml-2 btn btn-link p-0 border-0 text-reset"
						title="Move Up"
						type="button"
						onClick={onMoveUp}
						disabled={disableMoveUp}
					>
						<span className="glyphicon glyphicon-menu-left" />
					</button>
					<button
						className="ml-2 btn btn-link p-0 border-0 text-reset"
						title="Move Down"
						type="button"
						onClick={onMoveDown}
						disabled={disableMoveDown}
					>
						<span className="glyphicon glyphicon-menu-right" />
					</button>
					<EditButton
						onClick={() => {
							setRenaming(true);
						}}
					/>
					<DeleteButton onClick={onDelete} />
				</div>
			)}
		</div>
	);
};

const AddTeam = ({
	addTeam,
	did,
	availableBuiltInTeams,
}: {
	addTeam: (did: number, t?: NewLeagueTeam) => void;
	did: number;
	availableBuiltInTeams: NewLeagueTeam[];
}) => {
	const [abbrev, setAbbrev] = useState("custom");

	return (
		<div className="card-body p-0 m-3">
			<div className="input-group">
				<select
					className="form-control"
					value={abbrev}
					onChange={event => {
						setAbbrev(event.target.value);
					}}
				>
					<option value="custom">Custom Team</option>
					{availableBuiltInTeams.map(t => (
						<option key={t.abbrev} value={t.abbrev}>
							{t.region} {t.name} ({t.abbrev})
						</option>
					))}
				</select>
				<div className="input-group-append">
					<button
						className="btn btn-secondary"
						onClick={() => {
							const t = availableBuiltInTeams.find(t => t.abbrev === abbrev);
							addTeam(did, t);
						}}
					>
						Add Team
					</button>
				</div>
			</div>
		</div>
	);
};

const Division = ({
	div,
	divs,
	confs,
	teams,
	dispatch,
	addTeam,
	editTeam,
	disableMoveUp,
	disableMoveDown,
	abbrevsUsedMultipleTimes,
	availableBuiltInTeams,
}: {
	div: Div;
	divs: Div[];
	confs: Conf[];
	teams: NewLeagueTeam[];
	dispatch: Dispatch<Action>;
	addTeam: (did: number, t?: NewLeagueTeam) => void;
	editTeam: (tid: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	abbrevsUsedMultipleTimes: string[];
	availableBuiltInTeams: NewLeagueTeam[];
}) => {
	return (
		<div className="card mt-3">
			<CardHeader
				alignButtonsRight
				name={div.name}
				onDelete={async () => {
					if (teams.length === 0) {
						dispatch({ type: "deleteDiv", did: div.did });
					} else {
						const siblings = divs
							.filter(div2 => div2.did !== div.did)
							.map(div2 => {
								const conf = confs.find(conf => conf.cid === div2.cid);
								return {
									key: div2.did,
									text: `Move teams to "${div2.name}" division (${
										conf ? conf.name : "unknown conference"
									})`,
								};
							});
						const { proceed, key } = await confirmDeleteWithChlidren({
							text: `When the "${div.name}" division is deleted, what should happen to its teams?`,
							deleteButtonText: "Delete Division",
							deleteChildrenText: `Delete all teams in the "${div.name}" division`,
							siblings,
						});

						if (proceed) {
							dispatch({ type: "deleteDiv", did: div.did, moveToDID: key });
						}
					}
				}}
				onMoveDown={() => {
					dispatch({ type: "moveDiv", did: div.did, direction: 1 });
				}}
				onMoveUp={() => {
					dispatch({ type: "moveDiv", did: div.did, direction: -1 });
				}}
				onRename={(name: string) => {
					dispatch({ type: "renameDiv", did: div.did, name });
				}}
				disableMoveUp={disableMoveUp}
				disableMoveDown={disableMoveDown}
			/>

			<ul className="list-group list-group-flush">
				{teams.map(t => (
					<li key={t.tid} className="list-group-item d-flex">
						<div className="mr-auto">
							{t.region} {t.name}{" "}
							<span
								className={
									abbrevsUsedMultipleTimes.includes(t.abbrev)
										? "text-danger"
										: undefined
								}
							>
								({t.abbrev})
							</span>
						</div>
						<EditButton
							onClick={() => {
								editTeam(t.tid);
							}}
						/>
						<DeleteButton
							onClick={() => {
								dispatch({ type: "deleteTeam", tid: t.tid });
							}}
						/>
					</li>
				))}
			</ul>

			<AddTeam
				addTeam={addTeam}
				did={div.did}
				availableBuiltInTeams={availableBuiltInTeams}
			/>
		</div>
	);
};

const Conference = ({
	conf,
	confs,
	divs,
	teams,
	dispatch,
	addTeam,
	editTeam,
	disableMoveUp,
	disableMoveDown,
	abbrevsUsedMultipleTimes,
	availableBuiltInTeams,
}: {
	conf: Conf;
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeam[];
	dispatch: Dispatch<Action>;
	addTeam: (did: number, t?: NewLeagueTeam) => void;
	editTeam: (tid: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	abbrevsUsedMultipleTimes: string[];
	availableBuiltInTeams: NewLeagueTeam[];
}) => {
	const children = divs.filter(div => div.cid === conf.cid);

	return (
		<div className="card mb-3">
			<CardHeader
				name={conf.name}
				onDelete={async () => {
					if (children.length === 0) {
						dispatch({ type: "deleteConf", cid: conf.cid });
					} else {
						const siblings = confs
							.filter(conf2 => conf2.cid !== conf.cid)
							.map(conf2 => ({
								key: conf2.cid,
								text: `Move divisions to "${conf2.name}" conference`,
							}));
						const { proceed, key } = await confirmDeleteWithChlidren({
							text: `When the "${conf.name}" conference is deleted, what should happen to its divisions?`,
							deleteButtonText: "Delete Conference",
							deleteChildrenText: `Delete all divisions in the "${conf.name}" conference`,
							siblings,
						});

						if (proceed) {
							dispatch({ type: "deleteConf", cid: conf.cid, moveToCID: key });
						}
					}
				}}
				onMoveDown={() => {
					dispatch({ type: "moveConf", cid: conf.cid, direction: 1 });
				}}
				onMoveUp={() => {
					dispatch({ type: "moveConf", cid: conf.cid, direction: -1 });
				}}
				disableMoveUp={disableMoveUp}
				disableMoveDown={disableMoveDown}
				onRename={(name: string) => {
					dispatch({ type: "renameConf", cid: conf.cid, name });
				}}
			/>

			<div className="row mx-0">
				{children.map((div, i) => (
					<div className="col-sm-6 col-md-4" key={div.did}>
						<Division
							div={div}
							divs={divs}
							confs={confs}
							dispatch={dispatch}
							addTeam={addTeam}
							editTeam={editTeam}
							teams={teams.filter(t => t.did === div.did)}
							disableMoveUp={i === 0 && disableMoveUp}
							disableMoveDown={i === divs.length - 1 && disableMoveDown}
							abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
							availableBuiltInTeams={availableBuiltInTeams}
						/>
					</div>
				))}
			</div>

			<div className="card-body p-0 m-3">
				<button
					className="btn btn-secondary"
					onClick={() => {
						dispatch({ type: "addDiv", cid: conf.cid });
					}}
				>
					Add Division
				</button>
			</div>
		</div>
	);
};

const CustomizeTeams = ({
	onCancel,
	onSave,
	initialConfs,
	initialDivs,
	initialTeams,
	getDefaultConfsDivsTeams,
	godModeLimits,
}: {
	onCancel: () => void;
	onSave: (obj: ConfsDivsTeams) => void;
	initialConfs: Conf[];
	initialDivs: Div[];
	initialTeams: NewLeagueTeam[];
	getDefaultConfsDivsTeams: () => ConfsDivsTeams;
	godModeLimits: View<"newLeague">["godModeLimits"];
}) => {
	const [{ confs, divs, teams }, dispatch] = useReducer(reducer, {
		confs: [...initialConfs],
		divs: [...initialDivs],
		teams: [...initialTeams],
	});

	const [editingInfo, setEditingInfo] = useState<
		| {
				type: "none";
		  }
		| {
				type: "add";
				did: number;
		  }
		| {
				type: "edit";
				tid: number;
		  }
	>({
		type: "none",
	});

	const editTeam = (tid: number) => {
		setEditingInfo({
			type: "edit",
			tid,
		});
	};

	const addTeam = (did: number, t?: NewLeagueTeam) => {
		if (t) {
			const div = divs.find(div => div.did === did);
			if (div) {
				dispatch({
					type: "addTeam",
					t: {
						...t,
						cid: div.cid,
						did: div.did,
					},
				});
			}
		} else {
			setEditingInfo({
				type: "add",
				did,
			});
		}
	};

	let editingTeam: NewLeagueTeam | undefined;
	if (editingInfo.type === "add") {
		const div = divs.find(div => div.did === editingInfo.did);
		if (div) {
			editingTeam = {
				tid: -1,
				region: "",
				name: "",
				abbrev: "NEW",
				pop: 1,
				popRank: -1,
				cid: div.cid,
				did: div.did,
			};
		}
	} else if (editingInfo.type === "edit") {
		editingTeam = teams.find(t => t.tid === editingInfo.tid);
	}

	const abbrevCounts = countBy(teams, "abbrev");
	const abbrevsUsedMultipleTimes: string[] = [];
	for (const [abbrev, count] of Object.entries(abbrevCounts)) {
		if (count > 1) {
			abbrevsUsedMultipleTimes.push(abbrev);
		}
	}

	const availableAbbrevs = getUnusedAbbrevs(teams);
	const param = availableAbbrevs.map(abbrev => ({
		tid: -1,
		cid: -1,
		did: -1,
		abbrev,
	}));
	const availableBuiltInTeams: NewLeagueTeam[] = getTeamInfos(param).map(t => ({
		...t,
		popRank: -1,
	}));

	return (
		<>
			<div className="mb-3">
				<button
					className="btn btn-danger"
					onClick={() => {
						const info = getDefaultConfsDivsTeams();
						dispatch({
							type: "setState",
							...info,
						});
					}}
				>
					Reset All
				</button>
			</div>
			{confs.map((conf, i) => (
				<Conference
					key={conf.cid}
					conf={conf}
					confs={confs}
					divs={divs}
					teams={teams}
					dispatch={dispatch}
					addTeam={addTeam}
					editTeam={editTeam}
					disableMoveUp={i === 0}
					disableMoveDown={i === confs.length - 1}
					abbrevsUsedMultipleTimes={abbrevsUsedMultipleTimes}
					availableBuiltInTeams={availableBuiltInTeams}
				/>
			))}
			<button
				className="btn btn-secondary"
				onClick={() => {
					dispatch({ type: "addConf" });
				}}
			>
				Add Conference
			</button>

			<form
				className="mt-3"
				onSubmit={event => {
					event.preventDefault();

					if (abbrevsUsedMultipleTimes.length > 0) {
						logEvent({
							type: "error",
							text: `You cannot use the same abbrev for multiple teams: ${abbrevsUsedMultipleTimes.join(
								", ",
							)}`,
							saveToDb: false,
						});
						return;
					}

					if (teams.length < 2) {
						logEvent({
							type: "error",
							text: "Your league must have at least 2 teams in it.",
							saveToDb: false,
						});
						return;
					}

					onSave({ confs, divs, teams });
				}}
			>
				<button className="btn btn-primary mr-2" type="submit">
					Save Teams
				</button>
				<button className="btn btn-secondary" type="button" onClick={onCancel}>
					Cancel
				</button>
			</form>

			<UpsertTeamModal
				key={editingInfo.type === "edit" ? editingInfo.tid : editingInfo.type}
				t={editingTeam}
				confs={confs}
				divs={divs}
				onSave={(t: NewLeagueTeam) => {
					if (t.tid === -1) {
						dispatch({ type: "addTeam", t });
					} else {
						dispatch({ type: "editTeam", t });
					}
					setEditingInfo({ type: "none" });
				}}
				onCancel={() => {
					setEditingInfo({ type: "none" });
				}}
				godModeLimits={godModeLimits}
			/>
		</>
	);
};

export default CustomizeTeams;
