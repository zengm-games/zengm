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

const Division = ({
	div,
	teams,
	renameDiv,
}: {
	div: Div;
	teams: NewLeagueTeam[];
	renameDiv: (did: number, name: string) => void;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(div.name);

	return (
		<div className="card mt-3">
			<div
				className={classNames("card-header", renaming ? "p-1" : undefined)}
				style={{ height: 44 }}
			>
				{renaming ? (
					<form
						className="form-inline"
						onSubmit={event => {
							event.preventDefault();
							renameDiv(div.did, name);
							setRenaming(false);
						}}
					>
						<input
							type="text"
							className="form-control mr-2"
							value={name}
							onChange={event => {
								setName(event.target.value);
							}}
						/>
						<button type="submit" className="btn btn-primary">
							Save
						</button>
					</form>
				) : (
					<div className="d-flex">
						{div.name}
						<EditButton
							onClick={() => {
								setRenaming(true);
							}}
						/>
					</div>
				)}
			</div>
			<ul className="list-group list-group-flush">
				{teams.map(t => (
					<li key={t.tid} className="list-group-item">
						{t.region} {t.name}
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
}: {
	conf: Conf;
	divs: Div[];
	teams: NewLeagueTeam[];
	renameConf: (cid: number, name: string) => void;
	renameDiv: (did: number, name: string) => void;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(conf.name);

	return (
		<div className="card mb-3">
			<div
				className={classNames("card-header", renaming ? "p-1" : undefined)}
				style={{ height: 44 }}
			>
				{renaming ? (
					<form
						className="form-inline"
						onSubmit={event => {
							event.preventDefault();
							renameConf(conf.cid, name);
							setRenaming(false);
						}}
					>
						<input
							type="text"
							className="form-control mr-2"
							value={name}
							onChange={event => {
								setName(event.target.value);
							}}
						/>
						<button type="submit" className="btn btn-primary">
							Save
						</button>
					</form>
				) : (
					<div className="d-flex">
						{conf.name}
						<EditButton
							onClick={() => {
								setRenaming(true);
							}}
						/>
					</div>
				)}
			</div>

			<div className="row mx-0 mb-3">
				{divs.map(div => (
					<div className="col-sm-6 col-md-4" key={div.did}>
						<Division
							div={div}
							renameDiv={renameDiv}
							teams={teams.filter(t => t.did === div.did)}
						/>
					</div>
				))}
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

	return (
		<>
			<div className="mb-3">
				<button className="btn btn-secondary mr-2" title="Add Conference">
					Add Conf
				</button>
				<button className="btn btn-secondary mr-2" title="Add Division">
					Add Div
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
