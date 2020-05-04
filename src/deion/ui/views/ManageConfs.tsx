import React, { useState, ChangeEvent, FormEvent, MouseEvent } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../util";
import type { View } from "../../common/types";
import { PHASE } from "../../common";

const nextSeasonWarning =
	"Because the regular season is already over, changes will not be fully applied until next season.";

const ManageTeams = ({ confs, divs }: View<"manageConfs">) => {
	const [liveConfs, setLiveConfs] = useState(confs);
	const [liveDivs, setLiveDivs] = useState(divs);
	const [saving, setSaving] = useState(false);

	useTitleBar({ title: "Manage Conferences" });

	const updateConfName = (cid: number) => (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const newConfs = [...liveConfs];
		const conf = newConfs.find(c => c.cid === cid);
		console.log(event, conf, cid);
		if (conf) {
			conf.name = event.target.value;
			setLiveConfs(newConfs);
			console.log("updated");
		}
	};

	const updateDivName = (did: number) => (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const newDivs = [...liveDivs];
		const div = newDivs.find(d => d.did === did);
		if (div) {
			div.name = event.target.value;
			setLiveDivs(newDivs);
		}
	};

	const deleteConf = (cid: number) => () => {
		setLiveConfs(liveConfs.filter(conf => conf.cid !== cid));
		setLiveDivs(liveDivs.filter(div => div.cid !== cid));
	};

	const deleteDiv = (did: number) => () => {
		setLiveDivs(liveDivs.filter(div => div.did !== did));
	};

	const addConf = (event: MouseEvent) => {
		event.preventDefault();

		let newCid = 0;
		for (const conf of liveConfs) {
			if (conf.cid > newCid) {
				newCid = conf.cid + 1;
			}
		}

		setLiveConfs([
			...liveConfs,
			{
				cid: newCid,
				name: "New Conference",
			},
		]);
	};

	const addDiv = (cid: number) => (event: MouseEvent) => {
		event.preventDefault();

		let newDid = 0;
		for (const div of liveDivs) {
			if (div.did > newDid) {
				newDid = div.did + 1;
			}
		}

		setLiveDivs([
			...liveDivs,
			{
				cid,
				did: newDid,
				name: "New Division",
			},
		]);
	};

	return (
		<>
			<p>
				If you delete a conference, all divisions in that conference will be
				deleted too.
			</p>
			<p>
				If you delete a division, all teams belonging to that division will be
				assigned to some other division. You can reassign them on the{" "}
				<a href={helpers.leagueUrl(["manage_teams"])}>manage teams page</a>.
			</p>
			<form>
				<hr />
				{liveConfs.map(conf => {
					return (
						<React.Fragment key={conf.cid}>
							<div className="d-flex align-items-end mb-3">
								<div className="form-group mb-0">
									<label htmlFor={`conf-name-${conf.cid}`}>
										Conference Name
									</label>
									<input
										className="form-control"
										id={`conf-name-${conf.cid}`}
										value={conf.name}
										onChange={updateConfName(conf.cid)}
									/>
								</div>
								<button
									className="btn btn-danger ml-3"
									onClick={deleteConf(conf.cid)}
								>
									Delete
								</button>
							</div>
							{liveDivs
								.filter(div => div.cid === conf.cid)
								.map(div => (
									<div
										key={div.did}
										className="d-flex align-items-end mb-3 ml-4"
									>
										<div className="form-group mb-0">
											<label htmlFor={`div-name-${div.did}`}>
												Division Name
											</label>
											<input
												className="form-control"
												id={`div-name-${div.did}`}
												value={div.name}
												onChange={updateDivName(div.did)}
											/>
										</div>
										<button
											className="btn btn-danger ml-3"
											onClick={deleteDiv(div.did)}
										>
											Delete
										</button>
									</div>
								))}
							<button
								className="btn btn-secondary ml-4"
								onClick={addDiv(conf.cid)}
							>
								Add Division
							</button>
							<hr />
						</React.Fragment>
					);
				})}
				<button className="btn btn-secondary" onClick={addConf}>
					Add Conference
				</button>
				<hr className="my-3" />
				<button type="submit" className="btn btn-primary" disabled={saving}>
					Save Conferences and Divisions
				</button>
			</form>
		</>
	);
};

export default ManageTeams;
