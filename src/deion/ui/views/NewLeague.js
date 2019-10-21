import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { DIFFICULTY } from "../../common";
import { LeagueFileUpload } from "../components";
import {
	confirm,
	helpers,
	logEvent,
	realtimeUpdate,
	setTitle,
	toWorker,
} from "../util";

const PopText = ({ teams, tid }) => {
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

const defaultTeams = helpers.getTeamsDefault();
defaultTeams.unshift({
	tid: -1,
	region: "Random",
	name: "Team",
});

const NewLeague = props => {
	const [creating, setCreating] = useState(false);
	const [customize, setCustomize] = useState(
		props.lid !== undefined ? "custom-rosters" : "random",
	);
	const [difficulty, setDifficulty] = useState(
		props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
	);
	const [leagueFile, setLeagueFile] = useState(null);
	const [name, setName] = useState(props.name);
	const [prevlid, setPrevlid] = useState(props.lid);
	const [randomizeRosters, setRandomizeRosters] = useState(false);
	const [teams, setTeams] = useState(defaultTeams);
	const [tid, setTid] = useState(props.lastSelectedTid);

	if (props.lid === undefined && prevlid !== undefined) {
		setCustomize("random");
		setDifficulty(DIFFICULTY.Normal);
		setName(props.name);
		setPrevlid(undefined);
	}

	if (props.lid !== undefined && prevlid === undefined) {
		setCustomize("custom-rosters");
		setDifficulty(props.difficulty);
		setName(props.name);
		setPrevlid(props.lid);
	}

	const handleSubmit = useCallback(
		async event => {
			event.preventDefault();

			if (props.lid !== undefined) {
				const result = await confirm(
					`Are you sure you want to import this league? All the data currently in "${props.name}" will be overwritten.`,
				);
				if (!result) {
					return;
				}
			}

			setCreating(true);

			let startingSeason = 2019;

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
					"createLeague",
					name,
					tid,
					actualLeagueFile,
					startingSeason,
					actualRandomizeRosters,
					actualDifficulty,
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
				newTeams.unshift({
					tid: -1,
					region: "Random",
					name: "Team",
				});

				setTeams(newTeams);
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

	const title = props.lid === undefined ? "Create New League" : "Import League";
	setTitle(title);

	return (
		<>
			<h1>{title}</h1>

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

			<form onSubmit={handleSubmit}>
				<div className="row">
					<div className="form-group col-md-3 col-sm-6">
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

					<div className="form-group col-md-3 col-sm-6">
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

					<div className="form-group col-md-3 col-sm-6">
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

					<div className="col-md-3 col-sm-6">
						<div className="form-group">
							<label htmlFor="new-league-customize">Customize</label>
							<select
								id="new-league-customize"
								className="form-control mb-1"
								onChange={event => {
									setCustomize(event.target.value);
									setTeams(defaultTeams);
									setLeagueFile(null);
								}}
								value={customize}
							>
								{props.lid === undefined ? (
									<option value="random">Random Players</option>
								) : null}
								<option value="custom-rosters">Upload League File</option>
								<option value="custom-url">Enter League File URL</option>
							</select>
							<span className="text-muted">
								Teams in your new league can either be filled by
								randomly-generated players or by players from a{" "}
								<a
									href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
								>
									custom League File
								</a>{" "}
								you upload.
							</span>
						</div>
						{customize === "custom-rosters" || customize === "custom-url" ? (
							<>
								<LeagueFileUpload
									onLoading={() => {
										setLeagueFile(null);
									}}
									onDone={handleNewLeagueFile}
									enterURL={customize === "custom-url"}
								/>
								<div className="form-check mt-3">
									<label className="form-check-label">
										<input
											className="form-check-input"
											onChange={event => {
												setRandomizeRosters(event.target.checked);
											}}
											type="checkbox"
											value={randomizeRosters}
										/>
										Shuffle Rosters
									</label>
								</div>
							</>
						) : null}
					</div>
				</div>

				<div className="text-center">
					<button
						type="submit"
						className="btn btn-lg btn-primary mt-3"
						disabled={
							creating ||
							((customize === "custom-rosters" || customize === "custom-url") &&
								leagueFile === null)
						}
					>
						{title}
					</button>
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
