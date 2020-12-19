import React, { useState } from "react";
import type { NewLeagueTeam } from "./types";
import type { Conf, Div } from "../../../common/types";

const Division = ({
	div,
	renameDiv,
}: {
	div: Div;
	renameDiv: (did: number, name: string) => void;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(div.name);

	return (
		<div className="card">
			<div className="card-header">
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
						<button
							className="ml-3 btn btn-link p-0 border-0"
							onClick={() => {
								setRenaming(true);
							}}
							title="Edit"
							type="button"
						>
							<span className="glyphicon glyphicon-edit" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

const Conference = ({
	conf,
	divs,
	renameConf,
	renameDiv,
}: {
	conf: Conf;
	divs: Div[];
	renameConf: (cid: number, name: string) => void;
	renameDiv: (did: number, name: string) => void;
}) => {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(conf.name);

	return (
		<div className="card mb-3">
			<div className="card-header">
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
						<button
							className="ml-3 btn btn-link p-0 border-0"
							onClick={() => {
								setRenaming(true);
							}}
							title="Edit"
							type="button"
						>
							<span className="glyphicon glyphicon-edit" />
						</button>
					</div>
				)}
			</div>

			<div className="m-2">
				{divs.map(div => (
					<Division key={div.did} div={div} renameDiv={renameDiv} />
				))}
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
}: {
	onCancel: () => void;
	onSave: (teams: any[]) => void;
	initialConfs: Conf[];
	initialDivs: Div[];
	initialTeams: NewLeagueTeam[];
}) => {
	const [confs, setConfs] = useState([...initialConfs]);
	const [divs, setDivs] = useState([...initialDivs]);

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
			<h2>Customize Teams</h2>
			{confs.map(conf => (
				<Conference
					key={conf.cid}
					conf={conf}
					divs={divs.filter(div => div.cid === conf.cid)}
					renameConf={renameConf}
					renameDiv={renameDiv}
				/>
			))}

			<form
				onSubmit={() => {
					onSave([]);
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
