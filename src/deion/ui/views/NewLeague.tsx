import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { DIFFICULTY } from "../../common";
import { LeagueFileUpload } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import type { View } from "../../common/types";

const randomTeam = {
	tid: -1,
	region: "Random",
	name: "Team",
	popRank: Infinity,
};

type NewLeagueTeam = {
	tid: number;
	region: string;
	name: string;
	pop?: number;
	popRank: number;
};

const teamsBBGM: NewLeagueTeam[] = helpers.getTeamsDefault();
teamsBBGM.unshift(randomTeam);

const teamsRealistic: NewLeagueTeam[] =
	process.env.SPORT === "basketball" ? helpers.getTeamsDefault(true) : [];
teamsRealistic.unshift(randomTeam);

const PopText = ({ teams, tid }: { teams: typeof teamsBBGM; tid: number }) => {
	if (tid >= 0) {
		const t = teams.find(t2 => t2.tid === tid);
		if (t) {
			let size;
			if (t.popRank <= 3) {
				size = "very large";
			} else if (t.popRank <= 8) {
				size = "large";
			} else if (t.popRank <= 16) {
				size = "normal";
			} else if (t.popRank <= 24) {
				size = "small";
			} else {
				size = "very small";
			}

			return (
				<span className="text-muted">
					Region population: {t.pop} million (#
					{t.popRank})<br />
					Size: {size}
				</span>
			);
		}
	}

	return (
		<span className="text-muted">
			Region population: ?<br />
			Difficulty: ?
		</span>
	);
};

PopText.propTypes = {
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			// pop and popRank not required for Random Team
			pop: PropTypes.number,
			popRank: PropTypes.number,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	tid: PropTypes.number.isRequired,
};

const NewLeague = (props: View<"newLeague">) => {
	const [creating, setCreating] = useState(false);
	const [customize, setCustomize] = useState<
		"custom-rosters" | "custom-url" | "none"
	>(props.lid !== undefined ? "custom-rosters" : "none");
	const [customizePlayers, setCustomizePlayers] = useState<
		"fictional" | "real" | "league-file"
	>("fictional");
	const [customizeTeams, setCustomizeTeams] = useState<
		"bbgm" | "realistic" | "league-file"
	>("bbgm");
	const [difficulty, setDifficulty] = useState(
		props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
	);
	const [leagueFile, setLeagueFile] = useState<any>(null);
	const [name, setName] = useState(props.name);
	const [prevlid, setPrevlid] = useState(props.lid);
	const [randomizeRosters, setRandomizeRosters] = useState(false);
	const [teams, setTeams] = useState(teamsBBGM);
	const [tid, setTid] = useState(props.lastSelectedTid);

	if (props.lid === undefined && prevlid !== undefined) {
		setCustomize("none");
		setDifficulty(DIFFICULTY.Normal);
		setName(props.name);
		setPrevlid(undefined);
	}

	if (props.lid !== undefined && prevlid === undefined) {
		setCustomize("custom-rosters");
		setDifficulty(
			props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
		);
		setName(props.name);
		setPrevlid(props.lid);
	}

	const title = props.lid === undefined ? "Create New League" : "Import League";

	const handleSubmit = useCallback(
		async event => {
			event.preventDefault();

			if (props.lid !== undefined) {
				const result = await confirm(
					`Are you sure you want to import this league? All the data currently in "${props.name}" will be overwritten.`,
					{
						okText: title,
					},
				);
				if (!result) {
					return;
				}
			}

			setCreating(true);

			let startingSeason = new Date().getFullYear();

			let actualLeagueFile;
			let actualRandomizeRosters = false;
			if (customize === "custom-rosters" || customize === "custom-url") {
				actualLeagueFile = leagueFile;
				actualRandomizeRosters = randomizeRosters;
				startingSeason =
					leagueFile.startingSeason !== undefined
						? leagueFile.startingSeason
						: startingSeason;
			}

			const actualDifficulty = Object.values(DIFFICULTY).includes(difficulty)
				? difficulty
				: DIFFICULTY.Normal;

			try {
				const lid = await toWorker(
					"main",
					"createLeague",
					name,
					tid,
					actualLeagueFile,
					startingSeason,
					actualRandomizeRosters,
					actualDifficulty,
					customizePlayers,
					customizeTeams,
					props.lid,
				);
				realtimeUpdate([], `/l/${lid}`);
			} catch (err) {
				setCreating(false);
				console.log(err);
				logEvent({
					type: "error",
					text: err.message,
					persistent: true,
					saveToDb: false,
				});
			}
		},
		[
			customize,
			difficulty,
			leagueFile,
			name,
			props.lid,
			props.name,
			randomizeRosters,
			tid,
			title,
		],
	);

	const handleNewLeagueFile = useCallback(
		(err, newLeagueFile) => {
			if (err) {
				setLeagueFile(null);
				return;
			}

			setLeagueFile(newLeagueFile);

			let newTeams = helpers.deepCopy(newLeagueFile.teams);
			if (newTeams) {
				for (const t of newTeams) {
					// Is pop hidden in season, like in manageTeams import?
					if (!t.hasOwnProperty("pop") && t.hasOwnProperty("seasons")) {
						t.pop = t.seasons[t.seasons.length - 1].pop;
					}

					// God, I hate being permissive...
					if (typeof t.pop !== "number") {
						t.pop = parseFloat(t.pop);
					}
					if (Number.isNaN(t.pop)) {
						t.pop = 1;
					}

					t.pop = parseFloat(t.pop.toFixed(2));
				}

				newTeams = helpers.addPopRank(newTeams);

				// Might get overwritten from gameAttributes of uploaded file, but that's ok
				if (tid >= newTeams.length) {
					setTid(-1);
				}

				// Add random team
				newTeams.unshift(randomTeam);

				setTeams(newTeams);
				setCustomizeTeams("league-file");
			}

			if (newLeagueFile.players) {
				setCustomizePlayers("league-file");
			}

			// Need to update team and difficulty dropdowns?
			if (newLeagueFile.hasOwnProperty("gameAttributes")) {
				for (const ga of newLeagueFile.gameAttributes) {
					if (
						ga.key === "userTid" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						setTid(ga.value);
					} else if (
						ga.key === "difficulty" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						setDifficulty(ga.value);
					}
				}
			}
		},
		[tid],
	);

	useTitleBar({ title });

	return (
		<>
			{props.lid !== undefined ? (
				<div className="row">
					<div className="col-md-9 col-lg-6">
						<p>
							Here you can upload a league file to overwrite one of your
							existing leagues. This works just like deleting the existing
							league and creating a new one, it's just a little more convenient
							for people who do that a lot.
						</p>
						<p>
							If you just want to create a new league,{" "}
							<a href="/new_league">click here</a>.
						</p>
					</div>
				</div>
			) : null}

			<form onSubmit={handleSubmit} className="d-flex">
				<div style={{ maxWidth: 400 }}>
					<div className="form-group">
						<label htmlFor="new-league-name">League name</label>
						<input
							id="new-league-name"
							className="form-control"
							type="text"
							value={name}
							onChange={event => {
								setName(event.target.value);
							}}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="new-league-team">Pick your team</label>
						<select
							id="new-league-team"
							className="form-control mb-1"
							value={tid}
							onChange={event => {
								setTid(parseInt(event.target.value, 10));
							}}
						>
							{teams.map(t => {
								return (
									<option key={t.tid} value={t.tid}>
										{t.region} {t.name}
									</option>
								);
							})}
						</select>
						<PopText tid={tid} teams={teams} />
					</div>

					<div className="form-group">
						<label htmlFor="new-league-difficulty">Difficulty</label>
						<select
							id="new-league-difficulty"
							className="form-control mb-1"
							onChange={event => {
								setDifficulty(parseFloat(event.target.value));
							}}
							value={difficulty}
						>
							{Object.entries(DIFFICULTY).map(([text, numeric]) => (
								<option key={numeric} value={numeric}>
									{text}
								</option>
							))}
							{!Object.values(DIFFICULTY).includes(difficulty) ? (
								<option value={difficulty}>Custom (from league file)</option>
							) : null}
						</select>
						<span className="text-muted">
							Increasing difficulty makes AI teams more reluctant to trade with
							you, makes players less likely to sign with you, and makes it
							harder to turn a profit.
						</span>
					</div>

					{customizePlayers !== "fictional" ? (
						<div className="form-group">
							<label>Options</label>

							<div className="form-check">
								<label className="form-check-label">
									<input
										className="form-check-input"
										onChange={event => {
											setRandomizeRosters(event.target.checked);
										}}
										type="checkbox"
										checked={randomizeRosters}
									/>
									Shuffle rosters
								</label>
							</div>
						</div>
					) : null}

					<div className="text-center">
						<button
							type="submit"
							className="btn btn-lg btn-primary mt-3"
							disabled={
								creating ||
								((customize === "custom-rosters" ||
									customize === "custom-url") &&
									leagueFile === null)
							}
						>
							{title}
						</button>
					</div>
				</div>

				<div style={{ maxWidth: 400 }} className="ml-3 ml-md-5">
					<div className="card bg-light">
						<div className="card-body">
							<h2 className="card-title">Customize</h2>
							<div className="form-group">
								<label htmlFor="new-league-teams">Teams</label>
								<select
									className="form-control"
									value={customizeTeams}
									onChange={event => {
										setCustomizeTeams(event.target.value as any);
										if (event.target.value === "bbgm") {
											setTeams(teamsBBGM);
										} else if (event.target.value === "realistic") {
											setTeams(teamsRealistic);
										}
									}}
								>
									<option value="bbgm">
										{process.env.SPORT === "basketball" ? "BBGM" : "FBGM"}
									</option>
									{process.env.SPORT === "basketball" ? (
										<option value="realistic">Realistic</option>
									) : null}
									{leagueFile && leagueFile.players ? (
										<option value="league-file">League File</option>
									) : null}
								</select>
							</div>
							<div className="form-group">
								<label htmlFor="new-league-players">Players</label>
								<select
									className="form-control"
									value={customizePlayers}
									onChange={event => {
										setCustomizePlayers(event.target.value as any);
									}}
								>
									<option value="fictional">Fictional</option>
									{process.env.SPORT === "basketball" ? (
										<option value="real">Real</option>
									) : null}
									{leagueFile && leagueFile.players ? (
										<option value="league-file">League File</option>
									) : null}
								</select>
							</div>
							<div className="form-group mb-0">
								<label htmlFor="new-league-customize">League File</label>
								<p className="text-muted">
									League files can contain teams, players, and anything else in
									a league. You can create a league file by going to Tools >
									Export within a league, or by{" "}
									<a
										href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
									>
										creating a custom league file
									</a>
									.
								</p>
								<select
									id="new-league-customize"
									className="form-control"
									onChange={event => {
										setCustomize(event.target.value as any);
										setTeams(teamsBBGM);
										setLeagueFile(null);
										if (customizeTeams === "league-file") {
											setCustomizeTeams("bbgm");
											setCustomizePlayers("fictional");
										}
									}}
									value={customize}
								>
									<option value="none">None</option>
									<option value="custom-rosters">Upload League File</option>
									<option value="custom-url">Enter League File URL</option>
								</select>
							</div>
							{customize === "custom-rosters" || customize === "custom-url" ? (
								<div className="mt-3">
									<LeagueFileUpload
										onLoading={() => {
											setLeagueFile(null);
										}}
										onDone={handleNewLeagueFile}
										enterURL={customize === "custom-url"}
									/>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</form>
		</>
	);
};

NewLeague.propTypes = {
	difficulty: PropTypes.number,
	lid: PropTypes.number,
	name: PropTypes.string.isRequired,
	lastSelectedTid: PropTypes.number.isRequired,
};

export default NewLeague;
