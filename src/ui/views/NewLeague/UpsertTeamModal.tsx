import orderBy from "lodash-es/orderBy";
import { useEffect, useState } from "react";
import { applyRealTeamInfos } from ".";
import { DEFAULT_JERSEY, DEFAULT_STADIUM_CAPACITY } from "../../../common";
import getTeamInfos from "../../../common/getTeamInfos";
import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs";
import type { Conf, Div, View } from "../../../common/types";
import Modal from "../../components/Modal";
import { helpers, logEvent, toWorker } from "../../util";
import { useLeagues } from "../Exhibition";
import TeamForm from "../ManageTeams/TeamForm";
import type { AddEditTeamInfo } from "./CustomizeTeams";
import type { NewLeagueTeamWithoutRank } from "./types";

export const getGodModeWarnings = ({
	is,
	t,
	godModeLimits,
}: {
	is?: boolean;
	t?: {
		pop: string;
		stadiumCapacity: string;
	};
	godModeLimits: View<"newLeague">["godModeLimits"];
}) => {
	const pop = t ? parseFloat(t.pop) : NaN;
	const stadiumCapacity = t ? parseInt(t.stadiumCapacity) : NaN;

	const errors = [];
	if (!Number.isNaN(pop) && pop > godModeLimits.pop) {
		errors.push(
			`a region's population ${is ? "is " : ""}over ${
				godModeLimits.pop
			} million`,
		);
	}
	if (
		!Number.isNaN(stadiumCapacity) &&
		stadiumCapacity > godModeLimits.stadiumCapacity
	) {
		errors.push(
			`a team's stadium capacity ${
				is ? "is " : ""
			}over ${helpers.numberWithCommas(godModeLimits.stadiumCapacity)}`,
		);
	}

	return errors;
};

const GodModeWarning = ({
	controlledTeam,
	godModeLimits,
}: {
	controlledTeam?: {
		pop: string;
		stadiumCapacity: string;
	};
	godModeLimits: View<"newLeague">["godModeLimits"];
}) => {
	const errors = getGodModeWarnings({ t: controlledTeam, godModeLimits });
	if (errors.length >= 1) {
		return (
			<div className="alert alert-danger mb-0">
				If {errors.join(" or ")}, then you will not earn any achievements in
				this league.
			</div>
		);
	}

	return null;
};

const CUSTOM_TEAM = {
	tid: -1,
	region: "",
	name: "",
	abbrev: "NEW",
	pop: 1,
	// cid: div.cid,
	// did: div.did,
	cid: -1,
	did: -1,
};

const SelectTeam = ({
	abbrev,
	addEditTeamInfo,
	disabled,
	onChange,
	teams,
}: {
	abbrev: string | undefined;
	addEditTeamInfo: AddEditTeamInfo;
	disabled: boolean;
	onChange: (t: NewLeagueTeamWithoutRank) => void;
	teams: NewLeagueTeamWithoutRank[];
}) => {
	let availableTeams: NewLeagueTeamWithoutRank[];

	if (addEditTeamInfo.type === "addRandom") {
		const availableAbbrevs = getUnusedAbbrevs(teams);
		const param = availableAbbrevs.map(abbrev => ({
			tid: -1,
			cid: -1,
			did: -1,
			abbrev,
		}));
		availableTeams = orderBy(
			getTeamInfos(param).map(t => ({
				...t,
				popRank: -1,
			})),
			["region", "name"],
		);
	} else if (addEditTeamInfo.type === "addReal") {
		throw new Error("Not implemented");
	} else if (addEditTeamInfo.type === "addLeague") {
		throw new Error("Not implemented");
	} else {
		return null;
	}
	const availableAbbrevs = availableTeams.map(t => t.abbrev);
	const actualAbbrev = availableAbbrevs.includes(abbrev as any)
		? abbrev
		: "custom";
	console.log(availableTeams);

	return (
		<>
			<label htmlFor="select-team-team">Team</label>
			<select
				id="select-team-team"
				className="form-select"
				disabled={disabled}
				value={actualAbbrev}
				onChange={event => {
					const newAbbrev = event.target.value;
					if (newAbbrev === "custom") {
						onChange({ ...CUSTOM_TEAM });
					} else {
						const t = availableTeams.find(t => t.abbrev === newAbbrev);
						if (t) {
							onChange(t);
						}
					}
				}}
			>
				{addEditTeamInfo.type === "addRandom" ? (
					<option value="custom">Custom Team</option>
				) : null}
				{availableTeams.map(t => (
					<option key={t.abbrev} value={t.abbrev}>
						{t.region} {t.name} ({t.abbrev})
					</option>
				))}
			</select>
		</>
	);
};

const UpsertTeamModal = ({
	addEditTeamInfo,
	teams,
	confs,
	divs,
	onCancel,
	onSave,
	godModeLimits,
	realTeamInfo,
}: {
	addEditTeamInfo: AddEditTeamInfo;
	teams: NewLeagueTeamWithoutRank[];
	confs: Conf[];
	divs: Div[];
	onCancel: () => void;
	onSave: (t: NewLeagueTeamWithoutRank) => void;
} & Pick<View<"newLeague">, "godModeLimits" | "realTeamInfo">) => {
	const [controlledTeam, setControlledTeam] = useState<
		| {
				tid: number;
				region: string;
				name: string;
				abbrev: string;
				pop: string;
				stadiumCapacity: string;
				colors: [string, string, string];
				jersey: string;
				did: string;
				imgURL: string;
				imgURLSmall: string;
		  }
		| undefined
	>();

	const newControlledTeam = (t: NewLeagueTeamWithoutRank | undefined) => {
		if (!t) {
			setControlledTeam(undefined);
		} else {
			setControlledTeam({
				...t,
				region: t.region,
				name: t.name,
				abbrev: t.abbrev,
				pop: String(t.pop),
				stadiumCapacity: String(t.stadiumCapacity ?? DEFAULT_STADIUM_CAPACITY),
				colors: t.colors ?? ["#000000", "#cccccc", "#ffffff"],
				jersey: t.jersey ?? DEFAULT_JERSEY,
				did: String(t.did),
				imgURL: t.imgURL ?? "",
				imgURLSmall: t.imgURLSmall ?? "",
			});
		}
	};

	const leagues = useLeagues();

	useEffect(() => {
		let mounted = true;

		const run = async () => {
			const div = divs.find(div => div.did === addEditTeamInfo.did);
			if (!div) {
				throw new Error("Invalid did");
			}

			if (addEditTeamInfo.type === "none") {
				newControlledTeam(undefined);
				return;
			}

			let t: NewLeagueTeamWithoutRank | undefined;
			if (addEditTeamInfo.type === "edit") {
				t = teams.find(t => t.tid === addEditTeamInfo.tidEdit);
			} else if (addEditTeamInfo.type === "addRandom") {
				t = { ...CUSTOM_TEAM };
			} else if (addEditTeamInfo.type === "addReal") {
				const season = addEditTeamInfo.seasonReal;
				const newInfo = await toWorker("exhibitionGame", "getSeasonInfo", {
					type: "real",
					season,
					pidOffset: 0,
				});
				const newTeams = orderBy(
					applyRealTeamInfos(newInfo.teams, realTeamInfo, season),
					["region", "name", "tid"],
				);
				console.log("newInfo", newInfo, newTeams);
				t = {
					...newTeams[0],
					// cid: div.cid,
					// did: div.did,
					cid: -1,
					did: -1,
				};
			} else if (addEditTeamInfo.type === "addLeague") {
				throw new Error("NOT IMPLEMENTED");
			}

			if (!mounted) {
				return;
			}

			if (!t) {
				throw new Error("Invalid team");
			}

			newControlledTeam(t);
		};

		run();

		return () => {
			mounted = false;
		};
	}, [
		addEditTeamInfo.type,
		addEditTeamInfo.did,
		divs,
		addEditTeamInfo.tidEdit,
		addEditTeamInfo.seasonReal,
		realTeamInfo,
		teams,
	]);

	const save = () => {
		if (controlledTeam === undefined) {
			throw new Error("Invalid team");
		}
		const did = addEditTeamInfo.did;
		const div = divs.find(div => div.did === did);
		if (!div) {
			throw new Error("Invalid div");
		}

		const tid = addEditTeamInfo.type === "edit" ? controlledTeam.tid : -1;

		const edited = {
			...controlledTeam,
			region: controlledTeam.region,
			name: controlledTeam.name,
			abbrev: controlledTeam.abbrev,
			pop: parseFloat(controlledTeam.pop),
			stadiumCapacity: parseInt(controlledTeam.stadiumCapacity),
			colors: controlledTeam.colors,
			jersey: controlledTeam.jersey,
			tid,
			did,
			cid: div.cid,
			imgURL: controlledTeam.imgURL,
			imgURLSmall:
				controlledTeam.imgURLSmall === ""
					? undefined
					: controlledTeam.imgURLSmall,
		};

		const errors = [];
		let errorMessage: string | undefined;
		if (Number.isNaN(edited.pop)) {
			errors.push("Population");
		}
		if (Number.isNaN(edited.stadiumCapacity)) {
			errors.push("Stadium Capacity");
		}
		if (errors.length === 1) {
			errorMessage = `${errors[0]} must be a number.`;
		} else if (errors.length > 1) {
			errorMessage = `${errors[0]} and ${errors[1]} must be numbers.`;
		}
		if (errorMessage) {
			logEvent({
				type: "error",
				text: errorMessage,
				saveToDb: false,
			});
			return;
		}

		onSave(edited);
	};

	return (
		<Modal size="lg" show={addEditTeamInfo.type !== "none"} onHide={onCancel}>
			<Modal.Header closeButton>
				{addEditTeamInfo.type === "edit" ? "Edit" : "Add"} Team
			</Modal.Header>
			<Modal.Body className="border-bottom">
				<SelectTeam
					abbrev={controlledTeam?.abbrev}
					addEditTeamInfo={addEditTeamInfo}
					disabled={!controlledTeam}
					onChange={t => {
						newControlledTeam(t);
					}}
					teams={teams}
				/>
			</Modal.Body>
			<Modal.Body>
				{controlledTeam ? (
					<form
						id="foo"
						onSubmit={event => {
							event.preventDefault();
							save();
						}}
					>
						<div className="row">
							<TeamForm
								classNamesCol={[
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
									"col-6",
								]}
								confs={confs}
								divs={divs}
								handleInputChange={(field, event) => {
									if (field.startsWith("colors")) {
										const ind = parseInt(field.replace("colors", ""));
										if (ind >= 0 && ind <= 2) {
											const colors = [...controlledTeam.colors] as [
												string,
												string,
												string,
											];
											(colors[ind] = event.target.value),
												setControlledTeam({
													...controlledTeam,
													colors,
												});
										}
									} else {
										setControlledTeam({
											...controlledTeam,
											[field]: event.target.value,
										});
									}
								}}
								hideStatus
								t={controlledTeam}
							/>
						</div>
						<button className="d-none" type="submit"></button>
					</form>
				) : (
					"Loading..."
				)}
				<GodModeWarning
					controlledTeam={controlledTeam}
					godModeLimits={godModeLimits}
				/>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={onCancel}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					onClick={save}
					disabled={!controlledTeam}
				>
					{addEditTeamInfo.type === "edit" ? "Save" : "Add Team"}
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default UpsertTeamModal;
