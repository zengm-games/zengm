import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useCallback, useEffect, useState } from "react";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from ".";
import {
	DEFAULT_JERSEY,
	DEFAULT_STADIUM_CAPACITY,
	SPORT_HAS_REAL_PLAYERS,
} from "../../../common";
import getTeamInfos from "../../../common/getTeamInfos";
import getUnusedAbbrevs from "../../../common/getUnusedAbbrevs";
import type { Conf, Div, Player, View } from "../../../common/types";
import Modal from "../../components/Modal";
import { helpers, logEvent, toWorker } from "../../util";
import {
	type ExhibitionLeagueWithSeasons,
	getRandomSeason,
} from "../Exhibition";
import TeamForm from "../ManageTeams/TeamForm";
import type { AddEditTeamInfo } from "./CustomizeTeams";
import type { NewLeagueTeamWithoutRank } from "./types";
import { TeamsSplitNorthAmericaWorld } from "../../components/TeamsSplitNorthAmericaWorld";

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
	const pop = t ? helpers.localeParseFloat(t.pop) : NaN;
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

type SetAddEditTeamInfo = (
	addEditTeamInfo: (info: AddEditTeamInfo) => AddEditTeamInfo,
) => void;

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
	setAddEditTeamInfo: SetAddEditTeamInfo;
	disabled: boolean;
	onChange: (t?: NewLeagueTeamWithoutRank) => void;
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
		addEditTeamInfo.type === "add" && addEditTeamInfo.addType === "real"
			? addEditTeamInfo.seasonReal
			: addEditTeamInfo.seasonLeague;
	const setSeason = (newSeason: number) => {
		let key: "seasonReal" | "seasonLeague";
		if (addEditTeamInfo.type === "add" && addEditTeamInfo.addType === "real") {
			key = "seasonReal";
		} else if (
			addEditTeamInfo.type === "add" &&
			addEditTeamInfo.addType === "league"
		) {
			key = "seasonLeague";
		} else {
			throw new Error("Invalid setSeason call");
		}

		setAddEditTeamInfo(info => ({
			...info,
			[key]: newSeason,
		}));
	};

	const loadTeams = async (
		league: ExhibitionLeagueWithSeasons,
		season: number,
		tidInput?: number | "random",
	) => {
		setLoadingTeams(true);

		// This sets controlledTeam to undefined, which disables the Save Team button
		onChange();

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

		const newTeams = orderBy(
			applyRealTeamInfos(newInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		).map(t => ({
			...t,
			tid: -1,
			cid: -1,
			did: -1,
			usePlayers: !!t.players,
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

	useEffect(() => {
		const run = async () => {
			if (addEditTeamInfo.addType === "random") {
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
			} else if (addEditTeamInfo.addType === "real") {
				const league = await loadLeague("real");
				await loadTeams(league, addEditTeamInfo.seasonReal);
			} else if (addEditTeamInfo.addType === "league") {
				const allLeagues = await toWorker(
					"exhibitionGame",
					"getLeagues",
					undefined,
				);
				setLeagues(allLeagues);
				if (allLeagues.length > 0) {
					const lid = addEditTeamInfo.lid ?? allLeagues[0].lid;
					const league = await loadLeague(lid);
					await loadTeams(
						league,
						addEditTeamInfo.seasonLeague ?? league.seasonEnd,
					);
				} else {
					// If no leagues found, at least show something
					onChange({ ...CUSTOM_TEAM });
				}
			}
		};

		run();
		// We only want this to run when changing the type
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [addEditTeamInfo.type, addEditTeamInfo.addType]);

	if (addEditTeamInfo.type !== "add") {
		return null;
	}

	let availableTeams = allTeams;
	if (availableTeams && addEditTeamInfo.hideDupeAbbrevs) {
		const currentAbbrevs = new Set(currentTeams.map(t => t.abbrev));
		availableTeams = availableTeams.filter(t => !currentAbbrevs.has(t.abbrev));
	}
	const availableAbbrevs = availableTeams?.map(t => t.abbrev);
	const actualAbbrev = availableAbbrevs?.includes(abbrev as any)
		? abbrev
		: "custom";

	const actualDisabled =
		disabled || (addEditTeamInfo.addType !== "random" && !league);

	return (
		<>
			<div className="d-flex align-items-center">
				<select
					className="form-select"
					value={addEditTeamInfo.addType}
					onChange={async event => {
						setAddEditTeamInfo(info => ({
							...info,
							addType: event.target.value as any,
						}));
					}}
					disabled={disabled}
					style={{
						maxWidth: 200,
					}}
				>
					<option value="random">Random players team</option>
					{SPORT_HAS_REAL_PLAYERS ? (
						<option value="real">Real historical teams</option>
					) : null}
					<option value="league">Team from existing league</option>
				</select>
				{addEditTeamInfo.addType === "league" ? (
					leagues?.length === 0 ? (
						<div className="text-danger ms-2">No leagues found</div>
					) : (
						<select
							className="form-select ms-2"
							value={addEditTeamInfo.lid}
							onChange={async event => {
								const lid = parseInt(event.target.value);
								setAddEditTeamInfo(info => ({
									...info,
									lid,
								}));
								const league = await loadLeague(lid);
								setSeason(league.seasonEnd);
								await loadTeams(league, league.seasonEnd);
							}}
							disabled={disabled}
							style={{
								maxWidth: 300,
							}}
						>
							{leagues ? (
								leagues.map(league => (
									<option key={league.lid} value={league.lid}>
										{league.name}
									</option>
								))
							) : (
								<option value="loading">Loading...</option>
							)}
						</select>
					)
				) : null}
			</div>
			{addEditTeamInfo.addType === "league" && leagues?.length === 0 ? null : (
				<>
					<div className="input-group mt-3" style={{ maxWidth: 508 }}>
						{addEditTeamInfo.addType !== "random" ? (
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
							{addEditTeamInfo.addType === "random" ? (
								<option value="custom">Custom Team</option>
							) : availableTeams === undefined ? (
								<option value="loading">Loading...</option>
							) : null}
							{addEditTeamInfo.addType === "random" && availableTeams ? (
								<TeamsSplitNorthAmericaWorld
									teams={availableTeams}
									option={t => (
										<option key={t.abbrev} value={t.abbrev}>
											{t.region} {t.name} ({t.abbrev})
										</option>
									)}
								/>
							) : (
								availableTeams?.map(t => (
									<option key={t.abbrev} value={t.abbrev}>
										{t.region} {t.name} ({t.abbrev})
										{t.seasonInfo
											? ` ${helpers.formatRecord(t.seasonInfo)}${
													t.seasonInfo.roundsWonText
														? `, ${t.seasonInfo.roundsWonText.toLowerCase()}`
														: ""
											  }`
											: null}
									</option>
								))
							)}
						</select>
						<button
							className="btn btn-light-bordered"
							type="button"
							disabled={actualDisabled}
							onClick={async () => {
								if (addEditTeamInfo.addType !== "random" && league) {
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
					<div className="form-check mt-1">
						<input
							className="form-check-input"
							type="checkbox"
							checked={addEditTeamInfo.hideDupeAbbrevs}
							id="hideDupeAbbrevs"
							onChange={() => {
								setAddEditTeamInfo(info => ({
									...info,
									hideDupeAbbrevs: !info.hideDupeAbbrevs,
								}));
							}}
						/>
						<label className="form-check-label" htmlFor="hideDupeAbbrevs">
							Hide teams with duplicate abbrevs
						</label>
					</div>
				</>
			)}
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
	setAddEditTeamInfo: SetAddEditTeamInfo;
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
				usePlayers?: boolean;
				players?: Player[];
		  }
		| undefined
	>();

	const newControlledTeam = useCallback(
		(t: NewLeagueTeamWithoutRank | undefined) => {
			if (!t) {
				setControlledTeam(undefined);
			} else {
				setControlledTeam({
					...t,
					region: t.region,
					name: t.name,
					abbrev: t.abbrev,
					pop: String(t.pop),
					stadiumCapacity: String(
						t.stadiumCapacity ?? DEFAULT_STADIUM_CAPACITY,
					),
					colors: t.colors ?? ["#000000", "#cccccc", "#ffffff"],
					jersey: t.jersey ?? DEFAULT_JERSEY,
					did: String(addEditTeamInfo.did),
					imgURL: t.imgURL ?? "",
					imgURLSmall: t.imgURLSmall ?? "",
				});
			}
		},
		[addEditTeamInfo.did],
	);

	useEffect(() => {
		let t: NewLeagueTeamWithoutRank | undefined;
		if (addEditTeamInfo.type === "edit") {
			t = teams.find(t => t.tid === addEditTeamInfo.tidEdit);
		} else if (
			addEditTeamInfo.type === "add" &&
			addEditTeamInfo.addType === "random"
		) {
			t = { ...CUSTOM_TEAM };
		} else {
			// Will be loaded asynchronously in SelectTeam
		}

		newControlledTeam(t);
	}, [
		addEditTeamInfo.addType,
		addEditTeamInfo.type,
		addEditTeamInfo.tidEdit,
		newControlledTeam,
		teams,
	]);

	const save = () => {
		if (controlledTeam === undefined) {
			throw new Error("Invalid team");
		}
		const did = parseInt(controlledTeam.did);
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
			pop: helpers.localeParseFloat(controlledTeam.pop),
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
				<Modal.Title>
					{addEditTeamInfo.type === "edit" ? "Edit" : "Add"} Team
				</Modal.Title>
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
									} else if (field === "usePlayers") {
										setControlledTeam({
											...controlledTeam,
											usePlayers: !controlledTeam.usePlayers,
										});
									} else {
										setControlledTeam({
											...controlledTeam,
											[field]: event.target.value,
										});
									}
								}}
								hideStatus
								t={controlledTeam}
								showPlayers={!!controlledTeam.players}
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
					{addEditTeamInfo.type === "edit" ? "Save Team" : "Add Team"}
				</button>
			</Modal.Footer>
		</Modal>
	);
};

export default UpsertTeamModal;
