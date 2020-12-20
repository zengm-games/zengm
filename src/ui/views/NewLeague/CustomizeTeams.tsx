import React, { useState } from "react";
import type { NewLeagueTeam } from "./types";
import type { Conf, Div } from "../../../common/types";
import classNames from "classnames";

const EditButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			className="ml-3 btn btn-link p-0 border-0"
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
	onRename,
}: {
	alignButtonsRight?: boolean;
	name: string;
	onDelete: () => void;
	onRename: (name: string) => void;
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
					<div className={alignButtonsRight ? "mr-auto" : undefined}>
						{name}
					</div>
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
	renameDiv,
	deleteDiv,
	deleteTeam,
}: {
	div: Div;
	teams: NewLeagueTeam[];
	renameDiv: (did: number, name: string) => void;
	deleteDiv: (did: number) => void;
	deleteTeam: (tid: number) => void;
}) => {
	return (
		<div className="card mt-3">
			<CardHeader
				alignButtonsRight
				name={div.name}
				onDelete={() => {
					deleteDiv(div.did);
				}}
				onRename={(name: string) => {
					renameDiv(div.did, name);
				}}
			/>

			<ul className="list-group list-group-flush">
				{teams.map(t => (
					<li key={t.tid} className="list-group-item d-flex">
						<div className="mr-auto">
							{t.region} {t.name}
						</div>
						<EditButton onClick={() => {}} />
						<DeleteButton
							onClick={() => {
								deleteTeam(t.tid);
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
	renameConf,
	renameDiv,
	deleteConf,
	deleteDiv,
	deleteTeam,
	addDiv,
}: {
	conf: Conf;
	divs: Div[];
	teams: NewLeagueTeam[];
	renameConf: (cid: number, name: string) => void;
	renameDiv: (did: number, name: string) => void;
	deleteConf: (cid: number) => void;
	deleteDiv: (did: number) => void;
	deleteTeam: (tid: number) => void;
	addDiv: (cid: number) => void;
}) => {
	return (
		<div className="card mb-3">
			<CardHeader
				name={conf.name}
				onDelete={() => {
					deleteConf(conf.cid);
				}}
				onRename={(name: string) => {
					renameConf(conf.cid, name);
				}}
			/>

			<div className="row mx-0">
				{divs.map(div => (
					<div className="col-sm-6 col-md-4" key={div.did}>
						<Division
							div={div}
							renameDiv={renameDiv}
							deleteDiv={deleteDiv}
							deleteTeam={deleteTeam}
							teams={teams.filter(t => t.did === div.did)}
						/>
					</div>
				))}
			</div>

			<div className="card-body p-0 m-3">
				<button
					className="btn btn-secondary"
					onClick={() => {
						addDiv(conf.cid);
					}}
				>
					Add Division
				</button>
			</div>
		</div>
	);
};

type ConfsDivsTeams = {
	confs: Conf[];
	divs: Div[];
	teams: NewLeagueTeam[];
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
	const [confs, setConfs] = useState([...initialConfs]);
	const [divs, setDivs] = useState([...initialDivs]);
	const [teams, setTeams] = useState([...initialTeams]);

	const renameThing = (type: "conf" | "div") => (id: number, name: string) => {
		const func = type === "conf" ? setConfs : setDivs;

		func((rows: any[]) =>
			rows.map(row => {
				const rowID = type === "conf" ? row.cid : row.did;
				if (rowID !== id) {
					return row;
				}

				return {
					...row,
					name,
				};
			}),
		);
	};
	const renameConf = renameThing("conf");
	const renameDiv = renameThing("div");

	const deleteConf = (cid: number) => {
		setConfs(confs.filter(conf => conf.cid !== cid));
		setDivs(divs.filter(div => div.cid !== cid));
		setTeams(teams.filter(t => t.cid !== cid));
	};
	const deleteDiv = (did: number) => {
		setDivs(divs.filter(div => div.did !== did));
		setTeams(teams.filter(t => t.did !== did));
	};
	const deleteTeam = (tid: number) => {
		setTeams(teams.filter(t => t.tid !== tid));
	};

	return (
		<>
			<div className="mb-3">
				<button
					className="btn btn-secondary mr-2"
					onClick={() => {
						const maxCID = Math.max(...confs.map(conf => conf.cid));
						setConfs([
							...confs,
							{
								cid: maxCID + 1,
								name: "New Conference",
							},
						]);
					}}
				>
					Add Conference
				</button>
				<button className="btn btn-secondary mr-2">Add Team</button>
				<button
					className="btn btn-danger"
					onClick={() => {
						const info = getDefaultConfsDivsTeams();
						setConfs(info.confs);
						setDivs(info.divs);
						setTeams(info.teams);
					}}
				>
					Reset All
				</button>
			</div>
			{confs.map(conf => (
				<Conference
					key={conf.cid}
					conf={conf}
					divs={divs.filter(div => div.cid === conf.cid)}
					teams={teams}
					renameConf={renameConf}
					renameDiv={renameDiv}
					deleteConf={deleteConf}
					deleteDiv={deleteDiv}
					deleteTeam={deleteTeam}
					addDiv={(cid: number) => {
						const maxDID = Math.max(...divs.map(div => div.did));
						setDivs([
							...divs,
							{
								did: maxDID + 1,
								cid,
								name: "New Division",
							},
						]);
					}}
				/>
			))}

			<form
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
		</>
	);
};

export default CustomizeTeams;
