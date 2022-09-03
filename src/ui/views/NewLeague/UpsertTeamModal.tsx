import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useEffect, useRef, useState } from "react";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from ".";
import { DEFAULT_JERSEY, DEFAULT_STADIUM_CAPACITY } from "../../../common";
import getTeamInfos from "../../../common/getTeamInfos";
import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs";
import type { Conf, Div, View } from "../../../common/types";
import Modal from "../../components/Modal";
import { helpers, logEvent, toWorker } from "../../util";
import { ExhibitionLeagueWithSeasons, getRandomSeason } from "../Exhibition";
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
	setAddEditTeamInfo,
	disabled,
	onChange,
	currentTeams,
	realTeamInfo,
}: {
	abbrev: string | undefined;
	addEditTeamInfo: AddEditTeamInfo;
	setAddEditTeamInfo: (addEditTeamInfo: AddEditTeamInfo) => void;
	disabled: boolean;
	onChange: (t: NewLeagueTeamWithoutRank) => void;
	currentTeams: NewLeagueTeamWithoutRank[];
} & Pick<View<"newLeague">, "realTeamInfo">) => {
	const [league, setLeague] = useState<
		ExhibitionLeagueWithSeasons | undefined
	>();
	const [allTeams, setAllTeams] = useState<
		NewLeagueTeamWithoutRank[] | undefined
	>();
	const [leagues, setLeagues] = useState<
		| {
				lid: number;
				name: string;
		  }[]
		| undefined
	>();
	const [loadingTeams, setLoadingTeams] = useState(false);

	const season =
		addEditTeamInfo.type === "addReal"
			? addEditTeamInfo.seasonReal
			: addEditTeamInfo.seasonLeague;
	const setSeason = (newSeason: number) => {
		let key: "seasonReal" | "seasonLeague";
		if (addEditTeamInfo.type === "addReal") {
			key = "seasonReal";
		} else if (addEditTeamInfo.type === "addLeague") {
			key = "seasonLeague";
		} else {
			throw new Error("Invalid setSeason call");
		}

		setAddEditTeamInfo({
			...addEditTeamInfo,
			[key]: newSeason,
		});
	};

	const loadTeams = async (
		league: ExhibitionLeagueWithSeasons,
		season: number,
		tidInput?: number | "random",
	) => {
		setLoadingTeams(true);

		const newInfo = await toWorker(
			"exhibitionGame",
			"getSeasonInfo",
			league.type === "real"
				? {
						type: "real",
						season,
						pidOffset: 0,
				  }
				: {
						type: "league",
						lid: league.lid,
						season,
						pidOffset: 0,
				  },
		);
		console.log("newInfo", newInfo);
		const newTeams = orderBy(
			applyRealTeamInfos(newInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		).map(t => ({
			...t,
			tid: -1,
			cid: -1,
			did: -1,
		}));

		let newTeam;
		if (tidInput === "random") {
			const index = Math.floor(Math.random() * newTeams.length);
			newTeam = newTeams[index];
		} else {
			if (typeof tidInput === "number") {
				newTeam = newTeams.find(t => t.tid === tidInput);
			}
			if (!newTeam) {
				newTeam = newTeams.find(t => t.abbrev === abbrev) ?? newTeams[0];
			}
		}

		setAllTeams(newTeams);
		setLoadingTeams(false);

		onChange(newTeam);
	};

	const loadLeague = async (lid: "real" | number) => {
		let newLeague: ExhibitionLeagueWithSeasons;
		if (lid === "real") {
			newLeague = {
				type: "real",
				seasonStart: MIN_SEASON,
				seasonEnd: MAX_SEASON,
			};
		} else {
			const { seasonStart, seasonEnd } = await toWorker(
				"exhibitionGame",
				"getSeasons",
				lid,
			);
			newLeague = {
				type: "league",
				lid,
				seasonStart,
				seasonEnd,
			};
		}

		setLeague(newLeague);

		return newLeague;
	};

	const awaitingInitialLoad = useRef(true);
	useEffect(() => {
		const run = async () => {
			// We only want to do this once, on initial load ideally, but we may have to wait for leagues to be provided
			if (!awaitingInitialLoad.current) {
				return;
			}
			awaitingInitialLoad.current = false;

			if (addEditTeamInfo.type === "addRandom") {
				const availableAbbrevs = getUnusedAbbrevs([]);
				const param = availableAbbrevs.map(abbrev => ({
					tid: -1,
					cid: -1,
					did: -1,
					abbrev,
				}));
				setAllTeams(
					orderBy(
						getTeamInfos(param).map(t => ({
							...t,
							popRank: -1,
						})),
						["region", "name"],
					),
				);
			} else if (addEditTeamInfo.type === "addReal") {
				const league = await loadLeague("real");
				await loadTeams(league, season ?? league.seasonEnd);
			} else if (addEditTeamInfo.type === "addLeague") {
				const allLeagues = await toWorker(
					"exhibitionGame",
					"getLeagues",
					undefined,
				);
				setLeagues(allLeagues);
				if (allLeagues.length > 0) {
					const league = await loadLeague(allLeagues[0].lid);
					await loadTeams(league, season ?? league.seasonEnd);
				}
			}
		};

		run();
	}, [addEditTeamInfo.type]);

	if (!addEditTeamInfo.type.startsWith("add")) {
		return null;
	}

	const availableTeams = allTeams;
	const availableAbbrevs = availableTeams?.map(t => t.abbrev);
	const actualAbbrev = availableAbbrevs?.includes(abbrev as any)
		? abbrev
		: "custom";
	console.log("availableTeams", availableTeams);

	const actualDisabled =
		disabled || (addEditTeamInfo.type !== "addRandom" && !league);

	return (
		<>
			<div className="mb-3">
				<select
					className="form-select"
					value={addEditTeamInfo.type}
					onChange={async event => {
						setAddEditTeamInfo({
							...addEditTeamInfo,
							type: event.target.value as any,
						});
					}}
					disabled={disabled}
					style={{
						maxWidth: 200,
					}}
				>
					<option value="addRandom">Random players team</option>
					<option value="addReal">Real historical team</option>
					<option value="addLeague">Team from existing league</option>
				</select>
			</div>
			<div className="input-group">
				{addEditTeamInfo.type !== "addRandom" ? (
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);
							await loadTeams(league!, value);
						}}
						disabled={actualDisabled}
						style={{
							maxWidth: 75,
						}}
					>
						{league
							? range(league.seasonEnd, league.seasonStart - 1).map(i => (
									<option key={i} value={i}>
										{i}
									</option>
							  ))
							: null}
					</select>
				) : null}
				<select
					className="form-select"
					disabled={
						actualDisabled || availableTeams === undefined || loadingTeams
					}
					value={actualAbbrev}
					onChange={event => {
						const newAbbrev = event.target.value;
						if (newAbbrev === "custom") {
							onChange({ ...CUSTOM_TEAM });
						} else {
							const t = availableTeams?.find(t => t.abbrev === newAbbrev);
							if (t) {
								onChange(t);
							}
						}
					}}
				>
					{addEditTeamInfo.type === "addRandom" ? (
						<option value="custom">Custom Team</option>
					) : availableTeams === undefined ? (
						<option value="loading">Loading...</option>
					) : null}
					{availableTeams?.map(t => (
						<option key={t.abbrev} value={t.abbrev}>
							{t.region} {t.name} ({t.abbrev})
						</option>
					))}
				</select>
				<button
					className="btn btn-light-bordered"
					type="button"
					disabled={actualDisabled}
					onClick={async () => {
						if (league) {
							const randomSeason = getRandomSeason(
								league.seasonStart,
								league.seasonEnd,
							);
							setSeason(randomSeason);
							await loadTeams(league, randomSeason, "random");
						} else if (availableTeams) {
							const t =
								availableTeams[
									Math.floor(Math.random() * availableTeams.length)
								];
							onChange(t);
						}
					}}
				>
					Random
				</button>
			</div>
		</>
	);
};

const UpsertTeamModal = ({
	addEditTeamInfo,
	setAddEditTeamInfo,
	teams,
	confs,
	divs,
	onCancel,
	onSave,
	godModeLimits,
	realTeamInfo,
}: {
	addEditTeamInfo: AddEditTeamInfo;
	setAddEditTeamInfo: (addEditTeamInfo: AddEditTeamInfo) => void;
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

	useEffect(() => {
		let t: NewLeagueTeamWithoutRank | undefined;
		if (addEditTeamInfo.type === "edit") {
			t = teams.find(t => t.tid === addEditTeamInfo.tidEdit);
		} else if (addEditTeamInfo.type === "addRandom") {
			t = { ...CUSTOM_TEAM };
		} else {
			// Will be loaded asynchronously in SelectTeam
		}

		newControlledTeam(t);
	}, [addEditTeamInfo.type, addEditTeamInfo.tidEdit, teams]);

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
			{addEditTeamInfo.type !== "edit" ? (
				<Modal.Body className="border-bottom">
					<SelectTeam
						key={addEditTeamInfo.type}
						abbrev={controlledTeam?.abbrev}
						addEditTeamInfo={addEditTeamInfo}
						setAddEditTeamInfo={setAddEditTeamInfo}
						disabled={!controlledTeam}
						onChange={t => {
							newControlledTeam(t);
						}}
						currentTeams={teams}
						realTeamInfo={realTeamInfo}
					/>
				</Modal.Body>
			) : null}
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
