import PropTypes from "prop-types";
import React, { useCallback, useRef, useState } from "react";
import { DIFFICULTY } from "../../common";
import { LeagueFileUpload } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import type { View } from "../../common/types";
import league2020 from "../../../../public/basketball/leagues/2020.json";
import api from "../api";

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

const teamsDefault: NewLeagueTeam[] = helpers.addPopRank(
	helpers.getTeamsDefault(),
);
teamsDefault.unshift(randomTeam);

const teams2020: NewLeagueTeam[] =
	process.env.SPORT === "basketball"
		? helpers.addPopRank(league2020.teams)
		: [];
teams2020.unshift(randomTeam);

const PopText = ({
	teams,
	tid,
}: {
	teams: typeof teamsDefault;
	tid: number;
}) => {
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

const leaguePartDescriptions: { [key: string]: string } = {
	gameAttributes: "League settings",
	startingSeason: "Starting season",
	players: "Players, including ratings and stats",
	teams: "Teams",
	teamSeason: "Team seasons history",
	teamStats: "Team stats history",
	allStars: "All-Star Game history",
	awards: "Awards history",
	games: "Box scores",
	releasedPlayers: "Contracts owed to released players",
	draftLotteryResults: "Draft lottery history",
	events: "Event log",
	negotiations: "In-progress contract negotiations",
	trade: "In-progress trade negotiations",
	meta: "League metadata, like league name",
	messages: "Messages from the owner",
	playerFeats: "Statistical feats",
	playoffSeries: "Upcoming and historical playoff series",
	schedule: "Upcoming schedule",
	draftPicks: "Traded future draft picks",
};

const LeaguePartPicker = ({
	leagueFile,
	keptKeys,
	setKeptKeys,
}: {
	leagueFile: any;
	keptKeys: string[];
	setKeptKeys: (keys: string[]) => void;
}) => {
	const prevLeagueFile = useRef(leagueFile);

	const keys = leagueFile
		? Object.keys(leagueFile).filter(key => key !== "version")
		: [];

	if (leagueFile !== prevLeagueFile.current) {
		prevLeagueFile.current = leagueFile;
		setKeptKeys([...keys]);
	}

	if (!leagueFile) {
		return null;
	}

	const keysSorted = Object.keys(leaguePartDescriptions).filter(key =>
		keys.includes(key),
	);
	keysSorted.push(...keys.filter(key => !keysSorted.includes(key)));

	return (
		<div className="form-group">
			<label>Use from selected league:</label>

			{keysSorted.map(key => (
				<div key={key} className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={event => {
								if (!event.target.checked) {
									setKeptKeys(keptKeys.filter(key2 => key2 !== key));
								} else {
									setKeptKeys([...keptKeys, key]);
								}
							}}
							type="checkbox"
							checked={keptKeys.includes(key)}
						/>
						{leaguePartDescriptions[key] ? leaguePartDescriptions[key] : key}
					</label>
				</div>
			))}

			<div className="mt-1">
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([...keys]);
					}}
				>
					All
				</button>{" "}
				|{" "}
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([]);
					}}
				>
					None
				</button>
			</div>

			<p className="my-3">
				Warning: selecting a weird combination of things may result in a
				partially or completely broken league.
			</p>
		</div>
	);
};

const NewLeague = (props: View<"newLeague">) => {
	const [creating, setCreating] = useState(false);
	const [customize, setCustomize] = useState<
		"custom-rosters" | "custom-url" | "default" | "2020"
	>(() => {
		if (props.lid !== undefined) {
			return "custom-rosters";
		}

		if (props.type === "real") {
			return "2020";
		}

		return "default";
	});
	const [difficulty, setDifficulty] = useState(
		props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
	);
	const [leagueFile, setLeagueFile] = useState<any>(
		customize === "2020" ? league2020 : null,
	);
	const [name, setName] = useState(props.name);
	const [randomizeRosters, setRandomizeRosters] = useState(false);
	const [teams, setTeams] = useState(
		customize === "2020" ? teams2020 : teamsDefault,
	);
	const [tid, setTid] = useState(props.lastSelectedTid);
	const [keptKeys, setKeptKeys] = useState<string[]>(
		leagueFile ? Object.keys(leagueFile).filter(key => key !== "version") : [],
	);

	let title: string;
	if (props.lid !== undefined) {
		title = "Import League";
	} else if (props.type === "custom") {
		title = "New Custom League";
	} else if (props.type === "fictional") {
		title = "New Fictional Players League";
	} else {
		title = "New Real Players League";
	}

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

			const actualLeagueFile: any = {};
			for (const key of [...keptKeys, "version"]) {
				if (leagueFile && leagueFile[key]) {
					actualLeagueFile[key] = leagueFile[key];
				}
			}

			if (actualLeagueFile.startingSeason === undefined) {
				actualLeagueFile.startingSeason = new Date().getFullYear();
			}

			const actualRandomizeRosters = keptKeys.includes("players")
				? randomizeRosters
				: false;

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
					actualRandomizeRosters,
					actualDifficulty,
					props.lid,
				);
				api.bbgmPing("league", [lid, "League Type???"]);
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
			difficulty,
			keptKeys,
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

	useTitleBar({ title, hideNewWindow: true });

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

					{keptKeys.includes("players") ? (
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
							{props.lid !== undefined ? "Import League" : "Create League"}
						</button>
					</div>
				</div>

				{props.type === "custom" ? (
					<div style={{ maxWidth: 400 }} className="ml-3 ml-md-5 flex-fill">
						<div className="card bg-light">
							<div className="card-body" style={{ marginBottom: "-1rem" }}>
								<h2 className="card-title">Customize</h2>
								<div className="form-group">
									<label htmlFor="new-league-customize">League</label>
									<select
										id="new-league-customize"
										className="form-control"
										onChange={event => {
											const newCustomize = event.target.value as any;
											setCustomize(newCustomize);
											if (
												process.env.SPORT === "basketball" &&
												newCustomize === "2020"
											) {
												setLeagueFile(helpers.deepCopy(league2020));
												setTeams(teams2020);
											} else {
												setTeams(teamsDefault);
												setLeagueFile(null);
											}
										}}
										value={customize}
									>
										<option value="default">Fictional teams and players</option>
										<option value="2020">2020 players and teams</option>
										<option value="custom-rosters">Upload league file</option>
										<option value="custom-url">Enter league file URL</option>
									</select>
									{customize === "custom-rosters" ||
									customize === "custom-url" ? (
										<p className="mt-3">
											League files can contain teams, players, settings, and
											other data. You can create a league file by going to Tools
											> Export within a league, or by{" "}
											<a
												href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
											>
												creating a custom league file
											</a>
											.
										</p>
									) : null}
								</div>
								{customize === "custom-rosters" ||
								customize === "custom-url" ? (
									<div className="my-3">
										<LeagueFileUpload
											onLoading={() => {
												setLeagueFile(null);
											}}
											onDone={handleNewLeagueFile}
											enterURL={customize === "custom-url"}
											hideLoadedMessage
										/>
									</div>
								) : null}

								<LeaguePartPicker
									leagueFile={leagueFile}
									keptKeys={keptKeys}
									setKeptKeys={setKeptKeys}
								/>
							</div>
						</div>
					</div>
				) : null}
			</form>
		</>
	);
};

NewLeague.propTypes = {
	difficulty: PropTypes.number,
	lid: PropTypes.number,
	name: PropTypes.string.isRequired,
	lastSelectedTid: PropTypes.number.isRequired,
	type: PropTypes.string.isRequired,
};

export default NewLeague;
