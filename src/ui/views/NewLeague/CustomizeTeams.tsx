import React, { useReducer, useState } from "react";
import type { NewLeagueTeam } from "./types";
import type { Conf, Div } from "../../../common/types";
import classNames from "classnames";
import { Modal } from "react-bootstrap";
import arrayMove from "array-move";
import orderBy from "lodash/orderBy";

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
	  }
	| {
			type: "deleteDiv";
			did: number;
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

		case "deleteConf":
			return {
				confs: state.confs.filter(conf => conf.cid !== action.cid),
				divs: state.divs.filter(div => div.cid !== action.cid),
				teams: makeTIDsSequential(
					state.teams.filter(t => t.cid !== action.cid),
				),
			};

		case "deleteDiv":
			return {
				...state,
				divs: state.divs.filter(div => div.did !== action.did),
				teams: makeTIDsSequential(
					state.teams.filter(t => t.did !== action.did),
				),
			};

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

const Division = ({
	div,
	teams,
	dispatch,
	editTeam,
	disableMoveUp,
	disableMoveDown,
}: {
	div: Div;
	teams: NewLeagueTeam[];
	dispatch: React.Dispatch<Action>;
	editTeam: (tid: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
}) => {
	return (
		<div className="card mt-3">
			<CardHeader
				alignButtonsRight
				name={div.name}
				onDelete={() => {
					dispatch({ type: "deleteDiv", did: div.did });
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
							{t.region} {t.name}
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
		</div>
	);
};

const Conference = ({
	conf,
	divs,
	teams,
	dispatch,
	editTeam,
	disableMoveUp,
	disableMoveDown,
}: {
	conf: Conf;
	divs: Div[];
	teams: NewLeagueTeam[];
	dispatch: React.Dispatch<Action>;
	editTeam: (tid: number) => void;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
}) => {
	return (
		<div className="card mb-3">
			<CardHeader
				name={conf.name}
				onDelete={() => {
					dispatch({ type: "deleteConf", cid: conf.cid });
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
				{divs.map((div, i) => (
					<div className="col-sm-6 col-md-4" key={div.did}>
						<Division
							div={div}
							dispatch={dispatch}
							editTeam={editTeam}
							teams={teams.filter(t => t.did === div.did)}
							disableMoveUp={i === 0 && disableMoveUp}
							disableMoveDown={i === divs.length - 1 && disableMoveDown}
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
}: {
	onCancel: () => void;
	onSave: (obj: ConfsDivsTeams) => void;
	initialConfs: Conf[];
	initialDivs: Div[];
	initialTeams: NewLeagueTeam[];
	getDefaultConfsDivsTeams: () => ConfsDivsTeams;
}) => {
	const [{ confs, divs, teams }, dispatch] = useReducer(reducer, {
		confs: [...initialConfs],
		divs: [...initialDivs],
		teams: [...initialTeams],
	});

	const [editingTID, setEditingTID] = useState<number | undefined>();

	const editTeam = (tid: number) => {
		setEditingTID(tid);
	};

	return (
		<>
			<div className="mb-3">
				<button
					className="btn btn-secondary mr-2"
					onClick={() => {
						setEditingTID(-1);
					}}
				>
					Add Team
				</button>
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
					divs={divs.filter(div => div.cid === conf.cid)}
					teams={teams}
					dispatch={dispatch}
					editTeam={editTeam}
					disableMoveUp={i === 0}
					disableMoveDown={i === confs.length - 1}
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
				onSubmit={() => {
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

			<Modal
				show={editingTID !== undefined}
				onHide={() => {
					setEditingTID(undefined);
				}}
			>
				<Modal.Header closeButton>
					{editingTID !== undefined && editingTID >= 0 ? "Edit" : "Add"} Team
				</Modal.Header>
				<Modal.Body>
					<p>
						Click and drag to reorder columns, or use the checkboxes to
						show/hide columns.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<button
						className="btn btn-secondary"
						onClick={() => {
							setEditingTID(undefined);
						}}
					>
						Cancel
					</button>
					<button className="btn btn-primary">Save</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default CustomizeTeams;
